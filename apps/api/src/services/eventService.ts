import { prisma } from '../db/prisma';

export interface EventData {
  eventType: string;
  sessionId?: string;
  customerId?: string;
  productId?: string;
  variantId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
}

export type TrackEventInput = EventData;

export class EventService {
  public static async track(event: EventData) {
    const eventTypeMap: Record<string, any> = {
      product_view: 'PRODUCT_VIEW',
      PRODUCT_VIEW: 'PRODUCT_VIEW',
      add_to_cart: 'ADD_TO_CART',
      ADD_TO_CART: 'ADD_TO_CART',
      checkout_started: 'CHECKOUT_STARTED',
      CHECKOUT_STARTED: 'CHECKOUT_STARTED',
      purchase: 'PURCHASE_COMPLETED',
      purchase_completed: 'PURCHASE_COMPLETED',
      PURCHASE_COMPLETED: 'PURCHASE_COMPLETED',
    };

    const mappedType = eventTypeMap[event.eventType] || 'PRODUCT_VIEW';

    try {
      return await prisma.analyticsEvent.create({
        data: {
          sessionId: event.sessionId,
          customerId: event.customerId,
          productId: event.productId,
          variantId: event.variantId,
          orderId: event.orderId,
          eventType: mappedType,
          metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
        },
      });
    } catch {
      // Non-blocking
      return null;
    }
  }

  public static async getAnalyticsSummary() {
    const events = await prisma.analyticsEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    let productViews = 0;
    let addToCart = 0;
    let checkoutStarted = 0;
    let purchases = 0;

    for (const evt of events) {
      if (evt.eventType === 'PRODUCT_VIEW') productViews++;
      else if (evt.eventType === 'ADD_TO_CART') addToCart++;
      else if (evt.eventType === 'CHECKOUT_STARTED') checkoutStarted++;
      else if (evt.eventType === 'PURCHASE_COMPLETED') purchases++;
    }

    return {
      productViews,
      addToCart,
      checkoutStarted,
      purchases,
      conversionRate: productViews > 0 ? ((purchases / productViews) * 100).toFixed(1) + '%' : '0%',
    };
  }
}
