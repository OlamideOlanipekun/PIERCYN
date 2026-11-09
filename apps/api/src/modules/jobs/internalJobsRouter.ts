import { Router, Request, Response } from 'express';
import { prisma } from '@piercyn/db';
import { OutboxProcessor } from '../notifications/outboxProcessor';
import { InventoryService } from '../inventory/inventoryService';

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
    const expiredCount = await InventoryService.expireStaleReservations();
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
