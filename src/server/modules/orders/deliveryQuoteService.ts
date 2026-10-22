/**
 * Delivery Quote Service
 * Manages the per-order delivery-fee quotation lifecycle.
 *
 * Rules enforced here:
 *  - Only admins may set/change a delivery fee (enforced at the route level via requireAdmin)
 *  - Fee cannot be negative
 *  - quoteVersion increments on every fee change, invalidating prior acceptances
 *  - Payment is blocked until quoteStatus === 'ACCEPTED'
 *  - WhatsApp URL generator NEVER includes internal notes or sensitive admin data
 *  - Phone normalisation handles Nigerian 08x/07x/09x → +2348x/+2347x/+2349x
 *  - Opening WhatsApp does NOT automatically mark a quote as sent
 */

import { dbStore, DbOrder, QuoteStatusType } from '../../db/store';
import { buildWhatsAppPaymentMessage } from '../payments/bankTransfer';

export { buildWhatsAppPaymentMessage };

// ── Phone normalisation ────────────────────────────────────────────────────────

/**
 * Normalise a phone number to international E.164 format.
 * Handles Nigerian numbers (08x, 07x, 09x → +2348x, +2347x, +2349x).
 * Accepts numbers already in +234 format or other international formats.
 * Returns null if the number cannot be normalised.
 */
export function normalisePhone(raw: string): string | null {
  if (!raw) return null;
  // Strip everything except digits and leading +
  const stripped = raw.replace(/[\s\-().]/g, '');

  // Already international
  if (stripped.startsWith('+')) {
    const digits = stripped.slice(1).replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
    return null;
  }

  // Nigerian local numbers: 08x, 07x, 09x, 08xx, 07xx
  if (/^0[7-9][0-1]\d{8}$/.test(stripped)) {
    return `+234${stripped.slice(1)}`;
  }

  // Bare 234xxxxxxxxxx (no leading +)
  if (/^234[7-9][0-1]\d{8}$/.test(stripped)) {
    return `+${stripped}`;
  }

  return null;
}

// ── WhatsApp message template ─────────────────────────────────────────────────

function formatNGN(koboOrNaira: number): string {
  // Values are stored as plain Naira (not Kobo) in the in-memory store
  return `₦${Number(koboOrNaira).toLocaleString('en-NG')}`;
}

function buildWhatsAppMessage(order: DbOrder): string {
  const name = order.customerName.split(' ')[0] || order.customerName;
  const deliveryFee = order.quoteDeliveryFeeNGN ?? 0;
  const total = order.quoteTotalNGN ?? order.subtotalNGN + deliveryFee - order.discountNGN;
  const location = [order.shippingCity, order.shippingState].filter(Boolean).join(', ');
  const timeframe = order.quoteEstimatedTimeframe || 'To be confirmed';

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
    `Please confirm if you accept the delivery fee.\n\n` +
    `Reply *YES* to accept or *NO* if you would like to discuss the delivery arrangement.\n\n` +
    `Thank you for choosing PIERCYN!`
  );
}

// ── Service ────────────────────────────────────────────────────────────────────

export class DeliveryQuoteService {
  // ── helpers ────────────────────────────────────────────────────────────────

  private static getOrder(identifier: string): DbOrder {
    let order = dbStore.orders.get(identifier);
    if (!order) {
      const id = dbStore.orderNumberIndex.get(identifier);
      if (id) order = dbStore.orders.get(id);
    }
    if (!order) throw new Error(`Order not found: ${identifier}`);
    return order;
  }

  // ── isPaymentAllowed ────────────────────────────────────────────────────────

  /**
   * Payment is only allowed once the customer has explicitly accepted the quotation.
   * A confirmed payment is never blocked by a later quote state change.
   */
  public static isPaymentAllowed(order: DbOrder): boolean {
    if (order.paymentStatus === 'PAID') return true; // already paid — never block
    return order.quoteStatus === 'ACCEPTED';
  }

  // ── setDeliveryQuote ───────────────────────────────────────────────────────

  /**
   * Admin sets or updates the delivery fee for an order.
   *
   * - Fee cannot be negative
   * - Every change increments quoteVersion (invalidating any prior acceptance)
   * - Recalculates totalNGN authoritatively from trusted DB values
   * - Does NOT automatically mark the quote as sent
   */
  public static setDeliveryQuote(
    identifier: string,
    input: {
      deliveryFeeNGN: number;
      estimatedTimeframe?: string;
      internalNote?: string;
    },
    adminId: string
  ): DbOrder {
    if (!Number.isInteger(input.deliveryFeeNGN) || input.deliveryFeeNGN < 0) {
      throw new Error('Delivery fee must be a non-negative integer (NGN).');
    }
    if (input.estimatedTimeframe && input.estimatedTimeframe.length > 200) {
      throw new Error('Estimated timeframe must not exceed 200 characters.');
    }
    if (input.internalNote && input.internalNote.length > 1000) {
      throw new Error('Internal note must not exceed 1000 characters.');
    }

    const order = this.getOrder(identifier);

    if (order.paymentStatus === 'PAID' && order.quoteStatus !== 'PENDING') {
      throw new Error('Cannot change the delivery fee after payment has been confirmed.');
    }

    const now = new Date().toISOString();
    const newVersion = (order.quoteVersion || 0) + 1;
    const newTotal = Math.max(0, order.subtotalNGN + input.deliveryFeeNGN - order.discountNGN);

    // Authoritative fields (reflect the accepted/payable amounts)
    order.deliveryFeeNGN = input.deliveryFeeNGN;
    order.totalNGN = newTotal;

    // Quote snapshot fields
    order.quoteDeliveryFeeNGN = input.deliveryFeeNGN;
    order.quoteTotalNGN = newTotal;
    order.quoteVersion = newVersion;
    order.quoteStatus = 'SET';
    order.quoteSetAt = now;
    order.quoteSetByAdmin = adminId;

    if (input.estimatedTimeframe !== undefined) {
      order.quoteEstimatedTimeframe = input.estimatedTimeframe;
    }
    if (input.internalNote !== undefined) {
      order.quoteInternalNote = input.internalNote;
    }

    // Invalidate any prior acceptance / rejection — admin changed the price
    order.quoteAcceptedAt = undefined;
    order.quoteAcceptedByAdmin = undefined;
    order.quoteAcceptedFeeNGN = undefined;
    order.quoteAcceptedTotalNGN = undefined;
    order.quoteRejectedAt = undefined;
    order.quoteRejectedByAdmin = undefined;

    // Reset sent timestamp — new quote must be re-sent
    order.quoteSentAt = undefined;
    order.quoteSentByAdmin = undefined;

    order.updatedAt = now;
    return { ...order };
  }

  // ── markQuoteSent ──────────────────────────────────────────────────────────

  /**
   * Admin explicitly marks the quote as sent via WhatsApp.
   * This is NEVER inferred from the WhatsApp URL being opened.
   * Requires quoteStatus === 'SET'.
   */
  public static markQuoteSent(identifier: string, adminId: string): DbOrder {
    const order = this.getOrder(identifier);

    if (order.quoteStatus !== 'SET') {
      throw new Error(
        `Quote must be in SET status to mark as sent. Current status: ${order.quoteStatus}.`
      );
    }

    const now = new Date().toISOString();
    order.quoteStatus = 'SENT';
    order.quoteSentAt = now;
    order.quoteSentByAdmin = adminId;
    order.updatedAt = now;
    return { ...order };
  }

  // ── recordAcceptance ───────────────────────────────────────────────────────

  /**
   * Admin records the customer's WhatsApp acceptance.
   * Requires quoteStatus === 'SENT' (admin must mark it sent before recording acceptance).
   * Snapshots the accepted fee and total for immutable audit trail.
   */
  public static recordAcceptance(identifier: string, adminId: string): DbOrder {
    const order = this.getOrder(identifier);

    if (order.quoteStatus !== 'SENT') {
      throw new Error(
        `Can only record acceptance when quote has been sent. Current status: ${order.quoteStatus}.`
      );
    }

    const now = new Date().toISOString();
    order.quoteStatus = 'ACCEPTED';
    order.quoteAcceptedAt = now;
    order.quoteAcceptedByAdmin = adminId;
    order.quoteAcceptedFeeNGN = order.quoteDeliveryFeeNGN;
    order.quoteAcceptedTotalNGN = order.quoteTotalNGN;
    order.quoteRejectedAt = undefined;
    order.quoteRejectedByAdmin = undefined;
    order.updatedAt = now;
    return { ...order };
  }

  // ── recordRejection ────────────────────────────────────────────────────────

  /**
   * Admin records the customer's WhatsApp rejection.
   * Order cannot proceed to payment in this state.
   */
  public static recordRejection(identifier: string, adminId: string): DbOrder {
    const order = this.getOrder(identifier);

    if (!['SET', 'SENT', 'ACCEPTED'].includes(order.quoteStatus)) {
      throw new Error(
        `Cannot record rejection for a quote with status: ${order.quoteStatus}.`
      );
    }

    const now = new Date().toISOString();
    order.quoteStatus = 'REJECTED';
    order.quoteRejectedAt = now;
    order.quoteRejectedByAdmin = adminId;
    // Clear acceptance if it existed
    order.quoteAcceptedAt = undefined;
    order.quoteAcceptedByAdmin = undefined;
    order.updatedAt = now;
    return { ...order };
  }

  // ── generateWhatsAppUrl ───────────────────────────────────────────────────

  /**
   * Generates a wa.me/ URL with a personalised, URL-encoded pre-filled message.
   *
   * SECURITY RULES:
   * - Does NOT include quoteInternalNote
   * - Does NOT include admin identifiers
   * - Does NOT mark anything as sent
   * - Validates and normalises phone number before generating URL
   * Returns { url, phone, message, error } — error is set if phone cannot be normalised.
   */
  public static generateWhatsAppUrl(identifier: string): {
    url: string | null;
    phone: string | null;
    message: string;
    error: string | null;
  } {
    const order = this.getOrder(identifier);

    if ((!order.quoteDeliveryFeeNGN && order.quoteDeliveryFeeNGN !== 0) || order.quoteStatus === 'PENDING') {
      return {
        url: null,
        phone: null,
        message: '',
        error: 'Delivery fee has not been set yet. Set a delivery fee before generating the WhatsApp message.',
      };
    }

    const phone = normalisePhone(order.customerPhone);
    if (!phone) {
      return {
        url: null,
        phone: null,
        message: '',
        error: `Unable to normalise customer phone number: "${order.customerPhone}". Please verify the number is correct.`,
      };
    }

    const message = buildWhatsAppMessage(order);
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${phone.replace('+', '')}?text=${encoded}`;

    return { url, phone, message, error: null };
  }

  // ── generateWhatsAppPaymentUrl ─────────────────────────────────────────────

  /**
   * Generates wa.me click-to-chat URL with pre-filled WhatsApp payment instructions.
   * Only allowed when customer has accepted the quotation (quoteStatus === 'ACCEPTED').
   * SECURITY:
   * - Never includes internal notes or admin secrets
   * - Validates and normalises phone number
   * - Uses official Kuda bank transfer details
   * - Does NOT mark message as sent
   */
  public static generateWhatsAppPaymentUrl(identifier: string): {
    url: string | null;
    phone: string | null;
    message: string;
    quoteVersion?: number;
    error: string | null;
  } {
    const order = this.getOrder(identifier);

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
        error: `Unable to normalise customer phone number: "${order.customerPhone}". Please verify the number is correct.`,
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

    return { url, phone, message, quoteVersion: order.quoteVersion, error: null };
  }

  // ── markPaymentInstructionsSent ────────────────────────────────────────────

  /**
   * Explicitly marks payment instructions as sent via WhatsApp.
   * Does NOT mark payment as confirmed or order as paid.
   */
  public static markPaymentInstructionsSent(identifier: string, adminId: string): DbOrder {
    const order = this.getOrder(identifier);

    if (order.quoteStatus !== 'ACCEPTED') {
      throw new Error(`Quote must be in ACCEPTED status before sending payment instructions. Current status: ${order.quoteStatus}.`);
    }

    const now = new Date().toISOString();
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      fromStatus: order.status,
      toStatus: order.status,
      changedBy: adminId,
      timestamp: now,
      note: `Kuda bank transfer payment instructions sent via WhatsApp by ${adminId}`,
    });
    order.updatedAt = now;
    return { ...order };
  }

  // ── assignRider ────────────────────────────────────────────────────────────

  /**
   * Admin assigns a manual rider to the order for dispatch.
   * Payment must have been confirmed before a rider can be assigned.
   */
  public static assignRider(
    identifier: string,
    input: { riderName: string; riderPhone: string },
    adminId: string
  ): DbOrder {
    if (!input.riderName?.trim()) throw new Error('Rider name is required.');
    if (!input.riderPhone?.trim()) throw new Error('Rider phone number is required.');

    const order = this.getOrder(identifier);

    if (order.paymentStatus !== 'PAID') {
      throw new Error('A rider can only be assigned after payment has been verified.');
    }

    const now = new Date().toISOString();
    order.riderName = input.riderName.trim();
    order.riderPhone = input.riderPhone.trim();
    order.updatedAt = now;
    return { ...order };
  }

  // ── recordDispatch ─────────────────────────────────────────────────────────

  /**
   * Admin records that the order has been dispatched to the rider.
   */
  public static recordDispatch(
    identifier: string,
    input: { dispatchNote?: string },
    adminId: string
  ): DbOrder {
    const order = this.getOrder(identifier);

    if (order.paymentStatus !== 'PAID') {
      throw new Error('Cannot dispatch an order that has not been paid for.');
    }

    const now = new Date().toISOString();
    order.dispatchedAt = now;
    order.dispatchNote = input.dispatchNote?.trim() || undefined;
    order.updatedAt = now;
    return { ...order };
  }
}
