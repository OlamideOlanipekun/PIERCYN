import { prisma } from '../../db/prisma';
import { InventoryService } from '../inventory/inventoryService';
import { CommissionService } from '../affiliate/commissionService';
import { WhatsAppNotificationService } from '../notifications/whatsappNotificationService';

export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED', 'FAILED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['PACKED', 'CANCELLED', 'REFUNDED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED', 'FAILED'],
  DELIVERED: ['COMPLETED', 'RETURNED', 'EXCHANGED'],
  COMPLETED: ['RETURNED', 'REFUNDED'],
  CANCELLED: [],
  FAILED: ['PENDING_PAYMENT'],
  RETURNED: ['REFUNDED', 'EXCHANGED'],
  REFUNDED: [],
  EXCHANGED: ['PROCESSING'],
};

export class OrderService {
  public static async getOrder(identifier: string) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: identifier }, { orderNumber: identifier }],
      },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        payments: true,
        shipment: true,
      },
    });

    if (!order) return null;

    return {
      ...order,
      orderStatus: order.status,
      customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
      shippingAddressLine: order.deliveryAddress,
      shippingCity: order.deliveryCity,
      shippingState: order.deliveryState,
      timeline: order.statusHistory.map((sh) => ({
        status: sh.toStatus,
        timestamp: sh.createdAt.toISOString(),
        note: sh.note,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  public static async getOrderDetail(identifier: string) {
    return this.getOrder(identifier);
  }

  public static async getAllOrders(filter?: {
    status?: string;
    email?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status;
    }

    if (filter?.email) {
      where.customerEmail = { equals: filter.email, mode: 'insensitive' };
    }

    if (filter?.search) {
      const s = filter.search.toLowerCase();
      where.OR = [
        { orderNumber: { contains: s, mode: 'insensitive' } },
        { customerFirstName: { contains: s, mode: 'insensitive' } },
        { customerLastName: { contains: s, mode: 'insensitive' } },
        { customerEmail: { contains: s, mode: 'insensitive' } },
        { customerPhone: { contains: s } },
      ];
    }

    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        shipment: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filter?.limit,
      skip: filter?.offset,
    });

    return orders.map((o) => ({
      ...o,
      orderStatus: o.status,
      customerName: `${o.customerFirstName} ${o.customerLastName}`.trim(),
      shippingAddressLine: o.deliveryAddress,
      shippingCity: o.deliveryCity,
      shippingState: o.deliveryState,
      timeline: o.statusHistory.map((sh) => ({
        status: sh.toStatus,
        timestamp: sh.createdAt.toISOString(),
        note: sh.note,
      })),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));
  }

  public static async updateStatus(
    orderIdentifier: string,
    newStatus: string,
    note?: string,
    updatedBy: string = 'ADMIN'
  ) {
    const existing = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdentifier }, { orderNumber: orderIdentifier }],
      },
    });

    if (!existing) {
      throw new Error(`Order ${orderIdentifier} not found`);
    }

    // Payment confirmation must pass through markOrderPaid(), which records
    // the payment ledger and finalizes reserved inventory in one transaction.
    // Never allow a generic admin status update to bypass provider verification.
    if (newStatus === 'PAID') {
      throw new Error('Use the payment confirmation flow to mark an order paid.');
    }

    const currentStatus = existing.status;
    const allowed = VALID_ORDER_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid order status transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ') || 'None'}`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const isPaid = newStatus === 'PAID';
      const updatedOrder = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: newStatus as any,
          ...(isPaid ? { paymentStatus: 'PAID', paidAt: new Date() } : {}),
        },
        include: {
          items: true,
          statusHistory: true,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: existing.id,
          fromStatus: currentStatus as any,
          toStatus: newStatus as any,
          changedBy: updatedBy,
          note: note || `Status transitioned to ${newStatus} by ${updatedBy}`,
        },
      });

      if (newStatus === 'CANCELLED') {
        await InventoryService.releaseReservation(existing.orderNumber, tx);
      }

      return updatedOrder;
    });

    // Handle affiliate commission side-effects asynchronously/safely
    try {
      if (newStatus === 'PAID') {
        await CommissionService.processOrderCommission(existing.id);
      } else if (newStatus === 'DELIVERED' || newStatus === 'COMPLETED') {
        await CommissionService.markCommissionsAvailable(existing.id);
      } else if (['CANCELLED', 'REFUNDED', 'RETURNED'].includes(newStatus)) {
        await CommissionService.reverseCommissions(existing.id, note || `Order ${newStatus}`);
      }
    } catch (commErr: any) {
      console.error(`[COMMISSION_ERROR] Failed updating commission for order ${existing.id}:`, commErr.message);
    }

    return updated;
  }

  public static async markOrderPaid(
    orderNumber: string,
    providerReference: string = 'SYS-REF',
    confirmedBy: string = 'SYSTEM'
  ) {
    const orderRes = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      });

      if (!order) {
        throw new Error(`Order not found: ${orderNumber}`);
      }

      // Idempotency: if already paid, return early.
      if (order.paymentStatus === 'PAID') {
        return order;
      }
      if (order.status !== 'PENDING_PAYMENT') {
        throw new Error(`Cannot confirm payment for order ${order.orderNumber} while its status is ${order.status}.`);
      }

      const now = new Date();

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'PAID',
          paidAt: now,
        },
        include: { items: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'PAID',
          changedBy: confirmedBy,
          note: `Payment confirmed via reference ${providerReference} by ${confirmedBy}`,
        },
      });

      // Persist the actual payment provider. Otherwise Paystack payments inherit
      // the schema's DIRECT_TRANSFER default and the payment ledger lies.
      const provider =
        order.paymentMethod === 'PAYSTACK'
          ? 'PAYSTACK'
          : order.paymentMethod === 'MOCK'
          ? 'MOCK'
          : 'DIRECT_TRANSFER';

      await tx.payment.upsert({
        where: { providerReference },
        update: {
          provider,
          amountNGN: order.totalNGN,
          currency: order.currency || 'NGN',
          status: 'SUCCESS',
          paidAt: now,
        },
        create: {
          orderId: order.id,
          provider,
          providerReference,
          amountNGN: order.totalNGN,
          currency: order.currency || 'NGN',
          status: 'SUCCESS',
          paidAt: now,
        },
      });

      // Finalize inventory for all items
      for (const item of order.items) {
        if (item.variantId) {
          await InventoryService.finalizeSale(item.variantId, item.quantity, order.orderNumber, tx);
        }
      }

      // Log purchase event
      await tx.analyticsEvent.create({
        data: {
          orderId: order.id,
          customerId: order.customerId,
          eventType: 'PURCHASE_COMPLETED',
          metadata: JSON.stringify({
            orderNumber: order.orderNumber,
            totalNGN: order.totalNGN,
            providerReference,
          }),
        },
      });

      return updatedOrder;
    });

    // Best-effort operator alert after the payment transaction commits.
    await WhatsAppNotificationService.notifyOrderEvent({
      orderNumber: orderRes.orderNumber,
      customerName: `${orderRes.customerFirstName} ${orderRes.customerLastName}`.trim(),
      customerPhone: orderRes.customerPhone,
      totalNGN: orderRes.totalNGN,
      status: 'PAYMENT_CONFIRMED',
    });

    try {
      await CommissionService.processOrderCommission(orderRes.id);
    } catch (commErr: any) {
      console.error(`[COMMISSION_ERROR] Failed to process commission in markOrderPaid:`, commErr.message);
    }

    return orderRes;
  }

  public static async cancelOrder(orderNumber: string, reason: string = 'User cancellation') {
    return this.updateStatus(orderNumber, 'CANCELLED', reason);
  }
}
