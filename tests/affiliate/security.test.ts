if (!process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL_TEST = 'postgresql://postgres:postgres@localhost:5432/piercyn_test';
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAffiliate } from '../../apps/api/src/modules/affiliate/affiliateMiddleware';
import { AffiliateAuthService } from '../../apps/api/src/modules/affiliate/affiliateAuthService';
import { prisma } from '../../apps/api/src/db/prisma';

describe('Affiliate Security & Access Control Boundaries', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('requireAffiliate Middleware', () => {
    it('returns 401 Unauthenticated when no token is supplied', async () => {
      const req: any = { headers: {} };
      let statusCode = 0;
      let jsonBody: any = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (body: any) => {
              jsonBody = body;
            },
          };
        },
      };
      const next = vi.fn();

      await requireAffiliate(req, res, next);

      expect(statusCode).toBe(401);
      expect(jsonBody.success).toBe(false);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 Forbidden when affiliate account is SUSPENDED', async () => {
      const mockAffiliate = {
        id: 'aff_suspended_1',
        email: 'suspended@piercyn.com',
        firstName: 'Bad',
        lastName: 'Actor',
        status: 'SUSPENDED' as const,
        isActive: false,
        createdAt: new Date().toISOString(),
      };

      const token = AffiliateAuthService.generateToken(mockAffiliate as any);
      vi.spyOn(prisma.affiliate, 'findUnique').mockResolvedValue({
        ...mockAffiliate,
        createdAt: new Date(),
      } as any);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
      };
      let statusCode = 0;
      let jsonBody: any = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (body: any) => {
              jsonBody = body;
            },
          };
        },
      };
      const next = vi.fn();

      await requireAffiliate(req, res, next);

      expect(statusCode).toBe(403);
      expect(jsonBody.error).toMatch(/suspended/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 Forbidden when affiliate account is PENDING', async () => {
      const mockAffiliate = {
        id: 'aff_pending_1',
        email: 'pending@piercyn.com',
        firstName: 'Hopeful',
        lastName: 'Applicant',
        status: 'PENDING' as const,
        isActive: false,
        createdAt: new Date().toISOString(),
      };

      const token = AffiliateAuthService.generateToken(mockAffiliate as any);
      vi.spyOn(prisma.affiliate, 'findUnique').mockResolvedValue({
        ...mockAffiliate,
        createdAt: new Date(),
      } as any);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
      };
      let statusCode = 0;
      let jsonBody: any = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (body: any) => {
              jsonBody = body;
            },
          };
        },
      };
      const next = vi.fn();

      await requireAffiliate(req, res, next);

      expect(statusCode).toBe(403);
      expect(jsonBody.error).toMatch(/under review/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('successfully permits ACTIVE, approved affiliate and attaches affiliate to req', async () => {
      const mockAffiliate = {
        id: 'aff_active_1',
        email: 'active@piercyn.com',
        firstName: 'Active',
        lastName: 'Creator',
        status: 'ACTIVE' as const,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const token = AffiliateAuthService.generateToken(mockAffiliate as any);
      vi.spyOn(prisma.affiliate, 'findUnique').mockResolvedValue({
        ...mockAffiliate,
        createdAt: new Date(),
      } as any);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
      };
      const res: any = {};
      const next = vi.fn();

      await requireAffiliate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.affiliate).toBeDefined();
      expect(req.affiliate.id).toBe('aff_active_1');
      expect(req.affiliate.status).toBe('ACTIVE');
    });
  });
});
