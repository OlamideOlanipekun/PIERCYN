if (!process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL_TEST = 'postgresql://postgres:postgres@localhost:5432/piercyn_test';
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AffiliateService } from '../../apps/api/src/modules/affiliate/affiliateService';
import { prisma } from '../../apps/api/src/db/prisma';

describe('Affiliate Wallet & Payout Lifecycle', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Withdrawal Requests & Balance Reservation', () => {
    it('allows withdrawal of any amount ≥ ₦1 (zero minimum withdrawal restriction)', async () => {
      const affiliateId = 'aff_creator_1';
      const mockAffiliate = {
        id: affiliateId,
        status: 'ACTIVE',
        isActive: true,
      };

      const mockWallet = {
        id: 'wallet_1',
        affiliateId,
        availableKobo: 50_000, // ₦500 available
        reservedKobo: 0,
        paidKobo: 0,
      };

      const ledgerEntries: any[] = [];
      const walletUpdates: any[] = [];

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          affiliate: {
            findUnique: vi.fn().mockResolvedValue(mockAffiliate),
          },
          affiliateWallet: {
            findUnique: vi.fn().mockResolvedValue(mockWallet),
            update: vi.fn().mockImplementation((args) => {
              walletUpdates.push(args);
              return {
                ...mockWallet,
                availableKobo: mockWallet.availableKobo - args.data.availableKobo.decrement,
                reservedKobo: mockWallet.reservedKobo + args.data.reservedKobo.increment,
              };
            }),
          },
          affiliatePayout: {
            create: vi.fn().mockImplementation((args) => ({
              id: 'payout_req_1',
              requestedAt: new Date(),
              accountNumber: args.data.accountNumber,
              accountName: args.data.accountName,
              ...args.data,
            })),
          },
          affiliateCommission: {
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn(),
          },
          affiliateLedger: {
            create: vi.fn().mockImplementation((args) => {
              ledgerEntries.push(args.data);
              return { id: 'led_1', ...args.data };
            }),
          },
        };
        return cb(tx);
      });

      // Request withdrawal of ₦200 (less than old ₦500 minimum, perfectly valid under new rules)
      const payout = await AffiliateService.requestPayout(affiliateId, {
        amountNGN: 200,
        bankName: 'Guaranty Trust Bank',
        accountNumber: '0123456789',
        accountName: 'Creator Test',
      });

      expect(payout.amountKobo).toBe(20_000);
      expect(payout.status).toBe('PENDING');

      // Verify wallet reservation: available decremented, reserved incremented
      expect(walletUpdates).toHaveLength(1);
      expect(walletUpdates[0].data.availableKobo.decrement).toBe(20_000);
      expect(walletUpdates[0].data.reservedKobo.increment).toBe(20_000);

      // Verify immutable ledger entry
      expect(ledgerEntries).toHaveLength(1);
      expect(ledgerEntries[0].type).toBe('WITHDRAWAL_RESERVED');
      expect(ledgerEntries[0].amountKobo).toBe(-20_000);
    });

    it('rejects withdrawal if requested amount exceeds available balance', async () => {
      const affiliateId = 'aff_creator_2';

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          affiliate: {
            findUnique: vi.fn().mockResolvedValue({ id: affiliateId, status: 'ACTIVE', isActive: true }),
          },
          affiliateWallet: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'wallet_2',
              affiliateId,
              availableKobo: 10_000, // ₦100 available
              reservedKobo: 0,
            }),
          },
        };
        return cb(tx);
      });

      await expect(
        AffiliateService.requestPayout(affiliateId, {
          amountNGN: 500, // Requesting ₦500 when only ₦100 available
          bankName: 'Access Bank',
          accountNumber: '0987654321',
          accountName: 'Creator Test',
        })
      ).rejects.toThrow(/exceeds your available balance/i);
    });

    it('rejects zero or negative withdrawal requests', async () => {
      await expect(
        AffiliateService.requestPayout('aff_1', {
          amountNGN: 0,
          bankName: 'Access Bank',
          accountNumber: '0987654321',
          accountName: 'Creator Test',
        })
      ).rejects.toThrow(/greater than zero/i);
    });
  });

  describe('Administrative Payout Processing & Fund Release', () => {
    it('moves reserved funds to paid when admin approves payout as PAID', async () => {
      const mockPayout = {
        id: 'payout_pay_1',
        affiliateId: 'aff_creator_1',
        amountKobo: 80_000,
        status: 'PENDING',
      };

      vi.spyOn(prisma.affiliatePayout, 'findUnique').mockResolvedValue(mockPayout as any);

      const ledgerEntries: any[] = [];
      const walletUpdates: any[] = [];

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          affiliatePayout: {
            findUnique: vi.fn().mockResolvedValue(mockPayout),
            update: vi.fn().mockResolvedValue({ ...mockPayout, status: 'PAID' }),
          },
          affiliateWallet: {
            findUnique: vi.fn().mockResolvedValue({
              availableKobo: 0,
              reservedKobo: 80_000,
              paidKobo: 0,
            }),
            upsert: vi.fn().mockImplementation((args) => {
              walletUpdates.push(args);
              return { availableKobo: 0, reservedKobo: 0, paidKobo: 80_000 };
            }),
          },
          affiliateLedger: {
            create: vi.fn().mockImplementation((args) => {
              ledgerEntries.push(args.data);
              return { id: 'led_pay_1', ...args.data };
            }),
          },
          affiliateCommission: {
            updateMany: vi.fn(),
          },
        };
        return cb(tx);
      });

      const updated = await AffiliateService.processPayout(
        'payout_pay_1',
        'PAID',
        'admin@piercyn.com',
        'Bank transfer completed',
        'REF-TRF-12345'
      );

      expect(updated.status).toBe('PAID');
      expect(walletUpdates).toHaveLength(1);
      expect(walletUpdates[0].update.reservedKobo.decrement).toBe(80_000);
      expect(walletUpdates[0].update.paidKobo.increment).toBe(80_000);

      expect(ledgerEntries).toHaveLength(1);
      expect(ledgerEntries[0].type).toBe('WITHDRAWAL_PAID');
      expect(ledgerEntries[0].amountKobo).toBe(-80_000);
    });

    it('releases reserved funds back to available balance when admin REJECTS payout', async () => {
      const mockPayout = {
        id: 'payout_rej_1',
        affiliateId: 'aff_creator_1',
        amountKobo: 80_000,
        status: 'PENDING',
      };

      vi.spyOn(prisma.affiliatePayout, 'findUnique').mockResolvedValue(mockPayout as any);

      const ledgerEntries: any[] = [];
      const walletUpdates: any[] = [];

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          affiliatePayout: {
            findUnique: vi.fn().mockResolvedValue(mockPayout),
            update: vi.fn().mockResolvedValue({ ...mockPayout, status: 'REJECTED' }),
          },
          affiliateWallet: {
            findUnique: vi.fn().mockResolvedValue({
              availableKobo: 0,
              reservedKobo: 80_000,
              paidKobo: 0,
            }),
            upsert: vi.fn().mockImplementation((args) => {
              walletUpdates.push(args);
              return { availableKobo: 80_000, reservedKobo: 0, paidKobo: 0 };
            }),
          },
          affiliateLedger: {
            create: vi.fn().mockImplementation((args) => {
              ledgerEntries.push(args.data);
              return { id: 'led_rej_1', ...args.data };
            }),
          },
          affiliateCommission: {
            updateMany: vi.fn(),
          },
        };
        return cb(tx);
      });

      const updated = await AffiliateService.processPayout(
        'payout_rej_1',
        'REJECTED',
        'admin@piercyn.com',
        'Account name mismatch on bank server'
      );

      expect(updated.status).toBe('REJECTED');

      // Reserved released back to available
      expect(walletUpdates).toHaveLength(1);
      expect(walletUpdates[0].update.reservedKobo.decrement).toBe(80_000);
      expect(walletUpdates[0].update.availableKobo.increment).toBe(80_000);

      expect(ledgerEntries).toHaveLength(1);
      expect(ledgerEntries[0].type).toBe('WITHDRAWAL_RELEASED');
      expect(ledgerEntries[0].amountKobo).toBe(80_000);
    });
  });
});
