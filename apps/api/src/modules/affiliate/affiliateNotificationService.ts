// ============================================================
// PIERCYN AFFILIATE NOTIFICATION SERVICE
// Transactional emails for creator/affiliate lifecycle events.
// Queues durable notification events; SMTP delivery is handled by OutboxProcessor.
// ============================================================

import crypto from 'crypto';
import { prisma } from '../../db/prisma';

export function escapeAffiliateHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"\\']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]!);
}

function appBaseUrl(): string {
  return (process.env.APP_BASE_URL || 'https://piercyn.vercel.app').replace(/\/$/, '');
}


function emailWrapper(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F2F0EB; color: #141414; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; box-sizing: border-box; }
    .card-wrap { background-color: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 4px; padding: 32px 28px; }
    .header { text-align: left; padding-bottom: 20px; border-bottom: 2px solid #141414; }
    .brand { font-size: 24px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #141414; margin: 0; }
    .tag { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #78716C; margin-top: 6px; display: block; font-weight: 700; }
    .content { padding: 24px 0; line-height: 1.6; font-size: 14px; color: #44403C; }
    .card { background-color: #FAF9F6; border: 1px solid #E7E5E4; border-radius: 4px; padding: 18px; margin: 20px 0; }
    .btn { display: inline-block; background-color: #141414; color: #FFFFFF !important; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; padding: 14px 28px; text-decoration: none; border-radius: 2px; margin-top: 15px; }
    .footer { text-align: center; padding-top: 24px; font-size: 11px; color: #78716C; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card-wrap">
      <div class="header">
        <div class="brand">PIERCYN</div>
        <span class="tag">Creator &amp; Affiliate Club</span>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PIERCYN Luxury Atelier • piercyn@gmail.com<br>Luxury ready-to-wear tailored in Nigeria.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export class AffiliateNotificationService {
  private static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const text = html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
      const dedupeKey = `affiliate-email:${crypto.createHash('sha256').update(`${to}\n${subject}\n${html}`).digest('hex')}`;
      await prisma.notificationEvent.upsert({
        where: { eventKey: dedupeKey },
        update: {},
        create: {
          eventKey: dedupeKey,
          eventType: 'AFFILIATE_EMAIL',
          payload: {
            email: to,
            subject: `PIERCYN · ${subject}`,
            html,
            text,
            notifyTelegram: false,
          },
        },
      });
      return true;
    } catch (err: any) {
      console.warn(`[AFFILIATE_NOTIFICATION_QUEUE_ERROR] Failed to queue email to ${to}:`, err.message);
      return false;
    }
  }

  public static async notifyApplicationSubmitted(affiliate: { email: string; firstName: string }) {
    const html = emailWrapper(
      'Creator Application Received',
      `
      <h2 style="color: #141414; font-weight: 600; font-size: 20px; margin-top: 0;">Application Received</h2>
      <p>Dear ${escapeAffiliateHtml(affiliate.firstName)},</p>
      <p>Thank you for applying to the PIERCYN Creator &amp; Affiliate Partner Program. Our team is reviewing your profile and audience channels.</p>
      <div class="card">
        <p style="margin: 0; color: #78716C; font-size: 11px; font-weight: 700; text-transform: uppercase;">Review Window</p>
        <p style="margin: 4px 0 0; color: #141414; font-weight: 600;">Applications are typically reviewed within 24–48 business hours.</p>
      </div>
      <p>Once approved, you will receive an invitation to access your Creator Portal and begin generating branded referral links.</p>
      `
    );
    return this.sendEmail(affiliate.email, 'Application Received', html);
  }

  public static async notifyApplicationApproved(
    affiliate: { email: string; firstName: string },
    referralCode: string
  ) {
    const portalUrl = appBaseUrl();
    const html = emailWrapper(
      'Welcome to PIERCYN Creator Club',
      `
      <h2 style="color: #141414; font-weight: 600; font-size: 20px; margin-top: 0;">Welcome to the Creator Club</h2>
      <p>Dear ${escapeAffiliateHtml(affiliate.firstName)},</p>
      <p>We are delighted to approve your application to the PIERCYN Creator Partner Program. You can now earn flat ₦800 commissions on every qualifying customer order referred through your links.</p>
      <div class="card">
        <p style="margin: 0; color: #78716C; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Your Primary Referral Code</p>
        <p style="margin: 6px 0 0; font-family: monospace; font-size: 18px; color: #141414; font-weight: 700;">${escapeAffiliateHtml(referralCode)}</p>
        <p style="margin: 8px 0 0; font-size: 12px; color: #78716C;">Link: ${portalUrl}/?ref=${escapeAffiliateHtml(referralCode)}</p>
      </div>
      <p>Log into your Creator Portal to track real-time orders, manage custom campaigns, and withdraw your earnings with zero minimum restrictions.</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${portalUrl}/affiliate" class="btn">Launch Creator Portal</a>
      </div>
      `
    );
    return this.sendEmail(affiliate.email, 'Application Approved — Welcome to the Creator Club', html);
  }

  public static async notifyApplicationRejected(
    affiliate: { email: string; firstName: string },
    reason?: string
  ) {
    const html = emailWrapper(
      'Creator Application Status',
      `
      <h2 style="color: #141414; font-weight: 600; font-size: 20px; margin-top: 0;">Application Status Update</h2>
      <p>Dear ${escapeAffiliateHtml(affiliate.firstName)},</p>
      <p>Thank you for your interest in partnering with PIERCYN. At this time, we are unable to accept your creator application.</p>
      ${
        reason
          ? `<div class="card"><p style="margin: 0; color: #991B1B; font-size: 12px;"><strong>Note:</strong> ${escapeAffiliateHtml(reason)}</p></div>`
          : ''
      }
      <p>We invite you to reapply in the future as your audience channels and content portfolio evolve.</p>
      `
    );
    return this.sendEmail(affiliate.email, 'Application Status Update', html);
  }

  public static async notifyCommissionAvailable(
    affiliate: { email: string; firstName: string },
    details: { orderNumber: string; amountNGN: number }
  ) {
    const html = emailWrapper(
      'New Royalty Available',
      `
      <h2 style="color: #141414; font-weight: 600; font-size: 20px; margin-top: 0;">Royalty Now Available</h2>
      <p>Dear ${escapeAffiliateHtml(affiliate.firstName)},</p>
      <p>Good news! A customer order referred through your link has cleared the 7-day return cooling window and your commission is now available for withdrawal.</p>
      <div class="card">
        <p style="margin: 0; color: #78716C; font-size: 11px; text-transform: uppercase; font-weight: 700;">Order Number</p>
        <p style="margin: 2px 0 10px; color: #141414; font-family: monospace; font-weight: 600;">#${escapeAffiliateHtml(details.orderNumber)}</p>
        <p style="margin: 0; color: #78716C; font-size: 11px; text-transform: uppercase; font-weight: 700;">Commission Cleared</p>
        <p style="margin: 2px 0 0; color: #166534; font-size: 20px; font-weight: 700;">₦${escapeAffiliateHtml(details.amountNGN.toLocaleString())}</p>
      </div>
      <p>You can withdraw this balance to your Nigerian bank account anytime with zero minimum restrictions.</p>
      `
    );
    return this.sendEmail(affiliate.email, `₦${details.amountNGN.toLocaleString()} Commission Now Available`, html);
  }

  public static async notifyWithdrawalRequested(
    affiliate: { email: string; firstName: string },
    payout: { amountNGN: number; bankName: string; accountNumber: string }
  ) {
    const html = emailWrapper(
      'Withdrawal Request Received',
      `
      <h2 style="color: #141414; font-weight: 600; font-size: 20px; margin-top: 0;">Withdrawal Request Received</h2>
      <p>Dear ${escapeAffiliateHtml(affiliate.firstName)},</p>
      <p>We have received your withdrawal request. Our finance team will review and disburse your funds to your registered bank account.</p>
      <div class="card">
        <p style="margin: 0; color: #78716C; font-size: 11px; text-transform: uppercase; font-weight: 700;">Requested Amount</p>
        <p style="margin: 2px 0 10px; color: #141414; font-size: 20px; font-weight: 700;">₦${escapeAffiliateHtml(payout.amountNGN.toLocaleString())}</p>
        <p style="margin: 0; color: #78716C; font-size: 11px; text-transform: uppercase; font-weight: 700;">Destination Account</p>
        <p style="margin: 2px 0 0; color: #44403C; font-size: 13px;">${escapeAffiliateHtml(payout.bankName)} • ****${payout.accountNumber.slice(-4)}</p>
      </div>
      <p>Payouts are reviewed and disbursed weekly. You will receive an email confirmation once the transfer is completed.</p>
      `
    );
    return this.sendEmail(affiliate.email, 'Withdrawal Request Received', html);
  }

  public static async notifyWithdrawalPaid(
    affiliate: { email: string; firstName: string },
    payout: { amountNGN: number; paymentReference?: string }
  ) {
    const html = emailWrapper(
      'Payment Completed',
      `
      <h2 style="color: #141414; font-weight: 600; font-size: 20px; margin-top: 0;">Withdrawal Completed</h2>
      <p>Dear ${escapeAffiliateHtml(affiliate.firstName)},</p>
      <p>Your withdrawal of <strong>₦${escapeAffiliateHtml(payout.amountNGN.toLocaleString())}</strong> has been successfully processed and transferred to your bank account.</p>
      ${
        payout.paymentReference
          ? `<div class="card"><p style="margin: 0; color: #78716C; font-size: 11px; text-transform: uppercase; font-weight: 700;">Payment Reference</p><p style="margin: 2px 0 0; color: #141414; font-family: monospace; font-weight: 600;">${escapeAffiliateHtml(payout.paymentReference)}</p></div>`
          : ''
      }
      <p>Thank you for partnering with PIERCYN.</p>
      `
    );
    return this.sendEmail(affiliate.email, 'Withdrawal Completed', html);
  }

  public static async notifyWithdrawalRejected(
    affiliate: { email: string; firstName: string },
    payout: { amountNGN: number },
    reason?: string
  ) {
    const html = emailWrapper(
      'Withdrawal Request Update',
      `
      <h2 style="color: #141414; font-weight: 600; font-size: 20px; margin-top: 0;">Withdrawal Request Update</h2>
      <p>Dear ${escapeAffiliateHtml(affiliate.firstName)},</p>
      <p>Your withdrawal request for ₦${escapeAffiliateHtml(payout.amountNGN.toLocaleString())} could not be completed.</p>
      ${
        reason
          ? `<div class="card"><p style="margin: 0; color: #991B1B; font-size: 12px;"><strong>Reason:</strong> ${escapeAffiliateHtml(reason)}</p></div>`
          : ''
      }
      <p>The reserved funds have been automatically released back to your available balance. Please verify your banking details in your Creator Portal and submit a new request if appropriate.</p>
      `
    );
    return this.sendEmail(affiliate.email, 'Withdrawal Request Update', html);
  }

  /**
   * Notifies an affiliate when a previously approved commission is reversed.
   * Triggered by CommissionService.reverseCommissions() — fire-and-forget,
   * never called inside a database transaction.
   */
  public static async notifyCommissionReversed(
    affiliate: { email: string; firstName: string },
    details: { orderNumber: string; amountNGN: number; reason?: string }
  ) {
    const portalUrl = appBaseUrl();
    const html = emailWrapper(
      'Commission Reversal Notice',
      `
      <h2 style="color: #141414; font-weight: 600; font-size: 20px; margin-top: 0;">Commission Reversal</h2>
      <p>Dear ${escapeAffiliateHtml(affiliate.firstName)},</p>
      <p>A previously recorded commission on your PIERCYN Creator account has been reversed.</p>
      <div class="card">
        <p style="margin: 0; color: #78716C; font-size: 11px; text-transform: uppercase; font-weight: 700;">Order Number</p>
        <p style="margin: 2px 0 10px; color: #141414; font-family: monospace; font-weight: 600;">#${escapeAffiliateHtml(details.orderNumber)}</p>
        <p style="margin: 0; color: #78716C; font-size: 11px; text-transform: uppercase; font-weight: 700;">Amount Reversed</p>
        <p style="margin: 2px 0 0; color: #991B1B; font-size: 20px; font-weight: 700;">₦${escapeAffiliateHtml(details.amountNGN.toLocaleString())}</p>
        ${details.reason ? `<p style="margin: 10px 0 0; font-size: 12px; color: #78716C;"><strong>Reason:</strong> ${escapeAffiliateHtml(details.reason)}</p>` : ''}
      </div>
      <p>Your available balance has been updated. Please log into your Creator Portal to review your current earnings.</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${portalUrl}/affiliate" class="btn">View Affiliate Dashboard</a>
      </div>
      `
    );
    return this.sendEmail(affiliate.email, `Commission Reversal — Order #${details.orderNumber}`, html);
  }
}
