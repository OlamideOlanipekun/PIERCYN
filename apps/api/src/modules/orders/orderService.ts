import { prisma } from '../../db/prisma';
import { COMMERCE_CONFIG } from '../../config/constants';
import { InventoryService } from '../inventory/inventoryService';
import { CommissionService } from '../affiliate/commissionService';
import {
  NotificationQueueService,
  triggerNotificationProcessingAsync,
} from '../notifications';

export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ['AWAITING_PAYMENT_VERIFICATION', 'PAID', 'CANCELLED', 'FAILED'],
  AWAITING_PAYMENT_VERIFICATION: ['PAID', 'PENDING_PAYMENT', 'CANCELLED', 'FAILED'],
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

  public static async getPublicOrderDetail(identifier: string) {
    const order = await this.getOrder(identifier);
    if (!order) return null;

    const {
      manualReviewReason,
      needsManualReview,
      quoteInternalNote,
      quoteSetByAdmin,
      quoteSentByAdmin,
      quoteAcceptedByAdmin,
      quoteRejectedByAdmin,
      riderPhone,
      dispatchNote,
      ...publicOrder
    } = order as any;

    return {
      ...publicOrder,
      payments: order.payments.map((payment) => {
        const {
          rawMetadata,
          verifiedBy,
          receiptPath,
          verificationNote,
          ...publicPayment
        } = payment as any;
        return publicPayment;
      }),
    };
  }

  public static async getAllOrders(filter?: {
    status?: string;
    quoteStatus?: string;
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

    if (filter?.quoteStatus && filter.quoteStatus !== 'ALL') {
      where.quoteStatus = filter.quoteStatus;
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
    const updated = await prisma.$transaction(async (tx) => {
      // Serialize status changes with payment finalization for the same order.
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Order"
        WHERE "id" = ${orderIdentifier} OR "orderNumber" = ${orderIdentifier}
        FOR UPDATE
      `;
      if (!locked || locked.length === 0) {
        throw new Error(`Order ${orderIdentifier} not found`);
      }

      const existing = await tx.order.findUnique({ where: { id: locked[0].id } });
      if (!existing) {
        throw new Error(`Order ${orderIdentifier} not found`);
      }

      const currentStatus = existing.status;
      const allowed = VALID_ORDER_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(newStatus)) {
        throw new Error(
          `Invalid order status transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ') || 'None'}`
        );
      }

      const isPaid = newStatus === 'PAID';

      // Auto-reconcile quote on payment confirmation: if the order is being
      // marked PAID but the quote is still PENDING/SET/SENT, snapshot the
      // agreed fee so the customer page never shows "To be confirmed" on a
      // paid order.
      let quoteReconciliation: Record<string, any> = {};
      if (isPaid && existing.quoteStatus !== 'ACCEPTED') {
        const agreedFee = existing.quoteDeliveryFeeNGN ?? existing.deliveryFeeNGN ?? 0;
        const agreedTotal = existing.quoteTotalNGN ?? existing.totalNGN;
        quoteReconciliation = {
          quoteStatus: 'ACCEPTED',
          quoteAcceptedAt: new Date(),
          quoteAcceptedByAdmin: updatedBy,
          quoteAcceptedFeeNGN: agreedFee,
          quoteAcceptedTotalNGN: agreedTotal,
        };
      }

      const updatedOrder = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: newStatus as any,
          ...(isPaid ? { paymentStatus: 'PAID', paidAt: new Date() } : {}),
          ...quoteReconciliation,
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

    // Handle affiliate commission side-effects only when the programme is enabled.
    if (COMMERCE_CONFIG.AFFILIATE.ENABLED) {
      try {
        if (newStatus === 'PAID') {
          await CommissionService.processOrderCommission(updated.id);
        } else if (newStatus === 'DELIVERED' || newStatus === 'COMPLETED') {
          await CommissionService.markCommissionsAvailable(updated.id);
        } else if (['CANCELLED', 'REFUNDED', 'RETURNED'].includes(newStatus)) {
          await CommissionService.reverseCommissions(updated.id, note || `Order ${newStatus}`);
        }
      } catch (commErr: any) {
        console.error(`[COMMISSION_ERROR] Failed updating commission for order ${updated.id}:`, commErr.message);
      }
    }

    return updated;
  }

  public static async markOrderPaid(
    orderNumber: string,
    providerReference: string = 'SYS-REF'
  ) {
    const orderRes = await prisma.$transaction(async (tx) => {
      // Serialize all confirmations for this order. This is the critical
      // section that prevents a webhook and an admin approval from both
      // decrementing inventory.
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Order" WHERE "orderNumber" = ${orderNumber} FOR UPDATE
      `;
      if (!locked || locked.length === 0) {
        throw new Error(`Order not found: ${orderNumber}`);
      }

      const order = await tx.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      });

      if (!order) {
        throw new Error(`Order not found: ${orderNumber}`);
      }

      // Idempotency: if already paid, return early
      if (order.paymentStatus === 'PAID') {
        return order;
      }

      if (order.paymentStatus === 'REJECTED' && providerReference.startsWith('TRF-')) {
        throw new Error('The submitted transfer receipt was rejected. Ask the customer to resubmit before approving.');
      }

      const existingPayment = await tx.payment.findUnique({
        where: { providerReference },
      });
      if (existingPayment && existingPayment.orderId !== order.id) {
        throw new Error('Payment reference is already associated with another order.');
      }

      const now = new Date();

      // Money can arrive after the reservation cron cancelled the order. Never
      // reject the gateway callback: record the payment and flag it for a
      // human refund/reconciliation instead of retrying forever on an unpaid
      // cancelled order.
      if (['CANCELLED', 'FAILED', 'REFUNDED'].includes(order.status)) {
        const reviewReason = `Payment received after the order reached ${order.status}. Do not fulfil; reconcile or refund manually.`;
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            paidAt: order.paidAt ?? now,
            paymentSubmittedAt: order.paymentSubmittedAt ?? now,
            needsManualReview: true,
            manualReviewReason: reviewReason,
          },
          include: { items: true },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: order.status,
            changedBy: 'SYSTEM',
            note: `Payment confirmed via reference ${providerReference} after ${order.status}. Flagged for manual refund/reconciliation.`,
          },
        });

        await tx.payment.upsert({
          where: { providerReference },
          update: {
            status: 'SUCCESS',
            paidAt: now,
            verifiedAt: now,
            receiptPath: existingPayment?.receiptPath,
            receiptMimeType: existingPayment?.receiptMimeType,
            receiptUploadedAt: existingPayment?.receiptUploadedAt,
            verificationNote: existingPayment?.verificationNote,
            rejectionReason: null,
          },
          create: {
            orderId: order.id,
            providerReference,
            amountNGN: order.totalNGN,
            currency: 'NGN',
            status: 'SUCCESS',
            paidAt: now,
            submittedAt: now,
            verifiedAt: now,
          },
        });

        await tx.analyticsEvent.create({
          data: {
            orderId: order.id,
            customerId: order.customerId,
            eventType: 'PURCHASE_COMPLETED',
            metadata: JSON.stringify({
              event: 'PAYMENT_RECEIVED_AFTER_CANCELLATION',
              orderNumber: order.orderNumber,
              totalNGN: order.totalNGN,
              providerReference,
              reviewReason,
            }),
          },
        });

        return updatedOrder;
      }
      const shortfalls: string[] = [];

      // Finalize inventory before marking the order paid. Aggregate by variant
      // so duplicate lines cannot finalize (and fulfill reservations) twice.
      const requiredByVariant = new Map<string, number>();
      for (const item of order.items) {
        if (!item.variantId) continue;
        requiredByVariant.set(
          item.variantId,
          (requiredByVariant.get(item.variantId) || 0) + item.quantity
        );
      }

      for (const [variantId, quantity] of requiredByVariant) {
        const result = await InventoryService.finalizeSale(
          variantId,
          quantity,
          order.orderNumber,
          tx
        );
        if (!result.finalized) {
          shortfalls.push(`${variantId}: short by ${result.shortfall} unit(s)`);
        }
      }

      const needsManualReview = shortfalls.length > 0;
      const manualReviewReason = needsManualReview
        ? `Payment received but stock could not be fully allocated: ${shortfalls.join('; ')}. Do not fulfil until reviewed.`
        : null;

      // Auto-reconcile quote status: if the order has no accepted quote yet,
      // snapshot the agreed delivery fee at time of payment so the customer
      // page displays authoritative figures instead of "To be confirmed".
      const quoteReconcile: Record<string, any> = {};
      if (order.quoteStatus !== 'ACCEPTED') {
        const agreedFee = order.quoteDeliveryFeeNGN ?? order.deliveryFeeNGN ?? 0;
        const agreedTotal = order.quoteTotalNGN ?? order.totalNGN;
        quoteReconcile.quoteStatus = 'ACCEPTED';
        quoteReconcile.quoteAcceptedAt = now;
        quoteReconcile.quoteAcceptedByAdmin = 'SYSTEM';
        quoteReconcile.quoteAcceptedFeeNGN = agreedFee;
        quoteReconcile.quoteAcceptedTotalNGN = agreedTotal;
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'PAID',
          paidAt: now,
          paymentSubmittedAt: order.paymentSubmittedAt ?? now,
          needsManualReview,
          manualReviewReason,
          ...quoteReconcile,
        },
        include: { items: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'PAID',
          changedBy: 'SYSTEM',
          note: needsManualReview
            ? `Payment confirmed via reference ${providerReference}, but stock allocation requires manual review.`
            : `Payment confirmed via reference ${providerReference}`,
        },
      });

      await tx.payment.upsert({
        where: { providerReference },
        update: {
          status: 'SUCCESS',
          paidAt: now,
          verifiedAt: now,
          receiptPath: existingPayment?.receiptPath,
          receiptMimeType: existingPayment?.receiptMimeType,
          receiptUploadedAt: existingPayment?.receiptUploadedAt,
          verificationNote: existingPayment?.verificationNote,
        },
        create: {
          orderId: order.id,
          providerReference,
          amountNGN: order.totalNGN,
          currency: 'NGN',
          status: 'SUCCESS',
          paidAt: now,
          submittedAt: now,
          verifiedAt: now,
        },
      });

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
            needsManualReview,
          }),
        },
      });

      // Atomically queue PAYMENT_VERIFIED notification job
      const verificationSource = providerReference.startsWith('TRF-')
        ? 'ADMIN_APPROVAL'
        : providerReference.startsWith('MOCK-')
        ? 'MOCK'
        : 'PAYSTACK_VERIFY';

      await NotificationQueueService.queuePaymentVerified(
        updatedOrder,
        {
          providerReference,
          amountNGN: updatedOrder.totalNGN,
          verifiedAt: now,
        },
        verificationSource,
        null,
        tx
      );

      return updatedOrder;
    });

    // Opportunistically dispatch pending notifications
    triggerNotificationProcessingAsync();

    if (!COMMERCE_CONFIG.AFFILIATE.ENABLED) {
      return orderRes;
    }

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
