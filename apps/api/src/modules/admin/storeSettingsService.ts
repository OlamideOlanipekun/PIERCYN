import { prisma } from '../../db/prisma';
import { COMMERCE_CONFIG } from '../../config/constants';

const LOW_STOCK_ACTION = 'STORE_SETTING_UPDATED';
const LOW_STOCK_RESOURCE = 'STORE_SETTING';
const LOW_STOCK_KEY = 'lowStockThreshold';
const MAX_LOW_STOCK_THRESHOLD = 10000;

export function isValidLowStockThreshold(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= MAX_LOW_STOCK_THRESHOLD;
}

export async function getLowStockThreshold(): Promise<number> {
  const saved = await prisma.auditLog.findFirst({
    where: {
      action: LOW_STOCK_ACTION,
      resourceType: LOW_STOCK_RESOURCE,
      resourceId: LOW_STOCK_KEY,
    },
    orderBy: { createdAt: 'desc' },
    select: { newValue: true },
  });
  const value = saved?.newValue === null || saved?.newValue === undefined
    ? NaN
    : Number(saved.newValue);
  return isValidLowStockThreshold(value) ? value : COMMERCE_CONFIG.INVENTORY.LOW_STOCK_THRESHOLD;
}

export async function saveLowStockThreshold(value: number): Promise<void> {
  if (!isValidLowStockThreshold(value)) {
    throw new Error(`Low-stock threshold must be a whole number between 0 and ${MAX_LOW_STOCK_THRESHOLD}.`);
  }
  const previousValue = await getLowStockThreshold();
  await prisma.auditLog.create({
    data: {
      action: LOW_STOCK_ACTION,
      resourceType: LOW_STOCK_RESOURCE,
      resourceId: LOW_STOCK_KEY,
      oldValue: String(previousValue),
      newValue: String(value),
    },
  });
}
