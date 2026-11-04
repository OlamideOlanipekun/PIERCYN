// ============================================================
// PIERCYN AFFILIATE NOTIFICATION SERVICE
// Transactional emails for creator/affiliate lifecycle events.
// Fire-and-forget: notification errors never roll back transactions.
// ============================================================

import { getMailTransporter, getSmtpConfig } from '../notifications/emailConfig';

function emailWrapper(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0D0D0D; color: #EDECE8; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding-bottom: 30px; border-bottom: 1px solid #222222; }
    .brand { font-family: Georgia, serif; font-size: 24px; letter-spacing: 0.25em; color: #FFFFFF; font-weight: 300; }
    .tag { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #C9A96E; margin-top: 6px; display: block; }
    .content { padding: 30px 0; line-height: 1.6; font-size: 14px; color: #CCCCCC; }
    .card { background-color: #141414; border: 1px solid #242424; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .btn { display: inline-block; background-color: #C9A96E; color: #000000; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; font-size: 11px; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #222222; font-size: 11px; color: #666666; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">PIERCYN</div>
      <span class="tag">Creator & Affiliate Club</span>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PIERCYN. All rights reserved.<br>Luxury ready-to-wear tailored in Nigeria.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export class AffiliateNotificationService {
  private static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const transporter = getMailTransporter();
    const config = getSmtpConfig();

    if (!transporter || !config) {
      console.log(`[AFFILIATE_EMAIL_DEV] Transporter not configured. Subject: "${subject}" to: ${to}`);
      return false;
    }

    try {
      await transporter.sendMail({
        from: `"PIERCYN Creator Club" <${config.user}>`,
        to,
        subject: `PIERCYN · ${subject}`,
        html,
      });
      return true;
    } catch (err: any) {
      console.warn(`[AFFILIATE_NOTIFICATION_ERROR] Failed to send email to ${to}:`, err.message);
      return false;
    }
  }

  public static async notifyApplicationSubmitted(affiliate: { email: string; firstName: string }) {
    const html = emailWrapper(
      'Creator Application Received',
      `
      <h2 style="color: #FFFFFF; font-family: Georgia, serif; font-weight: 400; font-size: 20px; margin-top: 0;">Application Received</h2>
      <p>Dear ${affiliate.firstName},</p>
      <p>Thank you for applying to the PIERCYN Creator & Affiliate Partner Program. Our team is reviewing your profile and audience channels.</p>
      <div class="card">
        <p style="margin: 0; color: #AAAAAA; font-size: 12px;">Review Window</p>
        <p style="margin: 4px 0 0; color: #FFFFFF; font-weight: 500;">Applications are typically reviewed within 24–48 business hours.</p>
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
    const portalUrl = process.env.PUBLIC_APP_URL || 'https://piercyn.vercel.app';
    const html = emailWrapper(
      'Welcome to PIERCYN Creator Club',
      `
      <h2 style="color: #FFFFFF; font-family: Georgia, serif; font-weight: 400; font-size: 20px; margin-top: 0;">Welcome to the Creator Club</h2>
      <p>Dear ${affiliate.firstName},</p>
      <p>We are delighted to approve your application to the PIERCYN Creator Partner Program. You can now earn flat ₦800 commissions on every qualifying customer order referred through your links.</p>
      <div class="card">
        <p style="margin: 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Your Primary Referral Code</p>
        <p style="margin: 6px 0 0; font-family: monospace; font-size: 18px; color: #C9A96E; font-weight: 600;">${referralCode}</p>
        <p style="margin: 8px 0 0; font-size: 12px; color: #AAAAAA;">Link: ${portalUrl}/?ref=${referralCode}</p>
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
      <h2 style="color: #FFFFFF; font-family: Georgia, serif; font-weight: 400; font-size: 20px; margin-top: 0;">Application Status Update</h2>
      <p>Dear ${affiliate.firstName},</p>
      <p>Thank you for your interest in partnering with PIERCYN. At this time, we are unable to accept your creator application.</p>
      ${
        reason
          ? `<div class="card"><p style="margin: 0; color: #AAAAAA; font-size: 12px;"><strong>Note:</strong> ${reason}</p></div>`
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
      <h2 style="color: #FFFFFF; font-family: Georgia, serif; font-weight: 400; font-size: 20px; margin-top: 0;">Royalty Now Available</h2>
      <p>Dear ${affiliate.firstName},</p>
      <p>Good news! A customer order referred through your link has cleared the 7-day return cooling window and your commission is now available for withdrawal.</p>
      <div class="card">
        <p style="margin: 0; color: #888888; font-size: 11px; text-transform: uppercase;">Order Number</p>
        <p style="margin: 2px 0 10px; color: #FFFFFF; font-family: monospace;">#${details.orderNumber}</p>
        <p style="margin: 0; color: #888888; font-size: 11px; text-transform: uppercase;">Commission Cleared</p>
        <p style="margin: 2px 0 0; color: #C9A96E; font-size: 18px; font-weight: 600;">₦${details.amountNGN.toLocaleString()}</p>
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
      <h2 style="color: #FFFFFF; font-family: Georgia, serif; font-weight: 400; font-size: 20px; margin-top: 0;">Withdrawal Request Received</h2>
      <p>Dear ${affiliate.firstName},</p>
      <p>We have received your withdrawal request. Our finance team will review and disburse your funds to your registered bank account.</p>
      <div class="card">
        <p style="margin: 0; color: #888888; font-size: 11px; text-transform: uppercase;">Requested Amount</p>
        <p style="margin: 2px 0 10px; color: #FFFFFF; font-size: 18px; font-weight: 600;">₦${payout.amountNGN.toLocaleString()}</p>
        <p style="margin: 0; color: #888888; font-size: 11px; text-transform: uppercase;">Destination Account</p>
        <p style="margin: 2px 0 0; color: #CCCCCC; font-size: 12px;">${payout.bankName} • ****${payout.accountNumber.slice(-4)}</p>
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
      <h2 style="color: #FFFFFF; font-family: Georgia, serif; font-weight: 400; font-size: 20px; margin-top: 0;">Withdrawal Completed</h2>
      <p>Dear ${affiliate.firstName},</p>
      <p>Your withdrawal of <strong>₦${payout.amountNGN.toLocaleString()}</strong> has been successfully processed and transferred to your bank account.</p>
      ${
        payout.paymentReference
          ? `<div class="card"><p style="margin: 0; color: #888888; font-size: 11px; text-transform: uppercase;">Payment Reference</p><p style="margin: 2px 0 0; color: #FFFFFF; font-family: monospace;">${payout.paymentReference}</p></div>`
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
      <h2 style="color: #FFFFFF; font-family: Georgia, serif; font-weight: 400; font-size: 20px; margin-top: 0;">Withdrawal Request Update</h2>
      <p>Dear ${affiliate.firstName},</p>
      <p>Your withdrawal request for ₦${payout.amountNGN.toLocaleString()} could not be completed.</p>
      ${
        reason
          ? `<div class="card"><p style="margin: 0; color: #AAAAAA; font-size: 12px;"><strong>Reason:</strong> ${reason}</p></div>`
          : ''
      }
      <p>The reserved funds have been automatically released back to your available balance. Please verify your banking details in your Creator Portal and submit a new request if appropriate.</p>
      `
    );
    return this.sendEmail(affiliate.email, 'Withdrawal Request Update', html);
  }
}

