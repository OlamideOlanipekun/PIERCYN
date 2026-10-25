import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  inventoryFindMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../apps/api/src/db/prisma', () => ({
  prisma: {
    inventory: { findMany: mocks.inventoryFindMany },
    $transaction: mocks.transaction,
  },
}));

vi.mock('../apps/api/src/modules/notifications', () => ({
  NotificationQueueService: { queueOutOfStock: vi.fn() },
  triggerNotificationProcessingAsync: vi.fn(),
}));

import { InventoryService } from '../apps/api/src/modules/inventory/inventoryService';

describe('InventoryService.restockAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('previews the same addition across every inventory record', async () => {
    mocks.inventoryFindMany.mockResolvedValue([
      { stockQuantity: 10, reservedQuantity: 2 },
      { stockQuantity: 2, reservedQuantity: 5 },
    ]);

    const preview = await InventoryService.previewRestockAll(3);

    expect(preview).toEqual({
      variantCount: 2,
      quantityPerVariant: 3,
      totalUnitsAdded: 6,
      currentPhysicalStock: 12,
      resultingPhysicalStock: 18,
      currentAvailableStock: 8,
      resultingAvailableStock: 11,
    });
    expect(mocks.inventoryFindMany).toHaveBeenCalledWith({
      select: { stockQuantity: true, reservedQuantity: true },
    });
  });

  it('atomically increments all stock and writes a RESTOCK ledger record per variant', async () => {
    const before = [
      { id: 'inv-1', variantId: 'var-1', stockQuantity: 10, reservedQuantity: 2 },
      { id: 'inv-2', variantId: 'var-2', stockQuantity: 2, reservedQuantity: 5 },
    ];
    const after = [
      { id: 'inv-1', variantId: 'var-1', stockQuantity: 13, reservedQuantity: 2 },
      { id: 'inv-2', variantId: 'var-2', stockQuantity: 5, reservedQuantity: 5 },
    ];
    const tx = {
      inventory: {
        findMany: vi.fn().mockResolvedValueOnce(before).mockResolvedValueOnce(after),
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      inventoryTransaction: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
    };
    mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));

    const result = await InventoryService.restockAll(3, 'BULK-001', 'New delivery', 'admin-1');

    expect(tx.inventory.updateMany).toHaveBeenCalledWith({
      where: { variantId: { in: ['var-1', 'var-2'] } },
      data: { stockQuantity: { increment: 3 } },
    });
    expect(tx.inventoryTransaction.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          inventoryId: 'inv-1', variantId: 'var-1', type: 'RESTOCK', quantity: 3,
          previousStock: 10, newStock: 13, referenceId: 'BULK-001', reason: 'New delivery', adminId: 'admin-1',
        }),
        expect.objectContaining({
          inventoryId: 'inv-2', variantId: 'var-2', type: 'RESTOCK', quantity: 3,
          previousStock: 2, newStock: 5, referenceId: 'BULK-001', reason: 'New delivery', adminId: 'admin-1',
        }),
      ],
    });
    expect(result).toMatchObject({
      updatedCount: 2,
      quantityPerVariant: 3,
      totalUnitsAdded: 6,
      currentPhysicalStock: 12,
      resultingPhysicalStock: 18,
      currentAvailableStock: 8,
      resultingAvailableStock: 11,
    });
  });

  it('rejects invalid quantities before reading or writing inventory', async () => {
    await expect(InventoryService.restockAll(0, 'BULK-001', 'Invalid')).rejects.toThrow(/whole number/);
    await expect(InventoryService.previewRestockAll(100_001)).rejects.toThrow(/100,000/);
    expect(mocks.inventoryFindMany).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
