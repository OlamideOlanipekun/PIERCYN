import { prisma } from '../db/prisma';

export interface EventData {
  eventType: string;
  sessionId?: string;
  visitorId?: string;
  path?: string;
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
      page_view: 'PAGE_VIEW',
      PAGE_VIEW: 'PAGE_VIEW',
    };

    const mappedType = eventTypeMap[event.eventType];
    if (!mappedType) return null;
    let pagePath: string | undefined;
    if (mappedType === 'PAGE_VIEW') {
      if (!event.sessionId || !event.visitorId || !event.path || event.path.startsWith('//')) return null;
      pagePath = event.path.split(/[?#]/, 1)[0].toLowerCase().replace(/\/+$/, '') || '/';
      pagePath = pagePath.replace(/^\/product\//, '/products/').replace(/^\/categories\//, '/category/');
      if (pagePath === '/new' || pagePath === '/new-in') pagePath = '/new-arrivals';
      if (/^\/(admin|affiliate|account|cart|checkout|order|orders|track-order|order-confirmation)(\/|$)/.test(pagePath)) return null;
    }

    try {
      return await prisma.analyticsEvent.create({
        data: {
          sessionId: event.sessionId,
          visitorId: event.visitorId,
          path: pagePath,
          customerId: event.customerId,
          productId: event.productId,
          variantId: event.variantId,
          orderId: event.orderId,
          eventType: mappedType,
          metadata: mappedType === 'PAGE_VIEW' ? undefined : event.metadata ? JSON.stringify(event.metadata) : undefined,
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
