import { Router, Request, Response } from 'express';
import { AffiliateAuthService } from './affiliateAuthService';
import { AffiliateService } from './affiliateService';
import { CommissionService } from './commissionService';
import { requireAffiliate, requireAffiliateLoose, AuthenticatedAffiliateRequest } from './affiliateMiddleware';
import {
  AffiliateApplySchema,
  AffiliateLoginSchema,
  CreateAffiliateLinkSchema,
  UpdateAffiliateProfileSchema,
  RequestAffiliatePayoutSchema,
  TrackAffiliateClickSchema,
} from '../../schemas/affiliate';

export const affiliateRouter = Router();

// ─── PUBLIC TRACKING ENDPOINT ─────────────────────────────────────────────
// POST /api/affiliate/track-click
affiliateRouter.post('/track-click', async (req: Request, res: Response) => {
  try {
    const validated = TrackAffiliateClickSchema.parse(req.body);
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || undefined;
    const userAgent = req.headers['user-agent'] || undefined;

    const result = await AffiliateService.trackClick({
      code: validated.code,
      sessionId: validated.sessionId,
      ipAddress,
      userAgent,
      referrer: validated.referrer,
      landingPage: validated.landingPage,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0]?.message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

// GET /api/affiliate/resolve/:code
affiliateRouter.get('/resolve/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const link = await AffiliateService.getLinkByCode(code);
    if (!link) {
      return res.status(404).json({ success: false, error: 'Affiliate link not found' });
    }
    res.json({
      success: true,
      data: {
        code: link.code,
        destination: link.destination,
        destinationType: link.destinationType,
        affiliateName: `${link.affiliate.firstName} ${link.affiliate.lastName}`.trim(),
        affiliateStatus: link.affiliate.status,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── AUTHENTICATION & ONBOARDING ──────────────────────────────────────────

// POST /api/affiliate/apply
affiliateRouter.post('/apply', async (req: Request, res: Response) => {
  try {
    const validated = AffiliateApplySchema.parse(req.body);
    const result = await AffiliateService.applyForAffiliate(validated);
    res.status(201).json({
      success: true,
      data: {
        affiliate: result.affiliate,
        token: result.token,
        message: 'Your affiliate application has been submitted and is pending review.',
      },
    });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0]?.message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

// POST /api/affiliate/login
affiliateRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const validated = AffiliateLoginSchema.parse(req.body);
    const result = await AffiliateAuthService.login(validated.email, validated.password);
    res.json({ success: true, data: result });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0]?.message : err.message;
    res.status(401).json({ success: false, error: msg });
  }
});

// GET /api/affiliate/me (Loose auth: pending affiliates can inspect application status)
affiliateRouter.get('/me', requireAffiliateLoose, async (req: AuthenticatedAffiliateRequest, res: Response) => {
  try {
    const affiliateId = req.affiliate!.id;
    const affiliate = await AffiliateService.getAffiliateById(affiliateId);
    if (!affiliate) {
      return res.status(404).json({ success: false, error: 'Affiliate not found' });
    }
    res.json({ success: true, data: affiliate });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PROTECTED AFFILIATE PORTAL (ACTIVE ONLY) ─────────────────────────────

// GET /api/affiliate/dashboard
affiliateRouter.get('/dashboard', requireAffiliate, async (req: AuthenticatedAffiliateRequest, res: Response) => {
  try {
    const affiliateId = req.affiliate!.id;
    const stats = await AffiliateService.getDashboardStats(affiliateId);
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/affiliate/links
affiliateRouter.get('/links', requireAffiliate, async (req: AuthenticatedAffiliateRequest, res: Response) => {
  try {
    const affiliateId = req.affiliate!.id;
    const links = await AffiliateService.getAffiliateLinks(affiliateId);
    res.json({ success: true, data: links });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/affiliate/links
affiliateRouter.post('/links', requireAffiliate, async (req: AuthenticatedAffiliateRequest, res: Response) => {
  try {
    const affiliateId = req.affiliate!.id;
    const validated = CreateAffiliateLinkSchema.parse(req.body);
    const link = await AffiliateService.createAffiliateLink(affiliateId, validated);
    res.status(201).json({ success: true, data: link });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0]?.message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

// GET /api/affiliate/orders
affiliateRouter.get('/orders', requireAffiliate, async (req: AuthenticatedAffiliateRequest, res: Response) => {
  try {
    const affiliateId = req.affiliate!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
    const orders = await AffiliateService.getAttributedOrders(affiliateId, { limit, offset });
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/affiliate/commissions
affiliateRouter.get('/commissions', requireAffiliate, async (req: AuthenticatedAffiliateRequest, res: Response) => {
  try {
    const affiliateId = req.affiliate!.id;
    const status = req.query.status as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
    const commissions = await AffiliateService.getCommissions(affiliateId, { status, limit, offset });
    res.json({ success: true, data: commissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/affiliate/payouts
affiliateRouter.get('/payouts', requireAffiliate, async (req: AuthenticatedAffiliateRequest, res: Response) => {
  try {
    const affiliateId = req.affiliate!.id;
    const payouts = await AffiliateService.getPayouts(affiliateId);
    res.json({ success: true, data: payouts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/affiliate/payouts/request
affiliateRouter.post('/payouts/request', requireAffiliate, async (req: AuthenticatedAffiliateRequest, res: Response) => {
  try {
    const affiliateId = req.affiliate!.id;
    const validated = RequestAffiliatePayoutSchema.parse(req.body);
    const payout = await AffiliateService.requestPayout(affiliateId, validated);
    res.status(201).json({ success: true, data: payout });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0]?.message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

// PUT /api/affiliate/profile
affiliateRouter.put('/profile', requireAffiliate, async (req: AuthenticatedAffiliateRequest, res: Response) => {
  try {
    const affiliateId = req.affiliate!.id;
    const validated = UpdateAffiliateProfileSchema.parse(req.body);
    const updated = await AffiliateService.updateProfile(affiliateId, validated);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0]?.message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});
