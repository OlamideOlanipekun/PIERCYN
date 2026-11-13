import { AFFILIATE_CONFIG } from '../../config/constants';
import { prisma } from '../../db/prisma';
import { AffiliateNotificationService } from './affiliateNotificationService';

// ============================================================
// COMMISSION SERVICE
// Authoritative single source of truth for all commission calculations.
// Centralised order-level calculation: ₦1,000 = 100,000 kobo per qualifying order.
// Immutable ledger movements and atomic wallet projections.
// ============================================================

export class CommissionService {
  /**
   * Authoritative commission amount per qualifying order in Kobo.
   * ₦1,000 = 100,000 kobo.
   */
  public static calculateAffiliateCommission(): number {
    return AFFILIATE_CONFIG.commissionPerOrderKobo;
  }

  /**
   * Commission per order in Naira (for display).
   */
  public static getCommissionPerOrderNGN(): number {
    return AFFILIATE_CONFIG.commissionPerOrderKobo / 100;
  }

  /** Backwards compatibility alias */
  public static getCommissionPerProduct(): number {
    return this.calculateAffiliateCommission();
  }

  /** Backwards compatibility alias */
  public static getCommissionPerProductNGN(): number {
    return this.getCommissionPerOrderNGN();
  }

  public static getReturnWindowDays(): number {
    return AFFILIATE_CONFIG.returnWindowDays;
  }

  /**
   * Creates one qualifying commission record per order.
   * 
   * IDEMPOTENT: Verifies whether an order-level commission has already been created.
   * SELF-REFERRAL PROTECTION: Skips commission if customer is the affiliate.
   * FINANCIAL INTEGRITY: Atomic update of AffiliateWallet and AffiliateLedger.
   */
  public static async processOrderCommission(orderId: string): Promise<void> {
    if (!AFFILIATE_CONFIG.enabled) return;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        affiliate: true,
      },
    });

    if (!order || !order.affiliateId) {
      // No affiliate attribution on this order
      return;
    }

    const affiliate = order.affiliate;
    if (!affiliate || affiliate.status !== 'ACTIVE' || !affiliate.isActive) {
      console.log(
        `[COMMISSION] Order ${order.orderNumber} attribution ignored: Affiliate ${order.affiliateId} is not ACTIVE.`
      );
      return;
    }

    // SELF-REFERRAL PROTECTION
    const customerEmailNorm = order.customerEmail.toLowerCase().trim();
    const affiliateEmailNorm = affiliate.email.toLowerCase().trim();
    if (customerEmailNorm === affiliateEmailNorm) {
      console.log(
        `[COMMISSION] Self-referral detected — no commission created. ` +
        `Order ${order.orderNumber}, Affiliate ${affiliate.id}`
      );
      return;
    }

    // IDEMPOTENCY CHECK: Ensure only one commission exists per order
    const existing = await prisma.affiliateCommission.findFirst({
      where: { orderId: order.id },
    });
    if (existing) {
      console.log(`[COMMISSION] Commission already exists for order ${order.orderNumber}. Skipping.`);
      return;
    }

    const commissionAmountKobo = this.calculateAffiliateCommission();

    try {
      await prisma.$transaction(async (tx) => {
        // Double-check inside transaction to eliminate race conditions
        const inTxExisting = await tx.affiliateCommission.findFirst({
          where: { orderId: order.id },
        });
        if (inTxExisting) return;

        // 1. Create order-level commission record
        const commission = await tx.affiliateCommission.create({
          data: {
            affiliateId: affiliate.id,
            orderId: order.id,
            affiliateLinkId: order.affiliateLinkId || undefined,
            amountKobo: commissionAmountKobo,
            status: 'PENDING',
            isOrderLevel: true,
          },
        });

        // 2. Atomically upsert affiliate wallet balance
        const wallet = await tx.affiliateWallet.upsert({
          where: { affiliateId: affiliate.id },
          update: {
            pendingKobo: { increment: commissionAmountKobo },
            lifetimeEarnedKobo: { increment: commissionAmountKobo },
          },
          create: {
            affiliateId: affiliate.id,
            pendingKobo: commissionAmountKobo,
            lifetimeEarnedKobo: commissionAmountKobo,
          },
        });

        // 3. Create immutable ledger movement
        await tx.affiliateLedger.create({
          data: {
            affiliateId: affiliate.id,
            type: 'COMMISSION_PENDING',
            amountKobo: commissionAmountKobo,
            balanceBeforeKobo: wallet.availableKobo,
            balanceAfterKobo: wallet.availableKobo,
            referenceType: 'ORDER',
            referenceId: order.id,
            description: `Commission (pending delivery verification) for order #${order.orderNumber}`,
          },
        });

        console.log(
          `[COMMISSION] Processed ₦${commissionAmountKobo / 100} commission for order ${order.orderNumber}, ` +
          `affiliate ${affiliate.firstName} ${affiliate.lastName}`
        );
      });
    } catch (err: any) {
      console.error(`[COMMISSION_ERROR] Failed to process commission for order ${order.id}:`, err.message);
    }
  }

  /**
   * Called when an order transitions to DELIVERED status.
   * Immediately marks commissions AVAILABLE and approves them for immediate withdrawal.
   * Idempotent: Only operates on PENDING commissions.
   */
  public static async handleOrderDelivered(orderId: string): Promise<void> {
    await this.markCommissionsAvailable(orderId);
  }

  /**
   * Transitions mature commissions (where eligibleAt <= now) from PENDING to AVAILABLE.
   * Can be executed by the daily cron or on-demand.
   */
  public static async qualifyMatureCommissions(): Promise<number> {
    const now = new Date();
    const matureCommissions = await prisma.affiliateCommission.findMany({
      where: {
        status: 'PENDING',
        eligibleAt: { lte: now },
      },
    });

    let qualifiedCount = 0;

    for (const comm of matureCommissions) {
      try {
        await prisma.$transaction(async (tx) => {
          const current = await tx.affiliateCommission.findUnique({
            where: { id: comm.id },
          });
          if (!current || current.status !== 'PENDING') return;

          await tx.affiliateCommission.update({
            where: { id: comm.id },
            data: { status: 'AVAILABLE' },
          });

          const wallet = await tx.affiliateWallet.upsert({
            where: { affiliateId: comm.affiliateId },
            update: {
              pendingKobo: { decrement: comm.amountKobo },
              availableKobo: { increment: comm.amountKobo },
            },
            create: {
              affiliateId: comm.affiliateId,
              availableKobo: comm.amountKobo,
              lifetimeEarnedKobo: comm.amountKobo,
            },
          });

          await tx.affiliateLedger.create({
            data: {
              affiliateId: comm.affiliateId,
              type: 'COMMISSION_AVAILABLE',
              amountKobo: comm.amountKobo,
              balanceBeforeKobo: wallet.availableKobo - comm.amountKobo,
              balanceAfterKobo: wallet.availableKobo,
              referenceType: 'ORDER',
              referenceId: comm.orderId,
              description: `Commission cleared cooling period for order ${comm.orderId}`,
            },
          });

          qualifiedCount++;
        });

        const affiliateForNotification = await prisma.affiliate.findUnique({
          where: { id: comm.affiliateId },
          select: { email: true, firstName: true },
        });
        const orderForNotification = await prisma.order.findUnique({
          where: { id: comm.orderId },
          select: { orderNumber: true },
        });
        if (affiliateForNotification) {
          await AffiliateNotificationService.notifyCommissionAvailable(affiliateForNotification, {
            orderNumber: orderForNotification?.orderNumber || comm.orderId,
            amountNGN: comm.amountKobo / 100,
          });
        }
      } catch (err: any) {
        console.error(`[COMMISSION_QUALIFY_ERROR] Failed to qualify commission ${comm.id}:`, err.message);
      }
    }

    return qualifiedCount;
  }

  /**
   * Approves commissions and makes them immediately available for withdrawal upon delivery verification.
   * Idempotent: checks inside the transaction to avoid duplicate balance increments.
   */
  public static async markCommissionsAvailable(orderId: string): Promise<void> {
    const commissions = await prisma.affiliateCommission.findMany({
      where: { orderId, status: 'PENDING' },
    });

    for (const comm of commissions) {
      let walletUpdated = false;
      await prisma.$transaction(async (tx) => {
        // Atomic check inside transaction to guarantee idempotency
        const current = await tx.affiliateCommission.findUnique({
          where: { id: comm.id },
        });
        if (!current || current.status !== 'PENDING') return;

        await tx.affiliateCommission.update({
          where: { id: comm.id },
          data: { status: 'AVAILABLE', eligibleAt: new Date() },
        });

        const wallet = await tx.affiliateWallet.upsert({
          where: { affiliateId: comm.affiliateId },
          update: {
            pendingKobo: { decrement: comm.amountKobo },
            availableKobo: { increment: comm.amountKobo },
          },
          create: {
            affiliateId: comm.affiliateId,
            availableKobo: comm.amountKobo,
            lifetimeEarnedKobo: comm.amountKobo,
          },
        });

        await tx.affiliateLedger.create({
          data: {
            affiliateId: comm.affiliateId,
            type: 'COMMISSION_AVAILABLE',
            amountKobo: comm.amountKobo,
            balanceBeforeKobo: wallet.availableKobo - comm.amountKobo,
            balanceAfterKobo: wallet.availableKobo,
            referenceType: 'ORDER',
            referenceId: comm.orderId,
            description: `Commission approved & withdrawable for delivered order ${comm.orderId}`,
          },
        });
        walletUpdated = true;
      });

      if (walletUpdated) {
        // Fire-and-forget notification to affiliate that funds are now withdrawable
        prisma.affiliate.findUnique({
          where: { id: comm.affiliateId },
          select: { email: true, firstName: true },
        }).then((aff) => {
          if (!aff) return;
          prisma.order.findUnique({
            where: { id: comm.orderId },
            select: { orderNumber: true },
          }).then((ord) => {
            AffiliateNotificationService.notifyCommissionAvailable(aff, {
              orderNumber: ord?.orderNumber || comm.orderId,
              amountNGN: comm.amountKobo / 100,
            }).catch(() => null);
          }).catch(() => null);
        }).catch(() => null);
      }
    }
  }

  /**
   * Reverses commissions when an order is cancelled, refunded or returned.
   */
  public static async reverseCommissions(
    orderId: string,
    reason: string
  ): Promise<void> {
    const commissions = await prisma.affiliateCommission.findMany({
      where: { orderId, status: { in: ['PENDING', 'AVAILABLE'] } },
    });

    for (const comm of commissions) {
      await prisma.$transaction(async (tx) => {
        await tx.affiliateCommission.update({
          where: { id: comm.id },
          data: {
            status: 'REVERSED',
            reversedAt: new Date(),
            reversalReason: reason,
          },
        });

        const isPending = comm.status === 'PENDING';

        const wallet = await tx.affiliateWallet.upsert({
          where: { affiliateId: comm.affiliateId },
          update: isPending
            ? {
                pendingKobo: { decrement: comm.amountKobo },
                lifetimeEarnedKobo: { decrement: comm.amountKobo },
              }
            : {
                availableKobo: { decrement: comm.amountKobo },
                lifetimeEarnedKobo: { decrement: comm.amountKobo },
              },
          create: {
            affiliateId: comm.affiliateId,
          },
        });

        await tx.affiliateLedger.create({
          data: {
            affiliateId: comm.affiliateId,
            type: 'COMMISSION_REVERSED',
            amountKobo: -comm.amountKobo,
            balanceBeforeKobo: isPending ? wallet.availableKobo : wallet.availableKobo + comm.amountKobo,
            balanceAfterKobo: wallet.availableKobo,
            referenceType: 'ORDER',
            referenceId: comm.orderId,
            description: `Commission reversed: ${reason}`,
          },
        });
      });

      const affiliateForNotification = await prisma.affiliate.findUnique({
        where: { id: comm.affiliateId },
        select: { email: true, firstName: true },
      });
      const orderForNotification = await prisma.order.findUnique({
        where: { id: comm.orderId },
        select: { orderNumber: true },
      });
      if (affiliateForNotification) {
        await AffiliateNotificationService.notifyCommissionReversed(affiliateForNotification, {
          orderNumber: orderForNotification?.orderNumber || comm.orderId,
          amountNGN: comm.amountKobo / 100,
          reason,
        });
      }
    }
  }

  /**
   * Returns authoritative available balance in Kobo.
   */
  public static async getAvailableBalance(affiliateId: string): Promise<number> {
    const wallet = await prisma.affiliateWallet.findUnique({
      where: { affiliateId },
      select: { availableKobo: true },
    });
    if (wallet) return Math.max(0, wallet.availableKobo);

    // Fallback: aggregate from commissions
    const result = await prisma.affiliateCommission.aggregate({
      where: {
        affiliateId,
        status: 'AVAILABLE',
        payoutId: null,
      },
      _sum: { amountKobo: true },
    });
    return result._sum.amountKobo || 0;
  }

  /**
   * Returns comprehensive commission and balance summary for an affiliate.
   */
  public static async getCommissionSummary(affiliateId: string): Promise<{
    pendingKobo: number;
    availableKobo: number;
    reservedKobo: number;
    paidKobo: number;
    reversedKobo: number;
    totalEarnedKobo: number;
  }> {
    const wallet = await prisma.affiliateWallet.findUnique({
      where: { affiliateId },
    });

    if (wallet) {
      return {
        pendingKobo: wallet.pendingKobo,
        availableKobo: wallet.availableKobo,
        reservedKobo: wallet.reservedKobo,
        paidKobo: wallet.paidKobo,
        reversedKobo: 0,
        totalEarnedKobo: wallet.lifetimeEarnedKobo,
      };
    }

    // Dynamic aggregation fallback
    const [pending, available, paid, reversed] = await Promise.all([
      prisma.affiliateCommission.aggregate({
        where: { affiliateId, status: 'PENDING' },
        _sum: { amountKobo: true },
      }),
      prisma.affiliateCommission.aggregate({
        where: { affiliateId, status: 'AVAILABLE', payoutId: null },
        _sum: { amountKobo: true },
      }),
      prisma.affiliateCommission.aggregate({
        where: { affiliateId, status: 'PAID' },
        _sum: { amountKobo: true },
      }),
      prisma.affiliateCommission.aggregate({
        where: { affiliateId, status: 'REVERSED' },
        _sum: { amountKobo: true },
      }),
    ]);

    const pendingKobo = pending._sum.amountKobo || 0;
    const availableKobo = available._sum.amountKobo || 0;
    const paidKobo = paid._sum.amountKobo || 0;
    const reversedKobo = reversed._sum.amountKobo || 0;

    return {
      pendingKobo,
      availableKobo,
      reservedKobo: 0,
      paidKobo,
      reversedKobo,
      totalEarnedKobo: pendingKobo + availableKobo + paidKobo,
    };
  }
}
