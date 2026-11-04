if (!process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL_TEST = 'postgresql://postgres:postgres@localhost:5432/piercyn_test';
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AffiliateAuthService } from '../../apps/api/src/modules/affiliate/affiliateAuthService';
import { prisma } from '../../apps/api/src/db/prisma';

describe('Affiliate Dual-Mode Authentication (Supabase + HMAC)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('HMAC Token Generation & Verification', () => {
    it('generates an HMAC token prefixed with aff_tok_', () => {
      const mockAffiliate = {
        id: 'aff_auth_1',
        email: 'creator@piercyn.com',
        firstName: 'Jane',
        lastName: 'Doe',
        status: 'ACTIVE' as const,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const token = AffiliateAuthService.generateToken(mockAffiliate as any);
      expect(token.startsWith('aff_tok_')).toBe(true);
      expect(token.split('.')).toHaveLength(2);
    });

    it('successfully verifies valid HMAC token', async () => {
      const mockAffiliate = {
        id: 'aff_auth_2',
        email: 'creator2@piercyn.com',
        firstName: 'Kelvin',
        lastName: 'Styles',
        status: 'ACTIVE' as const,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const token = AffiliateAuthService.generateToken(mockAffiliate as any);
      const verified = await AffiliateAuthService.verifyToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.id).toBe('aff_auth_2');
      expect(verified?.email).toBe('creator2@piercyn.com');
    });

    it('rejects tampered HMAC token signature', async () => {
      const mockAffiliate = {
        id: 'aff_auth_3',
        email: 'creator3@piercyn.com',
        firstName: 'Tamper',
        lastName: 'Test',
        status: 'ACTIVE' as const,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const token = AffiliateAuthService.generateToken(mockAffiliate as any);
      // Tamper with signature
      const tampered = token.slice(0, -8) + 'invalid_';

      const verified = await AffiliateAuthService.verifyToken(tampered);
      expect(verified).toBeNull();
    });
  });

  describe('Password Login Guard for OAuth Accounts', () => {
    it('rejects password login for OAuth-only accounts with no password hash', async () => {
      vi.spyOn(prisma.affiliate, 'findUnique').mockResolvedValue({
        id: 'aff_oauth_1',
        email: 'google_user@piercyn.com',
        passwordHash: null, // OAuth-only user
        status: 'ACTIVE',
        isActive: true,
      } as any);

      await expect(
        AffiliateAuthService.login('google_user@piercyn.com', 'somePassword123')
      ).rejects.toThrow(/Please sign in with Google/i);
    });
  });
});
