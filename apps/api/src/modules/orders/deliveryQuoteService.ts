/**
 * PIERCYN Delivery Quotation & Manual Fulfilment Service (PostgreSQL / Prisma)
 *
 * Enforces Option A: Manual WhatsApp communication through the admin dashboard.
 * - Per-order delivery fee calculation by admin
 * - Server recalculation of final payable total: subtotal - discount + deliveryFee
 * - WhatsApp URL generation with Nigerian and international phone normalisation
 * - Message generation excluding confidential internal notes or admin secrets
 * - Opening WhatsApp does NOT mark quote as sent
 * - Explicit admin action to mark quote as sent
 * - Admin records customer acceptance or rejection
 * - Fee modification increments quoteVersion and invalidates prior acceptance
 * - Payment is blocked unless quoteStatus === 'ACCEPTED'
 * - Manual rider assignment and dispatch tracking
 */

import { prisma } from '../../db/prisma';
import { buildWhatsAppPaymentMessage } from '../payments/bankTransfer';

export { buildWhatsAppPaymentMessage };

// ── Phone normalisation ────────────────────────────────────────────────────────

/**
 * Normalise a phone number to international E.164 format.
 * Handles Nigerian numbers (08x, 07x, 09x -> +2348x, +2347x, +2349x).
 * Accepts numbers already in +234 format or international E.164.
 * Returns null if the number cannot be safely normalised.
 */
export function normalisePhone(raw: string): string | null {
  if (!raw) return null;
  const stripped = raw.replace(/[\s\-().]/g, '');

  if (stripped.startsWith('+')) {
    const digits = stripped.slice(1).replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
    return null;
  }

  // Nigerian local format: 07x, 08x, 09x (11 digits)
  if (/^0[7-9][0-1]\d{8}$/.test(stripped)) {
    return `+234${stripped.slice(1)}`;
  }

  // Bare 234xxxxxxxxxx (13 digits, no leading +)
  if (/^234[7-9][0-1]\d{8}$/.test(stripped)) {
    return `+${stripped}`;
  }

  return null;
}

// ── WhatsApp message template ─────────────────────────────────────────────────

function formatNGN(naira: number): string {
  return `₦${Number(naira || 0).toLocaleString('en-NG')}`;
}

export function buildWhatsAppMessage(order: {
  orderNumber: string;
  customerName: string;
  subtotalNGN: number;
  discountNGN: number;
  deliveryFeeNGN: number;
  totalNGN: number;
  deliveryCity: string;
  deliveryState: string;
  estimatedTimeframe?: string | null;
}): string {
  const name = (order.customerName || '').split(' ')[0]?.trim() || 'Valued Customer';
  const deliveryFee = order.deliveryFeeNGN ?? 0;
  const total = order.totalNGN;
  const location = [order.deliveryCity, order.deliveryState].filter(Boolean).join(', ') || 'Nigeria';
  const timeframe = order.estimatedTimeframe || 'To be confirmed';

  return (
    `Hello ${name} 👋\n\n` +
    `Thank you for shopping with PIERCYN!\n\n` +
    `Your delivery quotation is ready.\n\n` +
    `*Order:* ${order.orderNumber}\n\n` +
    `Products: ${formatNGN(order.subtotalNGN)}\n` +
    `Discount: ${formatNGN(order.discountNGN)}\n` +
    `Delivery fee: ${formatNGN(deliveryFee)}\n\n` +
    `*Total payable: ${formatNGN(total)}*\n\n` +
    `Delivery location: ${location}\n` +
    `Estimated delivery: ${timeframe}\n\n` +
    `Please review the delivery fee and confirm whether you accept it.\n\n` +
    `Reply *YES* to accept or *NO* to reject.\n\n` +
    `If you have any questions, please reply to this message.\n\n` +
    `Thank you for choosing PIERCYN!`
  );
}

// ── Delivery Quote Service ─────────────────────────────────────────────────────

export class DeliveryQuoteService {
  /**
   * Payment is only allowed once the customer has explicitly accepted the quotation.
   * A confirmed payment is never blocked by a later quote state change.
   */
  public static isPaymentAllowed(order: { paymentStatus?: string | null; quoteStatus?: string | null }): boolean {
    if (order.paymentStatus === 'PAID') return true;
    return order.quoteStatus === 'ACCEPTED';
  }

  /**
   * Set or update delivery fee for an order.
   * Transactional and idempotent.
   */
  public static async setDeliveryQuote(
    identifier: string,
    input: {
      deliveryFeeNGN: number;
      estimatedTimeframe?: string;
      internalNote?: string;
    },
    adminId: string
  ) {
    if (!Number.isInteger(input.deliveryFeeNGN) || input.deliveryFeeNGN < 0) {
      throw new Error('Delivery fee must be a non-negative integer (NGN).');
    }
    if (input.estimatedTimeframe && input.estimatedTimeframe.length > 200) {
      throw new Error('Estimated timeframe must not exceed 200 characters.');
    }
    if (input.internalNote && input.internalNote.length > 1000) {
      throw new Error('Internal note must not exceed 1000 characters.');
    }

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { OR: [{ id: identifier }, { orderNumber: identifier }] },
      });
      if (!order) throw new Error(`Order not found: ${identifier}`);

      if (order.paymentStatus === 'PAID') {
        throw new Error('Cannot change the delivery fee after payment has been confirmed.');
      }

      const now = new Date();
      const newVersion = (order.quoteVersion || 0) + 1;
      const newTotal = Math.max(0, order.subtotalNGN + input.deliveryFeeNGN - order.discountNGN);

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          deliveryFeeNGN: input.deliveryFeeNGN,
          totalNGN: newTotal,
          quoteDeliveryFeeNGN: input.deliveryFeeNGN,
          quoteTotalNGN: newTotal,
          quoteVersion: newVersion,
          quoteStatus: 'SET',
          quoteSetAt: now,
          quoteSetByAdmin: adminId,
          quoteEstimatedTimeframe: input.estimatedTimeframe !== undefined ? input.estimatedTimeframe : order.quoteEstimatedTimeframe,
          quoteInternalNote: input.internalNote !== undefined ? input.internalNote : order.quoteInternalNote,
          // Invalidate any prior acceptance or rejection
          quoteAcceptedAt: null,
          quoteAcceptedByAdmin: null,
          quoteAcceptedFeeNGN: null,
          quoteAcceptedTotalNGN: null,
          quoteRejectedAt: null,
          quoteRejectedByAdmin: null,
          quoteRejectedReason: null,
          quoteSentAt: null,
          quoteSentByAdmin: null,
        },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          changedBy: adminId,
          note: `Delivery fee set to ₦${input.deliveryFeeNGN.toLocaleString()} (quote v${newVersion}, total: ₦${newTotal.toLocaleString()}) by ${adminId}`,
        },
      });

      return updated;
    });
  }

  /**
   * Explicitly marks delivery quote as sent via WhatsApp.
   * Never inferred from opening WhatsApp.
   */
  public static async markQuoteSent(identifier: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { OR: [{ id: identifier }, { orderNumber: identifier }] },
      });
      if (!order) throw new Error(`Order not found: ${identifier}`);

      if (order.quoteStatus !== 'SET') {
        throw new Error(`Quote must be in SET status before marking as sent. Current status: ${order.quoteStatus}.`);
      }

      const now = new Date();
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          quoteStatus: 'SENT',
          quoteSentAt: now,
          quoteSentByAdmin: adminId,
        },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          changedBy: adminId,
          note: `Delivery quotation manually marked as sent via WhatsApp by ${adminId}`,
        },
      });

      return updated;
    });
  }

  /**
   * Record customer's acceptance of quotation via WhatsApp.
   * Snapshots agreed amounts and unlocks order for payment.
   */
  public static async recordAcceptance(identifier: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { OR: [{ id: identifier }, { orderNumber: identifier }] },
      });
      if (!order) throw new Error(`Order not found: ${identifier}`);

      if (!['SET', 'SENT'].includes(order.quoteStatus)) {
        throw new Error(`Can only record acceptance when quote is ready or sent. Current status: ${order.quoteStatus}.`);
      }

      const now = new Date();
      const acceptedFee = order.quoteDeliveryFeeNGN ?? order.deliveryFeeNGN;
      const acceptedTotal = order.quoteTotalNGN ?? order.totalNGN;

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          quoteStatus: 'ACCEPTED',
          quoteAcceptedAt: now,
          quoteAcceptedByAdmin: adminId,
          quoteAcceptedFeeNGN: acceptedFee,
          quoteAcceptedTotalNGN: acceptedTotal,
          quoteRejectedAt: null,
          quoteRejectedByAdmin: null,
          quoteRejectedReason: null,
        },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          changedBy: adminId,
          note: `Customer acceptance recorded by ${adminId}. Agreed fee: ₦${acceptedFee.toLocaleString()}, total: ₦${acceptedTotal.toLocaleString()}`,
        },
      });

      return updated;
    });
  }

  /**
   * Record customer's rejection of quotation via WhatsApp.
   * Order cannot proceed to payment in this state.
   */
  public static async recordRejection(identifier: string, adminId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { OR: [{ id: identifier }, { orderNumber: identifier }] },
      });
      if (!order) throw new Error(`Order not found: ${identifier}`);

      if (!['SET', 'SENT', 'ACCEPTED'].includes(order.quoteStatus)) {
        throw new Error(`Cannot record rejection for quote with status: ${order.quoteStatus}.`);
      }

      const now = new Date();
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          quoteStatus: 'REJECTED',
          quoteRejectedAt: now,
          quoteRejectedByAdmin: adminId,
          quoteRejectedReason: reason?.trim() || null,
          quoteAcceptedAt: null,
          quoteAcceptedByAdmin: null,
          quoteAcceptedFeeNGN: null,
          quoteAcceptedTotalNGN: null,
        },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          changedBy: adminId,
          note: `Customer rejection recorded by ${adminId}${reason ? `: ${reason.trim()}` : ''}`,
        },
      });

      return updated;
    });
  }

  /**
   * Generate wa.me click-to-chat URL with pre-filled personalised message.
   * SECURITY:
   * - Never includes internal notes or admin secrets
   * - Validates and normalises phone number
   * - Does NOT mark quote as sent
   */
  public static async generateWhatsAppUrl(identifier: string) {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: identifier }, { orderNumber: identifier }] },
    });
    if (!order) throw new Error(`Order not found: ${identifier}`);

    if (order.quoteDeliveryFeeNGN === null && order.deliveryFeeNGN === null) {
      return {
        url: null,
        phone: null,
        message: '',
        error: 'Delivery fee has not been set yet. Set a delivery fee before generating WhatsApp message.',
      };
    }

    const phone = normalisePhone(order.customerPhone);
    if (!phone) {
      return {
        url: null,
        phone: null,
        message: '',
        error: `Unable to normalise customer phone number "${order.customerPhone}". Please verify the number.`,
      };
    }

    const customerName = `${order.customerFirstName} ${order.customerLastName}`.trim();
    const deliveryFee = order.quoteDeliveryFeeNGN ?? order.deliveryFeeNGN ?? 0;
    const total = order.quoteTotalNGN ?? order.totalNGN;

    const message = buildWhatsAppMessage({
      orderNumber: order.orderNumber,
      customerName,
      subtotalNGN: order.subtotalNGN,
      discountNGN: order.discountNGN,
      deliveryFeeNGN: deliveryFee,
      totalNGN: total,
      deliveryCity: order.deliveryCity,
      deliveryState: order.deliveryState,
      estimatedTimeframe: order.quoteEstimatedTimeframe,
    });

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${phone.replace('+', '')}?text=${encoded}`;

    return {
      url,
      phone,
      message,
      quoteVersion: order.quoteVersion,
      error: null,
    };
  }

  /**
   * Generate wa.me click-to-chat URL with pre-filled WhatsApp payment instructions.
   * Only allowed once customer has accepted the quotation (quoteStatus === 'ACCEPTED').
   * SECURITY:
   * - Never includes internal notes or admin secrets
   * - Validates and normalises phone number
   * - Uses official Kuda bank transfer details
   * - Does NOT mark message as sent
   */
  public static async generateWhatsAppPaymentUrl(identifier: string) {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: identifier }, { orderNumber: identifier }] },
    });
    if (!order) throw new Error(`Order not found: ${identifier}`);

    if (order.quoteStatus !== 'ACCEPTED') {
      return {
        url: null,
        phone: null,
        message: '',
        quoteVersion: order.quoteVersion,
        error: 'Payment instructions cannot be generated until the delivery quotation has been accepted by the customer.',
      };
    }

    const phone = normalisePhone(order.customerPhone);
    if (!phone) {
      return {
        url: null,
        phone: null,
        message: '',
        quoteVersion: order.quoteVersion,
        error: `Unable to normalise customer phone number "${order.customerPhone}". Please verify the number.`,
      };
    }

    const customerName = `${order.customerFirstName} ${order.customerLastName}`.trim();
    const deliveryFee = order.quoteAcceptedFeeNGN ?? order.quoteDeliveryFeeNGN ?? order.deliveryFeeNGN ?? 0;
    const total = order.quoteAcceptedTotalNGN ?? order.quoteTotalNGN ?? order.totalNGN;

    const message = buildWhatsAppPaymentMessage({
      orderNumber: order.orderNumber,
      customerName,
      subtotalNGN: order.subtotalNGN,
      discountNGN: order.discountNGN,
      deliveryFeeNGN: deliveryFee,
      totalNGN: total,
    });

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${phone.replace('+', '')}?text=${encoded}`;

    return {
      url,
      phone,
      message,
      quoteVersion: order.quoteVersion,
      error: null,
    };
  }

  /**
   * Explicitly marks payment instructions as sent via WhatsApp.
   * Does NOT mark payment as confirmed or order as paid.
   */
  public static async markPaymentInstructionsSent(identifier: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { OR: [{ id: identifier }, { orderNumber: identifier }] },
      });
      if (!order) throw new Error(`Order not found: ${identifier}`);

      if (order.quoteStatus !== 'ACCEPTED') {
        throw new Error(`Quote must be in ACCEPTED status before sending payment instructions. Current status: ${order.quoteStatus}.`);
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          changedBy: adminId,
          note: `Kuda bank transfer payment instructions sent via WhatsApp by ${adminId}`,
        },
      });

      return order;
    });
  }

  /**
   * Assign a manual rider to the order.
   * Requires payment confirmed first.
   */
  public static async assignRider(
    identifier: string,
    input: { riderName: string; riderPhone: string },
    adminId: string
  ) {
    if (!input.riderName?.trim()) throw new Error('Rider name is required.');
    if (!input.riderPhone?.trim()) throw new Error('Rider phone number is required.');

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { OR: [{ id: identifier }, { orderNumber: identifier }] },
      });
      if (!order) throw new Error(`Order not found: ${identifier}`);

      if (order.paymentStatus !== 'PAID') {
        throw new Error('A rider can only be assigned after payment has been verified.');
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          riderName: input.riderName.trim(),
          riderPhone: input.riderPhone.trim(),
        },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          changedBy: adminId,
          note: `Rider assigned: ${input.riderName.trim()} (${input.riderPhone.trim()}) by ${adminId}`,
        },
      });

      return updated;
    });
  }

  /**
   * Record manual dispatch with assigned rider.
   * Moves status to SHIPPED if allowed.
   */
  public static async recordDispatch(
    identifier: string,
    input: { dispatchNote?: string },
    adminId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { OR: [{ id: identifier }, { orderNumber: identifier }] },
      });
      if (!order) throw new Error(`Order not found: ${identifier}`);

      if (order.paymentStatus !== 'PAID') {
        throw new Error('Cannot dispatch an order that has not been paid for.');
      }

      const now = new Date();
      const newStatus = ['PAID', 'PROCESSING', 'PACKED'].includes(order.status) ? 'SHIPPED' : order.status;

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: newStatus as any,
          dispatchedAt: now,
          dispatchNote: input.dispatchNote?.trim() || null,
        },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: newStatus as any,
          changedBy: adminId,
          note: `Dispatched${order.riderName ? ` with rider ${order.riderName}` : ''}${
            input.dispatchNote ? `: ${input.dispatchNote.trim()}` : ''
          } (recorded by ${adminId})`,
        },
      });

      return updated;
    });
  }

  /**
   * Record delivery completion.
   * Moves status to DELIVERED.
   */
  public static async recordDelivered(
    identifier: string,
    input: { deliveryNote?: string },
    adminId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { OR: [{ id: identifier }, { orderNumber: identifier }] },
      });
      if (!order) throw new Error(`Order not found: ${identifier}`);

      const now = new Date();
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'DELIVERED',
          deliveredAt: now,
        },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'DELIVERED',
          changedBy: adminId,
          note: `Order marked as delivered${input.deliveryNote ? `: ${input.deliveryNote.trim()}` : ''} by ${adminId}`,
        },
      });

      return updated;
    });
  }
}
