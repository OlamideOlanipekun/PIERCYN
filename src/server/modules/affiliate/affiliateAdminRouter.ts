import { Router, Response } from 'express';
import { requireAdmin, AuthenticatedAdminRequest } from '../admin/adminMiddleware';
import { AffiliateService } from './affiliateService';
import { CommissionService } from './commissionService';
import { prisma } from '../../db/prisma';
import { ReviewAffiliateApplicationSchema, ProcessAffiliatePayoutSchema } from '../../schemas/affiliate';

export const affiliateAdminRouter = Router();

// All routes require Admin authentication
affiliateAdminRouter.use(requireAdmin);

// ─── ADMIN AFFILIATE OVERVIEW ─────────────────────────────────────────────

// GET /api/admin/affiliates/overview
affiliateAdminRouter.get('/overview', async (_req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const [
      totalAffiliates,
      pendingAffiliates,
      activeAffiliates,
      rejectedAffiliates,
      suspendedAffiliates,
      totalLinks,
      totalClicks,
      commissionStats,
      payoutStats,
    ] = await Promise.all([
      prisma.affiliate.count(),
      prisma.affiliate.count({ where: { status: 'PENDING' } }),
      prisma.affiliate.count({ where: { status: 'ACTIVE' } }),
      prisma.affiliate.count({ where: { status: 'REJECTED' } }),
      prisma.affiliate.count({ where: { status: 'SUSPENDED' } }),
      prisma.affiliateLink.count(),
      prisma.affiliateClick.count(),
      prisma.affiliateCommission.groupBy({
        by: ['status'],
        _sum: { amountKobo: true },
        _count: { id: true },
      }),
      prisma.affiliatePayout.groupBy({
        by: ['status'],
        _sum: { amountKobo: true },
        _count: { id: true },
      }),
    ]);

    const commissionsByStatus: Record<string, { totalKobo: number; count: number }> = {};
    for (const group of commissionStats) {
      commissionsByStatus[group.status] = {
        totalKobo: group._sum.amountKobo || 0,
        count: group._count.id,
      };
    }

    const payoutsByStatus: Record<string, { totalKobo: number; count: number }> = {};
    for (const group of payoutStats) {
      payoutsByStatus[group.status] = {
        totalKobo: group._sum.amountKobo || 0,
        count: group._count.id,
      };
    }

    res.json({
      success: true,
      data: {
        affiliates: {
          total: totalAffiliates,
          pending: pendingAffiliates,
          active: activeAffiliates,
          rejected: rejectedAffiliates,
          suspended: suspendedAffiliates,
        },
        links: {
          total: totalLinks,
          totalClicks,
        },
        commissions: {
          pendingKobo: commissionsByStatus['PENDING']?.totalKobo || 0,
          pendingCount: commissionsByStatus['PENDING']?.count || 0,
          availableKobo: commissionsByStatus['AVAILABLE']?.totalKobo || 0,
          availableCount: commissionsByStatus['AVAILABLE']?.count || 0,
          paidKobo: commissionsByStatus['PAID']?.totalKobo || 0,
          paidCount: commissionsByStatus['PAID']?.count || 0,
          reversedKobo: commissionsByStatus['REVERSED']?.totalKobo || 0,
          reversedCount: commissionsByStatus['REVERSED']?.count || 0,
        },
        payouts: payoutsByStatus,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ADMIN PAYOUTS MANAGEMENT (registered BEFORE /:id to prevent shadowing) ─────────

// GET /api/admin/affiliates/payouts/all
affiliateAdminRouter.get('/payouts/all', async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { status, limit, offset } = req.query;
    const payouts = await AffiliateService.getAllPayoutsForAdmin({
      status: status as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json({ success: true, count: payouts.length, data: payouts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/affiliates/payouts/:id/process and /api/admin/affiliates/payouts/process
affiliateAdminRouter.post(['/payouts/:id/process', '/payouts/process'], async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = ProcessAffiliatePayoutSchema.parse(req.body);
    const targetPayoutId = req.params.id || (req.body as any).payoutId;
    if (!targetPayoutId) {
      return res.status(400).json({ success: false, error: 'payoutId is required' });
    }
    const updated = await AffiliateService.processPayout(
      targetPayoutId,
      validated.action,
      req.admin!.email,
      validated.notes || validated.adminNote,
      validated.payoutReference || validated.paymentReference
    );
    res.json({
      success: true,
      message: `Payout successfully updated to ${validated.action}.`,
      data: updated,
    });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0]?.message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

// ─── AFFILIATES DIRECTORY (/:id catch-all must come AFTER all specific routes) ──────

// GET /api/admin/affiliates
affiliateAdminRouter.get('/', async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { status, search, limit, offset } = req.query;
    // Sanitize query params: treat absent, empty, or literal "undefined" string as undefined
    const sanitizedStatus =
      status && status !== 'undefined' ? (status as string) : undefined;
    const sanitizedSearch =
      search && search !== 'undefined' ? (search as string) : undefined;
    const affiliates = await AffiliateService.getAllAffiliatesForAdmin({
      status: sanitizedStatus,
      search: sanitizedSearch,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json({ success: true, count: affiliates.length, data: affiliates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/affiliates/:id
affiliateAdminRouter.get('/:id', async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const affiliate = await AffiliateService.getAffiliateDetailForAdmin(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, error: 'Affiliate not found' });
    }
    res.json({ success: true, data: affiliate });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/affiliates/:id/review (Approve or Reject application)
affiliateAdminRouter.post('/:id/review', async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = ReviewAffiliateApplicationSchema.parse(req.body);
    const updated = await AffiliateService.reviewApplication(
      req.params.id,
      validated.action,
      req.admin!.email,
      validated.rejectionReason || validated.adminNotes
    );
    res.json({
      success: true,
      message: `Affiliate application ${validated.action.toLowerCase()}ed successfully.`,
      data: updated,
    });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0]?.message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

// POST /api/admin/affiliates/:id/status (Suspend or Reactivate)
affiliateAdminRouter.post('/:id/status', async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { status, reason } = req.body;
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be ACTIVE or SUSPENDED' });
    }

    const updated = await AffiliateService.updateAffiliateStatus(
      req.params.id,
      status,
      req.admin!.email,
      reason
    );
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
