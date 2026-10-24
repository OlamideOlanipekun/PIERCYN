import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateMany: vi.fn(),
  getSmtpConfig: vi.fn(),
  getMailTransporter: vi.fn(),
  verify: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock('../apps/api/src/db/prisma', () => ({
  prisma: { notificationJob: { updateMany: mocks.updateMany } },
}));

vi.mock('../apps/api/src/modules/notifications/emailConfig', () => ({
  getSmtpConfig: mocks.getSmtpConfig,
  getMailTransporter: mocks.getMailTransporter,
  sanitizeError: (error: unknown) => error instanceof Error ? error.message : String(error),
}));

import { NotificationWorker } from '../apps/api/src/modules/notifications/notificationWorker';

describe('NotificationWorker SMTP safeguards', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.spyOn(NotificationWorker, 'recoverStaleLocks').mockResolvedValue(0);
    vi.spyOn(NotificationWorker, 'claimPendingJobs').mockResolvedValue([]);
    mocks.getSmtpConfig.mockReturnValue({
      host: 'smtp.example.test', port: 465, secure: true, user: 'sender@example.test',
      pass: 'test-password', adminEmail: 'admin@example.test',
    });
    mocks.getMailTransporter.mockReturnValue({ verify: mocks.verify, sendMail: mocks.sendMail });
  });

  it('leaves queued notifications untouched when SMTP verification fails', async () => {
    mocks.verify.mockRejectedValue(new Error('Invalid SMTP credentials'));

    const result = await NotificationWorker.processNotifications(2);

    expect(result.skipped).toBe(true);
    expect(result.claimed).toBe(0);
    expect(result.message).toContain('queued notifications were left pending');
    expect(NotificationWorker.claimPendingJobs).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('requeues jobs previously failed for SMTP authentication after verification succeeds', async () => {
    mocks.verify.mockResolvedValue(true);

    const result = await NotificationWorker.processNotifications(2);

    expect(result.skipped).toBe(false);
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: 'FAILED',
        lastError: { startsWith: 'Authentication error:' },
      },
      data: expect.objectContaining({
        status: 'PENDING',
        attempts: 0,
        lastError: null,
      }),
    }));
    expect(NotificationWorker.claimPendingJobs).toHaveBeenCalledOnce();
  });
});
