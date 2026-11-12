import crypto from 'node:crypto';
import { prisma } from '@piercyn/db';
import { telegramClient } from './telegramClient';

export class TelegramService {
  /**
   * Hashes a secret token for storage or lookup.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  /**
   * Generates a single-use registration invite for an admin.
   */
  async createInvite(params: {
    recipientLabel: string;
    expectedUsername?: string;
    createdBy: string;
    expiresInHours?: number;
  }) {
    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + (params.expiresInHours ?? 48) * 60 * 60 * 1000);

    const invite = await prisma.telegramRegistrationInvite.create({
      data: {
        tokenHash,
        recipientLabel: params.recipientLabel,
        expectedUsername: params.expectedUsername?.replace(/^@/, '').toLowerCase(),
        createdBy: params.createdBy,
        expiresAt,
      },
    });

    return {
      inviteId: invite.id,
      token: rawToken,
      recipientLabel: invite.recipientLabel,
      expiresAt: invite.expiresAt,
    };
  }

  /**
   * Handles `/start <token>` registration in Telegram bot.
   */
  async processRegistration(params: {
    rawToken: string;
    chatId: string;
    username?: string;
  }): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.hashToken(params.rawToken);

    const invite = await prisma.telegramRegistrationInvite.findUnique({
      where: { tokenHash },
    });

    if (!invite) {
      return { success: false, message: 'Invalid or unknown registration invitation.' };
    }

    if (invite.usedAt) {
      return { success: false, message: 'This registration invitation has already been used.' };
    }

    if (new Date() > invite.expiresAt) {
      return { success: false, message: 'This registration invitation has expired.' };
    }

    const cleanUsername = params.username?.replace(/^@/, '').toLowerCase();
    if (invite.expectedUsername && invite.expectedUsername !== cleanUsername) {
      return {
        success: false,
        message: `This invitation was reserved for @${invite.expectedUsername}. Registration rejected.`,
      };
    }

    // Upsert the recipient using unique numeric chatId
    await prisma.$transaction([
      prisma.telegramRecipient.upsert({
        where: { chatId: params.chatId },
        update: {
          label: invite.recipientLabel,
          username: cleanUsername,
          isActive: true,
          lastSeenAt: new Date(),
        },
        create: {
          chatId: params.chatId,
          label: invite.recipientLabel,
          username: cleanUsername,
          isActive: true,
        },
      }),
      prisma.telegramRegistrationInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Send confirmation message to admin
    if (telegramClient.isConfigured) {
      try {
        await telegramClient.sendMessage({
          chatId: params.chatId,
          text: `<b>PIERCYN Admin Notifications Active</b>\n\nWelcome, <b>${invite.recipientLabel}</b>. You are registered to receive live operational alerts for orders, payments, receipts, and customer registrations.`,
        });
      } catch (err) {
        console.error('[TELEGRAM_WELCOME_ERROR]', err);
      }
    }

    return {
      success: true,
      message: `Successfully registered as ${invite.recipientLabel}. You will now receive PIERCYN admin alerts.`,
    };
  }

  /**
   * Fetches all active admin Telegram recipients.
   */
  async getActiveRecipients() {
    return prisma.telegramRecipient.findMany({
      where: { isActive: true },
      orderBy: { registeredAt: 'asc' },
    });
  }

  /**
   * Sends a message independently to every active admin.
   * If Admin 1 fails or blocks the bot, Admin 2 still receives the notification.
   */
  async notifyAdmins(text: string): Promise<{ sent: number; failed: number }> {
    if (!telegramClient.isConfigured) {
      console.warn('[TELEGRAM_NOT_CONFIGURED] Telegram notification skipped: Bot token not set');
      return { sent: 0, failed: 0 };
    }

    const recipients = await this.getActiveRecipients();
    if (recipients.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      recipients.map(async (recipient) => {
        try {
          await telegramClient.sendMessage({
            chatId: recipient.chatId,
            text,
          });
          sent++;
          await prisma.telegramRecipient.update({
            where: { id: recipient.id },
            data: { lastSeenAt: new Date() },
          });
        } catch (error) {
          failed++;
          console.error(`[TELEGRAM_DELIVERY_FAILED] Recipient ${recipient.label} (${recipient.chatId}):`, error);
        }
      })
    );

    return { sent, failed };
  }

  /**
   * Sends one outbox delivery to exactly one recipient. Errors propagate so
   * the outbox can retry this recipient without affecting other recipients.
   */
  async notifyRecipient(chatId: string, text: string): Promise<{ messageId?: string }> {
    if (!telegramClient.isConfigured) {
      throw new Error('Telegram bot token is not configured');
    }
    const result = await telegramClient.sendMessage({ chatId, text });
    try {
      await prisma.telegramRecipient.updateMany({
        where: { chatId, isActive: true },
        data: { lastSeenAt: new Date() },
      });
    } catch (error) {
      // Telegram already accepted the message; bookkeeping must not trigger a duplicate retry.
      console.warn('[TELEGRAM_RECIPIENT_BOOKKEEPING_FAILED]', JSON.stringify({ chatId, error: String(error) }));
    }
    const messageId = (result as any)?.message_id;
    return { messageId: messageId === undefined ? undefined : String(messageId) };
  }
}

export const telegramService = new TelegramService();
