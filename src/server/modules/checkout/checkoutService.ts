import crypto from 'crypto';
import { COMMERCE_CONFIG } from '../../config/constants';
import { CartService, CalculatedCart } from '../cart/cartService';
import { ShippingService } from '../shipping/shippingService';
import { InventoryService } from '../inventory/inventoryService';
import { CustomerService } from '../customers/customerService';
import { dbStore, DbOrder, DbOrderItem } from '../../db/store';
import { EventService } from '../../services/eventService';
import { AffiliateService } from '../affiliate/affiliateService';

export interface CheckoutQuote {
  cart: CalculatedCart;
  shippingRegion: 'lagos' | 'nationwide';
  shippingMethodName: string;
  subtotalNGN: number;
  deliveryFeeNGN: number;
  deliveryFeePending: boolean;
  discountNGN: number;
  discountDescription?: string;
  totalNGN: number;
  isEligibleForCheckout: boolean;
  errors: string[];
}

export interface CreateOrderInput {
  customer: {
    fullName: string;
    email: string;
    phone: string;
    state: string;
    city: string;
    address: string;
    orderNote?: string;
  };
  shippingRegion: 'lagos' | 'nationwide';
  paymentMethod: 'paystack' | 'transfer' | 'mock';
  items: { variantId: string; quantity: number }[];
  discountCode?: string;
  sessionId?: string;
  affiliateCode?: string; // Optional: referral code from localStorage attribution
}

export class CheckoutService {
  /**
   * Authoritatively calculate checkout quote with verified server rates and promotions.
   * Delivery fee is to be quoted by admin via WhatsApp — subtotal alone is calculated at checkout.
   */
  public static calculateQuote(
    sessionId: string,
    shippingRegion: 'lagos' | 'nationwide',
    items: { variantId: string; quantity: number }[],
    discountCode?: string
  ): CheckoutQuote {
    const cart = CartService.calculateItems(sessionId, items);

    // Verify discount code against server configuration
    let discountNGN = 0;
    let promoDescription: string | undefined;

    if (discountCode) {
      const cleanCode = discountCode.trim().toUpperCase();
      const promo = COMMERCE_CONFIG.PROMOTIONS.find((p) => p.code === cleanCode);
      if (promo) {
        discountNGN = Math.round((cart.subtotalNGN * promo.discountPercent) / 100);
        promoDescription = promo.description;
      }
    }

    // PIERCYN V1: Delivery fee is set manually by admin and confirmed via WhatsApp.
    // At checkout, fee is 0 (pending confirmation), final total is subtotal - discount.
    const deliveryFeeNGN = 0;
    const finalTotal = Math.max(0, cart.subtotalNGN - discountNGN);

    const shippingMethodName =
      shippingRegion === 'lagos'
        ? 'Lagos Delivery (Fee to be confirmed via WhatsApp)'
        : 'Nationwide Delivery (Fee to be confirmed via WhatsApp)';

    const isEligible = cart.isValid && cart.items.length > 0;

    return {
      cart,
      shippingRegion,
      shippingMethodName,
      subtotalNGN: cart.subtotalNGN,
      deliveryFeeNGN,
      deliveryFeePending: true,
      discountNGN,
      discountDescription: promoDescription,
      totalNGN: finalTotal,
      isEligibleForCheckout: isEligible,
      errors: cart.validationErrors,
    };
  }

  /**
   * Atomically reserve stock for all lines in the order.
   * If any line fails, all previously reserved lines for this order reference are rolled back!
   */
  public static reserveItemsForOrder(
    items: { variantId: string; quantity: number }[],
    orderNumber: string
  ): { success: boolean; failedVariantId?: string } {
    const reservedVariantIds: string[] = [];

    for (const item of items) {
      const reserved = InventoryService.reserveStock(item.variantId, item.quantity, orderNumber);
      if (!reserved) {
        // Rollback all reserved lines for this order reference
        InventoryService.releaseReservation(orderNumber);
        return { success: false, failedVariantId: item.variantId };
      }
      reservedVariantIds.push(item.variantId);
    }

    return { success: true };
  }

  /**
   * Create an authoritative order with snapshot item data and atomic inventory reservation
   */
  public static async createOrder(input: CreateOrderInput): Promise<DbOrder> {

    const sessionId = input.sessionId || `sess-${Date.now()}`;
    const quote = this.calculateQuote(
      sessionId,
      input.shippingRegion,
      input.items,
      input.discountCode
    );

    if (!quote.isEligibleForCheckout) {
      throw new Error(`Checkout validation failed: ${quote.errors.join(', ')}`);
    }

    const orderNumber = `PCY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    // 1. Transactional Inventory Reservation
    const reservation = this.reserveItemsForOrder(input.items, orderNumber);
    if (!reservation.success) {
      throw new Error(
        `Inventory reservation failed for variant ${reservation.failedVariantId}. Item may have sold out.`
      );
    }

    // 2. Associate / Create Customer Record (No customer login required)
    const customer = CustomerService.findOrCreateCustomer({
      email: input.customer.email,
      fullName: input.customer.fullName,
      phone: input.customer.phone,
      address: {
        addressLine: input.customer.address,
        city: input.customer.city,
        state: input.customer.state,
      },
    });

    // 3. Historical Snapshot of Order Items (Immutable)
    const orderItems: DbOrderItem[] = quote.cart.items.map((line) => ({
      id: `oi-${crypto.randomBytes(8).toString('hex')}`,
      orderId,
      variantId: line.variantId,
      productId: line.productId,
      productName: line.productName,
      sku: line.sku,
      category: line.category,
      colour: line.colour,
      size: line.size,
      unitPriceNGN: line.unitPriceNGN,
      costPriceNGN: line.costPriceNGN,
      totalPriceNGN: line.lineTotalNGN,
      image: line.image,
      quantity: line.quantity,
      createdAt: now,
    }));

    // 4. Resolve Affiliate Attribution (non-blocking — never fail the order)
    let affiliateId: string | undefined;
    let affiliateLinkId: string | undefined;
    let resolvedAffiliateCode: string | undefined;
    let affiliateAttributedAt: string | undefined;
    try {
      const affCode = input.affiliateCode?.trim().toUpperCase();
      const attribution = await AffiliateService.resolveAttribution(sessionId, affCode);
      if (attribution) {
        // SELF-REFERRAL GUARD: compare customer email vs affiliate email
        const affCheck = await AffiliateService.getProfile(attribution.affiliateId).catch(() => null);
        const custEmail = input.customer.email.toLowerCase().trim();
        const affEmail = affCheck?.email?.toLowerCase().trim();
        if (!affEmail || custEmail !== affEmail) {
          affiliateId = attribution.affiliateId;
          affiliateLinkId = attribution.affiliateLinkId;
          resolvedAffiliateCode = attribution.referralCode;
          affiliateAttributedAt = (attribution.clickedAt instanceof Date
            ? attribution.clickedAt
            : new Date(attribution.clickedAt as any)
          ).toISOString();
        } else {
          console.log(`[AFFILIATE] Self-referral blocked for customer ${custEmail}`);
        }
      }
    } catch (affErr: any) {
      // Never let affiliate resolution crash a real order
      console.warn('[AFFILIATE] Attribution resolution failed (non-critical):', affErr?.message);
    }

    // 5. Create Order Record
    const paymentMethodLabel =
      input.paymentMethod === 'paystack'
        ? 'Paystack'
        : input.paymentMethod === 'mock'
        ? 'Test Simulation'
        : 'Direct Bank Transfer / WhatsApp';

    const order: DbOrder = {
      id: orderId,
      orderNumber,
      customerId: customer.id,
      customerEmail: input.customer.email.toLowerCase(),
      customerPhone: input.customer.phone,
      customerName: input.customer.fullName,
      shippingAddressLine: input.customer.address,
      shippingCity: input.customer.city,
      shippingState: input.customer.state,
      shippingCountry: 'Nigeria',
      orderNote: input.customer.orderNote,
      subtotalNGN: quote.subtotalNGN,
      deliveryFeeNGN: quote.deliveryFeeNGN,
      discountNGN: quote.discountNGN,
      totalNGN: quote.totalNGN,
      currency: 'NGN',
      shippingMethodKey: quote.shippingRegion,
      shippingMethodName: quote.shippingMethodName,
      paymentMethod: paymentMethodLabel,
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_PAYMENT',
      quoteStatus: 'PENDING',
      quoteVersion: 0,
      timeline: [
        {
          status: 'PENDING_PAYMENT',
          timestamp: now,
          note: 'Order placed — awaiting delivery quotation from admin',
        },
      ],
      createdAt: now,
      updatedAt: now,
      items: orderItems,
      // Affiliate attribution snapshot (immutable)
      affiliateId,
      affiliateLinkId,
      affiliateCode: resolvedAffiliateCode,
      affiliateAttributedAt,
    };

    dbStore.orders.set(order.id, order);
    dbStore.orderNumberIndex.set(order.orderNumber, order.id);

    // 5. Track Checkout Started Event
    EventService.track({
      eventType: 'checkout_started',
      orderId: order.id,
      sessionId,
      customerId: customer.id,
      metadata: {
        orderNumber: order.orderNumber,
        totalNGN: order.totalNGN,
        itemCount: order.items.length,
      },
    });

    return order;
  }
}
