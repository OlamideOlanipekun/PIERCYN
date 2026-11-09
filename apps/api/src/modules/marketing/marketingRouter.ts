import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { prisma } from '@piercyn/db';
import { requireAdmin } from '../admin/adminMiddleware';

export const marketingRouter = Router();

/**
 * POST /api/marketing/subscribe
 * Customer newsletter & marketing consent opt-in.
 */
marketingRouter.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address required.' });
    }

    const unsubscribeToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(unsubscribeToken).digest('hex');

    const subscriber = await prisma.marketingSubscriber.upsert({
      where: { email },
      update: {
        isSubscribed: true,
        consentedAt: new Date(),
        unsubscribedAt: null,
      },
      create: {
        email,
        isSubscribed: true,
        consentedAt: new Date(),
        consentSource: req.body.source || 'storefront',
        unsubscribeTokenHash: tokenHash,
      },
    });

    return res.json({
      success: true,
      message: 'Subscribed successfully. You may unsubscribe anytime via email footer.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/marketing/unsubscribe/:token
 * One-click unsubscribe without requiring authentication.
 */
marketingRouter.get('/unsubscribe/:token', async (req: Request, res: Response) => {
  try {
    const rawToken = req.params.token;
    if (!rawToken) return res.status(400).send('Invalid unsubscribe link.');

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const subscriber = await prisma.marketingSubscriber.findUnique({
      where: { unsubscribeTokenHash: tokenHash },
    });

    if (!subscriber) {
      return res.status(404).send('Subscriber not found or link has expired.');
    }

    await prisma.marketingSubscriber.update({
      where: { id: subscriber.id },
      data: {
        isSubscribed: false,
        unsubscribedAt: new Date(),
      },
    });

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Unsubscribed — PIERCYN</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 48px;">
          <h2>You have been unsubscribed</h2>
          <p>You will no longer receive promotional emails from PIERCYN.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    return res.status(500).send('Unsubscribe failed.');
  }
});

/**
 * POST /api/admin/marketing/campaigns
 * Admin campaign creation.
 */
marketingRouter.post('/campaigns', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, subject, content } = req.body;
    if (!name || !subject || !content) {
      return res.status(400).json({ success: false, error: 'Name, subject, and content are required.' });
    }

    const campaign = await prisma.marketingCampaign.create({
      data: {
        name,
        subject,
        content,
        status: 'DRAFT',
      },
    });

    return res.json({ success: true, data: campaign });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/marketing/campaigns/:id/approve
 */
marketingRouter.post('/campaigns/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.id || 'ADMIN';
    const campaign = await prisma.marketingCampaign.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    return res.json({ success: true, data: campaign });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
