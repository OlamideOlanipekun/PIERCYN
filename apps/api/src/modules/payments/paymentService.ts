import crypto from 'crypto';
import { COMMERCE_CONFIG } from '../../config/constants';
import { OrderService } from '../orders/orderService';
import { InventoryService } from '../inventory/inventoryService';
import { prisma } from '../../db/prisma';
import {
  createReceiptSignedUrl,
  decodeReceiptBase64,
  removeReceipt,
  uploadReceipt,
  validateReceiptBuffer,
} from './receiptStorage';
import { buildBankTransferInstructions } from './bankTransfer';

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
  orderNumber?: string;
  amountNGN?: number;
  bankTransfer?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    narration: string;
    reviewWindowHours: number;
  };
  reservationExpiresAt?: string | null;
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
    const instructions = buildBankTransferInstructions(params.orderNumber, params.amountNGN);
    const { amountNGN, ...bankTransfer } = instructions;
    return {
      success: true,
      provider: 'DIRECT_TRANSFER',
      providerReference: `TRF-${params.orderNumber}`,
      orderNumber: params.orderNumber,
      amountNGN,
      bankTransfer,
      message: `Transfer exactly NGN ${amountNGN.toLocaleString('en-NG')} to ${bankTransfer.bankName} - ${bankTransfer.accountName} (${bankTransfer.accountNumber}) using ${params.orderNumber} as narration, then upload your receipt.`,
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
            // Never trust a client-supplied callback URL.
            callback_url: `${COMMERCE_CONFIG.APP_URL}/order-confirmation?ref=${encodeURIComponent(params.orderNumber)}`,
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
    if (!verified.success) return failed;

    const order = await OrderService.getOrder(verified.orderNumber) || await OrderService.getOrder(orderNumberOrRef);
    if (!order || verified.orderNumber !== order.orderNumber) return failed;
    if (['CANCELLED', 'FAILED', 'REFUNDED'].includes(order.status)) return failed;
    if (order.quoteStatus !== 'ACCEPTED') return failed;
    if (!Number.isFinite(verified.amountNGN) || verified.amountNGN !== order.totalNGN) return failed;
    if (provider.providerType === 'PAYSTACK' && verified.currency?.toUpperCase() !== 'NGN') return failed;

    await OrderService.markOrderPaid(order.orderNumber, verified.providerReference);
    return {
      success: true,
      providerReference: verified.providerReference,
      amountNGN: order.totalNGN,
      orderNumber: order.orderNumber,
      currency: verified.currency,
      paidAt: verified.paidAt,
    };
  }

  public static async initializePayment(
    orderNumber: string,
    _callbackUrl?: string
  ): Promise<PaymentInitializationResult> {
    const order = await OrderService.getOrder(orderNumber);
    if (!order) throw new Error(`Order not found: ${orderNumber}`);

    if (order.paymentStatus === 'PAID') {
      throw new Error('This order has already been paid.');
    }
    if (['CANCELLED', 'FAILED', 'REFUNDED'].includes(order.status)) {
      throw new Error('This order can no longer be paid.');
    }
    if (order.quoteStatus !== 'ACCEPTED') {
      throw new Error('Payment cannot be initiated until the delivery quotation has been accepted by the customer.');
    }

    if (this.provider.providerType === 'DIRECT_TRANSFER') {
      const providerReference = `TRF-${order.orderNumber}`;
      const now = new Date();
      const reviewDeadline = new Date(
        now.getTime() + COMMERCE_CONFIG.PAYMENT.BANK_TRANSFER.REVIEW_WINDOW_HOURS * 60 * 60 * 1000
      );

      await prisma.payment.upsert({
        where: { providerReference },
        update: {
          amountNGN: order.totalNGN,
          currency: 'NGN',
        },
        create: {
          orderId: order.id,
          provider: 'DIRECT_TRANSFER',
          providerReference,
          amountNGN: order.totalNGN,
          currency: 'NGN',
          status: 'PENDING',
          reviewDeadlineAt: reviewDeadline,
        },
      });
    }

    const result = await this.provider.initialize({
      orderNumber: order.orderNumber,
      amountNGN: order.totalNGN,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
    });

    return {
      ...result,
      orderNumber: order.orderNumber,
      amountNGN: order.totalNGN,
      reservationExpiresAt: (await InventoryService.getActiveReservationExpiry(order.orderNumber))?.toISOString() ?? null,
    };
  }

  public static async submitPaymentReceipt(
    orderNumber: string,
    fileBase64: string,
    mimeType: string
  ): Promise<{
    status: string;
    paymentStatus: string;
    reviewDeadlineAt: string;
    reservationExpiresAt: string | null;
  }> {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        quoteStatus: true,
        totalNGN: true,
        paymentMethod: true,
      },
    });
    if (!order) throw new Error(`Order not found: ${orderNumber}`);

    if (order.paymentStatus === 'PAID' || order.status === 'PAID') {
      throw new Error('This order has already been paid.');
    }
    if (['CANCELLED', 'FAILED', 'REFUNDED'].includes(order.status)) {
      throw new Error('This order can no longer accept a payment receipt.');
    }
    if (order.quoteStatus !== 'ACCEPTED') {
      throw new Error('Payment receipts cannot be submitted until the delivery quotation has been accepted by the customer.');
    }
    if (order.paymentMethod === 'PAYSTACK') {
      throw new Error('Paystack orders are confirmed automatically and do not require a receipt.');
    }

    const buffer = decodeReceiptBase64(fileBase64);
    const validation = validateReceiptBuffer(buffer, mimeType);
    if (!validation.valid) throw new Error(validation.error);

    const providerReference = `TRF-${order.orderNumber}`;
    const existing = await prisma.payment.findUnique({ where: { providerReference } });
    if (existing?.status === 'SUCCESS') {
      throw new Error('This payment has already been approved.');
    }

    const receiptPath = await uploadReceipt(order.id, buffer, mimeType);
    const now = new Date();
    const reviewDeadlineAt = new Date(
      now.getTime() + COMMERCE_CONFIG.PAYMENT.BANK_TRANSFER.REVIEW_WINDOW_HOURS * 60 * 60 * 1000
    );

    let replacedPath: string | null = null;
    try {
      await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "Order" WHERE "id" = ${order.id} FOR UPDATE
        `;
        if (!locked || locked.length === 0) throw new Error('Order not found.');

        // Re-check after taking the lock: the reservation cron or an admin may
        // have cancelled the order while the receipt was being uploaded.
        const currentOrder = await tx.order.findUnique({
          where: { id: order.id },
          select: { status: true, paymentStatus: true },
        });
        if (!currentOrder) throw new Error('Order not found.');
        if (currentOrder.paymentStatus === 'PAID' || currentOrder.status === 'PAID') {
          throw new Error('This order has already been paid.');
        }
        if (['CANCELLED', 'FAILED', 'REFUNDED'].includes(currentOrder.status)) {
          throw new Error('This order can no longer accept a payment receipt.');
        }

        const current = await tx.payment.findUnique({ where: { providerReference } });
        if (current?.status === 'SUCCESS') {
          throw new Error('This payment has already been approved.');
        }
        replacedPath = current?.receiptPath || null;

        await tx.payment.upsert({
          where: { providerReference },
          update: {
            status: 'SUBMITTED',
            receiptPath,
            receiptMimeType: mimeType,
            receiptUploadedAt: now,
            submittedAt: now,
            reviewDeadlineAt,
            rejectionReason: null,
          },
          create: {
            orderId: order.id,
            provider: 'DIRECT_TRANSFER',
            providerReference,
            amountNGN: order.totalNGN,
            currency: 'NGN',
            status: 'SUBMITTED',
            receiptPath,
            receiptMimeType: mimeType,
            receiptUploadedAt: now,
            submittedAt: now,
            reviewDeadlineAt,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'AWAITING_PAYMENT_VERIFICATION',
            paymentStatus: 'AWAITING_VERIFICATION',
            paymentSubmittedAt: now,
            paymentReviewDeadlineAt: reviewDeadlineAt,
            needsManualReview: false,
            manualReviewReason: null,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: currentOrder.status,
            toStatus: 'AWAITING_PAYMENT_VERIFICATION',
            changedBy: 'CUSTOMER',
            note: 'Payment receipt uploaded. Awaiting admin verification.',
          },
        });

        await InventoryService.extendReservations(order.orderNumber, reviewDeadlineAt, tx);
      });
    } catch (err) {
      await removeReceipt(receiptPath);
      throw err;
    }

    if (replacedPath && replacedPath !== receiptPath) {
      await removeReceipt(replacedPath);
    }

    return {
      status: 'AWAITING_PAYMENT_VERIFICATION',
      paymentStatus: 'AWAITING_VERIFICATION',
      reviewDeadlineAt: reviewDeadlineAt.toISOString(),
      reservationExpiresAt: (
        await InventoryService.getActiveReservationExpiry(order.orderNumber)
      )?.toISOString() ?? null,
    };
  }

  public static async approvePayment(
    orderNumber: string,
    adminId: string,
    adminEmail: string,
    note?: string
  ): Promise<{ orderNumber: string; paymentReference: string }> {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!order) throw new Error(`Order not found: ${orderNumber}`);
    if (order.paymentStatus === 'PAID') {
      throw new Error('This order is already marked paid.');
    }
    if (order.quoteStatus !== 'ACCEPTED') {
      throw new Error('Payment cannot be approved until the delivery quotation has been confirmed and accepted.');
    }
    if (order.status !== 'AWAITING_PAYMENT_VERIFICATION') {
      throw new Error('Only orders awaiting payment verification can be approved.');
    }

    const payment = order.payments[0];
    if (!payment || !payment.receiptPath) {
      throw new Error('No payment receipt has been submitted for this order.');
    }
    if (payment.status === 'REJECTED') {
      throw new Error('This payment receipt was rejected. Ask the customer to resubmit.');
    }

    await OrderService.markOrderPaid(order.orderNumber, payment.providerReference);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        verifiedBy: adminId,
        verifiedAt: new Date(),
        verificationNote: note || `Verified by ${adminEmail}`,
        rejectionReason: null,
      },
    });

    return { orderNumber: order.orderNumber, paymentReference: payment.providerReference };
  }

  public static async rejectPayment(
    orderNumber: string,
    adminId: string,
    adminEmail: string,
    reason: string
  ): Promise<{ orderNumber: string; orderStatus: string; paymentStatus: string }> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A rejection reason of at least 5 characters is required.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Order" WHERE "orderNumber" = ${orderNumber} FOR UPDATE
      `;
      if (!locked || locked.length === 0) throw new Error(`Order not found: ${orderNumber}`);

      const order = await tx.order.findUnique({
        where: { orderNumber },
        include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
      if (!order) throw new Error(`Order not found: ${orderNumber}`);
      if (order.paymentStatus === 'PAID') {
        throw new Error('A paid order cannot have its receipt rejected.');
      }
      if (order.status !== 'AWAITING_PAYMENT_VERIFICATION') {
        throw new Error('Only orders awaiting payment verification can be rejected.');
      }

      const payment = order.payments[0];
      if (!payment?.receiptPath) throw new Error('No payment receipt has been submitted.');

      const now = new Date();
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REJECTED',
          verifiedBy: adminId,
          verifiedAt: now,
          verificationNote: `Rejected by ${adminEmail}`,
          rejectionReason: reason.trim(),
        },
      });

      const reservation = await tx.inventoryReservation.findFirst({
        where: { reference: order.orderNumber, status: 'ACTIVE' },
        select: { expiresAt: true },
      });
      const canResubmit =
        !!reservation && reservation.expiresAt.getTime() > now.getTime() - 30 * 60 * 1000;

      if (!canResubmit) {
        await InventoryService.releaseReservation(order.orderNumber, tx);
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
            paymentReviewDeadlineAt: null,
            needsManualReview: false,
            manualReviewReason: null,
          },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: 'CANCELLED',
            changedBy: adminId,
            note: `Receipt rejected: ${reason.trim()}. Reservation had expired, so stock was released.`,
          },
        });
        return { orderStatus: 'CANCELLED', paymentStatus: 'FAILED' };
      }

      const newExpiry = new Date(now.getTime() + COMMERCE_CONFIG.INVENTORY.RESERVATION_TTL_MINUTES * 60 * 1000);
      await InventoryService.extendReservations(order.orderNumber, newExpiry, tx);

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PENDING_PAYMENT',
          paymentStatus: 'REJECTED',
          paymentReviewDeadlineAt: null,
          needsManualReview: false,
          manualReviewReason: null,
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'PENDING_PAYMENT',
          changedBy: adminId,
          note: `Receipt rejected: ${reason.trim()}. Customer may resubmit before ${newExpiry.toISOString()}.`,
        },
      });

      return { orderStatus: 'PENDING_PAYMENT', paymentStatus: 'REJECTED' };
    });

    return { orderNumber, ...result };
  }

  public static async getReceiptForAdmin(orderNumber: string): Promise<{
    receiptUrl: string;
    mimeType: string | null;
    uploadedAt: string | null;
    paymentStatus: string;
    rejectionReason: string | null;
    verificationNote: string | null;
  }> {
    const payment = await prisma.payment.findFirst({
      where: { order: { orderNumber }, receiptPath: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment?.receiptPath) throw new Error('No receipt has been submitted for this order.');

    return {
      receiptUrl: await createReceiptSignedUrl(payment.receiptPath),
      mimeType: payment.receiptMimeType,
      uploadedAt: payment.receiptUploadedAt?.toISOString() ?? null,
      paymentStatus: payment.status,
      rejectionReason: payment.rejectionReason,
      verificationNote: payment.verificationNote,
    };
  }
}
