import { Router, Request, Response } from 'express';
import { prisma } from '@piercyn/db';
import { telegramService } from './telegramService';
import { telegramClient } from './telegramClient';

export const telegramWebhookRouter = Router();

telegramWebhookRouter.post('/webhook', async (req: Request, res: Response) => {
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (expectedSecret && secretHeader !== expectedSecret) {
    console.warn('[TELEGRAM_WEBHOOK_UNAUTHORIZED] Invalid secret token');
    return res.status(401).json({ error: 'Unauthorized webhook call' });
  }

  const update = req.body;
  if (!update || !update.message) {
    return res.status(200).json({ ok: true });
  }

  const message = update.message;
  const chatId = String(message.chat?.id);
  const text: string = (message.text || '').trim();
  const username = message.from?.username;

  // Immediate 200 response to satisfy Telegram
  res.status(200).json({ ok: true });

  try {
    // 1. Handle Registration: /start <token>
    if (text.startsWith('/start')) {
      const parts = text.split(/\s+/);
      if (parts.length > 1) {
        const rawToken = parts[1];
        const regResult = await telegramService.processRegistration({
          rawToken,
          chatId,
          username,
        });

        if (telegramClient.isConfigured) {
          await telegramClient.sendMessage({
            chatId,
            text: regResult.message,
          });
        }
        return;
      } else {
        if (telegramClient.isConfigured) {
          await telegramClient.sendMessage({
            chatId,
            text: 'Welcome to PIERCYN Admin Bot. If you have an invite token, send <code>/start &lt;token&gt;</code> to register.',
          });
        }
        return;
      }
    }

    // 2. Authorize subsequent operational commands: recipient must be registered & active
    const recipient = await prisma.telegramRecipient.findUnique({
      where: { chatId },
    });

    if (!recipient || !recipient.isActive) {
      if (telegramClient.isConfigured) {
        await telegramClient.sendMessage({
          chatId,
          text: '⛔ Access restricted. You are not authorized to run PIERCYN administrative commands.',
        });
      }
      return;
    }

    // 3. Operational Read-Only Commands
    if (text === '/status' || text === '/today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [orderCount, pendingReceipts, pendingQuotes] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: today } } }),
        prisma.order.count({ where: { paymentStatus: 'UNDER_REVIEW' } }),
        prisma.order.count({ where: { quoteStatus: 'PENDING' } }),
      ]);

      const msg = `📊 <b>PIERCYN Operational Status</b>\n\n` +
        `• Today's Orders: <b>${orderCount}</b>\n` +
        `• Receipts Pending Review: <b>${pendingReceipts}</b>\n` +
        `• Delivery Quotes Pending: <b>${pendingQuotes}</b>\n\n` +
        `<i>Admin: ${recipient.label}</i>`;

      await telegramClient.sendMessage({ chatId, text: msg });
      return;
    }

    if (text === '/pending' || text === '/receipts') {
      const orders = await prisma.order.findMany({
        where: { paymentStatus: 'UNDER_REVIEW' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true, totalNGN: true, customerFirstName: true, customerLastName: true },
      });

      if (orders.length === 0) {
        await telegramClient.sendMessage({ chatId, text: '✅ No receipts currently awaiting review.' });
        return;
      }

      const list = orders
        .map(o => `• <b>${o.orderNumber}</b>: ₦${(o.totalNGN / 100).toLocaleString()} (${o.customerFirstName} ${o.customerLastName})`)
        .join('\n');

      await telegramClient.sendMessage({
        chatId,
        text: `⏳ <b>Pending Payment Reviews (${orders.length})</b>:\n\n${list}`,
      });
      return;
    }

    if (text === '/help') {
      const help = `<b>PIERCYN Admin Commands:</b>\n\n` +
        `• <code>/status</code> — Today's overview & pending queues\n` +
        `• <code>/pending</code> — Orders awaiting payment receipt review\n` +
        `• <code>/today</code> — Quick summary of today's activities\n` +
        `• <code>/help</code> — Show this guide\n\n` +
        `<i>Note: Mutation actions (approvals, refunds, payouts) must be completed in the admin dashboard.</i>`;

      await telegramClient.sendMessage({ chatId, text: help });
      return;
    }

  } catch (error) {
    console.error('[TELEGRAM_COMMAND_ERROR]', error);
  }
});
