import crypto from 'node:crypto';
import { prisma } from '@piercyn/db';
import { getSmtpConfig, getMailTransporter, sanitizeError } from './emailConfig';
import { telegramService } from '../telegram/telegramService';
import {
  renderWelcomeEmail,
  renderOrderCreatedEmail,
  renderReceiptUploadedEmail,
  renderPaymentVerifiedEmail,
  renderOutOfStockEmail,
  renderPaymentDecisionEmail,
  renderDeliveryQuoteCreatedEmail,
  renderQuoteDecisionEmail,
  renderFulfilmentEmail,
} from './emailTemplates';

const STALE_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const RETRY_DELAYS_MS = [
  0,                  // Immediate / next cycle
  30 * 1000,          // 30s
  2 * 60 * 1000,      // 2 mins
  10 * 60 * 1000,     // 10 mins
  30 * 60 * 1000,     // 30 mins
];

export interface OutboxRunResult {
  claimed: number;
  sent: number;
  failed: number;
  retried: number;
  recovered: number;
  skipped: boolean;
  message?: string;
}

export class OutboxProcessor {
  /**
   * Recovers stuck processing locks from crashed functions.
   */
  public static async recoverStaleLocks(): Promise<number> {
    const staleCutoff = new Date(Date.now() - STALE_LOCK_TIMEOUT_MS);
    const result = await prisma.notificationDelivery.updateMany({
      where: {
        status: 'PROCESSING',
        lockedAt: { lt: staleCutoff },
      },
      data: {
        status: 'PENDING',
        lockedAt: null,
        lockToken: null,
      },
    });
    return result.count;
  }

  /**
   * Converts pending `NotificationEvent` rows into per-channel, per-recipient `NotificationDelivery` rows.
   */
  public static async fanOutEvents(batchLimit: number = 20): Promise<number> {
    const events = await prisma.notificationEvent.findMany({
      where: {
        deliveries: { none: {} },
      },
      take: batchLimit,
      orderBy: { occurredAt: 'asc' },
    });

    if (events.length === 0) return 0;

    let deliveriesCreated = 0;
    const activeTelegramAdmins = await telegramService.getActiveRecipients();

    for (const event of events) {
      const payload = (event.payload || {}) as Record<string, any>;
      const deliveriesToCreate: Array<{
        eventId: string;
        channel: 'EMAIL' | 'TELEGRAM';
        recipientKey: string;
      }> = [];

      // 1. Customer Email Delivery
      const customerEmail = payload.customerEmail || payload.email;
      if (customerEmail && typeof customerEmail === 'string') {
        deliveriesToCreate.push({
          eventId: event.id,
          channel: 'EMAIL',
          recipientKey: customerEmail.trim().toLowerCase(),
        });
      }

      // 2. Telegram Admin Deliveries (independent per approved admin)
      for (const admin of activeTelegramAdmins) {
        deliveriesToCreate.push({
          eventId: event.id,
          channel: 'TELEGRAM',
          recipientKey: admin.chatId,
        });
      }

      for (const delivery of deliveriesToCreate) {
        try {
          await prisma.notificationDelivery.upsert({
            where: {
              eventId_channel_recipientKey: {
                eventId: delivery.eventId,
                channel: delivery.channel,
                recipientKey: delivery.recipientKey,
              },
            },
            update: {},
            create: {
              eventId: delivery.eventId,
              channel: delivery.channel,
              recipientKey: delivery.recipientKey,
              status: 'PENDING',
            },
          });
          deliveriesCreated++;
        } catch (err) {
          console.error('[FANOUT_UPSERT_ERROR]', err);
        }
      }
    }

    return deliveriesCreated;
  }

  /**
   * Processes a batch of pending deliveries safely with leasing locks.
   */
  public static async processDeliveries(batchSize: number = 10): Promise<OutboxRunResult> {
    const workerId = `outbox-worker-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const recovered = await this.recoverStaleLocks();
    await this.fanOutEvents(batchSize);

    const now = new Date();
    const candidates = await prisma.notificationDelivery.findMany({
      where: {
        status: 'PENDING',
        nextAttemptAt: { lte: now },
      },
      include: {
        event: true,
      },
      take: batchSize,
      orderBy: { nextAttemptAt: 'asc' },
    });

    if (candidates.length === 0) {
      return { claimed: 0, sent: 0, failed: 0, retried: 0, recovered, skipped: false };
    }

    const smtpConfig = getSmtpConfig();
    const transporter = getMailTransporter();

    let sent = 0;
    let failed = 0;
    let retried = 0;

    for (const delivery of candidates) {
      // Lease the delivery
      const leased = await prisma.notificationDelivery.updateMany({
        where: { id: delivery.id, status: 'PENDING' },
        data: {
          status: 'PROCESSING',
          lockedAt: now,
          lockToken: workerId,
        },
      });

      if (leased.count === 0) continue; // Claimed by another worker

      try {
        const payload = (delivery.event.payload || {}) as Record<string, any>;

        if (delivery.channel === 'TELEGRAM') {
          // Send Telegram message to this specific recipient
          const messageText = this.formatTelegramMessage(delivery.event.eventType, payload);
          if (messageText) {
            await telegramService.notifyAdmins(messageText);
          }
        } else if (delivery.channel === 'EMAIL') {
          // Send transactional Email
          if (transporter && smtpConfig) {
            const emailContent = this.formatEmailMessage(delivery.event.eventType, payload);
            if (emailContent) {
              await transporter.sendMail({
                from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
                replyTo: smtpConfig.replyTo,
                to: delivery.recipientKey,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
              });
            }
          } else {
            console.warn('[OUTBOX_SMTP_UNCONFIGURED] Email delivery skipped; SMTP not configured');
          }
        }

        // Mark SENT
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            lockedAt: null,
            lockToken: null,
            lastError: null,
          },
        });
        sent++;
      } catch (err: any) {
        const errorMsg = sanitizeError(err);
        const nextAttempts = (delivery.attempts || 0) + 1;
        const isMaxExhausted = nextAttempts >= (delivery.maxAttempts || 5);

        if (isMaxExhausted) {
          await prisma.notificationDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'DEAD',
              attempts: nextAttempts,
              lockedAt: null,
              lockToken: null,
              lastError: errorMsg,
            },
          });
          failed++;
        } else {
          const delayIndex = Math.min(nextAttempts, RETRY_DELAYS_MS.length - 1);
          const nextAttemptAt = new Date(Date.now() + RETRY_DELAYS_MS[delayIndex]);

          await prisma.notificationDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'PENDING',
              attempts: nextAttempts,
              nextAttemptAt,
              lockedAt: null,
              lockToken: null,
              lastError: errorMsg,
            },
          });
          retried++;
        }
      }
    }

    return {
      claimed: candidates.length,
      sent,
      failed,
      retried,
      recovered,
      skipped: false,
    };
  }

  private static formatTelegramMessage(eventType: string, payload: Record<string, any>): string | null {
    switch (eventType) {
      case 'CUSTOMER_REGISTERED':
        return (
          `🛍️ <b>PIERCYN — NEW CUSTOMER</b>\n\n` +
          `• Customer: <b>${payload.firstName || ''} ${payload.lastName || ''}</b>\n` +
          `• Email: <code>${payload.email || 'N/A'}</code>\n` +
          `• Registered: ${payload.registeredAt || new Date().toISOString()}`
        );

      case 'ORDER_CREATED':
        return (
          `📦 <b>PIERCYN — NEW ORDER PLACED</b>\n\n` +
          `• Order: <b>${payload.orderNumber || payload.orderId}</b>\n` +
          `• Customer: ${payload.customerName || payload.customerEmail}\n` +
          `• Amount: ₦${((payload.totalNGN || 0) / 100).toLocaleString()}\n` +
          `• Status: PENDING PAYMENT`
        );

      case 'RECEIPT_UPLOADED':
        return (
          `🧾 <b>PIERCYN — RECEIPT UPLOADED</b>\n\n` +
          `• Order: <b>${payload.orderNumber}</b>\n` +
          `• Customer: ${payload.customerName}\n` +
          `• Amount: ₦${((payload.totalNGN || 0) / 100).toLocaleString()}\n` +
          `• Action: Review required in Admin Dashboard`
        );

      case 'PAYMENT_VERIFIED':
        return (
          `✅ <b>PIERCYN — PAYMENT VERIFIED</b>\n\n` +
          `• Order: <b>${payload.orderNumber}</b>\n` +
          `• Amount: ₦${((payload.amountNGN || 0) / 100).toLocaleString()}\n` +
          `• Verified by: ${payload.verifiedBy || 'Admin'}`
        );

      case 'DELIVERY_QUOTE_ACCEPTED':
        return (
          `🚚 <b>PIERCYN — DELIVERY QUOTE ACCEPTED</b>\n\n` +
          `• Order: <b>${payload.orderNumber}</b>\n` +
          `• Customer accepted delivery quote. Awaiting delivery payment.`
        );

      case 'ORDER_DISPATCHED':
        return (
          `🚀 <b>PIERCYN — ORDER DISPATCHED</b>\n\n` +
          `• Order: <b>${payload.orderNumber}</b>\n` +
          `• Recipient: ${payload.customerName}\n` +
          `• City/State: ${payload.deliveryCity}, ${payload.deliveryState}`
        );

      case 'ORDER_DELIVERED':
        return (
          `🎉 <b>PIERCYN — ORDER DELIVERED</b>\n\n` +
          `• Order: <b>${payload.orderNumber}</b>\n` +
          `• Confirmed delivered.`
        );

      default:
        return `🔔 <b>PIERCYN Alert</b>: ${eventType}`;
    }
  }

  private static formatEmailMessage(
    eventType: string,
    payload: Record<string, any>
  ): { subject: string; html: string; text: string } | null {
    switch (eventType) {
      case 'CUSTOMER_REGISTERED':
        return renderWelcomeEmail({
          firstName: payload.firstName,
          email: payload.email || payload.customerEmail,
        });

      case 'ORDER_CREATED':
        return renderOrderCreatedEmail(payload as any);

      case 'RECEIPT_UPLOADED':
        return renderReceiptUploadedEmail(payload as any);

      case 'PAYMENT_VERIFIED':
        return renderPaymentVerifiedEmail(payload as any);

      case 'PAYMENT_REJECTED':
        return renderPaymentDecisionEmail(
          {
            orderId: payload.orderId,
            orderNumber: payload.orderNumber,
            customerName: payload.customerName,
            customerEmail: payload.customerEmail,
            customerPhone: payload.customerPhone || '',
            paymentType: payload.paymentType || 'PRODUCT',
            amountNGN: payload.amountNGN || 0,
            providerReference: payload.providerReference || 'N/A',
            rejectionReason: payload.rejectionReason || payload.reason || 'Payment could not be confirmed',
            verifiedBy: payload.verifiedBy,
            timestamp: payload.timestamp || new Date().toISOString(),
          },
          false
        );

      case 'DELIVERY_PAYMENT_VERIFIED':
        return renderPaymentDecisionEmail(
          {
            orderId: payload.orderId,
            orderNumber: payload.orderNumber,
            customerName: payload.customerName,
            customerEmail: payload.customerEmail,
            customerPhone: payload.customerPhone || '',
            paymentType: 'DELIVERY',
            amountNGN: payload.amountNGN || payload.deliveryFeeNGN || 0,
            providerReference: payload.providerReference || 'N/A',
            verifiedBy: payload.verifiedBy,
            timestamp: payload.timestamp || new Date().toISOString(),
          },
          true
        );

      case 'DELIVERY_QUOTE_CREATED':
        return renderDeliveryQuoteCreatedEmail({
          orderId: payload.orderId,
          orderNumber: payload.orderNumber,
          customerName: payload.customerName,
          customerEmail: payload.customerEmail,
          customerPhone: payload.customerPhone || '',
          deliveryFeeNGN: payload.deliveryFeeNGN || payload.amountNGN || 0,
          subtotalNGN: payload.subtotalNGN || 0,
          totalNGN: payload.totalNGN || 0,
          quoteId: payload.quoteId || '',
          expiresAt: payload.expiresAt || '',
          decisionUrl: payload.decisionUrl || '',
        });

      case 'DELIVERY_QUOTE_ACCEPTED':
        return renderQuoteDecisionEmail(payload as any, 'ACCEPTED');

      case 'DELIVERY_QUOTE_DECLINED':
      case 'DELIVERY_QUOTE_REJECTED':
        return renderQuoteDecisionEmail(payload as any, 'REJECTED');

      case 'ORDER_DISPATCHED':
      case 'ORDER_DELIVERED': {
        const stage = eventType === 'ORDER_DISPATCHED' ? 'DISPATCHED' : 'DELIVERED';
        return renderFulfilmentEmail(payload as any, stage);
      }

      default:
        return null;
    }
  }
}
