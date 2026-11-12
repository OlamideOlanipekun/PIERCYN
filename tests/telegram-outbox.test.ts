import { describe, expect, it, vi } from 'vitest';
process.env.DATABASE_URL_TEST = process.env.DATABASE_URL_TEST || 'postgresql://mock:mock@localhost:5432/mock_test';
import { OutboxProcessor } from '../apps/api/src/modules/notifications/outboxProcessor';
import { telegramService } from '../apps/api/src/modules/telegram/telegramService';
import { prisma } from '../packages/db/src/client';

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
});
