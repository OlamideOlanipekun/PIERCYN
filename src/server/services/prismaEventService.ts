import { prisma } from '../db/prisma';

export class PrismaEventService {
  static track(input: { eventType: string; sessionId?: string; customerId?: string; productId?: string; variantId?: string; orderId?: string; metadata?: Record<string, unknown> }) {
    return prisma.event.create({ data: { ...input, metadata: JSON.stringify(input.metadata ?? {}) } });
  }
  static getRecentEvents(limit = 50) { return prisma.event.findMany({ orderBy: { timestamp: 'desc' }, take: limit }); }
  static async getAnalyticsSummary() {
    const [totalEvents, paidOrders, views, lowStock] = await Promise.all([prisma.event.count(), prisma.order.findMany({ where: { paymentStatus: 'PAID' }, include: { items: true } }), prisma.event.findMany({ where: { eventType: 'product_view' } }), prisma.inventory.findMany({ where: { availableStock: { lte: 3 } }, include: { variant: true } })]);
    const productViews: Record<string, number> = {};
    for (const event of views) if (event.productId) productViews[event.productId] = (productViews[event.productId] ?? 0) + 1;
    const totalRevenueNGN = paidOrders.reduce((sum, order) => sum + order.totalNGN, 0);
    return { totalOrders: paidOrders.length, paidOrdersCount: paidOrders.length, totalRevenueNGN, averageOrderValueNGN: paidOrders.length ? Math.round(totalRevenueNGN / paidOrders.length) : 0, productViews, productSales: {}, lowStockAlerts: lowStock.map((item) => ({ variantId: item.variantId, sku: item.variant.sku, availableStock: item.availableStock })), totalEvents };
  }
}
