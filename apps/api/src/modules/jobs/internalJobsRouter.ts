import { Router, Request, Response } from 'express';
import { prisma } from '@piercyn/db';
import { OutboxProcessor } from '../notifications/outboxProcessor';
import { InventoryService } from '../inventory/inventoryService';
import { CommissionService } from '../affiliate/commissionService';
import { DeliveryQuoteCron } from '../checkout/quoteCron';

export const internalJobsRouter = Router();

// Middleware: Validate CRON_SECRET or ADMIN token
function requireCronSecret(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized internal job call' });
  }
  next();
}

internalJobsRouter.use(requireCronSecret);

/**
 * GET/POST /api/internal/cron/daily
 * Daily aggregator cron triggered by Vercel Cron at 06:00 UTC.
 * Executes:
 * 1. Delivery quote lifecycle & reminders/expiries
 * 2. Mature affiliate commission qualification
 * 3. Stale inventory reservation expiry
 * 4. Notification delivery outbox processing
 */
const handleDailyCron = async (_req: Request, res: Response) => {
  const summary: Record<string, any> = {};
  const errors: string[] = [];

  // 1. Process delivery quotation reminders and expiries
  try {
    summary.quotes = await DeliveryQuoteCron.processQuoteLifecycle();
  } catch (err: any) {
    errors.push(`DeliveryQuoteCron: ${err.message}`);
  }

  // 2. Qualify mature commissions
  try {
    summary.qualifiedCommissions = await CommissionService.qualifyMatureCommissions();
  } catch (err: any) {
    errors.push(`CommissionService: ${err.message}`);
  }

  // 3. Expire stale inventory reservations
  try {
    summary.expiredReservations = await InventoryService.expireReservations();
  } catch (err: any) {
    errors.push(`InventoryService: ${err.message}`);
  }

  // 4. Process pending notification outbox deliveries
  try {
    summary.outbox = await OutboxProcessor.processDeliveries(30);
  } catch (err: any) {
    errors.push(`OutboxProcessor: ${err.message}`);
  }

  const success = errors.length === 0;
  return res.status(success ? 200 : 207).json({
    success,
    executedAt: new Date().toISOString(),
    summary,
    errors: errors.length > 0 ? errors : undefined,
  });
};

internalJobsRouter.get('/cron/daily', handleDailyCron);
internalJobsRouter.post('/cron/daily', handleDailyCron);

/**
 * POST /api/internal/process-outbox
 * Triggers batch processing of queued email and Telegram deliveries.
 */
internalJobsRouter.post('/process-outbox', async (_req: Request, res: Response) => {
  try {
    const result = await OutboxProcessor.processDeliveries(15);
    return res.json({ success: true, result });
  } catch (error: any) {
    console.error('[CRON_OUTBOX_ERROR]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/internal/expire-reservations
 * Releases inventory reservations older than 30 minutes for unpaid orders.
 */
internalJobsRouter.post('/expire-reservations', async (_req: Request, res: Response) => {
  try {
    const expiredCount = await InventoryService.expireReservations();
    return res.json({ success: true, expiredCount });
  } catch (error: any) {
    console.error('[CRON_EXPIRE_RESERVATIONS_ERROR]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/internal/expire-delivery-quotes
 * Expires pending delivery quotations past their 48-hour expiration deadline.
 */
internalJobsRouter.post('/expire-delivery-quotes', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const expired = await prisma.deliveryQuote.updateMany({
      where: {
        status: 'SENT',
        expiresAt: { lte: now },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return res.json({ success: true, expiredQuotesCount: expired.count });
  } catch (error: any) {
    console.error('[CRON_EXPIRE_QUOTES_ERROR]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
