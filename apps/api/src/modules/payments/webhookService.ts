import { PaymentService } from './paymentService';
import { OrderService } from '../orders/orderService';

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

    if (!rawBody || provider.providerType !== 'PAYSTACK' || !provider.verifyWebhookSignature(signature, rawBody)) {
      return {
        received: false,
        processed: false,
        idempotentDuplicate: false,
        message: 'Invalid signature or Paystack webhook secret is not configured',
      };
    }

    const event = payload?.event;
    const data = payload?.data;
    const reference = data?.reference;

    if (typeof event !== 'string' || typeof reference !== 'string' || reference.length === 0) {
      return {
        received: false,
        processed: false,
        idempotentDuplicate: false,
        message: 'Malformed webhook: event and transaction reference are required',
      };
    }

    // Acknowledge authentic, unrelated events without changing commerce state.
    if (event !== 'charge.success') {
      return {
        received: true,
        processed: false,
        idempotentDuplicate: false,
        message: `Ignored Paystack event: ${event}`,
      };
    }

    if (
      data?.status !== 'success' ||
      data?.currency !== 'NGN' ||
      !Number.isSafeInteger(data?.amount) ||
      data.amount <= 0
    ) {
      return {
        received: false,
        processed: false,
        idempotentDuplicate: false,
        message: 'Invalid transaction status, currency, or amount',
      };
    }

    const order = await OrderService.getOrder(reference);
    if (!order || order.orderNumber !== reference || String(order.paymentMethod).toUpperCase() !== 'PAYSTACK') {
      return {
        received: false,
        processed: false,
        idempotentDuplicate: false,
        message: 'No matching Paystack order for this payment reference',
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

    // Do not trust the event payload alone to settle an order. Re-query Paystack
    // and let PaymentService validate the provider reference, order, currency,
    // status and exact amount. OrderService handles duplicate payment idempotently.
    const verification = await PaymentService.verifyPayment(reference);
    if (!verification.success) {
      return {
        received: false,
        processed: false,
        idempotentDuplicate: false,
        message: 'Paystack transaction verification failed; order remains unpaid',
      };
    }

    return {
      received: true,
      processed: true,
      idempotentDuplicate: false,
      message: 'Paystack charge.success independently verified and processed',
    };
  }
}
