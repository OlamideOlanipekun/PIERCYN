/**
 * PIERCYN Checkout Router — Authenticated checkout and order lifecycle endpoints.
 *
 * All customer-facing checkout endpoints require Supabase Google OAuth.
 * Guest checkout is DISABLED.
 *
 * Payment flow:
 *   POST /checkout                           → Create order (auth required)
 *   GET  /customers/me/orders                → List orders for authenticated customer
 *   GET  /orders/:id                         → Get order detail (owned by auth customer)
 *   GET  /orders/:id/events                  → Order event timeline
 *   POST /orders/:id/product-payment/receipt → Upload product payment receipt
 *   POST /orders/:id/delivery/quote/accept   → Accept delivery quotation
 *   POST /orders/:id/delivery/quote/reject   → Reject delivery quotation
 *   POST /orders/:id/delivery-payment/receipt→ Upload delivery payment receipt
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth } from '../../middleware/authenticate';
import { AuthService } from '../auth/auth.service';
import { CheckoutService } from './checkoutService';
import { PaymentService } from '../payments/paymentService';
import { decodeReceiptBase64, validateReceiptBuffer, uploadReceipt } from '../payments/receiptStorage';
import { prisma } from '../../db/prisma';
import { verifyOrderAccessToken } from '../../security/orderAccessToken';
import {
  NotificationQueueService,
  triggerNotificationProcessingAsync,
} from '../notifications';
import { recordEvent, PIERCYN_EVENTS } from '../notifications/events';
import { WhatsAppService } from '../../services/whatsappService';

export const checkoutRouter = Router();

const APP_URL = (process.env.APP_URL || 'https://piercyn.vercel.app').replace(/\/+$/, '');

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNGN(n: number) {
  return `₦${Number(n || 0).toLocaleString('en-NG')}`;
}

async function resolveCustomerFromReq(req: Request) {
  if (!req.user) return null;
  return AuthService.resolveCustomerId(req.user.supabaseId);
}

/**
 * Verify access to an order via either:
 * 1. Valid cryptographic order access token (x-order-access-token)
 * 2. Authenticated customer ownership (matching customerId or email)
 * Returns the loaded order with relations or null if unauthorized.
 */
async function getOrderForCustomerOrToken(req: Request, orderId: string) {
  const token = req.headers['x-order-access-token'];
  if (typeof token === 'string') {
    const verified = verifyOrderAccessToken(token);
    if (verified && verified.orderId === orderId) {
      return prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payments: { orderBy: { createdAt: 'asc' } },
          deliveryQuotes: { orderBy: { version: 'desc' } },
          refundReviews: { orderBy: { createdAt: 'desc' } },
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });
    }
  }

  if (req.user) {
    const customerId = await resolveCustomerFromReq(req);
    return prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          ...(customerId ? [{ customerId }] : []),
          { customerEmail: { equals: req.user.email, mode: 'insensitive' as const } },
        ],
      },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'asc' } },
        deliveryQuotes: { orderBy: { version: 'desc' } },
        refundReviews: { orderBy: { createdAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  return null;
}

// ── POST /checkout ─────────────────────────────────────────────────────────────

const CheckoutBodySchema = z.object({
  customer: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    state: z.string().min(1),
    city: z.string().min(1),
    address: z.string().min(5),
    orderNote: z.string().optional(),
  }),
  shippingRegion: z.enum(['lagos', 'nationwide']),
  paymentMethod: z.enum(['paystack', 'transfer', 'mock']).default('transfer'),
  items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().positive() })).min(1),
  discountCode: z.string().optional(),
  affiliateCode: z.string().optional(),
  sessionId: z.string().optional(),
});

checkoutRouter.post('/checkout', requireAuth, async (req: Request, res: Response) => {
  try {
    const customerId = await resolveCustomerFromReq(req);
    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Authentication required to place an order.' });
    }

    // Force payment method to transfer (bank transfer is the only checkout method)
    const validated = CheckoutBodySchema.parse({ ...req.body, paymentMethod: 'transfer' });
    // Override email with authenticated identity
    validated.customer.email = req.user!.email;

    const sessionId = validated.sessionId || req.headers['x-session-id'] as string || `auth-${customerId}`;

    const order = await CheckoutService.createOrder({
      ...validated,
      sessionId,
    });

    // Create the product payment obligation record
    const productPaymentRef = `pp-${order.id}-v1`;
    await prisma.payment.upsert({
      where: { providerReference: productPaymentRef },
      update: {},
      create: {
        orderId: order.id,
        paymentType: 'PRODUCT',
        amountDueNGN: order.subtotalNGN,
        amountNGN: order.subtotalNGN,
        currency: 'NGN',
        provider: 'DIRECT_TRANSFER',
        providerReference: productPaymentRef,
        status: 'PENDING',
      },
    });

    // Create initial delivery quote placeholder
    await prisma.deliveryQuote.upsert({
      where: {
        // We don't have a unique constraint on orderId+version so use findFirst + create
        id: `dq-placeholder-${order.id}`,
      },
      update: {},
      create: {
        id: `dq-placeholder-${order.id}`,
        orderId: order.id,
        version: 1,
        amountNGN: 0,
        status: 'PENDING',
      },
    });

    triggerNotificationProcessingAsync();

    return res.status(201).json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        subtotalNGN: order.subtotalNGN,
        totalNGN: order.totalNGN,
        status: order.status,
        paymentInstructions: {
          bankName: process.env.BANK_NAME || 'Kuda',
          accountName: process.env.BANK_ACCOUNT_NAME || 'PIERCYN',
          accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
          reference: order.orderNumber,
          amountDueNGN: order.subtotalNGN,
        },
      },
    });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    return res.status(400).json({ success: false, error: msg });
  }
});

// ── GET /customers/me/orders ───────────────────────────────────────────────────

checkoutRouter.get('/customers/me/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const customerId = await resolveCustomerFromReq(req);
    if (!customerId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const orders = await prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { select: { productName: true, size: true, quantity: true, unitPriceNGN: true, image: true } },
        payments: { select: { paymentType: true, status: true, amountDueNGN: true, amountNGN: true } },
        deliveryQuotes: { orderBy: { version: 'desc' }, take: 1 },
      },
    });

    return res.json({ success: true, data: orders });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /orders/:id ───────────────────────────────────────────────────────────

checkoutRouter.get('/orders/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const order = await getOrderForCustomerOrToken(req, req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    return res.json({ success: true, data: order });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /orders/:id/events ─────────────────────────────────────────────────────

checkoutRouter.get('/orders/:id/events', optionalAuth, async (req: Request, res: Response) => {
  try {
    const order = await getOrderForCustomerOrToken(req, req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const events = await prisma.orderStatusHistory.findMany({
      where: { orderId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ success: true, data: events });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /orders/:id/product-payment/receipt ───────────────────────────────────

const ReceiptSchema = z.object({
  fileBase64: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'application/pdf']),
});

checkoutRouter.post('/orders/:id/product-payment/receipt', optionalAuth, async (req: Request, res: Response) => {
  try {
    const order = await getOrderForCustomerOrToken(req, req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const productPayment = order.payments.find(p => p.paymentType === 'PRODUCT');
    if (!productPayment) {
      return res.status(400).json({ success: false, error: 'No product payment obligation found for this order.' });
    }
    if (productPayment.status === 'VERIFIED') {
      return res.status(409).json({ success: false, error: 'Product payment already verified.' });
    }

    const validated = ReceiptSchema.parse(req.body);
    const buffer = decodeReceiptBase64(validated.fileBase64);
    const validation = validateReceiptBuffer(buffer, validated.mimeType);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const receiptPath = await uploadReceipt(order.id, buffer, validated.mimeType);

    await prisma.$transaction(async (tx) => {
      // Update the typed Payment record
      await tx.payment.update({
        where: { id: productPayment.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          receiptPath,
          receiptMimeType: validated.mimeType,
          receiptUploadedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'AWAITING_VERIFICATION',
          status: 'AWAITING_PAYMENT_VERIFICATION',
        },
      });

      // Immutable timeline event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          type: 'RECEIPT_UPLOADED',
          title: 'Product Payment Receipt Uploaded',
          description: `Customer uploaded transfer receipt for ₦${(productPayment.amountDueNGN / 100).toLocaleString()}`,
          actorType: 'CUSTOMER',
          metadata: { receiptPath },
        },
      });

      // Outbox event
      await recordEvent(tx, {
        eventKey: `order:${order.id}:product-receipt:uploaded:v1`,
        eventType: PIERCYN_EVENTS.RECEIPT_UPLOADED,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
          customerEmail: order.customerEmail,
          totalNGN: productPayment.amountDueNGN,
          paymentType: 'PRODUCT',
        },
      });
    });

    // The event is durable in the transactional outbox above; kick the worker
    // immediately so admins do not have to open the receipt or wait for cron.
    triggerNotificationProcessingAsync();

    // Notify admin
    const customerName = `${order.customerFirstName} ${order.customerLastName}`;
    const waMsg =
      `🧾 *PRODUCT RECEIPT SUBMITTED*\n\n` +
      `Order: *${order.orderNumber}*\n` +
      `Customer: ${customerName} (${order.customerPhone})\n` +
      `Amount Due: *${formatNGN(productPayment.amountDueNGN)}*\n\n` +
      `Please log into the admin panel to verify the receipt.`;
    await WhatsAppService.sendToMerchant(waMsg);

    // WhatsApp to customer
    await WhatsAppService.sendMessage({
      to: order.customerPhone,
      body:
        `✅ *PIERCYN* — Receipt Received!\n\n` +
        `Your product payment receipt for order *${order.orderNumber}* has been submitted.\n\n` +
        `Our team will verify your payment within 24 hours and notify you once confirmed.\n\n` +
        `Thank you for shopping with PIERCYN.`,
    });

    return res.status(202).json({ success: true, data: { status: 'SUBMITTED', receiptPath } });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    return res.status(400).json({ success: false, error: msg });
  }
});

// ── POST /orders/:id/delivery/quote/accept ─────────────────────────────────────

checkoutRouter.post('/orders/:id/delivery/quote/accept', optionalAuth, async (req: Request, res: Response) => {
  try {
    const order = await getOrderForCustomerOrToken(req, req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const activeQuote = order.deliveryQuotes.find(q => q.status === 'SENT');
    if (!activeQuote) {
      return res.status(400).json({ success: false, error: 'No pending delivery quotation found for this order.' });
    }
    if (activeQuote.expiresAt && new Date() > activeQuote.expiresAt) {
      return res.status(410).json({ success: false, error: 'This quotation has expired. Please await a revised quotation from PIERCYN.' });
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      // Mark quote accepted
      await tx.deliveryQuote.update({
        where: { id: activeQuote.id },
        data: { status: 'ACCEPTED', acceptedAt: now },
      });

      // Lock delivery fee on the order and update total
      const newTotal = order.subtotalNGN + activeQuote.amountNGN;
      await tx.order.update({
        where: { id: order.id },
        data: {
          deliveryFeeNGN: activeQuote.amountNGN,
          totalNGN: newTotal,
          quoteStatus: 'ACCEPTED',
          quoteAcceptedAt: now,
          quoteAcceptedFeeNGN: activeQuote.amountNGN,
          quoteAcceptedTotalNGN: newTotal,
        },
      });

      // Create delivery payment obligation
      const deliveryRef = `dp-${order.id}-v${activeQuote.version}`;
      await tx.payment.upsert({
        where: { providerReference: deliveryRef },
        update: {},
        create: {
          orderId: order.id,
          paymentType: 'DELIVERY',
          amountDueNGN: activeQuote.amountNGN,
          amountNGN: activeQuote.amountNGN,
          currency: 'NGN',
          provider: 'DIRECT_TRANSFER',
          providerReference: deliveryRef,
          status: 'PENDING',
        },
      });

      // Record status event
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          changedBy: order.customerId || 'CUSTOMER',
          note: `Customer accepted delivery quotation of ${formatNGN(activeQuote.amountNGN)}`,
        },
      });

      // Immutable timeline event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          type: 'DELIVERY_QUOTE_ACCEPTED',
          title: 'Delivery Quote Accepted',
          description: `Customer accepted delivery quotation of ${formatNGN(activeQuote.amountNGN)}`,
          actorType: 'CUSTOMER',
          metadata: { amountNGN: activeQuote.amountNGN },
        },
      });

      // Outbox event
      await recordEvent(tx, {
        eventKey: `order:${order.id}:quote-accepted:v${activeQuote.version}`,
        eventType: PIERCYN_EVENTS.DELIVERY_QUOTE_ACCEPTED,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
          customerEmail: order.customerEmail,
          deliveryFeeNGN: activeQuote.amountNGN,
        },
      });
    });

    // Notify merchant
    const customerName = `${order.customerFirstName} ${order.customerLastName}`;
    await WhatsAppService.sendToMerchant(
      `✅ *QUOTATION ACCEPTED*\n\nOrder: *${order.orderNumber}*\nCustomer: ${customerName}\nDelivery Fee: *${formatNGN(activeQuote.amountNGN)}*\n\nCustomer will now pay the delivery fee.`
    );

    return res.json({
      success: true,
      data: {
        message: 'Quotation accepted. Please proceed to pay the delivery fee.',
        deliveryFeeNGN: activeQuote.amountNGN,
        paymentInstructions: {
          bankName: process.env.BANK_NAME || 'Kuda',
          accountName: process.env.BANK_ACCOUNT_NAME || 'PIERCYN',
          accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
          reference: order.orderNumber,
          amountDueNGN: activeQuote.amountNGN,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /orders/:id/delivery/quote/reject ─────────────────────────────────────

checkoutRouter.post('/orders/:id/delivery/quote/reject', optionalAuth, async (req: Request, res: Response) => {
  try {
    const order = await getOrderForCustomerOrToken(req, req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const activeQuote = order.deliveryQuotes.find(q => q.status === 'SENT');
    if (!activeQuote) {
      return res.status(400).json({ success: false, error: 'No active delivery quotation to reject.' });
    }

    const rejectionReason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.deliveryQuote.update({
        where: { id: activeQuote.id },
        data: { status: 'REJECTED', rejectedAt: now, rejectionReason: rejectionReason || null },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { quoteStatus: 'REJECTED', quoteRejectedAt: now, quoteRejectedReason: rejectionReason || null },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          changedBy: order.customerId || 'CUSTOMER',
          note: `Customer rejected delivery quotation. Reason: ${rejectionReason || 'Not provided'}`,
        },
      });
      await recordEvent(tx, {
        eventKey: `order:${order.id}:quote-declined:v${activeQuote.version}`,
        eventType: PIERCYN_EVENTS.DELIVERY_QUOTE_DECLINED,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
          customerEmail: order.customerEmail,
          deliveryFeeNGN: activeQuote.amountNGN,
          subtotalNGN: order.subtotalNGN,
          rejectionReason,
        },
      });
    });

    const customerName = `${order.customerFirstName} ${order.customerLastName}`;
    await WhatsAppService.sendToMerchant(
      `❌ *QUOTATION REJECTED*\n\nOrder: *${order.orderNumber}*\nCustomer: ${customerName}\nReason: ${rejectionReason || 'Not provided'}\n\nPlease review and prepare a revised quotation.`
    );

    return res.json({ success: true, data: { message: 'Quotation rejected. PIERCYN will review and provide a revised quotation.' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /orders/:id/delivery-payment/receipt ──────────────────────────────────

checkoutRouter.post('/orders/:id/delivery-payment/receipt', optionalAuth, async (req: Request, res: Response) => {
  try {
    const order = await getOrderForCustomerOrToken(req, req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const activeQuote = order.deliveryQuotes.find(q => q.status === 'ACCEPTED');
    if (!activeQuote) {
      return res.status(400).json({ success: false, error: 'Delivery quotation must be accepted before submitting delivery payment.' });
    }

    const deliveryPayment = order.payments.find(p => p.paymentType === 'DELIVERY');
    if (!deliveryPayment) {
      return res.status(400).json({ success: false, error: 'No delivery payment obligation found. Please accept the quotation first.' });
    }
    if (deliveryPayment.status === 'VERIFIED') {
      return res.status(409).json({ success: false, error: 'Delivery payment already verified.' });
    }

    const validated = ReceiptSchema.parse(req.body);
    const buffer = decodeReceiptBase64(validated.fileBase64);
    const validation = validateReceiptBuffer(buffer, validated.mimeType);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const receiptPath = await uploadReceipt(order.id, buffer, validated.mimeType);

    const uploadedAt = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: deliveryPayment.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: uploadedAt,
          receiptPath,
          receiptMimeType: validated.mimeType,
          receiptUploadedAt: uploadedAt,
        },
      });

      await recordEvent(tx, {
        eventKey: `order:${order.id}:delivery-receipt:uploaded:v1`,
        eventType: PIERCYN_EVENTS.RECEIPT_UPLOADED,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
          customerEmail: order.customerEmail,
          totalNGN: deliveryPayment.amountDueNGN,
          paymentType: 'DELIVERY',
        },
      });
    });

    // Start delivery immediately; the outbox remains retryable if Telegram is
    // temporarily unavailable or the serverless invocation ends early.
    triggerNotificationProcessingAsync();

    const customerName = `${order.customerFirstName} ${order.customerLastName}`;
    await WhatsAppService.sendToMerchant(
      `🚚 *DELIVERY RECEIPT SUBMITTED*\n\nOrder: *${order.orderNumber}*\nCustomer: ${customerName}\nDelivery Fee: *${formatNGN(deliveryPayment.amountDueNGN)}*\n\nPlease verify the delivery payment in the admin panel.`
    );

    await WhatsAppService.sendMessage({
      to: order.customerPhone,
      body:
        `✅ *PIERCYN* — Delivery Receipt Received!\n\n` +
        `Your delivery payment receipt for order *${order.orderNumber}* has been received.\n\n` +
        `Once verified, your order will be prepared for dispatch.\n\n` +
        `Thank you for choosing PIERCYN!`,
    });

    return res.status(202).json({ success: true, data: { status: 'SUBMITTED' } });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    return res.status(400).json({ success: false, error: msg });
  }
});
