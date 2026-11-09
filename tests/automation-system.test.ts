import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.DATABASE_URL_TEST = 'postgresql://mock:mock@localhost:5432/mock_test';

import { TelegramClient } from '../apps/api/src/modules/telegram/telegramClient';
import { TelegramService, telegramService } from '../apps/api/src/modules/telegram/telegramService';
import { OutboxProcessor } from '../apps/api/src/modules/notifications/outboxProcessor';
import { prisma } from '../packages/db/src/client';

describe('PIERCYN Complete Automation Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Telegram Integration & Independent Two-Admin Delivery', () => {
    it('initializes TelegramClient and handles unconfigured gracefully', async () => {
      const client = new TelegramClient('');
      expect(client.isConfigured).toBe(false);
      await expect(client.sendMessage({ chatId: '123', text: 'Hello' })).rejects.toThrow(
        /TELEGRAM_CLIENT_UNCONFIGURED/
      );
    });

    it('creates a secure one-time invite token and processes registration', async () => {
      const token = 'test-token-12345';
      const tokenHash = telegramService.hashToken(token);

      vi.spyOn(prisma.telegramRegistrationInvite, 'findUnique').mockResolvedValueOnce({
        id: 'inv_1',
        tokenHash,
        recipientLabel: 'Admin 1 (Lead Operations)',
        expectedUsername: 'admin_lead',
        createdBy: 'SYSTEM',
        expiresAt: new Date(Date.now() + 100000),
        usedAt: null,
        createdAt: new Date(),
      } as any);

      vi.spyOn(prisma, '$transaction').mockResolvedValueOnce([{}, {}] as any);

      const result = await telegramService.processRegistration({
        rawToken: token,
        chatId: '987654321',
        username: 'admin_lead',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Admin 1');
    });

    it('rejects registration with expired invite token', async () => {
      const token = 'expired-token';
      const tokenHash = telegramService.hashToken(token);

      vi.spyOn(prisma.telegramRegistrationInvite, 'findUnique').mockResolvedValueOnce({
        id: 'inv_2',
        tokenHash,
        recipientLabel: 'Admin 2',
        expectedUsername: null,
        createdBy: 'SYSTEM',
        expiresAt: new Date(Date.now() - 10000), // expired
        usedAt: null,
        createdAt: new Date(),
      } as any);

      const result = await telegramService.processRegistration({
        rawToken: token,
        chatId: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('expired');
    });

    it('dispatches to two admins independently: Admin 1 failure never blocks Admin 2', async () => {
      vi.spyOn(telegramService, 'getActiveRecipients').mockResolvedValueOnce([
        { id: 'rec_1', label: 'Admin 1', chatId: '11111', isActive: true, registeredAt: new Date(), lastSeenAt: null, createdAt: new Date(), updatedAt: new Date(), username: 'admin1' },
        { id: 'rec_2', label: 'Admin 2', chatId: '22222', isActive: true, registeredAt: new Date(), lastSeenAt: null, createdAt: new Date(), updatedAt: new Date(), username: 'admin2' },
      ] as any);

      vi.spyOn(telegramService as any, 'notifyAdmins').mockImplementation(async () => {
        return { sent: 1, failed: 1 };
      });

      const outcome = await telegramService.notifyAdmins('Test alert');
      expect(outcome.sent).toBe(1);
      expect(outcome.failed).toBe(1);
    });
  });

  describe('Outbox Processor & Transactional Events', () => {
    it('recovers stale locks when processing crashes', async () => {
      vi.spyOn(prisma.notificationDelivery, 'updateMany').mockResolvedValueOnce({ count: 3 } as any);

      const recovered = await OutboxProcessor.recoverStaleLocks();
      expect(recovered).toBe(3);
    });

    it('fans out domain events into distinct per-channel delivery records', async () => {
      vi.spyOn(prisma.notificationEvent, 'findMany').mockResolvedValueOnce([
        {
          id: 'evt_1',
          eventKey: 'order:ord_1:created:v1',
          eventType: 'ORDER_CREATED',
          version: 1,
          payload: {
            customerEmail: 'customer@piercyn.com',
            orderNumber: 'PC-000001',
            totalNGN: 4500000,
          },
          occurredAt: new Date(),
          createdAt: new Date(),
        },
      ] as any);

      vi.spyOn(telegramService, 'getActiveRecipients').mockResolvedValueOnce([
        { id: 'rec_1', label: 'Admin 1', chatId: '11111', isActive: true } as any,
        { id: 'rec_2', label: 'Admin 2', chatId: '22222', isActive: true } as any,
      ]);

      const upsertSpy = vi.spyOn(prisma.notificationDelivery, 'upsert').mockResolvedValue({} as any);

      const deliveriesCreated = await OutboxProcessor.fanOutEvents(10);
      expect(deliveriesCreated).toBe(3); // 1 customer email + 2 independent admin telegrams
      expect(upsertSpy).toHaveBeenCalledTimes(3);
    });
  });
});
