import { dbStore, DbInventory, DbInventoryTransaction, DbReservation } from '../../db/store';
import { prisma } from '../../db/prisma';

export interface StockCheckResult {
  variantId: string;
  sku?: string;
  available: number;
  availableStock?: number;
  stockQuantity?: number;
  reservedQuantity?: number;
  reservedStock?: number;
  soldStock?: number;
  damagedStock?: number;
  returnedStock?: number;
  totalStock?: number;
  reorderLevel?: number;
  belowReorder?: boolean;
}

export interface ReserveResult {
  success: boolean;
  reservationId?: string;
  error?: string;
}

export class InventoryService {
  /**
   * Get current stock status for a variant from in-memory dbStore or fallback.
   */
  public static getVariantStock(variantId: string): DbInventory | null {
    const inv = dbStore.inventory.get(variantId);
    if (!inv) return null;
    return inv;
  }

  /**
   * Get current stock status for a variant.
   */
  public static getStockStatus(variantId: string): StockCheckResult | null {
    const inv = dbStore.inventory.get(variantId);
    if (!inv) return null;
    const variant = dbStore.variants.get(variantId);
    return {
      variantId: inv.variantId,
      sku: variant?.sku,
      available: inv.availableStock,
      availableStock: inv.availableStock,
      stockQuantity: inv.availableStock + inv.reservedStock,
      reservedQuantity: inv.reservedStock,
      reservedStock: inv.reservedStock,
      soldStock: inv.soldStock,
      damagedStock: inv.damagedStock,
      returnedStock: inv.returnedStock,
      totalStock: inv.availableStock + inv.reservedStock + inv.soldStock,
      reorderLevel: 5,
      belowReorder: inv.availableStock <= 5,
    };
  }

  /**
   * Check availability for multiple variants.
   */
  public static checkAvailability(
    items: Array<{ variantId: string; quantity: number }>
  ): Map<string, number> {
    const availabilityMap = new Map<string, number>();
    for (const item of items) {
      const inv = dbStore.inventory.get(item.variantId);
      availabilityMap.set(item.variantId, inv ? inv.availableStock : 0);
    }
    return availabilityMap;
  }

  /**
   * Reserve stock for a checkout session.
   */
  public static reserveStock(
    variantId: string,
    quantity: number,
    reference: string,
    expiresInMinutes: number = 15
  ): any {
    const inv = dbStore.inventory.get(variantId);
    if (!inv) {
      return false;
    }

    if (inv.availableStock < quantity) {
      return false;
    }

    inv.availableStock -= quantity;
    inv.reservedStock += quantity;
    inv.updatedAt = new Date().toISOString();

    const reservationId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    const res: DbReservation = {
      id: reservationId,
      variantId,
      quantity,
      reference,
      status: 'ACTIVE',
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    dbStore.reservations.set(reservationId, res);

    dbStore.inventoryTransactions.push({
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      inventoryId: inv.id,
      variantId,
      quantity,
      type: 'RESERVATION',
      reference,
      reason: `Reserved ${quantity} unit(s) for ${reference}`,
      createdAt: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Release a previously held reservation.
   */
  public static releaseReservation(referenceOrId: string): boolean {
    let targetRes: DbReservation | undefined;
    for (const res of dbStore.reservations.values()) {
      if ((res.id === referenceOrId || res.reference === referenceOrId) && res.status === 'ACTIVE') {
        targetRes = res;
        break;
      }
    }

    if (!targetRes) return false;

    const inv = dbStore.inventory.get(targetRes.variantId);
    if (inv) {
      inv.reservedStock = Math.max(0, inv.reservedStock - targetRes.quantity);
      inv.availableStock += targetRes.quantity;
      inv.updatedAt = new Date().toISOString();
    }

    targetRes.status = 'RELEASED';

    if (inv) {
      dbStore.inventoryTransactions.push({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        inventoryId: inv.id,
        variantId: targetRes.variantId,
        quantity: targetRes.quantity,
        type: 'RELEASE',
        reference: targetRes.reference,
        reason: 'Reservation released/expired',
        createdAt: new Date().toISOString(),
      });
    }

    return true;
  }

  /**
   * Finalize a sale — converts reserved or available stock to sold.
   */
  public static finalizeSale(
    variantId: string,
    quantity: number,
    orderNumber: string
  ): boolean {
    const inv = dbStore.inventory.get(variantId);
    if (!inv) return false;

    // Release any active reservation matching this orderNumber first
    for (const res of dbStore.reservations.values()) {
      if (res.reference === orderNumber && res.variantId === variantId && res.status === 'ACTIVE') {
        res.status = 'FULFILLED';
        inv.reservedStock = Math.max(0, inv.reservedStock - res.quantity);
      }
    }

    // Deduct stock if not already accounted for by reservation
    if (inv.availableStock >= quantity) {
      inv.availableStock -= quantity;
    }
    inv.soldStock += quantity;
    inv.updatedAt = new Date().toISOString();

    dbStore.inventoryTransactions.unshift({
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      inventoryId: inv.id,
      variantId,
      quantity,
      type: 'SALE',
      reference: orderNumber,
      reason: `Sale finalized for order ${orderNumber}`,
      createdAt: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Adjust stock manually (e.g. Purchase, Damage, Audit adjustment).
   */
  public static adjustStock(
    variantId: string,
    quantity: number,
    type: 'PURCHASE' | 'SALE' | 'RESERVATION' | 'RELEASE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE',
    reference: string,
    reason?: string
  ): boolean {
    const inv = dbStore.inventory.get(variantId);
    if (!inv) return false;

    switch (type) {
      case 'PURCHASE':
      case 'RETURN':
        inv.availableStock += quantity;
        break;
      case 'DAMAGE':
        inv.availableStock = Math.max(0, inv.availableStock - quantity);
        inv.damagedStock += quantity;
        break;
      case 'ADJUSTMENT':
        inv.availableStock = quantity;
        break;
      default:
        inv.availableStock = Math.max(0, inv.availableStock - quantity);
        break;
    }

    inv.updatedAt = new Date().toISOString();

    dbStore.inventoryTransactions.unshift({
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      inventoryId: inv.id,
      variantId,
      quantity,
      type,
      reference,
      reason,
      createdAt: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Retrieve ledger transaction history for a variant.
   */
  public static getLedger(variantId: string): DbInventoryTransaction[] {
    return dbStore.inventoryTransactions
      .filter((tx) => tx.variantId === variantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Asynchronous DB Prisma inventory check.
   */
  public static async getDbStockStatus(variantId: string) {
    return prisma.inventory.findUnique({
      where: { variantId },
      include: { variant: { select: { sku: true } } },
    });
  }
}
