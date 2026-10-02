import { dbStore } from '../../db/store';
import { PaymentService } from './paymentService';
import { OrderService } from '../orders/orderService';

export interface WebhookProcessingResult {
  received: boolean;
  processed: boolean;
  idempotentDuplicate: boolean;
  message: string;
}

export class WebhookService {
  /**
   * Process payment provider webhooks with strict idempotency and cryptographic signature validation.
   * Safe to call multiple times with identical payloads without duplicate financial or inventory effects.
   */
  public static async handlePaystackWebhook(
    signature: string,
    rawBody: string,
    payload: any
  ): Promise<WebhookProcessingResult> {
    const provider = PaymentService.getProvider();

    // 1. Verify Cryptographic Signature
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

    // 2. Strict Idempotency Check
    const eventId = `${event}_${reference}`;
    if (dbStore.processedWebhooks.has(eventId)) {
      return {
        received: true,
        processed: true,
        idempotentDuplicate: true,
        message: 'Webhook event already processed (idempotent duplicate)',
      };
    }

    // 3. Process Charge Success Event
    if (event === 'charge.success' && data.status === 'success') {
      const orderNumber = data.metadata?.order_number || reference;
      const order = OrderService.getOrder(orderNumber);

      if (order) {
        // Atomic update of order status & inventory
        OrderService.markOrderPaid(order.orderNumber, reference);

        const payment = dbStore.payments.get(reference);
        if (payment) {
          payment.status = 'SUCCESS';
          payment.verifiedAt = data.paid_at || new Date().toISOString();
          payment.rawMetadata = JSON.stringify(data);
          payment.updatedAt = new Date().toISOString();
        }
      }
    }

    // Mark as processed in idempotent ledger
    dbStore.processedWebhooks.add(eventId);

    return {
      received: true,
      processed: true,
      idempotentDuplicate: false,
      message: `Webhook ${event} processed successfully`,
    };
  }
}
