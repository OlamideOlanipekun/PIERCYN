import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IPaymentProvider, PaymentVerificationResult } from './paymentService';

const mocks = vi.hoisted(() => ({
  getOrder: vi.fn(),
  markOrderPaid: vi.fn(),
}));

vi.mock('../orders/orderService', () => ({
  OrderService: {
    getOrder: mocks.getOrder,
    markOrderPaid: mocks.markOrderPaid,
  },
}));

import { PaymentService } from './paymentService';

const order = {
  id: 'order-id',
  orderNumber: 'PCY-ORDER-123',
  totalNGN: 8000,
  customerEmail: 'buyer@example.com',
  customerName: 'Test Buyer',
  customerPhone: '08000000000',
};

function providerWith(result: PaymentVerificationResult): IPaymentProvider {
  return {
    name: 'Paystack test provider',
    providerType: 'PAYSTACK',
    initialize: vi.fn(),
    verify: vi.fn().mockResolvedValue(result),
    verifyWebhookSignature: vi.fn().mockReturnValue(true),
  };
}

describe('PaymentService.verifyPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOrder.mockResolvedValue(order);
    mocks.markOrderPaid.mockResolvedValue(order);
  });

  it('does not mark an order paid when the provider reference does not match', async () => {
    PaymentService.setProvider(providerWith({
      success: true,
      providerReference: 'ANOTHER-REFERENCE',
      amountNGN: 8000,
      amountKobo: 800000,
      currency: 'NGN',
      orderNumber: order.orderNumber,
    }));

    const result = await PaymentService.verifyPayment(order.orderNumber);

    expect(result.success).toBe(false);
    expect(mocks.markOrderPaid).not.toHaveBeenCalled();
  });

  it('does not mark an order paid when the verified amount is incorrect', async () => {
    PaymentService.setProvider(providerWith({
      success: true,
      providerReference: order.orderNumber,
      amountNGN: 100,
      amountKobo: 10000,
      currency: 'NGN',
      orderNumber: order.orderNumber,
    }));

    const result = await PaymentService.verifyPayment(order.orderNumber);

    expect(result.success).toBe(false);
    expect(mocks.markOrderPaid).not.toHaveBeenCalled();
  });

  it('marks an order paid only when reference, order, currency and exact amount match', async () => {
    PaymentService.setProvider(providerWith({
      success: true,
      providerReference: order.orderNumber,
      amountNGN: 8000,
      amountKobo: 800000,
      currency: 'NGN',
      orderNumber: order.orderNumber,
      paidAt: '2026-10-12T00:00:00.000Z',
    }));

    const result = await PaymentService.verifyPayment(order.orderNumber);

    expect(result.success).toBe(true);
    expect(mocks.markOrderPaid).toHaveBeenCalledOnce();
    expect(mocks.markOrderPaid).toHaveBeenCalledWith(order.orderNumber, order.orderNumber);
  });

  it('fails when the order does not exist', async () => {
    mocks.getOrder.mockResolvedValue(null);
    PaymentService.setProvider(providerWith({
      success: true,
      providerReference: order.orderNumber,
      amountNGN: 8000,
      amountKobo: 800000,
      currency: 'NGN',
      orderNumber: order.orderNumber,
    }));

    const result = await PaymentService.verifyPayment(order.orderNumber);

    expect(result.success).toBe(false);
    expect(mocks.markOrderPaid).not.toHaveBeenCalled();
  });
});
