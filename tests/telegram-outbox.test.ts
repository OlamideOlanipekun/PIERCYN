import { describe, expect, it, vi } from 'vitest';
process.env.DATABASE_URL_TEST = process.env.DATABASE_URL_TEST || 'postgresql://mock:mock@localhost:5432/mock_test';
import { OutboxProcessor } from '../apps/api/src/modules/notifications/outboxProcessor';
import { telegramService } from '../apps/api/src/modules/telegram/telegramService';
import { prisma } from '../packages/db/src/client';
import * as emailConfig from '../apps/api/src/modules/notifications/emailConfig';
import { AffiliateNotificationService } from '../apps/api/src/modules/affiliate/affiliateNotificationService';

describe('Telegram transactional outbox', () => {
  it('renders the required new-order details and escapes Telegram HTML', () => {
    const message = (OutboxProcessor as any).formatTelegramMessage('ORDER_CREATED', {
      orderId: 'ord_1',
      orderNumber: 'PCY-123456',
      customerName: 'Ada <Admin>',
      customerEmail: 'ada@example.com',
      customerPhone: '+2348000000000',
      items: [{ name: 'Black <Tee>', quantity: 2, size: 'M' }],
      subtotalNGN: 4500000,
      deliveryFeeNGN: 0,
      totalNGN: 4500000,
      quoteStatus: 'PENDING',
      paymentStatus: 'PENDING',
      createdAt: '2026-11-12T17:00:00.000Z',
    });

    expect(message).toContain('PIERCYN — NEW ORDER');
    expect(message).toContain('PCY-123456');
    expect(message).toContain('ada@example.com');
    expect(message).toContain('Black &lt;Tee&gt;');
    expect(message).toContain('Pending quotation');
    expect(message).toContain('PENDING');
    expect(message).not.toContain('Ada <Admin>');
  });

  it('sends each Telegram delivery to its own recipient instead of broadcasting', async () => {
    vi.spyOn(OutboxProcessor, 'recoverStaleLocks').mockResolvedValue(0);
    vi.spyOn(OutboxProcessor, 'fanOutEvents').mockResolvedValue(0);
    vi.spyOn(prisma.notificationDelivery, 'findMany').mockResolvedValueOnce([
      {
        id: 'delivery_1',
        channel: 'TELEGRAM',
        recipientKey: '987654321',
        status: 'PENDING',
        attempts: 0,
        maxAttempts: 5,
        nextAttemptAt: new Date(),
        event: {
          id: 'event_1',
          eventType: 'ORDER_CREATED',
          payload: { orderId: 'order_1', orderNumber: 'PCY-123456', totalNGN: 100000 },
        },
      },
    ] as any);
    vi.spyOn(prisma.notificationDelivery, 'updateMany').mockResolvedValue({ count: 1 } as any);
    vi.spyOn(prisma.notificationDelivery, 'update').mockResolvedValue({} as any);
    const sendSpy = vi.spyOn(telegramService, 'notifyRecipient').mockResolvedValue({ messageId: 'msg_1' });

    const result = await OutboxProcessor.processDeliveries(1);

    expect(result.sent).toBe(1);
    expect(sendSpy).toHaveBeenCalledOnce();
    expect(sendSpy).toHaveBeenCalledWith('987654321', expect.stringContaining('PCY-123456'));
  });

  it('keeps customer email pending when SMTP is unavailable', async () => {
    vi.spyOn(OutboxProcessor, 'recoverStaleLocks').mockResolvedValue(0);
    vi.spyOn(OutboxProcessor, 'fanOutEvents').mockResolvedValue(0);
    vi.spyOn(emailConfig, 'getCustomerSmtpConfig').mockReturnValue(null);
    vi.spyOn(emailConfig, 'getCustomerMailTransporter').mockReturnValue(null);
    vi.spyOn(prisma.notificationDelivery, 'findMany').mockResolvedValueOnce([
      {
        id: 'email_delivery_1',
        channel: 'EMAIL',
        recipientKey: 'customer@example.com',
        status: 'PENDING',
        attempts: 0,
        maxAttempts: 5,
        nextAttemptAt: new Date(),
        event: {
          id: 'event_email_1',
          eventType: 'ORDER_CREATED',
          payload: { orderId: 'order_email_1', orderNumber: 'PCY-EMAIL-1', customerEmail: 'customer@example.com' },
        },
      },
    ] as any);
    const updateManySpy = vi.spyOn(prisma.notificationDelivery, 'updateMany').mockResolvedValue({ count: 1 } as any);
    const updateSpy = vi.spyOn(prisma.notificationDelivery, 'update').mockResolvedValue({} as any);

    const result = await OutboxProcessor.processDeliveries(1);

    expect(result.sent).toBe(0);
    expect(result.retried).toBe(1);
    expect(updateManySpy).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PROCESSING' }),
    }));
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PENDING', attempts: 1 }),
    }));
    expect(updateSpy).not.toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'SENT' }),
    }));
  });

  it('queues affiliate email content as a durable outbox event', async () => {
    const upsertSpy = vi.spyOn(prisma.notificationEvent, 'upsert').mockResolvedValue({ id: 'affiliate_event_1' } as any);

    await AffiliateNotificationService.notifyApplicationSubmitted({
      email: 'creator@example.com',
      firstName: 'Creator',
    });

    expect(upsertSpy).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        eventType: 'AFFILIATE_EMAIL',
        payload: expect.objectContaining({
          email: 'creator@example.com',
          notifyTelegram: false,
          text: expect.any(String),
        }),
      }),
    }));
  });
});
