import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';

const mockDb = vi.hoisted(() => ({
  adminFindUnique: vi.fn(),
  adminUpdate: vi.fn(),
  auditFindFirst: vi.fn(),
  auditFindMany: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock('../apps/api/src/db/prisma', () => ({
  prisma: {
    admin: {
      findUnique: mockDb.adminFindUnique,
      update: mockDb.adminUpdate,
    },
    auditLog: {
      findFirst: mockDb.auditFindFirst,
      findMany: mockDb.auditFindMany,
      create: mockDb.auditCreate,
    },
  },
}));

import { AdminAuthService } from '../apps/api/src/modules/admin/adminAuthService';
import { getLowStockThreshold, saveLowStockThreshold } from '../apps/api/src/modules/admin/storeSettingsService';

describe('persistent admin authentication safeguards', () => {
  let revoked = false;
  let savedThreshold: string | null = null;

  beforeEach(async () => {
    vi.clearAllMocks();
    revoked = false;
    savedThreshold = null;
    const passwordHash = await bcrypt.hash('correct-password', 4);
    mockDb.adminFindUnique.mockResolvedValue({
      id: 'admin-test',
      email: 'admin@example.test',
      name: 'Test Admin',
      isActive: true,
      passwordHash,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    mockDb.adminUpdate.mockResolvedValue({});
    mockDb.auditFindMany.mockResolvedValue([]);
    mockDb.auditFindFirst.mockImplementation(({ where }: { where: { action: string; resourceId?: string } }) => {
      if (where.action === 'ADMIN_SESSION_REVOKED' && revoked) return Promise.resolve({ id: 'revoke-log' });
      if (where.resourceId === 'lowStockThreshold' && savedThreshold !== null) {
        return Promise.resolve({ newValue: savedThreshold });
      }
      return Promise.resolve(null);
    });
    mockDb.auditCreate.mockImplementation(({ data }: { data: { action: string; resourceType?: string; resourceId?: string; newValue?: string } }) => {
      if (data.action === 'ADMIN_SESSION_REVOKED') revoked = true;
      if (data.resourceType === 'STORE_SETTING' && data.resourceId === 'lowStockThreshold') {
        savedThreshold = data.newValue ?? null;
      }
      return Promise.resolve({ id: 'auth-log' });
    });
  });

  it('checks persistent revocation records on every token validation', async () => {
    const { token } = await AdminAuthService.login('admin@example.test', 'correct-password', '198.51.100.4');
    expect(await AdminAuthService.verifyToken(token)).not.toBeNull();

    await AdminAuthService.logout(token);

    expect(mockDb.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'ADMIN_SESSION_REVOKED',
        resourceType: 'ADMIN_AUTH',
        resourceId: expect.not.stringContaining(token),
      }),
    }));
    expect(await AdminAuthService.verifyToken(token)).toBeNull();
  });

  it('blocks after five recent failures using persisted shared records', async () => {
    mockDb.auditFindMany.mockResolvedValue(
      Array.from({ length: 5 }, () => ({ createdAt: new Date() }))
    );

    await expect(
      AdminAuthService.login('admin@example.test', 'wrong-password', '198.51.100.5')
    ).rejects.toThrow(/temporarily locked/);
    expect(mockDb.adminFindUnique).not.toHaveBeenCalled();
  });

  it('loads and persists the low-stock threshold across requests', async () => {
    savedThreshold = '4';
    expect(await getLowStockThreshold()).toBe(4);

    await saveLowStockThreshold(7);

    expect(await getLowStockThreshold()).toBe(7);
    expect(mockDb.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'STORE_SETTING_UPDATED',
        resourceType: 'STORE_SETTING',
        resourceId: 'lowStockThreshold',
        newValue: '7',
      }),
    }));
  });
});
