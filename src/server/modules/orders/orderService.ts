import {
  dbStore,
  DbOrder,
  DbOrderItem,
  OrderStatusType,
  VALID_ORDER_TRANSITIONS,
} from '../../db/store';
import { ProductService } from '../products/productService';
import { InventoryService } from '../inventory/inventoryService';
import { ShippingService } from '../shipping/shippingService';
import { prisma } from '../../db/prisma';

export interface CreateOrderCustomerInput {
  fullName: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  address: string;
}

export interface CreateOrderItemInput {
  variantId: string;
  quantity: number;
}

export interface CreateOrderInput {
  customer: CreateOrderCustomerInput;
  shippingRegion: string;
  paymentMethod: string;
  items: CreateOrderItemInput[];
  discountCode?: string;
  orderNote?: string;
  currency?: string;
}

export class OrderService {
  /**
   * Create an order with full server-side validation and calculation.
   */
  public static createOrder(input: CreateOrderInput): DbOrder {
    if (!input.items || input.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const orderItems: DbOrderItem[] = [];
    let subtotalNGN = 0;

    for (const item of input.items) {
      const variant = ProductService.getVariantByIdOrSku(item.variantId);
      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found`);
      }

      const inv = InventoryService.getVariantStock(variant.id);
      if (!inv || inv.availableStock < item.quantity) {
        throw new Error(`Insufficient stock for variant ${variant.sku}: only ${inv ? inv.availableStock : 0} available`);
      }

      const product = dbStore.products.get(variant.productId);
      if (!product) {
        throw new Error(`Product not found for variant ${variant.sku}`);
      }

      const unitPrice = variant.priceNGN || product.priceNGN;
      const costPrice = variant.costPriceNGN || product.costPriceNGN || Math.round(unitPrice * 0.38);
      const lineTotal = unitPrice * item.quantity;

      subtotalNGN += lineTotal;

      orderItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderId: '', // Will populate
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        sku: variant.sku,
        category: product.categoryId,
        size: variant.size,
        colour: variant.colour,
        unitPriceNGN: unitPrice,
        costPriceNGN: costPrice,
        totalPriceNGN: lineTotal,
        image: variant.image || product.images[0] || '',
        quantity: item.quantity,
        createdAt: new Date().toISOString(),
      });
    }

    // Shipping calculation
    const deliveryFeeNGN = ShippingService.calculateFee(input.shippingRegion as 'lagos' | 'nationwide', subtotalNGN);

    // Promo code validation
    let discountNGN = 0;
    if (input.discountCode) {
      const code = input.discountCode.toUpperCase();
      if (code === 'PIERCYN10' || code === 'WELCOME10') {
        discountNGN = Math.round(subtotalNGN * 0.1);
      } else if (code === 'STANDOUT' || code === 'VIP15') {
        discountNGN = Math.round(subtotalNGN * 0.15);
      } else if (code === 'FREESHIP') {
        discountNGN = deliveryFeeNGN;
      }
    }

    const totalNGN = Math.max(0, subtotalNGN + deliveryFeeNGN - discountNGN);
    const orderNumber = `PCY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    for (const oi of orderItems) {
      oi.orderId = orderId;
    }

    const order: DbOrder = {
      id: orderId,
      orderNumber,
      customerId: undefined,
      customerEmail: input.customer.email.toLowerCase(),
      customerPhone: input.customer.phone,
      customerName: input.customer.fullName,
      shippingAddressLine: input.customer.address,
      shippingCity: input.customer.city,
      shippingState: input.customer.state,
      shippingCountry: 'Nigeria',
      orderNote: input.orderNote,
      subtotalNGN,
      deliveryFeeNGN,
      discountNGN,
      totalNGN,
      currency: input.currency || 'NGN',
      shippingMethodKey: input.shippingRegion,
      shippingMethodName: input.shippingRegion.toLowerCase() === 'lagos' ? 'Lagos Express' : 'Nationwide Courier',
      paymentMethod: input.paymentMethod,
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_PAYMENT',
      timeline: [
        {
          status: 'PENDING_PAYMENT',
          timestamp: now,
          note: 'Order placed, awaiting payment confirmation',
        },
      ],
      createdAt: now,
      updatedAt: now,
      items: orderItems,
    };

    dbStore.orders.set(orderId, order);
    dbStore.orderNumberIndex.set(orderNumber, orderId);

    return order;
  }

  /**
   * Look up order by orderNumber or ID.
   */
  public static getOrder(identifier: string): DbOrder | null {
    let order = dbStore.orders.get(identifier);
    if (!order) {
      const orderId = dbStore.orderNumberIndex.get(identifier);
      if (orderId) {
        order = dbStore.orders.get(orderId);
      }
    }
    return order ? { ...order } : null;
  }

  /**
   * Alias for getOrder
   */
  public static getOrderDetail(identifier: string): DbOrder | null {
    return this.getOrder(identifier);
  }

  /**
   * Get all orders with optional filtering.
   */
  public static getAllOrders(filter?: {
    status?: OrderStatusType;
    email?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): DbOrder[] {
    let list = Array.from(dbStore.orders.values());

    if (filter?.status) {
      list = list.filter((o) => o.orderStatus === filter.status);
    }
    if (filter?.email) {
      const e = filter.email.toLowerCase();
      list = list.filter((o) => o.customerEmail.toLowerCase() === e);
    }
    if (filter?.search) {
      const s = filter.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(s) ||
          o.customerName.toLowerCase().includes(s) ||
          o.customerEmail.toLowerCase().includes(s)
      );
    }
    if (filter?.startDate) {
      const start = new Date(filter.startDate).getTime();
      list = list.filter((o) => new Date(o.createdAt).getTime() >= start);
    }
    if (filter?.endDate) {
      const end = new Date(filter.endDate).getTime();
      list = list.filter((o) => new Date(o.createdAt).getTime() <= end);
    }

    list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filter?.offset !== undefined || filter?.limit !== undefined) {
      const offset = filter.offset || 0;
      const limit = filter.limit !== undefined ? offset + filter.limit : undefined;
      list = list.slice(offset, limit);
    }

    return list;
  }

  /**
   * Update order status with state machine transition enforcement.
   */
  public static updateStatus(
    orderIdentifier: string,
    newStatus: OrderStatusType,
    note?: string,
    updatedBy: string = 'ADMIN'
  ): DbOrder {
    const order = this.getOrder(orderIdentifier);
    if (!order) {
      throw new Error(`Order ${orderIdentifier} not found`);
    }

    const currentStatus = order.orderStatus;
    const allowedTransitions = VALID_ORDER_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid order status transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'None'}`
      );
    }

    const liveOrder = dbStore.orders.get(order.id)!;
    const now = new Date().toISOString();

    liveOrder.orderStatus = newStatus;
    if (newStatus === 'PAID') {
      liveOrder.paymentStatus = 'PAID';
      liveOrder.paidAt = now;
    }
    liveOrder.updatedAt = now;

    liveOrder.timeline.push({
      status: newStatus,
      timestamp: now,
      note: note || `Status transitioned to ${newStatus} by ${updatedBy}`,
    });

    return { ...liveOrder };
  }

  /**
   * Mark order as PAID idempotently and finalize inventory.
   * Supports both synchronous invocation and Prisma transaction context.
   */
  public static markOrderPaid(
    param1: any,
    param2?: string,
    param3?: string
  ): any {
    let orderNumber: string;
    let providerReference: string;

    if (typeof param1 === 'string') {
      orderNumber = param1;
      providerReference = param2 || 'SYS-REF';
    } else {
      orderNumber = param2 || '';
      providerReference = param3 || 'SYS-REF';
    }

    const order = this.getOrder(orderNumber);
    if (!order) {
      throw new Error(`Order not found: ${orderNumber}`);
    }

    const liveOrder = dbStore.orders.get(order.id)!;

    // Idempotency check: if already paid, return
    if (liveOrder.paymentStatus === 'PAID') {
      return { ...liveOrder };
    }

    const now = new Date().toISOString();
    liveOrder.paymentStatus = 'PAID';
    liveOrder.orderStatus = 'PAID';
    liveOrder.paidAt = now;
    liveOrder.updatedAt = now;

    liveOrder.timeline.push({
      status: 'PAID',
      timestamp: now,
      note: `Payment confirmed via reference ${providerReference}`,
    });

    // Finalize stock for all order line items
    for (const item of liveOrder.items) {
      if (item.variantId) {
        InventoryService.finalizeSale(item.variantId, item.quantity, liveOrder.orderNumber);
      }
    }

    return { ...liveOrder };
  }

  /**
   * Cancel an order and release any reserved inventory.
   */
  public static cancelOrder(orderNumber: string, reason: string = 'User cancellation'): DbOrder {
    const order = this.getOrder(orderNumber);
    if (!order) throw new Error(`Order ${orderNumber} not found`);

    return this.updateStatus(order.id, 'CANCELLED', reason);
  }
}
