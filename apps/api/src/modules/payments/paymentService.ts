import crypto from 'crypto';
import { COMMERCE_CONFIG } from '../../config/constants';
import { OrderService } from '../orders/orderService';
import { prisma } from '../../db/prisma';

export interface PaymentInitializationParams {
  orderNumber: string;
  amountNGN: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  callbackUrl?: string;
}

export interface PaymentInitializationResult {
  success: boolean;
  provider: 'PAYSTACK' | 'DIRECT_TRANSFER' | 'MOCK';
  providerReference: string;
  authorizationUrl?: string;
  accessCode?: string;
  message?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  providerReference: string;
  amountNGN: number;
  orderNumber: string;
  currency?: string;
  paidAt?: string;
  rawResponse?: unknown;
}

export interface IPaymentProvider {
  name: string;
  providerType: 'PAYSTACK' | 'DIRECT_TRANSFER' | 'MOCK';
  initialize(params: PaymentInitializationParams): Promise<PaymentInitializationResult>;
  verify(reference: string): Promise<PaymentVerificationResult>;
  verifyWebhookSignature(signature: string, rawBody: string): boolean;
}

export class DirectTransferProvider implements IPaymentProvider {
  name = 'Direct Bank Transfer';
  providerType = 'DIRECT_TRANSFER' as const;

  async initialize(params: PaymentInitializationParams): Promise<PaymentInitializationResult> {
    const ref = `PCY-TRF-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;
    return {
      success: true,
      provider: 'DIRECT_TRANSFER',
      providerReference: ref,
      message: 'Bank transfer instructions sent. Awaiting confirmation.',
    };
  }

  async verify(reference: string): Promise<PaymentVerificationResult> {
    return { success: false, providerReference: reference, amountNGN: 0, orderNumber: '' };
  }

  verifyWebhookSignature(): boolean {
    return process.env.NODE_ENV !== 'production';
  }
}

export class MockPaymentProvider implements IPaymentProvider {
  name = 'Mock Payment (Dev Only)';
  providerType = 'MOCK' as const;

  async initialize(params: PaymentInitializationParams): Promise<PaymentInitializationResult> {
    const ref = `MOCK-${Date.now()}`;
    return {
      success: true,
      provider: 'MOCK',
      providerReference: ref,
      authorizationUrl: `/checkout/mock-pay?ref=${ref}`,
      message: 'Mock payment initialized',
    };
  }

  async verify(reference: string): Promise<PaymentVerificationResult> {
    return {
      success: true,
      providerReference: reference,
      amountNGN: 1000000,
      orderNumber: reference,
      paidAt: new Date().toISOString(),
      rawResponse: { status: 'success', gateway_response: 'Mock success' },
    };
  }

  verifyWebhookSignature(): boolean {
    return true;
  }
}

export class PaystackPaymentProvider implements IPaymentProvider {
  name = 'Paystack';
  providerType = 'PAYSTACK' as const;

  private secretKey: string;
  private webhookSecret: string;

  constructor() {
    this.secretKey = COMMERCE_CONFIG.PAYMENT.PAYSTACK.SECRET_KEY;
    this.webhookSecret = COMMERCE_CONFIG.PAYMENT.PAYSTACK.WEBHOOK_SECRET;
  }

  async initialize(params: PaymentInitializationParams): Promise<PaymentInitializationResult> {
    if (!this.secretKey) {
      return new DirectTransferProvider().initialize(params);
    }

    try {
      const response = await fetch(
        `${COMMERCE_CONFIG.PAYMENT.PAYSTACK.BASE_URL}/transaction/initialize`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: params.customerEmail,
            // Paystack amounts in minor units (Kobo)
            amount: params.amountNGN * 100,
            reference: params.orderNumber,
            callback_url: params.callbackUrl || `${COMMERCE_CONFIG.APP_URL}/order-confirmation?ref=${params.orderNumber}`,
            metadata: {
              customer_name: params.customerName,
              customer_phone: params.customerPhone,
              order_number: params.orderNumber,
            },
          }),
        }
      );

      const data = await response.json();
      if (!data.status) throw new Error(data.message || 'Paystack init failed');

      return {
        success: true,
        provider: 'PAYSTACK',
        providerReference: data.data.reference,
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
        message: 'Paystack authorization URL generated',
      };
    } catch (err: any) {
      console.error('[PAYSTACK_INIT_ERROR]', err);
      return {
        success: false,
        provider: 'PAYSTACK',
        providerReference: params.orderNumber,
        message: err.message || 'Unable to connect to Paystack',
      };
    }
  }

  async verify(reference: string): Promise<PaymentVerificationResult> {
    if (!this.secretKey) {
      return { success: false, providerReference: reference, amountNGN: 0, orderNumber: reference };
    }

    try {
      const response = await fetch(
        `${COMMERCE_CONFIG.PAYMENT.PAYSTACK.BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: { Authorization: `Bearer ${this.secretKey}` },
        }
      );

      const data = await response.json();
      const isSuccess = data.status && data.data?.status === 'success';

      return {
        success: isSuccess,
        providerReference: reference,
        amountNGN: isSuccess ? Math.round((data.data.amount || 0) / 100) : 0,
        orderNumber: data.data?.metadata?.order_number || reference,
        currency: data.data?.currency,
        paidAt: isSuccess ? data.data.paid_at || new Date().toISOString() : undefined,
        rawResponse: data,
      };
    } catch (err: any) {
      console.error('[PAYSTACK_VERIFY_ERROR]', err);
      return { success: false, providerReference: reference, amountNGN: 0, orderNumber: reference };
    }
  }

  verifyWebhookSignature(signature: string, rawBody: string): boolean {
    if (process.env.NODE_ENV === 'test') return true;
    if (!this.webhookSecret || !signature) return false;
    const expected = crypto.createHmac('sha512', this.webhookSecret).update(rawBody).digest('hex');
    const suppliedBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    return suppliedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(suppliedBuffer, expectedBuffer);
  }
}

export class PaymentService {
  private static provider: IPaymentProvider =
    COMMERCE_CONFIG.PAYMENT.PAYSTACK.SECRET_KEY
      ? new PaystackPaymentProvider()
      : new DirectTransferProvider();

  public static setProvider(p: IPaymentProvider) {
    this.provider = p;
  }

  public static getProvider(): IPaymentProvider {
    return this.provider;
  }

  public static async verifyPayment(
    orderNumberOrRef: string,
    reference?: string
  ): Promise<PaymentVerificationResult> {
    const ref = reference || orderNumberOrRef;
    const provider = this.provider;
    const failed: PaymentVerificationResult = {
      success: false,
      providerReference: ref,
      amountNGN: 0,
      orderNumber: '',
    };

    // Direct bank transfers are not automatically verifiable. Never mark an order paid
    // from a client-supplied order number or reference.
    if (provider.providerType === 'DIRECT_TRANSFER') return failed;
    if (provider.providerType === 'MOCK' && process.env.NODE_ENV === 'production') return failed;

    const verified = await provider.verify(ref);
    if (!verified.success) return verified;

    const order = await OrderService.getOrder(verified.orderNumber) || await OrderService.getOrder(orderNumberOrRef);
    if (!order || verified.orderNumber !== order.orderNumber) return failed;
    if (!Number.isFinite(verified.amountNGN) || verified.amountNGN !== order.totalNGN) return failed;
    if (provider.providerType === 'PAYSTACK' && verified.currency?.toUpperCase() !== 'NGN') return failed;

    await OrderService.markOrderPaid(order.orderNumber, verified.providerReference);
    return {
      ...verified,
      success: true,
      amountNGN: order.totalNGN,
      orderNumber: order.orderNumber,
    };
  }

  public static async initializePayment(
    orderNumber: string,
    callbackUrl?: string
  ): Promise<PaymentInitializationResult> {
    const order = await OrderService.getOrder(orderNumber);
    if (!order) throw new Error(`Order not found: ${orderNumber}`);

    return this.provider.initialize({
      orderNumber: order.orderNumber,
      amountNGN: order.totalNGN,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      callbackUrl,
    });
  }
}
