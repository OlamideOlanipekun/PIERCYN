import crypto from 'crypto';
import { prisma } from '../../db/prisma';
import { getSmtpConfig, getMailTransporter, sanitizeError } from './emailConfig';
import {
  renderOrderCreatedEmail,
  renderReceiptUploadedEmail,
  renderPaymentVerifiedEmail,
  renderOutOfStockEmail,
} from './emailTemplates';
import {
  OrderCreatedPayload,
  ReceiptUploadedPayload,
  PaymentVerifiedPayload,
  ProductOutOfStockPayload,
} from './types';

const STALE_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Backoff delays in milliseconds
const RETRY_DELAYS_MS = [
  0,                  // Attempt 1 (first retry): immediate / next cycle (~1m)
  1 * 60 * 1000,      // Attempt 2: 1 min
  5 * 60 * 1000,      // Attempt 3: 5 mins
  15 * 60 * 1000,     // Attempt 4: 15 mins
  60 * 60 * 1000,     // Attempt 5: 1 hour
  6 * 60 * 60 * 1000, // Attempt 6: 6 hours
];

export interface WorkerRunResult {
  claimed: number;
  sent: number;
  failed: number;
  retried: number;
  recovered: number;
  skipped: boolean;
  message?: string;
}

export class NotificationWorker {
  /**
   * Reclaims jobs that were abandoned by crashed workers.
   */
  public static async recoverStaleLocks(): Promise<number> {
    const staleThreshold = new Date(Date.now() - STALE_LOCK_TIMEOUT_MS);
    try {
      const recovered = await prisma.notificationJob.updateMany({
        where: {
          status: 'PROCESSING',
          lockedAt: { lte: staleThreshold },
        },
        data: {
          status: 'PENDING',
          lockedAt: null,
          lockedBy: null,
        },
      });
      return recovered.count;
    } catch (err) {
      console.error('[NOTIFICATION_WORKER] Error recovering stale locks:', err);
      return 0;
    }
  }

  /**
   * Atomically claims up to `batchSize` pending jobs.
   */
  public static async claimPendingJobs(batchSize: number = 10, workerId: string): Promise<any[]> {
    const now = new Date();

    try {
      // Use raw query with FOR UPDATE SKIP LOCKED to prevent concurrency collisions
      const claimed = await prisma.$queryRaw<any[]>`
        UPDATE "NotificationJob"
        SET status = 'PROCESSING',
            "lockedAt" = NOW(),
            "lockedBy" = ${workerId},
            "updatedAt" = NOW()
        WHERE id IN (
          SELECT id FROM "NotificationJob"
          WHERE status = 'PENDING'
            AND "nextAttemptAt" <= ${now}
            AND attempts < "maxAttempts"
          ORDER BY "nextAttemptAt" ASC
          LIMIT ${batchSize}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *;
      `;

      return claimed || [];
    } catch (err: any) {
      // Fallback if SKIP LOCKED is not supported or errors
      console.warn('[NOTIFICATION_WORKER] Raw claim fallback:', err.message);
      const candidates = await prisma.notificationJob.findMany({
        where: {
          status: 'PENDING',
          nextAttemptAt: { lte: now },
        },
        orderBy: { nextAttemptAt: 'asc' },
        take: batchSize,
      });

      const claimedJobs: any[] = [];
      for (const job of candidates) {
        const updated = await prisma.notificationJob.updateMany({
          where: { id: job.id, status: 'PENDING' },
          data: {
            status: 'PROCESSING',
            lockedAt: now,
            lockedBy: workerId,
          },
        });
        if (updated.count > 0) {
          claimedJobs.push({ ...job, status: 'PROCESSING', lockedAt: now, lockedBy: workerId });
        }
      }
      return claimedJobs;
    }
  }

  /**
   * Core worker execution routine. Safe to run concurrently and repeatedly.
   */
  public static async processNotifications(batchSize: number = 10): Promise<WorkerRunResult> {
    const workerId = `worker-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const recovered = await this.recoverStaleLocks();

    const smtpConfig = getSmtpConfig();
    const transporter = getMailTransporter();

    // If SMTP credentials are missing from environment, preserve jobs as PENDING with warning
    if (!smtpConfig || !transporter) {
      return {
        claimed: 0,
        sent: 0,
        failed: 0,
        retried: 0,
        recovered,
        skipped: true,
        message: 'SMTP credentials are not configured in environment variables (SMTP_USER, SMTP_APP_PASSWORD).',
      };
    }

    // Validate SMTP before claiming jobs. Bad credentials or an unavailable
    // server must not turn an entire batch into terminal failures.
    try {
      await transporter.verify();
    } catch (err) {
      const message = sanitizeError(err);
      console.warn('[NOTIFICATION_SMTP_VERIFY_FAILED]', message);
      return {
        claimed: 0,
        sent: 0,
        failed: 0,
        retried: 0,
        recovered,
        skipped: true,
        message: `SMTP verification failed; queued notifications were left pending. ${message}`,
      };
    }

    // Requeue jobs previously failed only because SMTP authentication was bad.
    // A successful verify means they can now be retried without DB intervention.
    await prisma.notificationJob.updateMany({
      where: {
        status: 'FAILED',
        lastError: { startsWith: 'Authentication error:' },
      },
      data: {
        status: 'PENDING',
        attempts: 0,
        nextAttemptAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastError: null,
      },
    });

    const jobs = await this.claimPendingJobs(batchSize, workerId);
    if (jobs.length === 0) {
      return { claimed: 0, sent: 0, failed: 0, retried: 0, recovered, skipped: false };
    }

    let sent = 0;
    let failed = 0;
    let retried = 0;

    for (const job of jobs) {
      try {
        const { subject, html, text } = this.renderEmailForJob(job.eventType, job.payload);

        await transporter.sendMail({
          from: `PIERCYN Commercial Engine <${smtpConfig.user}>`,
          to: smtpConfig.adminEmail,
          subject,
          html,
          text,
        });

        // Mark successfully SENT
        await prisma.notificationJob.update({
          where: { id: job.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            lockedAt: null,
            lockedBy: null,
            lastError: null,
          },
        });
        sent++;
      } catch (err: any) {
        const errorMsg = sanitizeError(err);
        const nextAttempts = (job.attempts || 0) + 1;
        const isAuthError = err.responseCode === 535 || err.code === 'EAUTH';
        const isMaxExhausted = nextAttempts >= (job.maxAttempts || 6);

        if (isAuthError || isMaxExhausted) {
          // Terminal failure: preserve for review, do not retry
          await prisma.notificationJob.update({
            where: { id: job.id },
            data: {
              status: 'FAILED',
              attempts: nextAttempts,
              lockedAt: null,
              lockedBy: null,
              lastError: isAuthError ? `Authentication error: ${errorMsg}` : errorMsg,
            },
          });
          failed++;
        } else {
          // Calculate exponential backoff
          const delayIndex = Math.min(nextAttempts, RETRY_DELAYS_MS.length - 1);
          const delayMs = RETRY_DELAYS_MS[delayIndex];
          const nextAttemptAt = new Date(Date.now() + delayMs);

          await prisma.notificationJob.update({
            where: { id: job.id },
            data: {
              status: 'PENDING',
              attempts: nextAttempts,
              nextAttemptAt,
              lockedAt: null,
              lockedBy: null,
              lastError: errorMsg,
            },
          });
          retried++;
        }
      }
    }

    return {
      claimed: jobs.length,
      sent,
      failed,
      retried,
      recovered,
      skipped: false,
    };
  }

  private static renderEmailForJob(
    eventType: string,
    payload: any
  ): { subject: string; html: string; text: string } {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

    switch (eventType) {
      case 'ORDER_CREATED':
        return renderOrderCreatedEmail(data as OrderCreatedPayload);
      case 'RECEIPT_UPLOADED':
        return renderReceiptUploadedEmail(data as ReceiptUploadedPayload);
      case 'PAYMENT_VERIFIED':
        return renderPaymentVerifiedEmail(data as PaymentVerifiedPayload);
      case 'PRODUCT_OUT_OF_STOCK':
        return renderOutOfStockEmail(data as ProductOutOfStockPayload);
      default:
        throw new Error(`Unknown eventType: ${eventType}`);
    }
  }
}
