import { Router, Request, Response } from 'express';
import { waitUntil } from '@vercel/functions';
import { prisma } from '@piercyn/db';
import { telegramService } from './telegramService';
import { telegramClient } from './telegramClient';

export const telegramWebhookRouter = Router();

const TELEGRAM_COMMANDS = ['/start', '/help', '/status', '/today', '/pending', '/unpaid', '/receipts', '/delivery'];

function getCommand(text: string): { command: string; args: string[] } {
  const match = text.trim().match(/^\/([a-z0-9_]+)(?:@[a-z0-9_]+)?(?:\s+(.*))?$/i);
  if (!match) return { command: '', args: [] };
  return {
    command: `/${match[1].toLowerCase()}`,
    args: match[2] ? match[2].trim().split(/\s+/).filter(Boolean) : [],
  };
}

function formatNGN(amount: number): string {
  return `₦${(amount / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function allowedBootstrapChatIds(): Set<string> {
  return new Set(
    (process.env.TELEGRAM_ADMIN_CHAT_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

async function sendReply(chatId: string, text: string): Promise<void> {
  if (!telegramClient.isConfigured) {
    console.error('[TELEGRAM_NOT_CONFIGURED] Cannot reply: TELEGRAM_BOT_TOKEN is not set');
    return;
  }
  try {
    await telegramClient.sendMessage({ chatId, text });
  } catch (error) {
    console.error('[TELEGRAM_REPLY_FAILED]', { chatId, error });
  }
}

async function listPaymentOrders(where: any, title: string, emptyMessage: string): Promise<string> {
  const orders = await prisma.order.findMany({
    where,
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      orderNumber: true,
      totalNGN: true,
      customerFirstName: true,
      customerLastName: true,
    },
  });
  if (orders.length === 0) return emptyMessage;
  const list = orders.map((order) => {
    const customer = `${order.customerFirstName} ${order.customerLastName}`.trim();
    return `• <b>${escapeHtml(order.orderNumber)}</b> — ${formatNGN(order.totalNGN)} — ${escapeHtml(customer)}`;
  }).join('\n');
  return `${title} <b>(${orders.length})</b>:\n\n${list}`;
}

async function processTelegramUpdate(update: any): Promise<void> {
  if (!update || !update.message) return;

  const message = update.message;
  const chatId = String(message.chat?.id || '');
  if (!chatId || chatId === 'undefined') {
    console.warn('[TELEGRAM_UPDATE_INVALID] Missing message.chat.id');
    return;
  }

  const text = typeof message.text === 'string' ? message.text.trim() : '';
  const username = typeof message.from?.username === 'string' ? message.from.username : undefined;
  const { command, args } = getCommand(text);

  console.info('[TELEGRAM_UPDATE_RECEIVED]', JSON.stringify({
    updateId: update.update_id ?? null,
    chatId,
    command: command || '(non-command)',
  }));

  if (command === '/start') {
    const existing = await prisma.telegramRecipient.findUnique({ where: { chatId } });
    if (existing?.isActive) {
      await sendReply(
        chatId,
        `👋 Welcome back, <b>${escapeHtml(existing.label)}</b>! You are registered for PIERCYN operational notifications.\n\nType <code>/status</code> for today's summary or <code>/help</code> for commands.`
      );
      return;
    }

    if (args.length > 0) {
      const registration = await telegramService.processRegistration({
        rawToken: args[0],
        chatId,
        username,
      });
      await sendReply(chatId, registration.message);
      return;
    }

    const bootstrapAllowlist = allowedBootstrapChatIds();
    const recipientCount = await prisma.telegramRecipient.count();
    if (recipientCount === 0 && (bootstrapAllowlist.size === 0 || bootstrapAllowlist.has(chatId))) {
      await prisma.telegramRecipient.create({
        data: {
          chatId,
          label: 'Primary Admin',
          username: username?.replace(/^@/, '').toLowerCase(),
          isActive: true,
        },
      });
      await sendReply(
        chatId,
        '🎉 <b>PIERCYN Admin Notifications Activated!</b>\n\nYou are registered as <b>Primary Admin</b>. Type <code>/status</code> for today\'s queue or <code>/help</code> for available commands.'
      );
      return;
    }

    await sendReply(
      chatId,
      'Welcome to PIERCYN Admin Bot. Send an administrator-issued invite using <code>/start &lt;token&gt;</code> to register.'
    );
    return;
  }

  const recipient = await prisma.telegramRecipient.findUnique({ where: { chatId } });
  if (!recipient?.isActive) {
    await sendReply(chatId, '⛔ Access restricted. You are not authorized to run PIERCYN administrative commands.');
    return;
  }

  if (command === '/status' || command === '/today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [orderCount, pendingReceipts, pendingQuotes] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { paymentStatus: 'AWAITING_VERIFICATION' } }),
      prisma.order.count({ where: { quoteStatus: { in: ['PENDING', 'SET', 'SENT'] } } }),
    ]);
    await sendReply(
      chatId,
      `📊 <b>PIERCYN Operational Status</b>\n\n` +
      `• Today's Orders: <b>${orderCount}</b>\n` +
      `• Receipts Pending Review: <b>${pendingReceipts}</b>\n` +
      `• Delivery Quotes Pending: <b>${pendingQuotes}</b>\n\n` +
      `<i>Admin: ${escapeHtml(recipient.label)}</i>`
    );
    return;
  }

  if (command === '/pending' || command === '/receipts') {
    await sendReply(
      chatId,
      await listPaymentOrders(
        { paymentStatus: 'AWAITING_VERIFICATION' },
        '⏳ <b>Pending Payment Reviews',
        '✅ No receipts currently awaiting review.'
      )
    );
    return;
  }

  if (command === '/unpaid') {
    await sendReply(
      chatId,
      await listPaymentOrders(
        { paymentStatus: { not: 'PAID' }, status: { notIn: ['CANCELLED', 'FAILED', 'REFUNDED'] } },
        '💳 <b>Unpaid Orders',
        '✅ No unpaid orders currently require attention.'
      )
    );
    return;
  }

  if (command === '/delivery') {
    await sendReply(
      chatId,
      await listPaymentOrders(
        { quoteStatus: { in: ['PENDING', 'SET', 'SENT'] }, status: { notIn: ['CANCELLED', 'FAILED', 'REFUNDED'] } },
        '🚚 <b>Delivery Quotes Pending',
        '✅ No delivery quotes are currently pending.'
      )
    );
    return;
  }

  if (command === '/help') {
    await sendReply(
      chatId,
      `<b>PIERCYN Admin Commands:</b>\n\n` +
      TELEGRAM_COMMANDS.map((item) => `• <code>${item}</code>`).join('\n') +
      '\n\n<code>/status</code> and <code>/today</code> show the operational queue.\n' +
      '<code>/pending</code> and <code>/receipts</code> show receipt reviews.\n' +
      '<code>/unpaid</code> shows unpaid orders.\n' +
      '<code>/delivery</code> shows pending delivery quotes.\n\n' +
      '<i>Mutation actions remain in the admin dashboard.</i>'
    );
    return;
  }

  await sendReply(chatId, 'Unknown command. Use <code>/help</code> to see the available PIERCYN commands.');
}

telegramWebhookRouter.post('/webhook', async (req: Request, res: Response) => {
  const secretHeader = req.header('x-telegram-bot-api-secret-token');
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  if (!expectedSecret) {
    console.error('[TELEGRAM_WEBHOOK_MISCONFIGURED] TELEGRAM_WEBHOOK_SECRET is not set');
    return res.status(503).json({ error: 'Telegram webhook is not configured' });
  }
  if (secretHeader !== expectedSecret) {
    console.warn('[TELEGRAM_WEBHOOK_UNAUTHORIZED] Invalid secret token');
    return res.status(401).json({ error: 'Unauthorized webhook call' });
  }

  // Telegram requires a fast acknowledgement. Vercel's waitUntil keeps the
  // database work and outbound sendMessage alive after this response returns.
  const work = processTelegramUpdate(req.body).catch((error) => {
    console.error('[TELEGRAM_COMMAND_ERROR]', error);
  });
  waitUntil(work);
  return res.status(200).json({ ok: true });
});
