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

    // Only the Paystack provider can authenticate Paystack webhook signatures.
    if (provider.providerType !== 'PAYSTACK' || !provider.verifyWebhookSignature(signature, rawBody)) {
      return {
        received: false,
        processed: false,
        idempotentDuplicate: false,
        message: 'Invalid signature or Paystack is not the configured payment provider',
      };
    }

    const event = payload?.event;
    const data = payload?.data;
    const reference = data?.reference;

    if (typeof event !== 'string' || typeof reference !== 'string' || !reference) {
      return {
        received: false,
        processed: false,
        idempotentDuplicate: false,
        message: 'Malformed webhook: event and transaction reference are required',
      };
    }

    // Other authentic Paystack events can be acknowledged without changing order state.
    if (event !== 'charge.success') {
      return {
        received: true,
        processed: false,
        idempotentDuplicate: false,
        message: `Ignored Paystack event: ${event}`,
      };
    }

    if (data?.status !== 'success' || data?.currency !== 'NGN' || !Number.isSafeInteger(data?.amount)) {
      return {
        received: false,
        processed: false,
        idempotentDuplicate: false,
        message: 'Invalid transaction status, currency, or amount',
      };
    }

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

    const orderNumber = data.metadata?.order_number || reference;
    const order = await OrderService.getOrder(orderNumber);

    if (!order || order.orderNumber !== reference || order.orderNumber !== orderNumber) {
      return {
        received: false,
        processed: false,
        idempotentDuplicate: false,
        message: 'No matching order for this payment reference',
      };
    }

    const expectedAmountKobo = Math.round(order.totalNGN * 100);
    if (data.amount !== expectedAmountKobo) {
      return {
        received: false,
        processed: false,
        idempotentDuplicate: false,
        message: 'Payment amount does not match the order total',
      };
    }

    // Marking paid is transactional and idempotent in OrderService. Only call it
    // after the signed event, reference, currency and exact amount are validated.
    await OrderService.markOrderPaid(order.orderNumber, reference);

    await prisma.payment.upsert({
      where: { providerReference: reference },
      update: {
        status: 'SUCCESS',
        paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
        rawMetadata: JSON.stringify(data),
      },
      create: {
        orderId: order.id,
        providerReference: reference,
        amountNGN: data.amount / 100,
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
      message: 'Paystack charge.success verified and processed',
    };
  }
}
