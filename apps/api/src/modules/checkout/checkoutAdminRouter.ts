/**
 * PIERCYN Admin Checkout Management Router
 *
 * Admin-only endpoints for the complete checkout order lifecycle:
 * - Verify / reject product payment
 * - Generate and send delivery quotation
 * - Verify / reject delivery payment
 * - Authorize dispatch → mark dispatched → mark delivered
 * - Create / manage refund review cases
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../admin/adminMiddleware';
import { prisma } from '../../db/prisma';
import { InventoryService } from '../inventory/inventoryService';
import { WhatsAppService } from '../../services/whatsappService';
import {
  NotificationQueueService,
  triggerNotificationProcessingAsync,
} from '../notifications';
import { recordEvent, PIERCYN_EVENTS } from '../notifications/events';

export const checkoutAdminRouter = Router();

const APP_URL = (process.env.APP_URL || 'https://piercyn.vercel.app').replace(/\/+$/, '');
const QUOTE_EXPIRY_HOURS = 48;

function formatNGN(n: number) {
  return `₦${Number(n || 0).toLocaleString('en-NG')}`;
}

// Helper: load full order with all checkout relations
async function loadAdminOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { id: true, email: true, phone: true, firstName: true, lastName: true } },
      items: true,
      payments: { orderBy: { createdAt: 'asc' } },
      deliveryQuotes: { orderBy: { version: 'desc' } },
      refundReviews: { orderBy: { createdAt: 'desc' } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });
}

// ── POST /admin/orders/:id/product-payment/verify ─────────────────────────────

checkoutAdminRouter.post('/orders/:id/product-payment/verify', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.id || 'ADMIN';
    const order = await loadAdminOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const productPayment = order.payments.find(p => p.paymentType === 'PRODUCT');
    if (!productPayment) return res.status(400).json({ success: false, error: 'No product payment record found.' });
    if (productPayment.status === 'VERIFIED') return res.status(409).json({ success: false, error: 'Product payment already verified.' });
    if (productPayment.status !== 'SUBMITTED') return res.status(400).json({ success: false, error: 'Payment receipt has not been submitted yet.' });

    const note = typeof req.body.note === 'string' ? req.body.note : '';
    const now = new Date();

    // Aggregate by variant to finalize sales
    const shortfalls: string[] = [];
    const requiredByVariant = new Map<string, number>();
    for (const item of order.items) {
      if (!item.variantId) continue;
      requiredByVariant.set(
        item.variantId,
        (requiredByVariant.get(item.variantId) || 0) + item.quantity
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const [variantId, quantity] of requiredByVariant) {
        const result = await InventoryService.finalizeSale(
          variantId,
          quantity,
          order.orderNumber,
          tx
        );
        if (!result.finalized) {
          shortfalls.push(`${variantId}: short by ${result.shortfall} unit(s)`);
        }
      }

      const needsManualReview = shortfalls.length > 0;
      const manualReviewReason = needsManualReview
        ? `Payment verified but stock could not be fully allocated: ${shortfalls.join('; ')}. Do not fulfil until reviewed.`
        : null;

      await tx.payment.update({
        where: { id: productPayment.id },
        data: {
          status: 'VERIFIED',
          verifiedAt: now,
          verifiedBy: adminId,
          verificationNote: note,
          amountReceivedNGN: productPayment.amountDueNGN,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'PAID',
          paidAt: now,
          needsManualReview,
          manualReviewReason,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'PAID',
          changedBy: adminId,
          note: needsManualReview
            ? `Product payment verified by admin. Flagged for review: ${manualReviewReason}`
            : 'Product payment verified by admin',
        },
      });

      // Immutable timeline event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          type: 'PAYMENT_VERIFIED',
          title: 'Product Payment Verified',
          description: `Product payment of ${formatNGN(productPayment.amountDueNGN)} verified by admin`,
          actorType: 'ADMIN',
          actorId: adminId,
          metadata: { amountNGN: productPayment.amountDueNGN, note },
        },
      });

      // Outbox event
      await recordEvent(tx, {
        eventKey: `order:${order.id}:product-payment:verified:v1`,
        eventType: PIERCYN_EVENTS.PAYMENT_VERIFIED,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          amountNGN: productPayment.amountDueNGN,
          verifiedBy: adminId,
        },
      });
    });

    // WhatsApp + Email to customer
    const customerName = `${order.customerFirstName} ${order.customerLastName}`;
    const waMsg =
      `✅ *PIERCYN* — Payment Verified!\n\n` +
      `Hi ${order.customerFirstName},\n\n` +
      `Your product payment for order *${order.orderNumber}* has been verified.\n\n` +
      `*Amount:* ${formatNGN(productPayment.amountDueNGN)}\n\n` +
      `Our team will now calculate your delivery fee and send you a quotation shortly.\n\n` +
      `Thank you for shopping with PIERCYN! 🛍`;
    await WhatsAppService.sendMessage({ to: order.customerPhone, body: waMsg });

    // Notify merchant
    await WhatsAppService.sendToMerchant(
      `✅ *Product payment verified*\nOrder: *${order.orderNumber}* | ${customerName}\nAmount: ${formatNGN(productPayment.amountDueNGN)}\nVerified by: ${adminId}`
    );

    triggerNotificationProcessingAsync();

    return res.json({ success: true, data: { status: 'VERIFIED', verifiedAt: now } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /admin/orders/:id/product-payment/reject ─────────────────────────────

checkoutAdminRouter.post('/orders/:id/product-payment/reject', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.id || 'ADMIN';
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason) return res.status(400).json({ success: false, error: 'A rejection reason is required.' });

    const order = await loadAdminOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const productPayment = order.payments.find(p => p.paymentType === 'PRODUCT');
    if (!productPayment) return res.status(400).json({ success: false, error: 'No product payment record found.' });
    if (productPayment.status === 'VERIFIED') return res.status(409).json({ success: false, error: 'Cannot reject an already verified payment.' });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: productPayment.id },
        data: { status: 'REJECTED', rejectionReason: reason, verifiedBy: adminId, verifiedAt: new Date() },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id, fromStatus: order.status, toStatus: order.status,
          changedBy: adminId, note: `Product payment rejected. Reason: ${reason}`,
        },
      });
      await recordEvent(tx, {
        eventKey: `order:${order.id}:product-payment:rejected:v${Date.now()}`,
        eventType: PIERCYN_EVENTS.PAYMENT_REJECTED,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          paymentType: 'PRODUCT',
          amountNGN: productPayment.amountDueNGN,
          providerReference: productPayment.providerReference || 'BANK_TRANSFER',
          rejectionReason: reason,
          verifiedBy: adminId,
          timestamp: new Date().toISOString(),
        },
      });
    });

    // Notify customer
    const waMsg =
      `⚠️ *PIERCYN* — Payment Could Not Be Verified\n\n` +
      `Hi ${order.customerFirstName},\n\n` +
      `Unfortunately, we were unable to verify your product payment for order *${order.orderNumber}*.\n\n` +
      `*Reason:* ${reason}\n\n` +
      `Please re-upload a valid receipt or contact us for assistance.`;
    await WhatsAppService.sendMessage({ to: order.customerPhone, body: waMsg });

    return res.json({ success: true, data: { status: 'REJECTED', reason } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /admin/orders/:id/delivery/quote ─────────────────────────────────────

const QuoteSchema = z.object({ amountNGN: z.number().int().positive() });

checkoutAdminRouter.post('/orders/:id/delivery/quote', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.id || 'ADMIN';
    const order = await loadAdminOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // Prerequisite: product payment must be verified
    const productPayment = order.payments.find(p => p.paymentType === 'PRODUCT');
    if (productPayment?.status !== 'VERIFIED') {
      return res.status(400).json({ success: false, error: 'Product payment must be verified before generating a delivery quotation.' });
    }

    const validated = QuoteSchema.parse(req.body);
    const expiresAt = new Date(Date.now() + QUOTE_EXPIRY_HOURS * 60 * 60 * 1000);
    const now = new Date();

    // Determine next version
    const latestQuote = order.deliveryQuotes[0];
    const newVersion = latestQuote ? latestQuote.version + 1 : 1;

    // Expire any open SENT quotes first
    if (latestQuote && latestQuote.status === 'SENT') {
      await prisma.deliveryQuote.update({
        where: { id: latestQuote.id },
        data: { status: 'REQUOTE_REQUIRED' },
      });
    }

    const quote = await prisma.deliveryQuote.create({
      data: {
        orderId: order.id,
        version: newVersion,
        amountNGN: validated.amountNGN,
        status: 'SENT',
        createdByAdmin: adminId,
        sentAt: now,
        expiresAt,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { quoteStatus: 'SENT', quoteSentAt: now, quoteSentByAdmin: adminId, quoteDeliveryFeeNGN: validated.amountNGN },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id, fromStatus: order.status, toStatus: order.status,
        changedBy: adminId, note: `Delivery quotation v${newVersion} sent: ${formatNGN(validated.amountNGN)}`,
      },
    });

    // Send official WhatsApp quotation message to customer
    const decisionUrl = `${APP_URL}/account/orders/${order.id}/delivery`;

    await recordEvent(prisma as any, {
      eventKey: `order:${order.id}:quote:v${newVersion}`,
      eventType: PIERCYN_EVENTS.DELIVERY_QUOTE_CREATED,
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        deliveryFeeNGN: validated.amountNGN,
        subtotalNGN: order.subtotalNGN,
        totalNGN: order.totalNGN + validated.amountNGN,
        quoteId: quote.id,
        expiresAt: expiresAt.toISOString(),
        decisionUrl,
      },
    });
    const customerMsg =
      `📦 *PIERCYN DELIVERY QUOTATION*\n\n` +
      `Order: *${order.orderNumber}*\n\n` +
      `Your delivery fee has been confirmed.\n\n` +
      `*Delivery Fee: ${formatNGN(validated.amountNGN)}*\n\n` +
      `Accept or reject your quotation here:\n${decisionUrl}\n\n` +
      `This quotation expires in ${QUOTE_EXPIRY_HOURS} hours.\n\n` +
      `Delivery timeframe will be communicated separately by our team.\n\n` +
      `Thank you for shopping with PIERCYN.`;
    await WhatsAppService.sendMessage({ to: order.customerPhone, body: customerMsg });

    // Notify merchant
    await WhatsAppService.sendToMerchant(
      `📤 *Delivery quotation sent*\nOrder: *${order.orderNumber}*\nFee: ${formatNGN(validated.amountNGN)}\nVersion: v${newVersion}\nExpires: ${expiresAt.toLocaleString('en-NG')}`
    );

    return res.status(201).json({ success: true, data: { quoteId: quote.id, version: newVersion, amountNGN: validated.amountNGN, expiresAt, status: 'SENT' } });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    return res.status(400).json({ success: false, error: msg });
  }
});

// ── POST /admin/orders/:id/delivery-payment/verify ────────────────────────────

checkoutAdminRouter.post('/orders/:id/delivery-payment/verify', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.id || 'ADMIN';
    const order = await loadAdminOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const deliveryPayment = order.payments.find(p => p.paymentType === 'DELIVERY');
    if (!deliveryPayment) return res.status(400).json({ success: false, error: 'No delivery payment obligation found.' });
    if (deliveryPayment.status === 'VERIFIED') return res.status(409).json({ success: false, error: 'Delivery payment already verified.' });
    if (deliveryPayment.status !== 'SUBMITTED') return res.status(400).json({ success: false, error: 'Delivery payment receipt has not been submitted yet.' });

    const note = typeof req.body.note === 'string' ? req.body.note : '';
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: deliveryPayment.id },
        data: { status: 'VERIFIED', verifiedAt: now, verifiedBy: adminId, verificationNote: note },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'READY_FOR_DISPATCH' },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id, fromStatus: order.status, toStatus: 'READY_FOR_DISPATCH',
          changedBy: adminId, note: 'Delivery payment verified — order ready for dispatch',
        },
      });
      await recordEvent(tx, {
        eventKey: `order:${order.id}:delivery-payment:verified:v1`,
        eventType: PIERCYN_EVENTS.DELIVERY_PAYMENT_VERIFIED,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          amountNGN: deliveryPayment.amountDueNGN,
          providerReference: deliveryPayment.providerReference || 'BANK_TRANSFER',
          verifiedBy: adminId,
          timestamp: now.toISOString(),
        },
      });
    });

    const waMsg =
      `✅ *PIERCYN* — Delivery Payment Verified!\n\n` +
      `Hi ${order.customerFirstName},\n\n` +
      `Your delivery payment for order *${order.orderNumber}* has been verified.\n\n` +
      `*Amount:* ${formatNGN(deliveryPayment.amountDueNGN)}\n\n` +
      `Your order is now being prepared for dispatch. Our team will notify you once it's on the way!\n\n` +
      `Thank you for choosing PIERCYN! 🛍`;
    await WhatsAppService.sendMessage({ to: order.customerPhone, body: waMsg });

    await WhatsAppService.sendToMerchant(
      `✅ *Delivery payment verified*\nOrder: *${order.orderNumber}*\nAmount: ${formatNGN(deliveryPayment.amountDueNGN)}\nStatus → READY_FOR_DISPATCH`
    );

    triggerNotificationProcessingAsync();

    return res.json({ success: true, data: { status: 'VERIFIED', orderStatus: 'READY_FOR_DISPATCH', verifiedAt: now } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /admin/orders/:id/delivery-payment/reject ────────────────────────────

checkoutAdminRouter.post('/orders/:id/delivery-payment/reject', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.id || 'ADMIN';
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason) return res.status(400).json({ success: false, error: 'A rejection reason is required.' });

    const order = await loadAdminOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const deliveryPayment = order.payments.find(p => p.paymentType === 'DELIVERY');
    if (!deliveryPayment) return res.status(400).json({ success: false, error: 'No delivery payment record found.' });
    if (deliveryPayment.status === 'VERIFIED') return res.status(409).json({ success: false, error: 'Cannot reject an already verified delivery payment.' });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: deliveryPayment.id },
        data: { status: 'REJECTED', rejectionReason: reason, verifiedBy: adminId, verifiedAt: new Date() },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id, fromStatus: order.status, toStatus: order.status,
          changedBy: adminId, note: `Delivery payment rejected. Reason: ${reason}`,
        },
      });
      await recordEvent(tx, {
        eventKey: `order:${order.id}:delivery-payment:rejected:v${Date.now()}`,
        eventType: PIERCYN_EVENTS.PAYMENT_REJECTED,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          paymentType: 'DELIVERY',
          amountNGN: deliveryPayment.amountDueNGN,
          providerReference: deliveryPayment.providerReference || 'BANK_TRANSFER',
          rejectionReason: reason,
          verifiedBy: adminId,
          timestamp: new Date().toISOString(),
        },
      });
    });

    await WhatsAppService.sendMessage({
      to: order.customerPhone,
      body:
        `⚠️ *PIERCYN* — Delivery Payment Could Not Be Verified\n\n` +
        `Hi ${order.customerFirstName},\n\n` +
        `We could not verify your delivery payment for order *${order.orderNumber}*.\n\n` +
        `*Reason:* ${reason}\n\n` +
        `Please re-upload your delivery receipt or contact us.`,
    });

    return res.json({ success: true, data: { status: 'REJECTED', reason } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /admin/orders/:id/dispatch ───────────────────────────────────────────

const DispatchSchema = z.object({
  logisticsProvider: z.string().min(1),
  dispatchReference: z.string().optional(),
  dispatchNote: z.string().optional(),
});

checkoutAdminRouter.post('/orders/:id/dispatch', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.id || 'ADMIN';
    const order = await loadAdminOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // STRICT prerequisite enforcement — must be enforced here even if frontend already checks
    const productPayment = order.payments.find(p => p.paymentType === 'PRODUCT');
    const deliveryPayment = order.payments.find(p => p.paymentType === 'DELIVERY');
    const acceptedQuote = order.deliveryQuotes.find(q => q.status === 'ACCEPTED');

    const prereqErrors: string[] = [];
    if (productPayment?.status !== 'VERIFIED') prereqErrors.push('Product payment is not verified.');
    if (!acceptedQuote) prereqErrors.push('Delivery quotation has not been accepted by the customer.');
    if (deliveryPayment?.status !== 'VERIFIED') prereqErrors.push('Delivery payment is not verified.');

    if (prereqErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Dispatch prerequisites not met. All payment and quotation conditions must be satisfied.',
        details: prereqErrors,
      });
    }

    const validated = DispatchSchema.parse(req.body);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'DISPATCHED',
          riderName: validated.logisticsProvider,
          dispatchedAt: now,
          dispatchNote: validated.dispatchNote || null,
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id, fromStatus: order.status, toStatus: 'DISPATCHED',
          changedBy: adminId,
          note: `Order dispatched via ${validated.logisticsProvider}${validated.dispatchReference ? ` | Ref: ${validated.dispatchReference}` : ''}`,
        },
      });

      // Immutable timeline event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          type: 'ORDER_DISPATCHED',
          title: 'Order Dispatched',
          description: `Dispatched via ${validated.logisticsProvider}`,
          actorType: 'ADMIN',
          actorId: adminId,
          metadata: {
            logisticsProvider: validated.logisticsProvider,
            dispatchReference: validated.dispatchReference,
          },
        },
      });

      // Outbox event
      await recordEvent(tx, {
        eventKey: `order:${order.id}:dispatched:v1`,
        eventType: PIERCYN_EVENTS.ORDER_DISPATCHED,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
          customerEmail: order.customerEmail,
          deliveryCity: order.deliveryCity,
          deliveryState: order.deliveryState,
          logisticsProvider: validated.logisticsProvider,
        },
      });
    });

    // Notify customer
    const waMsg =
      `🚚 *PIERCYN* — Your Order is on the Way!\n\n` +
      `Hi ${order.customerFirstName},\n\n` +
      `Your order *${order.orderNumber}* has been dispatched!\n\n` +
      `*Logistics:* ${validated.logisticsProvider}\n` +
      (validated.dispatchReference ? `*Reference:* ${validated.dispatchReference}\n` : '') +
      `\nDelivery timeframe will be confirmed by our team shortly.\n\n` +
      `Thank you for shopping with PIERCYN! 🛍`;
    await WhatsAppService.sendMessage({ to: order.customerPhone, body: waMsg });

    await WhatsAppService.sendToMerchant(
      `🚚 *Order dispatched*\nOrder: *${order.orderNumber}*\nLogistics: ${validated.logisticsProvider}\n${validated.dispatchReference ? `Ref: ${validated.dispatchReference}\n` : ''}By: ${adminId}`
    );

    triggerNotificationProcessingAsync();

    return res.json({ success: true, data: { status: 'DISPATCHED', dispatchedAt: now, logisticsProvider: validated.logisticsProvider } });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    return res.status(400).json({ success: false, error: msg });
  }
});

// ── POST /admin/orders/:id/delivered ──────────────────────────────────────────

checkoutAdminRouter.post('/orders/:id/delivered', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.id || 'ADMIN';
    const order = await loadAdminOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (order.status !== 'DISPATCHED') {
      return res.status(400).json({ success: false, error: `Order must be in DISPATCHED status to mark as delivered. Current: ${order.status}` });
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'DELIVERED', deliveredAt: now },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id, fromStatus: 'DISPATCHED', toStatus: 'DELIVERED',
          changedBy: adminId, note: 'Order marked as delivered',
        },
      });

      // Immutable timeline event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          type: 'ORDER_DELIVERED',
          title: 'Order Delivered',
          description: 'Delivered successfully to customer',
          actorType: 'ADMIN',
          actorId: adminId,
        },
      });

      // Outbox event
      await recordEvent(tx, {
        eventKey: `order:${order.id}:delivered:v1`,
        eventType: PIERCYN_EVENTS.ORDER_DELIVERED,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
          customerEmail: order.customerEmail,
        },
      });
    });

    await WhatsAppService.sendMessage({
      to: order.customerPhone,
      body:
        `✨ *PIERCYN* — Your Order Has Been Delivered!\n\n` +
        `Hi ${order.customerFirstName},\n\n` +
        `Your order *${order.orderNumber}* has been delivered.\n\n` +
        `We hope you love your new pieces! 🖤\n\n` +
        `Your feedback means the world to us — thank you for choosing PIERCYN.`,
    });

    await WhatsAppService.sendToMerchant(
      `✅ *Order delivered*\nOrder: *${order.orderNumber}*\nCustomer: ${order.customerFirstName} ${order.customerLastName}\nBy: ${adminId}`
    );

    triggerNotificationProcessingAsync();

    return res.json({ success: true, data: { status: 'DELIVERED', deliveredAt: now } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /admin/orders/:id/refund-review ──────────────────────────────────────

const RefundReviewSchema = z.object({
  reason: z.string().min(5),
  amountNGN: z.number().int().positive(),
  notes: z.string().optional(),
  paymentId: z.string().optional(),
});

checkoutAdminRouter.post('/orders/:id/refund-review', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.id || 'ADMIN';
    const order = await loadAdminOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const validated = RefundReviewSchema.parse(req.body);

    const review = await prisma.refundReview.create({
      data: {
        orderId: order.id,
        paymentId: validated.paymentId || null,
        reason: validated.reason,
        amountNGN: validated.amountNGN,
        status: 'OPEN',
        notes: validated.notes || null,
      },
    });

    return res.status(201).json({ success: true, data: review });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    return res.status(400).json({ success: false, error: msg });
  }
});

// ── GET /admin/orders ──────────────────────────────────────────────────────────

checkoutAdminRouter.get('/orders', requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const status = req.query.status as string | undefined;
    const quoteStatus = req.query.quoteStatus as string | undefined;

    const where: any = {};
    if (status) where.status = status;
    if (quoteStatus) where.quoteStatus = quoteStatus;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: { select: { productName: true, quantity: true, unitPriceNGN: true } },
          payments: { select: { paymentType: true, status: true, amountDueNGN: true } },
          deliveryQuotes: { orderBy: { version: 'desc' }, take: 1 },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const mapped = orders.map((o) => ({
      ...o,
      orderStatus: o.status,
      customerName: o.customerFirstName ? `${o.customerFirstName} ${o.customerLastName || ''}`.trim() : (o.customerEmail || 'Customer'),
    }));

    return res.json({ success: true, data: mapped, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /admin/orders/:id ──────────────────────────────────────────────────────

checkoutAdminRouter.get('/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const order = await loadAdminOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    const mapped = {
      ...order,
      orderStatus: order.status,
      customerName: order.customerFirstName ? `${order.customerFirstName} ${order.customerLastName || ''}`.trim() : (order.customerEmail || 'Customer'),
    };
    return res.json({ success: true, data: mapped });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

