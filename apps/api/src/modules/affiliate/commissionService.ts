import { COMMERCE_CONFIG } from '../../config/constants';
import { prisma } from '../../db/prisma';

// ============================================================
// COMMISSION SERVICE
// Single source of truth for all commission calculations.
// Never hardcode ₦500 anywhere else — use this service.
// Commission amounts are in KOBO (NGN minor units).
// ============================================================

const COMMISSION_PER_PRODUCT_KOBO =
  COMMERCE_CONFIG.AFFILIATE.COMMISSION_PER_PRODUCT_KOBO; // ₦500 = 50,000 kobo

const RETURN_WINDOW_DAYS = COMMERCE_CONFIG.AFFILIATE.RETURN_WINDOW_DAYS;

export class CommissionService {
  /**
   * Returns the commission amount per product unit in Kobo.
   * Centralised so it can be extended to support category/campaign rates later.
   */
  public static getCommissionPerProduct(_productId?: string, _categoryId?: string): number {
    // V1: flat rate per product. Future: category/campaign-specific rates.
    return COMMISSION_PER_PRODUCT_KOBO;
  }

  /**
   * Creates commission records for all items in an order.
   * Called after order payment is verified.
   * 
   * IDEMPOTENT: Uses unique(affiliateId, orderItemId) constraint.
   * Safe to call multiple times — will not create duplicates.
   * SELF-REFERRAL PROTECTION: Skips commission if customer is the affiliate.
   */
  public static async processOrderCommission(orderId: string): Promise<void> {
    if (!COMMERCE_CONFIG.AFFILIATE.ENABLED) return;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        affiliate: true,
      },
    });

    if (!order || !order.affiliateId) {
      // No affiliate attribution on this order
      return;
    }

    const affiliate = order.affiliate;
    if (!affiliate || affiliate.status !== 'ACTIVE') {
      // Affiliate not active at time of commission processing
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

    // Create one commission per order item (idempotent via unique constraint)
    for (const item of order.items) {
      const commissionAmount = this.getCommissionPerProduct() * item.quantity;

      try {
        await prisma.affiliateCommission.upsert({
          where: {
            affiliateId_orderItemId: {
              affiliateId: affiliate.id,
              orderItemId: item.id,
            },
          },
          update: {
            // Already exists — update nothing (idempotency)
          },
          create: {
            affiliateId: affiliate.id,
            orderId: order.id,
            orderItemId: item.id,
            affiliateLinkId: order.affiliateLinkId || undefined,
            amountKobo: commissionAmount,
            status: 'PENDING',
          },
        });
      } catch (err: any) {
        // If unique constraint violation (race condition), log but do not re-throw
        console.error(
          `[COMMISSION] Failed to create commission for item ${item.id}:`,
          err.message
        );
      }
    }

    console.log(
      `[COMMISSION] Processed commission for order ${order.orderNumber}, ` +
      `affiliate ${affiliate.firstName} ${affiliate.lastName}, ` +
      `${order.items.length} items`
    );
  }

  /**
   * Marks commissions as AVAILABLE when an order reaches DELIVERED status
   * and the return window has passed.
   * 
   * For immediate DELIVERED transitions, marks PENDING → AVAILABLE
   * (return window handled by a future scheduled job or can be done inline for V1).
   */
  public static async markCommissionsAvailable(orderId: string): Promise<void> {
    const eligibleAt = new Date();

    await prisma.affiliateCommission.updateMany({
      where: {
        orderId,
        status: 'PENDING',
      },
      data: {
        status: 'AVAILABLE',
        eligibleAt,
      },
    });
  }

  /**
   * Reverses commissions when an order or items are cancelled/refunded/returned.
   * Can target specific items (partial return) or all items (full cancellation).
   */
  public static async reverseCommissions(
    orderId: string,
    reason: string,
    orderItemIds?: string[] // If provided, only reverse these specific items
  ): Promise<void> {
    const where: any = { orderId, status: { in: ['PENDING', 'AVAILABLE'] } };
    if (orderItemIds && orderItemIds.length > 0) {
      where.orderItemId = { in: orderItemIds };
    }

    await prisma.affiliateCommission.updateMany({
      where,
      data: {
        status: 'REVERSED',
        reversedAt: new Date(),
        reversalReason: reason,
      },
    });
  }

  /**
   * Computes the total available balance for an affiliate (not yet in a payout).
   */
  public static async getAvailableBalance(affiliateId: string): Promise<number> {
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
   * Computes summary statistics for an affiliate's commissions.
   */
  public static async getCommissionSummary(affiliateId: string): Promise<{
    pendingKobo: number;
    availableKobo: number;
    paidKobo: number;
    reversedKobo: number;
    totalEarnedKobo: number;
  }> {
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
      paidKobo,
      reversedKobo,
      totalEarnedKobo: pendingKobo + availableKobo + paidKobo,
    };
  }

  /**
   * Returns commission per product in Naira (for display).
   */
  public static getCommissionPerProductNGN(): number {
    return COMMISSION_PER_PRODUCT_KOBO / 100;
  }

  public static getReturnWindowDays(): number {
    return RETURN_WINDOW_DAYS;
  }
}
