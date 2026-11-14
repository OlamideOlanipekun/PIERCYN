/**
 * PIERCYN Delivery Quotation Lifecycle Cron Job
 *
 * Runs periodically to:
 * 1. Send 24-hour reminder WhatsApp to customers who haven't decided yet.
 * 2. Expire quotations that have passed their 48-hour window.
 * 3. Create RefundReview cases for orders with verified product payments on expiry.
 * 4. Notify both customer and admin on expiry.
 */

import { prisma } from '../../db/prisma';
import { WhatsAppService } from '../../services/whatsappService';
import { recordEvent, PIERCYN_EVENTS } from '../notifications/events';
import { triggerNotificationProcessingAsync } from '../notifications';

const APP_URL = (process.env.APP_URL || 'https://piercyn.vercel.app').replace(/\/+$/, '');
const REMINDER_HOURS = 24;

function formatNGN(n: number) {
  return `₦${Number(n || 0).toLocaleString('en-NG')}`;
}

export interface QuoteCronResult {
  reminders: number;
  expired: number;
  refundCasesCreated: number;
  errors: string[];
}

export class DeliveryQuoteCron {

  public static async processQuoteLifecycle(): Promise<QuoteCronResult> {
    const result: QuoteCronResult = { reminders: 0, expired: 0, refundCasesCreated: 0, errors: [] };
    const now = new Date();

    // ── 1. Send 24-hour reminders ──────────────────────────────────────────────
    const reminderThreshold = new Date(now.getTime() - REMINDER_HOURS * 60 * 60 * 1000);

    const quotesNeedingReminder = await prisma.deliveryQuote.findMany({
      where: {
        status: 'SENT',
        reminderSentAt: null,
        sentAt: { lte: reminderThreshold },
        expiresAt: { gt: now }, // not yet expired
      },
      include: {
        order: {
          select: {
            id: true, orderNumber: true, customerFirstName: true, customerLastName: true,
            customerPhone: true, customerEmail: true, subtotalNGN: true,
          },
        },
      },
    });

    for (const quote of quotesNeedingReminder) {
      try {
        const decisionUrl = `${APP_URL}/account/orders/${quote.orderId}/delivery`;
        const hoursLeft = Math.max(0, Math.round(((quote.expiresAt?.getTime() || 0) - now.getTime()) / 3600000));
        const waMsg =
          `⏰ *PIERCYN DELIVERY QUOTATION REMINDER*\n\n` +
          `Hi ${quote.order.customerFirstName},\n\n` +
          `You have a pending delivery quotation for order *${quote.order.orderNumber}*.\n\n` +
          `*Delivery Fee: ${formatNGN(quote.amountNGN)}*\n\n` +
          `This quotation expires in approximately ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.\n\n` +
          `Accept or reject here:\n${decisionUrl}\n\n` +
          `Delivery timeframe will be communicated separately by our team.\n\n` +
          `Thank you for shopping with PIERCYN.`;

        await WhatsAppService.sendMessage({ to: quote.order.customerPhone, body: waMsg });
        await prisma.deliveryQuote.update({ where: { id: quote.id }, data: { reminderSentAt: now } });
        result.reminders++;
      } catch (err: any) {
        result.errors.push(`Reminder failed for quote ${quote.id}: ${err.message}`);
      }
    }

    // ── 2. Expire overdue quotations ───────────────────────────────────────────
    const expiredQuotes = await prisma.deliveryQuote.findMany({
      where: {
        status: 'SENT',
        expiresAt: { lte: now },
      },
      include: {
        order: {
          include: {
            payments: { where: { paymentType: 'PRODUCT' } },
          },
        },
      },
    });

    for (const quote of expiredQuotes) {
      try {
        await prisma.$transaction(async (tx) => {
          // Mark quote expired
          await tx.deliveryQuote.update({ where: { id: quote.id }, data: { status: 'EXPIRED' } });

          // Update order quote status
          await tx.order.update({
            where: { id: quote.orderId },
            data: { quoteStatus: 'EXPIRED' },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: quote.orderId,
              fromStatus: quote.order.status,
              toStatus: quote.order.status,
              changedBy: 'SYSTEM',
              note: `Delivery quotation v${quote.version} expired after ${48} hours`,
            },
          });

          // Create RefundReview case if product payment was verified
          const productPayment = quote.order.payments[0];
          if (productPayment?.status === 'VERIFIED') {
            await tx.refundReview.create({
              data: {
                orderId: quote.orderId,
                paymentId: productPayment.id,
                reason: `Delivery quotation v${quote.version} expired. Customer did not accept or reject within 48 hours.`,
                amountNGN: productPayment.amountDueNGN,
                status: 'OPEN',
              },
            });
            result.refundCasesCreated++;
          }

          await recordEvent(tx, {
            eventKey: `order:${quote.orderId}:quote-expired:v${quote.version}`,
            eventType: PIERCYN_EVENTS.DELIVERY_QUOTE_EXPIRED,
            payload: {
              orderId: quote.orderId,
              orderNumber: quote.order.orderNumber,
              customerName: `${quote.order.customerFirstName} ${quote.order.customerLastName}`.trim(),
              customerEmail: quote.order.customerEmail,
              customerPhone: quote.order.customerPhone,
              deliveryFeeNGN: quote.amountNGN,
              subtotalNGN: quote.order.subtotalNGN,
              totalNGN: quote.order.totalNGN + quote.amountNGN,
              quoteId: quote.id,
              expiresAt: quote.expiresAt?.toISOString() || now.toISOString(),
              decisionUrl: `${APP_URL}/account/orders/${quote.orderId}/delivery`,
            },
          });
        });

        // Notify customer
        await WhatsAppService.sendMessage({
          to: quote.order.customerPhone,
          body:
            `⚠️ *PIERCYN* — Delivery Quotation Expired\n\n` +
            `Hi ${quote.order.customerFirstName},\n\n` +
            `Your delivery quotation for order *${quote.order.orderNumber}* has expired.\n\n` +
            `Our team has been notified and will follow up with you shortly regarding your order status.\n\n` +
            `Thank you for your patience.`,
        });

        // Notify merchant
        await WhatsAppService.sendToMerchant(
          `⚠️ *Delivery quotation EXPIRED*\n\nOrder: *${quote.order.orderNumber}*\nFee: ${formatNGN(quote.amountNGN)}\nVersion: v${quote.version}\n\nPlease review the order and product payment status.`
        );

        result.expired++;
      } catch (err: any) {
        result.errors.push(`Expiry failed for quote ${quote.id}: ${err.message}`);
      }
    }

    // Expiry events are committed inside the loop transactions. Start the
    // outbox after those commits so customer/admin notifications are prompt.
    if (result.expired > 0) {
      triggerNotificationProcessingAsync();
    }
    return result;
  }
}
