import { dbStore, DbEvent } from '../db/store';

export interface TrackEventInput {
  eventType: string;
  sessionId?: string;
  customerId?: string;
  productId?: string;
  variantId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
}

export class EventService {
  /**
   * Log an auditable business event
   */
  public static track(input: TrackEventInput): DbEvent {
    const event: DbEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      eventType: input.eventType,
      sessionId: input.sessionId,
      customerId: input.customerId,
      productId: input.productId,
      variantId: input.variantId,
      orderId: input.orderId,
      metadata: input.metadata || {},
      timestamp: new Date().toISOString(),
    };

    dbStore.events.push(event);
    return event;
  }

  /**
   * Get analytics dashboard metrics
   */
  public static getAnalyticsSummary() {
    const totalEvents = dbStore.events.length;
    const orders = Array.from(dbStore.orders.values());
    const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');

    const totalRevenueNGN = paidOrders.reduce((sum, o) => sum + o.totalNGN, 0);
    const averageOrderValueNGN =
      paidOrders.length > 0 ? Math.round(totalRevenueNGN / paidOrders.length) : 0;

    // Product View & Conversion counts
    const productViews: Record<string, number> = {};
    const productSales: Record<string, number> = {};

    for (const ev of dbStore.events) {
      if (ev.eventType === 'product_view' && ev.productId) {
        productViews[ev.productId] = (productViews[ev.productId] || 0) + 1;
      }
    }

    for (const ord of paidOrders) {
      for (const it of ord.items) {
        productSales[it.productId] = (productSales[it.productId] || 0) + it.quantity;
      }
    }

    // Low stock alerts
    const lowStockAlerts: { variantId: string; sku: string; availableStock: number }[] = [];
    for (const inv of dbStore.inventory.values()) {
      if (inv.availableStock <= 3) {
        const v = dbStore.variants.get(inv.variantId);
        if (v) {
          lowStockAlerts.push({
            variantId: inv.variantId,
            sku: v.sku,
            availableStock: inv.availableStock,
          });
        }
      }
    }

    return {
      totalOrders: orders.length,
      paidOrdersCount: paidOrders.length,
      totalRevenueNGN,
      averageOrderValueNGN,
      productViews,
      productSales,
      lowStockAlerts,
      totalEvents,
    };
  }

  /**
   * Get recent event stream
   */
  public static getRecentEvents(limit: number = 50): DbEvent[] {
    return [...dbStore.events].reverse().slice(0, limit);
  }
}
