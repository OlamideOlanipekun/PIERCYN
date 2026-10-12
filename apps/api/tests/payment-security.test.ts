import { afterEach, describe, expect, it } from 'vitest';
import { DirectTransferProvider, PaystackPaymentProvider, PaymentService } from '../src/modules/payments/paymentService';
import { WebhookService } from '../src/modules/payments/webhookService';

const originalNodeEnv = process.env.NODE_ENV;
const originalProvider = PaymentService.getProvider();

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  PaymentService.setProvider(originalProvider);
});

describe('production payment verification safeguards', () => {
  it('does not mark an order paid from a client-supplied transfer reference', async () => {
    process.env.NODE_ENV = 'production';
    PaymentService.setProvider(new DirectTransferProvider());

    const result = await PaymentService.verifyPayment('PCY-FAKE-REFERENCE');

    expect(result.success).toBe(false);
    expect(result.amountNGN).toBe(0);
  });

  it('rejects production webhooks when no Paystack signing secret is configured', async () => {
    process.env.NODE_ENV = 'production';
    PaymentService.setProvider(new PaystackPaymentProvider());

    const result = await WebhookService.handlePaystackWebhook('', JSON.stringify({
      event: 'charge.success',
      data: {
        reference: 'PCY-FAKE-REFERENCE',
        status: 'success',
        currency: 'NGN',
        amount: 500000,
        metadata: { order_number: 'PCY-FAKE-REFERENCE' },
      },
    }), {
      event: 'charge.success',
      data: {
        reference: 'PCY-FAKE-REFERENCE',
        status: 'success',
        currency: 'NGN',
        amount: 500000,
        metadata: { order_number: 'PCY-FAKE-REFERENCE' },
      },
    });

    expect(result.processed).toBe(false);
    expect(result.message).toBe('Invalid webhook signature');
  });
});
