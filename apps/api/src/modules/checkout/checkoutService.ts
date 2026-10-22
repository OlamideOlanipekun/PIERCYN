import { COMMERCE_CONFIG } from '../../config/constants';
import { CartService, CalculatedCart } from '../cart/cartService';
import { ShippingService } from '../shipping/shippingService';
import { InventoryService } from '../inventory/inventoryService';
import { CustomerService } from '../customers/customerService';
import { AffiliateService } from '../affiliate/affiliateService';
import { prisma } from '../../db/prisma';
import { generateOrderNumber } from '@piercyn/utils';

export interface CheckoutQuote {
  cart: CalculatedCart;
  shippingRegion: 'lagos' | 'nationwide';
  shippingMethodName: string;
  subtotalNGN: number;
  deliveryFeeNGN: number;
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
  affiliateCode?: string;
  sessionId?: string;
}

export class CheckoutService {
  public static async calculateQuote(
    sessionId: string,
    shippingRegion: 'lagos' | 'nationwide',
    items: { variantId: string; quantity: number }[],
    discountCode?: string
  ): Promise<CheckoutQuote> {
    const cart = await CartService.calculateItems(sessionId, items);

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

    // PIERCYN Option A: Delivery fee is calculated manually by admin and communicated via WhatsApp.
    // At checkout, preliminary delivery fee is 0 (marked pending), and total is subtotal - discount.
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

  public static async createOrder(input: CreateOrderInput) {
    const sessionId = input.sessionId || `sess-${Date.now()}`;
    const quote = await this.calculateQuote(
      sessionId,
      input.shippingRegion,
      input.items,
      input.discountCode
    );

    if (!quote.isEligibleForCheckout) {
      throw new Error(`Checkout validation failed: ${quote.errors.join(', ')}`);
    }

    const orderNumber = generateOrderNumber();

    // Resolve and snapshot attribution before checkout. The order must never rely on
    // browser storage or a later link lookup to determine commission ownership.
    // The programme is paused: no attribution is recorded while disabled.
    const attribution = COMMERCE_CONFIG.AFFILIATE.ENABLED
      ? await AffiliateService.resolveAttribution(sessionId, input.affiliateCode)
      : null;
    let affiliateAttribution: {
      affiliateId: string;
      affiliateLinkId: string;
      referralCode: string;
      clickedAt: Date;
    } | null = null;

    if (attribution) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { id: attribution.affiliateId },
        select: { email: true, status: true, isActive: true },
      });
      const customerEmail = input.customer.email.trim().toLowerCase();

      if (
        affiliate?.status === 'ACTIVE' &&
        affiliate.isActive &&
        affiliate.email.trim().toLowerCase() !== customerEmail
      ) {
        affiliateAttribution = {
          affiliateId: attribution.affiliateId,
          affiliateLinkId: attribution.affiliateLinkId,
          referralCode: attribution.referralCode,
          clickedAt: new Date(attribution.clickedAt),
        };
      }
    }

    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Transactional stock reservation
      for (const item of input.items) {
        const reserved = await InventoryService.reserveStock(
          item.variantId,
          item.quantity,
          orderNumber,
          COMMERCE_CONFIG.INVENTORY.RESERVATION_TTL_MINUTES,
          tx
        );
        if (!reserved) {
          throw new Error(`Stock reservation failed for variant ${item.variantId}. It may have just sold out.`);
        }
      }

      // 2. Customer record
      const customer = await CustomerService.findOrCreateCustomer(
        {
          email: input.customer.email,
          fullName: input.customer.fullName,
          phone: input.customer.phone,
          address: {
            addressLine: input.customer.address,
            city: input.customer.city,
            state: input.customer.state,
          },
        },
        tx
      );

      const paymentMethodLabel =
        input.paymentMethod === 'paystack'
          ? 'PAYSTACK'
          : input.paymentMethod === 'mock'
          ? 'MOCK'
          : 'DIRECT_TRANSFER';

      // 3. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          customerFirstName: input.customer.fullName.split(' ')[0] || 'Customer',
          customerLastName: input.customer.fullName.split(' ').slice(1).join(' ') || 'PIERCYN',
          customerEmail: input.customer.email.toLowerCase().trim(),
          customerPhone: input.customer.phone,
          deliveryAddress: input.customer.address,
          deliveryCity: input.customer.city,
          deliveryState: input.customer.state,
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
          status: 'PENDING_PAYMENT',
          quoteStatus: 'PENDING',
          quoteVersion: 1,
          affiliateId: affiliateAttribution?.affiliateId || null,
          affiliateLinkId: affiliateAttribution?.affiliateLinkId || null,
          affiliateCode: affiliateAttribution?.referralCode || null,
          affiliateAttributedAt: affiliateAttribution?.clickedAt || null,
          items: {
            create: quote.cart.items.map((line) => ({
              variantId: line.variantId,
              productId: line.productId,
              productName: line.productName,
              sku: line.sku,
              colour: line.colour,
              size: line.size,
              unitPriceNGN: line.unitPriceNGN,
              costPriceNGN: line.costPriceNGN,
              totalNGN: line.lineTotalNGN,
              image: line.image,
              quantity: line.quantity,
            })),
          },
          statusHistory: {
            create: {
              fromStatus: 'PENDING_PAYMENT',
              toStatus: 'PENDING_PAYMENT',
              changedBy: 'SYSTEM',
              note: 'Order placed — awaiting delivery quotation from admin',
            },
          },
          events: {
            create: {
              sessionId,
              customerId: customer.id,
              eventType: 'CHECKOUT_STARTED',
              metadata: JSON.stringify({
                orderNumber,
                totalNGN: quote.totalNGN,
                itemCount: quote.cart.items.length,
              }),
            },
          },
        },
        include: {
          items: true,
          statusHistory: true,
        },
      });

      if (affiliateAttribution) {
        await tx.affiliateLink.update({
          where: { id: affiliateAttribution.affiliateLinkId },
          data: { orderCount: { increment: 1 } },
        });
      }

      return order;
    }, { isolationLevel: 'Serializable' });

    // Clear session cart
    await CartService.clearCart(sessionId);

    return createdOrder;
  }
}
