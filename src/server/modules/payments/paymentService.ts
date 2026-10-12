import crypto from 'crypto';
import { COMMERCE_CONFIG } from '../../config/constants';
import { OrderService } from '../orders/orderService';
import { InventoryService } from '../inventory/inventoryService';
import { prisma } from '../../db/prisma';

// ── Payment provider interfaces ───────────────────────────────────

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
  amountKobo?: number;
  currency?: string;
  orderNumber: string;
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

// ── Direct Bank Transfer Provider ─────────────────────────────────

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
    return false;
  }
}

// ── Mock Provider (test/dev only) ─────────────────────────────────

export class MockPaymentProvider implements IPaymentProvider {
  name = 'Mock Payment (Dev Only)';
  providerType = 'MOCK' as const;

  async initialize(params: PaymentInitializationParams): Promise<PaymentInitializationResult> {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, provider: 'MOCK', providerReference: params.orderNumber, message: 'Mock payments are disabled in production.' };
    }
    const ref = params.orderNumber;
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
      amountNGN: 0,
      amountKobo: 0,
      currency: 'NGN',
      orderNumber: reference,
      paidAt: new Date().toISOString(),
      rawResponse: { status: 'success', gateway_response: 'Mock success' },
    };
  }

  verifyWebhookSignature(): boolean {
    return false;
  }
}

// ── Paystack Provider ─────────────────────────────────────────────

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
      return { success: false, provider: 'PAYSTACK', providerReference: params.orderNumber, message: 'Paystack is selected but PAYSTACK_SECRET_KEY is not configured.' };
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
            amount: Math.round(params.amountNGN * 100),
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
      const transaction = data?.data;
      const amountKobo = Number(transaction?.amount);
      const isSuccess = response.ok && data?.status === true && transaction?.status === 'success' && Number.isSafeInteger(amountKobo) && amountKobo > 0;

      return {
        success: isSuccess,
        providerReference: transaction?.reference || reference,
        amountNGN: Number.isSafeInteger(amountKobo) ? amountKobo / 100 : 0,
        amountKobo: Number.isSafeInteger(amountKobo) ? amountKobo : 0,
        currency: transaction?.currency,
        orderNumber: transaction?.metadata?.order_number || reference,
        paidAt: isSuccess ? data.data.paid_at || new Date().toISOString() : undefined,
        rawResponse: data,
      };
    } catch (err: any) {
      console.error('[PAYSTACK_VERIFY_ERROR]', err);
      return { success: false, providerReference: reference, amountNGN: 0, orderNumber: reference };
    }
  }

  verifyWebhookSignature(signature: string, rawBody: string): boolean {
    if (!this.webhookSecret || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
    const expected = crypto.createHmac('sha512', this.webhookSecret).update(rawBody).digest();
    const received = Buffer.from(signature, 'hex');
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  }
}

// ── Payment Service ───────────────────────────────────────────────

export class PaymentService {
  private static providerOverride: IPaymentProvider | null = null;

  public static setProvider(p: IPaymentProvider | null) {
    this.providerOverride = p;
  }

  public static getProvider(): IPaymentProvider {
    return this.providerOverride || new PaystackPaymentProvider();
  }

  private static providerForOrder(order: { paymentMethod?: string }): IPaymentProvider {
    if (this.providerOverride) return this.providerOverride;
    const method = String(order.paymentMethod || '').toUpperCase();
    if (method.includes('PAYSTACK')) return new PaystackPaymentProvider();
    if (method.includes('MOCK') || method.includes('TEST SIMULATION')) {
      return process.env.NODE_ENV === 'production' ? new DirectTransferProvider() : new MockPaymentProvider();
    }
    return new DirectTransferProvider();
  }

  public static async verifyPayment(orderNumberOrRef: string, reference?: string): Promise<PaymentVerificationResult> {
    const ref = reference || orderNumberOrRef;
    const order = OrderService.getOrder(orderNumberOrRef) || OrderService.getOrder(ref);
    if (!order) return { success: false, providerReference: ref, amountNGN: 0, orderNumber: orderNumberOrRef };

    if (order.paymentStatus === 'PAID' || order.orderStatus !== 'PENDING_PAYMENT') {
      return { success: false, providerReference: ref, amountNGN: 0, orderNumber: order.orderNumber };
    }

    const provider = this.providerForOrder(order);
    if (provider.providerType === 'DIRECT_TRANSFER') {
      return { success: false, providerReference: ref, amountNGN: 0, orderNumber: order.orderNumber };
    }

    if (provider.providerType === 'MOCK') {
      if (process.env.NODE_ENV === 'production' || ref !== order.orderNumber) {
        return { success: false, providerReference: ref, amountNGN: 0, orderNumber: order.orderNumber };
      }
      OrderService.markOrderPaid(order.orderNumber, ref);
      return { success: true, providerReference: ref, amountNGN: order.totalNGN, amountKobo: Math.round(order.totalNGN * 100), currency: 'NGN', orderNumber: order.orderNumber, paidAt: new Date().toISOString() };
    }

    const verified = await provider.verify(ref);
    const amountKobo = verified.amountKobo ?? Math.round(verified.amountNGN * 100);
    const expectedKobo = Math.round(order.totalNGN * 100);
    const valid = verified.success && verified.providerReference === ref && verified.orderNumber === order.orderNumber && verified.currency === 'NGN' && Number.isSafeInteger(amountKobo) && amountKobo === expectedKobo;
    if (!valid) return { ...verified, success: false, orderNumber: order.orderNumber };

    OrderService.markOrderPaid(order.orderNumber, ref);
    return { ...verified, success: true, amountNGN: amountKobo / 100, amountKobo, currency: 'NGN', orderNumber: order.orderNumber };
  }

  public static async initializePayment(orderNumber: string, callbackUrl?: string): Promise<PaymentInitializationResult> {
    const order = OrderService.getOrder(orderNumber);
    if (!order) throw new Error(`Order not found: ${orderNumber}`);
    if (order.paymentStatus === 'PAID' || order.orderStatus !== 'PENDING_PAYMENT') {
      throw new Error('Payment can only be initialized for an unpaid order awaiting payment.');
    }
    const provider = this.providerForOrder(order);
    let validatedCallbackUrl: string | undefined;
    if (callbackUrl) {
      const requested = new URL(callbackUrl);
      const appOrigin = new URL(COMMERCE_CONFIG.APP_URL).origin;
      if (requested.origin !== appOrigin || (process.env.NODE_ENV === 'production' && requested.protocol !== 'https:')) {
        throw new Error('Callback URL must use the configured PIERCYN application origin.');
      }
      validatedCallbackUrl = requested.toString();
    }
    return provider.initialize({
      orderNumber: order.orderNumber,
      amountNGN: order.totalNGN,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      callbackUrl: validatedCallbackUrl,
    });
  }
}
