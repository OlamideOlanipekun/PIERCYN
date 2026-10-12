import crypto from 'crypto';
import { COMMERCE_CONFIG } from '../../config/constants';
import { OrderService } from '../orders/orderService';

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

export class DirectTransferProvider implements IPaymentProvider {
  name = 'Direct Bank Transfer';
  providerType = 'DIRECT_TRANSFER' as const;

  async initialize(params: PaymentInitializationParams): Promise<PaymentInitializationResult> {
    const ref = `PCY-TRF-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;
    return {
      success: true,
      provider: 'DIRECT_TRANSFER',
      providerReference: ref,
      message: 'Bank transfer instructions sent. Awaiting manual confirmation.',
    };
  }

  async verify(reference: string): Promise<PaymentVerificationResult> {
    return { success: false, providerReference: reference, amountNGN: 0, orderNumber: '' };
  }

  verifyWebhookSignature(): boolean {
    return false;
  }
}

export class MockPaymentProvider implements IPaymentProvider {
  name = 'Mock Payment (Dev Only)';
  providerType = 'MOCK' as const;

  async initialize(params: PaymentInitializationParams): Promise<PaymentInitializationResult> {
    // Use the order number as the reference so the dev-only mock flow can resolve the order.
    return {
      success: true,
      provider: 'MOCK',
      providerReference: params.orderNumber,
      authorizationUrl: `/checkout/mock-pay?ref=${encodeURIComponent(params.orderNumber)}`,
      message: 'Mock payment initialized (development only)',
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
      rawResponse: { status: 'success', gateway_response: 'Mock success (development only)' },
    };
  }

  verifyWebhookSignature(): boolean {
    return false;
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
      return {
        success: false,
        provider: 'PAYSTACK',
        providerReference: params.orderNumber,
        message: 'Paystack is selected but PAYSTACK_SECRET_KEY is not configured.',
      };
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
      if (!response.ok || !data.status || !data.data?.reference || !data.data?.authorization_url) {
        throw new Error(data.message || 'Paystack initialization failed');
      }

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
        { headers: { Authorization: `Bearer ${this.secretKey}` } }
      );

      const data = await response.json();
      const transaction = data?.data;
      const isSuccess = response.ok && data?.status === true && transaction?.status === 'success';
      const amountKobo = Number(transaction?.amount);

      return {
        success: Boolean(isSuccess && Number.isSafeInteger(amountKobo) && amountKobo >= 0),
        providerReference: transaction?.reference || reference,
        amountNGN: Number.isFinite(amountKobo) ? amountKobo / 100 : 0,
        amountKobo: Number.isSafeInteger(amountKobo) ? amountKobo : 0,
        currency: typeof transaction?.currency === 'string' ? transaction.currency : undefined,
        orderNumber: transaction?.metadata?.order_number || reference,
        paidAt: isSuccess ? transaction?.paid_at || new Date().toISOString() : undefined,
        rawResponse: data,
      };
    } catch (err: any) {
      console.error('[PAYSTACK_VERIFY_ERROR]', err);
      return { success: false, providerReference: reference, amountNGN: 0, amountKobo: 0, orderNumber: reference };
    }
  }

  verifyWebhookSignature(signature: string, rawBody: string): boolean {
    if (!this.webhookSecret || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;

    const expected = crypto.createHmac('sha512', this.webhookSecret).update(rawBody).digest();
    const received = Buffer.from(signature, 'hex');
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  }
}

function createConfiguredProvider(): IPaymentProvider {
  const selected = COMMERCE_CONFIG.PAYMENT.DEFAULT_PROVIDER.toLowerCase();

  if (selected === 'paystack') return new PaystackPaymentProvider();
  if (selected === 'mock' && process.env.NODE_ENV !== 'production') return new MockPaymentProvider();
  if (selected === 'mock' && process.env.NODE_ENV === 'production') {
    console.error('[PAYMENT_CONFIG_ERROR] Mock payments cannot be enabled in production; using direct transfer.');
  }
  if (selected !== 'direct_transfer' && selected !== 'mock') {
    console.error(`[PAYMENT_CONFIG_ERROR] Unsupported PAYMENT_PROVIDER "${selected}"; using direct transfer.`);
  }

  return new DirectTransferProvider();
}

export class PaymentService {
  private static provider: IPaymentProvider = createConfiguredProvider();

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
    const order = await OrderService.getOrder(orderNumberOrRef) || await OrderService.getOrder(ref);

    if (!order) {
      return {
        success: false,
        providerReference: ref,
        amountNGN: 0,
        orderNumber: orderNumberOrRef,
      };
    }

    const provider = this.provider;
    if (provider.providerType === 'DIRECT_TRANSFER') {
      // Bank transfers cannot be confirmed from a customer-supplied reference.
      return {
        success: false,
        providerReference: ref,
        amountNGN: 0,
        orderNumber: order.orderNumber,
      };
    }

    if (provider.providerType === 'MOCK') {
      if (process.env.NODE_ENV === 'production' || ref !== order.orderNumber) {
        return { success: false, providerReference: ref, amountNGN: 0, orderNumber: order.orderNumber };
      }

      // The mock provider is explicitly development-only. Never use this branch in production.
      await OrderService.markOrderPaid(order.orderNumber, ref);
      return {
        success: true,
        providerReference: ref,
        amountNGN: order.totalNGN,
        amountKobo: Math.round(order.totalNGN * 100),
        currency: 'NGN',
        orderNumber: order.orderNumber,
        paidAt: new Date().toISOString(),
      };
    }

    const verification = await provider.verify(ref);
    const verifiedAmountKobo = verification.amountKobo ?? Math.round(verification.amountNGN * 100);
    const expectedAmountKobo = Math.round(order.totalNGN * 100);
    const isValid =
      verification.success &&
      verification.providerReference === ref &&
      verification.orderNumber === order.orderNumber &&
      verification.currency === 'NGN' &&
      Number.isSafeInteger(verifiedAmountKobo) &&
      verifiedAmountKobo === expectedAmountKobo;

    if (!isValid) {
      return {
        ...verification,
        success: false,
        orderNumber: order.orderNumber,
      };
    }

    await OrderService.markOrderPaid(order.orderNumber, ref);
    return {
      ...verification,
      success: true,
      amountNGN: verifiedAmountKobo / 100,
      amountKobo: verifiedAmountKobo,
      currency: 'NGN',
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
