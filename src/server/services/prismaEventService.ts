import { prisma } from '../db/prisma';

export class PrismaEventService {
  static track(input: { eventType: string; sessionId?: string; customerId?: string; productId?: string; variantId?: string; orderId?: string; metadata?: Record<string, unknown> }) {
    const eventTypeMap: Record<string, any> = {
      product_view: 'PRODUCT_VIEW',
      add_to_cart: 'ADD_TO_CART',
      checkout_started: 'CHECKOUT_STARTED',
      purchase_completed: 'PURCHASE_COMPLETED',
    };
    const mappedType = eventTypeMap[input.eventType.toLowerCase()] || 'PRODUCT_VIEW';
    return prisma.analyticsEvent.create({
      data: {
        eventType: mappedType,
        sessionId: input.sessionId,
        customerId: input.customerId,
        productId: input.productId,
        variantId: input.variantId,
        orderId: input.orderId,
        metadata: JSON.stringify(input.metadata ?? {}),
      },
    });
  }
  static getRecentEvents(limit = 50) {
    return prisma.analyticsEvent.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  }
  static async getAnalyticsSummary() {
    const [totalEvents, paidOrders, views, lowStock] = await Promise.all([
      prisma.analyticsEvent.count(),
      prisma.order.findMany({ where: { paymentStatus: 'PAID' }, include: { items: true } }),
      prisma.analyticsEvent.findMany({ where: { eventType: 'PRODUCT_VIEW' } }),
      prisma.inventory.findMany({ where: { stockQuantity: { lte: 3 } }, include: { variant: true } }),
    ]);
    const productViews: Record<string, number> = {};
    for (const event of views) {
      if (event.productId) productViews[event.productId] = (productViews[event.productId] ?? 0) + 1;
    }
    const totalRevenueNGN = paidOrders.reduce((sum, order) => sum + order.totalNGN, 0);
    return {
      totalOrders: paidOrders.length,
      paidOrdersCount: paidOrders.length,
      totalRevenueNGN,
      averageOrderValueNGN: paidOrders.length ? Math.round(totalRevenueNGN / paidOrders.length) : 0,
      productViews,
      productSales: {},
      lowStockAlerts: lowStock.map((item) => ({
        variantId: item.variantId,
        sku: item.variant.sku,
        availableStock: Math.max(0, item.stockQuantity - item.reservedQuantity),
      })),
      totalEvents,
    };
  }
}
