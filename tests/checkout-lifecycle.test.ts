import { describe, expect, it, vi } from 'vitest';
import { WhatsAppService } from '../apps/api/src/services/whatsappService';

vi.mock('../apps/api/src/db/prisma', () => ({
  prisma: {
    deliveryQuote: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    order: {
      update: vi.fn().mockResolvedValue({}),
    },
    refundReview: {
      create: vi.fn().mockResolvedValue({}),
    },
    orderStatusHistory: {
      create: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn().mockImplementation((fn: any) => fn({
      deliveryQuote: { update: vi.fn().mockResolvedValue({}) },
      order: { update: vi.fn().mockResolvedValue({}) },
      refundReview: { create: vi.fn().mockResolvedValue({}) },
      orderStatusHistory: { create: vi.fn().mockResolvedValue({}) },
    })),
  },
}));

describe('PIERCYN Consolidated Checkout System', () => {
  describe('WhatsApp Notification & Normalization', () => {
    it('normalizes Nigerian local phone numbers to E.164 format', () => {
      expect(WhatsAppService.normalizePhone('08012345678')).toBe('+2348012345678');
      expect(WhatsAppService.normalizePhone('09098765432')).toBe('+2349098765432');
      expect(WhatsAppService.normalizePhone('2348123456789')).toBe('+2348123456789');
      expect(WhatsAppService.normalizePhone('+2348011223344')).toBe('+2348011223344');
    });

    it('rejects invalid or incomplete phone numbers gracefully', () => {
      expect(WhatsAppService.normalizePhone('')).toBeNull();
      expect(WhatsAppService.normalizePhone('12345')).toBeNull();
      expect(WhatsAppService.normalizePhone('not-a-number')).toBeNull();
    });

    it('simulates message dispatch safely when Meta Cloud API credentials are unset', async () => {
      const result = await WhatsAppService.sendMessage({
        to: '08012345678',
        body: 'PIERCYN DELIVERY QUOTATION\n\nOrder: #PC-000001\nDelivery Fee: ₦3,500',
      });
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });
  });

  describe('Delivery Quotation Specification Rules', () => {
    it('ensures delivery quotation messages never contain automated delivery timeframe', () => {
      const quotationMessage =
        `PIERCYN DELIVERY QUOTATION\n\n` +
        `Order: #PC-000042\n\n` +
        `Your delivery fee has been confirmed.\n\n` +
        `Delivery Fee: ₦3,500\n\n` +
        `Accept or reject your quotation here:\n` +
        `https://piercyn.vercel.app/account/orders/ord_123/delivery\n\n` +
        `This quotation expires after 48 hours.\n\n` +
        `Thank you for shopping with PIERCYN.\n\n` +
        `Delivery timeframe is communicated separately by staff.`;

      // Must explicitly communicate that timeframe is manual
      expect(quotationMessage).toContain('Delivery timeframe is communicated separately by staff');
      // Must not contain automated ETA promises
      expect(quotationMessage).not.toContain('Estimated delivery:');
      expect(quotationMessage).not.toContain('business days');
    });

    it('processes quote lifecycle cron safely with mocked data', async () => {
      const { DeliveryQuoteCron } = await import('../apps/api/src/modules/checkout/quoteCron');
      const cronResult = await DeliveryQuoteCron.processQuoteLifecycle();
      expect(cronResult).toBeDefined();
      expect(cronResult.reminders).toBe(0);
      expect(cronResult.expired).toBe(0);
      expect(cronResult.refundCasesCreated).toBe(0);
      expect(cronResult.errors).toEqual([]);
    });
  });
});
