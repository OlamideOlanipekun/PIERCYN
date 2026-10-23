import { prisma } from '../../db/prisma';
import type { PrismaClient } from '../../db/prisma';
import {
  OrderCreatedPayload,
  ReceiptUploadedPayload,
  PaymentVerifiedPayload,
  ProductOutOfStockPayload,
} from './types';

export class NotificationQueueService {
  /**
   * Enqueues a notification job. If a job with the specified dedupeKey already
   * exists, the operation succeeds idempotently without throwing.
   */
  public static async queueJob(
    eventType: 'ORDER_CREATED' | 'RECEIPT_UPLOADED' | 'PAYMENT_VERIFIED' | 'PRODUCT_OUT_OF_STOCK',
    dedupeKey: string,
    payload: Record<string, any>,
    txClient?: any
  ): Promise<{ enqueued: boolean; dedupeKey: string; jobId?: string }> {
    const client = txClient || prisma;

    try {
      // Upsert or create with catch on unique constraint to guarantee idempotency
      const job = await client.notificationJob.upsert({
        where: { dedupeKey },
        update: {}, // No-op if already queued
        create: {
          eventType,
          dedupeKey,
          payload,
          status: 'PENDING',
          attempts: 0,
          nextAttemptAt: new Date(),
        },
      });

      return { enqueued: true, dedupeKey, jobId: job.id };
    } catch (err: any) {
      // If concurrent insertion occurred with same dedupeKey (P2002), return gracefully
      if (err.code === 'P2002') {
        return { enqueued: false, dedupeKey };
      }
      console.error(`[NOTIFICATION_QUEUE_ERROR] Failed to queue ${eventType} (${dedupeKey}):`, err);
      throw err;
    }
  }

  public static async queueOrderCreated(
    order: {
      id: string;
      orderNumber: string;
      customerFirstName: string;
      customerLastName: string;
      customerEmail: string;
      customerPhone: string;
      deliveryAddress: string;
      deliveryCity: string;
      deliveryState: string;
      orderNote?: string | null;
      subtotalNGN: number;
      deliveryFeeNGN: number;
      discountNGN: number;
      totalNGN: number;
      paymentMethod: string;
      createdAt: Date | string;
    },
    items: Array<{
      productName: string;
      sku: string;
      size: string;
      colour: string;
      quantity: number;
      unitPriceNGN: number;
      totalNGN: number;
    }>,
    txClient?: any
  ) {
    const dedupeKey = `order-created:${order.id}`;
    const payload: OrderCreatedPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      deliveryCity: order.deliveryCity,
      deliveryState: order.deliveryState,
      orderNote: order.orderNote,
      items: items.map((i) => ({
        name: i.productName,
        sku: i.sku,
        size: i.size,
        colour: i.colour,
        quantity: i.quantity,
        unitPriceNGN: i.unitPriceNGN,
        totalNGN: i.totalNGN,
      })),
      subtotalNGN: order.subtotalNGN,
      deliveryFeeNGN: order.deliveryFeeNGN,
      discountNGN: order.discountNGN,
      totalNGN: order.totalNGN,
      paymentMethod: order.paymentMethod,
      createdAt: new Date(order.createdAt).toISOString(),
    };

    return this.queueJob('ORDER_CREATED', dedupeKey, payload, txClient);
  }

  public static async queueReceiptUploaded(
    order: {
      id: string;
      orderNumber: string;
      customerFirstName: string;
      customerLastName: string;
      customerEmail: string;
      customerPhone: string;
      totalNGN: number;
    },
    payment: {
      id: string;
      providerReference: string;
      receiptPath: string;
      receiptMimeType?: string | null;
      receiptUploadedAt?: Date | null;
      reviewDeadlineAt?: Date | null;
    },
    txClient?: any
  ) {
    const uploadedAt = payment.receiptUploadedAt || new Date();
    const dedupeKey = `receipt-uploaded:${order.id}:${payment.id}:${uploadedAt.getTime()}`;
    const payload: ReceiptUploadedPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      totalNGN: order.totalNGN,
      providerReference: payment.providerReference,
      receiptPath: payment.receiptPath,
      receiptMimeType: payment.receiptMimeType,
      uploadedAt: uploadedAt.toISOString(),
      reviewDeadlineAt: (payment.reviewDeadlineAt || new Date()).toISOString(),
    };

    return this.queueJob('RECEIPT_UPLOADED', dedupeKey, payload, txClient);
  }

  public static async queuePaymentVerified(
    order: {
      id: string;
      orderNumber: string;
      customerFirstName: string;
      customerLastName: string;
      customerEmail: string;
      customerPhone: string;
      paymentMethod: string;
      paidAt?: Date | null;
    },
    payment: {
      providerReference: string;
      amountNGN: number;
      verifiedAt?: Date | null;
    },
    verificationSource: 'PAYSTACK_WEBHOOK' | 'PAYSTACK_VERIFY' | 'ADMIN_APPROVAL' | 'MOCK',
    verifiedBy?: string | null,
    txClient?: any
  ) {
    const dedupeKey = `payment-verified:${order.id}:${payment.providerReference}`;
    const payload: PaymentVerifiedPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      amountNGN: payment.amountNGN,
      paymentMethod: order.paymentMethod,
      providerReference: payment.providerReference,
      verifiedAt: (payment.verifiedAt || new Date()).toISOString(),
      verificationSource,
      verifiedBy,
    };

    return this.queueJob('PAYMENT_VERIFIED', dedupeKey, payload, txClient);
  }

  public static async queueOutOfStock(
    variant: {
      id: string;
      productId: string;
      sku: string;
      size: string;
      colour: string;
      product?: { name: string } | null;
    },
    inventoryTransactionId: string,
    triggerReference?: string | null,
    reason?: string | null,
    productNameOverride?: string,
    txClient?: any
  ) {
    const dedupeKey = `stock-out:${variant.id}:${inventoryTransactionId}`;
    const productName = productNameOverride || variant.product?.name || variant.sku;

    const payload: ProductOutOfStockPayload = {
      productId: variant.productId,
      productName,
      variantId: variant.id,
      sku: variant.sku,
      size: variant.size,
      colour: variant.colour,
      depletedAt: new Date().toISOString(),
      triggerReference,
      reason,
    };

    return this.queueJob('PRODUCT_OUT_OF_STOCK', dedupeKey, payload, txClient);
  }
}
