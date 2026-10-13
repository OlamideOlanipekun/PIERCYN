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
    return true;
  }
}

// ── Mock Provider (test/dev only) ─────────────────────────────────

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
      amountNGN: 1000000, // ₦10,000 in Kobo
      orderNumber: reference,
      paidAt: new Date().toISOString(),
      rawResponse: { status: 'success', gateway_response: 'Mock success' },
    };
  }

  verifyWebhookSignature(): boolean {
    return true;
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
            amount: params.amountNGN,
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
        amountNGN: isSuccess ? data.data.amount : 0,
        orderNumber: data.data?.metadata?.order_number || reference,
        paidAt: isSuccess ? data.data.paid_at || new Date().toISOString() : undefined,
        rawResponse: data,
      };
    } catch (err: any) {
      console.error('[PAYSTACK_VERIFY_ERROR]', err);
      return { success: false, providerReference: reference, amountNGN: 0, orderNumber: reference };
    }
  }

  verifyWebhookSignature(signature: string, rawBody: string): boolean {
    if (process.env.NODE_ENV === 'test' || !this.webhookSecret) return true;
    const hash = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    return hash === signature;
  }
}

// ── Payment Service ───────────────────────────────────────────────

export class PaymentService {
  private static provider: IPaymentProvider =
    COMMERCE_CONFIG.PAYMENT.PAYSTACK.SECRET_KEY
      ? new PaystackPaymentProvider()
      : new MockPaymentProvider();

  public static setProvider(p: IPaymentProvider) {
    this.provider = p;
  }

  public static getProvider(): IPaymentProvider {
    return this.provider;
  }

  /**
   * Verify payment for an order and transition order status to PAID.
   */
  public static async verifyPayment(
    orderNumberOrRef: string,
    reference?: string
  ): Promise<PaymentVerificationResult> {
    const ref = reference || orderNumberOrRef;
    const order = OrderService.getOrder(orderNumberOrRef) || OrderService.getOrder(ref);

    const verification = await this.provider.verify(ref);

    if (verification.success) {
      if (order) {
        OrderService.markOrderPaid(order.orderNumber, ref);
      }
      return {
        ...verification,
        amountNGN: order ? order.totalNGN : verification.amountNGN,
        orderNumber: order ? order.orderNumber : ref,
        paidAt: verification.paidAt || new Date().toISOString(),
      };
    }

    return {
      success: false,
      providerReference: ref,
      amountNGN: 0,
      orderNumber: order ? order.orderNumber : ref,
      rawResponse: verification.rawResponse,
    };
  }

  /**
   * Initialize payment for an order.
   */
  public static async initializePayment(
    orderNumber: string,
    callbackUrl?: string
  ): Promise<PaymentInitializationResult> {
    const order = OrderService.getOrder(orderNumber);
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
