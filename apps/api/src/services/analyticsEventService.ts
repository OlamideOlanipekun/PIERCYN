/**
 * PIERCYN V1 — Analytics Event Service
 * ============================================================
 * Lightweight funnel event tracking.
 * Tracks: PRODUCT_VIEW → ADD_TO_CART → CHECKOUT_STARTED → PURCHASE_COMPLETED
 *
 * V1 design: simple event table, no warehouse.
 * Use createdAt + eventType + productId for basic funnel metrics.
 * ============================================================
 */

import { prisma } from '../db/prisma';
import type { EventType } from '@prisma/client';

export interface TrackEventInput {
  eventType: EventType;
  sessionId?: string;
  customerId?: string;
  productId?: string;
  variantId?: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
}

export class AnalyticsEventService {
  /**
   * Track an analytics event. Fire-and-forget safe.
   * Errors are caught and logged — analytics must never break commerce.
   */
  public static async track(input: TrackEventInput): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: input.eventType,
          sessionId: input.sessionId || null,
          customerId: input.customerId || null,
          productId: input.productId || null,
          variantId: input.variantId || null,
          orderId: input.orderId || null,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        },
      });
    } catch (err) {
      console.error('[ANALYTICS_ERROR]', err);
    }
  }

  /**
   * Basic funnel summary for admin dashboard.
   * Returns event counts by type over the last N days.
   */
  public static async getFunnelSummary(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [views, addedToCart, checkoutStarted, purchases] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { eventType: 'PRODUCT_VIEW', createdAt: { gte: since } },
      }),
      prisma.analyticsEvent.count({
        where: { eventType: 'ADD_TO_CART', createdAt: { gte: since } },
      }),
      prisma.analyticsEvent.count({
        where: { eventType: 'CHECKOUT_STARTED', createdAt: { gte: since } },
      }),
      prisma.analyticsEvent.count({
        where: { eventType: 'PURCHASE_COMPLETED', createdAt: { gte: since } },
      }),
    ]);

    return {
      period: `${days}d`,
      since: since.toISOString(),
      funnel: {
        productViews: views,
        addedToCart,
        checkoutStarted,
        purchasesCompleted: purchases,
        cartConversionRate: views > 0 ? ((addedToCart / views) * 100).toFixed(1) + '%' : '0%',
        checkoutConversionRate:
          addedToCart > 0 ? ((checkoutStarted / addedToCart) * 100).toFixed(1) + '%' : '0%',
        purchaseConversionRate:
          checkoutStarted > 0
            ? ((purchases / checkoutStarted) * 100).toFixed(1) + '%'
            : '0%',
      },
    };
  }

  /**
   * Top products by view count.
   */
  public static async getTopProducts(limit: number = 10, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const results = await prisma.analyticsEvent.groupBy({
      by: ['productId'],
      where: {
        eventType: 'PRODUCT_VIEW',
        productId: { not: null },
        createdAt: { gte: since },
      },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });

    const productIds = results
      .map((r) => r.productId)
      .filter(Boolean) as string[];

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true, priceNGN: true },
    });

    return results.map((r) => ({
      productId: r.productId,
      views: r._count.productId,
      product: products.find((p) => p.id === r.productId) || null,
    }));
  }

  /**
   * Revenue summary (from completed orders).
   */
  public static async getRevenueSummary(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const paidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: since },
      },
      include: {
        items: {
          select: {
            unitPriceNGN: true,
            costPriceNGN: true,
            quantity: true,
            totalNGN: true,
          },
        },
      },
    });

    const totalRevenueNGN = paidOrders.reduce((sum, o) => sum + o.totalNGN, 0);
    const totalCOGS = paidOrders.reduce(
      (sum, o) =>
        sum +
        o.items.reduce((is, i) => is + i.costPriceNGN * i.quantity, 0),
      0
    );
    const grossProfitNGN = totalRevenueNGN - totalCOGS;

    return {
      period: `${days}d`,
      totalOrders: paidOrders.length,
      totalRevenueNGN,
      totalCOGS,
      grossProfitNGN,
      grossMarginPercent:
        totalRevenueNGN > 0
          ? ((grossProfitNGN / totalRevenueNGN) * 100).toFixed(1) + '%'
          : '0%',
      averageOrderValueNGN:
        paidOrders.length > 0 ? Math.round(totalRevenueNGN / paidOrders.length) : 0,
    };
  }
}
