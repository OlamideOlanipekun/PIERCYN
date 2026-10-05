import { prisma } from '../db/prisma';
import { COMMERCE_CONFIG } from '../config/constants';
import { ShippingService } from './shippingService';
import { PrismaCartService } from './prismaCartService';

export class PrismaCheckoutService {
  static async calculateQuote(sessionId: string, shippingRegion: 'lagos' | 'nationwide', items: { variantId: string; quantity: number }[], discountCode?: string) {
    const cart = await PrismaCartService.calculateItems(sessionId, items);
    const promo = discountCode ? COMMERCE_CONFIG.PROMOTIONS.find((item) => item.code === discountCode.trim().toUpperCase()) : undefined;
    const deliveryFeeNGN = ShippingService.calculateFee(shippingRegion, cart.subtotalNGN);
    const discountNGN = promo ? Math.round(cart.subtotalNGN * promo.discountPercent / 100) : 0;
    return { cart, shippingRegion, shippingMethodName: shippingRegion === 'lagos' ? 'Lagos Doorstep (24–48 Hours)' : 'Nationwide Nigeria (3–5 Business Days)', subtotalNGN: cart.subtotalNGN, deliveryFeeNGN, discountNGN, discountDescription: promo?.description, totalNGN: Math.max(0, cart.subtotalNGN + deliveryFeeNGN - discountNGN), isEligibleForCheckout: cart.isValid && cart.items.length > 0, errors: cart.validationErrors };
  }

  static async createOrder(input: any) {
    const quote = await this.calculateQuote(input.sessionId || `guest-${Date.now()}`, input.shippingRegion, input.items, input.discountCode);
    if (!quote.isEligibleForCheckout) throw new Error(`Checkout validation failed: ${quote.errors.join(', ')}`);
    const orderNumber = `PCY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const [firstName, ...restName] = (input.customer.fullName || 'Valued Customer').trim().split(' ');
    const lastName = restName.join(' ') || 'Customer';

    return prisma.$transaction(async (tx) => {
      for (const line of quote.cart.items) {
        const inventory = await tx.inventory.findUnique({ where: { variantId: line.variantId } });
        const available = inventory ? inventory.stockQuantity - inventory.reservedQuantity : 0;
        if (!inventory || available < line.quantity) {
          throw new Error(`Inventory reservation failed for variant ${line.variantId}. Item may have sold out.`);
        }
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { reservedQuantity: { increment: line.quantity } },
        });
        await tx.inventoryReservation.create({
          data: {
            variantId: line.variantId,
            quantity: line.quantity,
            reference: orderNumber,
            expiresAt: new Date(Date.now() + COMMERCE_CONFIG.INVENTORY.RESERVATION_TTL_MINUTES * 60000),
          },
        });
        await tx.inventoryTransaction.create({
          data: {
            inventoryId: inventory.id,
            variantId: line.variantId,
            quantity: line.quantity,
            type: 'RESERVATION',
            previousStock: inventory.stockQuantity,
            newStock: inventory.stockQuantity,
            referenceType: 'ORDER',
            referenceId: orderNumber,
            reason: 'Checkout initiated',
          },
        });
      }
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerFirstName: firstName,
          customerLastName: lastName,
          customerEmail: input.customer.email.toLowerCase(),
          customerPhone: input.customer.phone || '',
          deliveryAddress: input.customer.address || '',
          deliveryCity: input.customer.city || '',
          deliveryState: input.customer.state || '',
          orderNote: input.customer.orderNote || null,
          subtotalNGN: quote.subtotalNGN,
          deliveryFeeNGN: quote.deliveryFeeNGN,
          discountNGN: quote.discountNGN,
          totalNGN: quote.totalNGN,
          shippingMethodKey: quote.shippingRegion,
          shippingMethodName: quote.shippingMethodName,
          paymentMethod: input.paymentMethod === 'paystack' ? 'PAYSTACK' : 'DIRECT_TRANSFER',
          items: {
            create: quote.cart.items.map((line) => ({
              variantId: line.variantId,
              productId: line.productId,
              productName: line.productName,
              sku: line.sku,
              colour: line.colour,
              size: line.size,
              unitPriceNGN: line.unitPriceNGN,
              totalNGN: line.lineTotalNGN,
              image: line.image,
              quantity: line.quantity,
            })),
          },
          events: {
            create: {
              eventType: 'CHECKOUT_STARTED',
              sessionId: input.sessionId,
              metadata: JSON.stringify({ orderNumber, totalNGN: quote.totalNGN }),
            },
          },
        },
        include: { items: true },
      });
      return order;
    });
  }
}
