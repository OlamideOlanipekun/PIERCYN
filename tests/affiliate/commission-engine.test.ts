if (!process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL_TEST = 'postgresql://postgres:postgres@localhost:5432/piercyn_test';
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AFFILIATE_CONFIG } from '../../packages/config/src/index';
import { CommissionService } from '../../apps/api/src/modules/affiliate/commissionService';
import { prisma } from '../../apps/api/src/db/prisma';

describe('Affiliate Commission Engine (₦1,000 Order-Level)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Commercial Configuration Guarantees', () => {
    it('enforces ₦1,000 (100,000 kobo) per qualifying order', () => {
      expect(AFFILIATE_CONFIG.commissionPerOrderKobo).toBe(100_000);
      expect(CommissionService.calculateAffiliateCommission()).toBe(100_000);
      expect(CommissionService.getCommissionPerOrderNGN()).toBe(1000);
      expect(CommissionService.getCommissionPerProductNGN()).toBe(1000);
    });

    it('enforces 7-day return cooling window', () => {
      expect(AFFILIATE_CONFIG.returnWindowDays).toBe(7);
      expect(CommissionService.getReturnWindowDays()).toBe(7);
    });

    it('enforces zero minimum withdrawal requirement', () => {
      expect(AFFILIATE_CONFIG.minimumWithdrawalKobo).toBe(0);
    });

    it('enforces 30-day attribution window', () => {
      expect(AFFILIATE_CONFIG.attributionWindowDays).toBe(30);
    });
  });

  describe('Order-Level Calculation & Idempotency', () => {
    it('creates exactly one ₦800 commission for an order with 3 items (not per-product)', async () => {
      const mockOrder = {
        id: 'ord_123',
        orderNumber: 'ORD-2026-001',
        affiliateId: 'aff_1',
        affiliateLinkId: 'link_1',
        paymentStatus: 'PAID',
        customerEmail: 'customer@example.com',
        items: [
          { id: 'item_1', productName: 'Velvet Suit Jacket', quantity: 1, unitPriceNGN: 45000 },
          { id: 'item_2', productName: 'Silk Trouser', quantity: 1, unitPriceNGN: 25000 },
          { id: 'item_3', productName: 'Leather Belt', quantity: 1, unitPriceNGN: 12000 },
        ],
        affiliate: { id: 'aff_1', email: 'affiliate@creator.com', status: 'ACTIVE', isActive: true },
      };

      vi.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder as any);
      vi.spyOn(prisma.affiliateCommission, 'findFirst').mockResolvedValue(null);

      const createdRecords: any[] = [];
      const walletRecords: any[] = [];
      const ledgerRecords: any[] = [];

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          affiliateCommission: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockImplementation((args) => {
              createdRecords.push(args.data);
              return { id: 'comm_1', ...args.data };
            }),
          },
          affiliateWallet: {
            upsert: vi.fn().mockImplementation((args) => {
              walletRecords.push(args);
              return { affiliateId: 'aff_1', pendingKobo: 100_000, availableKobo: 0 };
            }),
          },
          affiliateLedger: {
            create: vi.fn().mockImplementation((args) => {
              ledgerRecords.push(args.data);
              return { id: 'led_1', ...args.data };
            }),
          },
        };
        return cb(tx);
      });

      await CommissionService.processOrderCommission('ord_123');

      // Verify exactly ONE order-level commission created
      expect(createdRecords).toHaveLength(1);
      expect(createdRecords[0].amountKobo).toBe(100_000);
      expect(createdRecords[0].isOrderLevel).toBe(true);
      expect(createdRecords[0].status).toBe('PENDING');

      // Verify wallet credit
      expect(walletRecords).toHaveLength(1);
      expect(walletRecords[0].update.pendingKobo.increment).toBe(100_000);

      // Verify immutable ledger entry
      expect(ledgerRecords).toHaveLength(1);
      expect(ledgerRecords[0].type).toBe('COMMISSION_PENDING');
      expect(ledgerRecords[0].amountKobo).toBe(100_000);
      expect(ledgerRecords[0].referenceType).toBe('ORDER');
      expect(ledgerRecords[0].referenceId).toBe('ord_123');
    });

    it('is strictly idempotent: duplicate delivery event does not create duplicate commissions', async () => {
      const mockOrder = {
        id: 'ord_duplicate',
        affiliateId: 'aff_1',
        paymentStatus: 'PAID',
        customerEmail: 'customer@example.com',
        items: [{ id: 'item_1', productName: 'Linen Shirt', quantity: 2, unitPriceNGN: 18000 }],
        affiliate: { id: 'aff_1', email: 'affiliate@creator.com', status: 'ACTIVE', isActive: true },
      };

      vi.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder as any);

      // Existing commission found
      vi.spyOn(prisma.affiliateCommission, 'findFirst').mockResolvedValue({
        id: 'comm_existing',
        orderId: 'ord_duplicate',
        amountKobo: 100_000,
        status: 'PENDING',
      } as any);

      const txSpy = vi.spyOn(prisma, '$transaction');

      await CommissionService.processOrderCommission('ord_duplicate');

      // No transaction or new commission created
      expect(txSpy).not.toHaveBeenCalled();
    });

    it('rejects self-referral: customer email matching affiliate email yields zero commission', async () => {
      const mockOrder = {
        id: 'ord_self_ref',
        affiliateId: 'aff_1',
        paymentStatus: 'PAID',
        customerEmail: 'same_creator@piercyn.com',
        items: [{ id: 'item_1', productName: 'Silk Robe', quantity: 1, unitPriceNGN: 35000 }],
        affiliate: { id: 'aff_1', email: 'same_creator@piercyn.com', status: 'ACTIVE', isActive: true },
      };

      vi.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder as any);
      const txSpy = vi.spyOn(prisma, '$transaction');

      await CommissionService.processOrderCommission('ord_self_ref');

      // Self-referral aborted before transaction
      expect(txSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cooling Window & Maturity Lifecycle', () => {
    it('sets 7-day cooling window on order delivery', async () => {
      let updatedData: any = null;
      vi.spyOn(prisma.affiliateCommission as any, 'updateMany').mockImplementation(async (args: any) => {
        updatedData = args.data;
        return { count: 1 } as any;
      });

      const before = new Date();
      await CommissionService.handleOrderDelivered('ord_delivered_1');

      expect(updatedData).toBeDefined();
      expect(updatedData.eligibleAt).toBeInstanceOf(Date);

      // Verify eligibleAt is approximately 7 days from now
      const daysDiff = (updatedData.eligibleAt.getTime() - before.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThanOrEqual(6.99);
      expect(daysDiff).toBeLessThanOrEqual(7.01);
    });

    it('promotes mature pending commissions to available with atomic wallet update', async () => {
      const matureCommissions = [
        { id: 'comm_m1', affiliateId: 'aff_1', amountKobo: 100_000, orderId: 'ord_m1' },
      ];

      vi.spyOn(prisma.affiliateCommission, 'findMany').mockResolvedValue(matureCommissions as any);

      const walletUpdates: any[] = [];
      const ledgerEntries: any[] = [];

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          affiliateCommission: {
            findUnique: vi.fn().mockResolvedValue({ id: 'comm_m1', status: 'PENDING' }),
            update: vi.fn().mockResolvedValue({ id: 'comm_m1', status: 'AVAILABLE' }),
          },
          affiliateWallet: {
            findUnique: vi.fn().mockResolvedValue({ pendingKobo: 100_000, availableKobo: 0 }),
            upsert: vi.fn().mockImplementation((args) => {
              walletUpdates.push(args);
              return { affiliateId: 'aff_1', pendingKobo: 0, availableKobo: 100_000 };
            }),
          },
          affiliateLedger: {
            create: vi.fn().mockImplementation((args) => {
              ledgerEntries.push(args.data);
              return { id: 'led_mature', ...args.data };
            }),
          },
        };
        return cb(tx);
      });

      const count = await CommissionService.qualifyMatureCommissions();

      expect(count).toBe(1);
      expect(walletUpdates).toHaveLength(1);
      expect(walletUpdates[0].update.pendingKobo.decrement).toBe(100_000);
      expect(walletUpdates[0].update.availableKobo.increment).toBe(100_000);

      expect(ledgerEntries).toHaveLength(1);
      expect(ledgerEntries[0].type).toBe('COMMISSION_AVAILABLE');
      expect(ledgerEntries[0].amountKobo).toBe(100_000);
    });
  });
});
