import { PaymentService } from './paymentService';
import { OrderService } from '../orders/orderService';
import { prisma } from '../../db/prisma';

export interface WebhookProcessingResult {
  received: boolean;
  processed: boolean;
  idempotentDuplicate: boolean;
  message: string;
}

export class WebhookService {
  public static async handlePaystackWebhook(
    signature: string,
    rawBody: string,
    payload: any
  ): Promise<WebhookProcessingResult> {
    const provider = PaymentService.getProvider();

    // 1. Verify Signature
    const isValidSignature = provider.verifyWebhookSignature(signature, rawBody);
    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      return {
        received: true,
        processed: false,
        idempotentDuplicate: false,
        message: 'Invalid webhook signature',
      };
    }

    const event = payload?.event;
    const data = payload?.data;
    const reference = data?.reference;

    if (!reference) {
      return {
        received: true,
        processed: false,
        idempotentDuplicate: false,
        message: 'Missing transaction reference',
      };
    }

    // 2. Strict Idempotency Check in Database
    const existingPayment = await prisma.payment.findUnique({
      where: { providerReference: reference },
    });

    if (existingPayment && existingPayment.status === 'SUCCESS') {
      return {
        received: true,
        processed: true,
        idempotentDuplicate: true,
        message: 'Webhook event already processed (idempotent duplicate)',
      };
    }

    // Acknowledge unrelated events without mutating order/payment state.
    if (event !== 'charge.success' || data?.status !== 'success') {
      return {
        received: true,
        processed: true,
        idempotentDuplicate: false,
        message: 'Webhook acknowledged; no successful charge to process.',
      };
    }

    const orderNumber = data.metadata?.order_number || reference;
    const order = await OrderService.getOrder(orderNumber);
    if (!order) {
      return {
        received: true,
        processed: false,
        idempotentDuplicate: false,
        message: 'No matching order found for this payment reference.',
      };
    }

    const amountKobo = Number(data.amount);
    const expectedAmountKobo = Math.round(order.totalNGN * 100);
    const currency = String(data.currency || '').toUpperCase();
    if (!Number.isFinite(amountKobo) || amountKobo !== expectedAmountKobo || currency !== 'NGN') {
      return {
        received: true,
        processed: false,
        idempotentDuplicate: false,
        message: 'Payment amount or currency does not match the order.',
      };
    }

    await OrderService.markOrderPaid(order.orderNumber, reference);
    await prisma.payment.upsert({
      where: { providerReference: reference },
      update: {
        orderId: order.id,
        amountNGN: order.totalNGN,
        currency: 'NGN',
        status: 'SUCCESS',
        paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
        rawMetadata: JSON.stringify(data),
      },
      create: {
        orderId: order.id,
        providerReference: reference,
        amountNGN: order.totalNGN,
        currency: 'NGN',
        status: 'SUCCESS',
        paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
        rawMetadata: JSON.stringify(data),
      },
    });

    return {
      received: true,
      processed: true,
      idempotentDuplicate: false,
      message: `Webhook ${event} processed successfully`,
    };
  }
}
