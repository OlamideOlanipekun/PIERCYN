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
  status?: 'IN_STOCK' | 'LOW_STOCK' | 'SOLD_OUT';
}

export interface ReserveResult {
  success: boolean;
  reservationId?: string;
  error?: string;
}

export interface BulkAdjustmentItem {
  variantId: string;
  quantity: number;
  type: 'PURCHASE' | 'DAMAGE' | 'ADJUSTMENT' | 'SET_EXACT' | 'RESTOCK' | 'RETURN';
  reference?: string;
  reason?: string;
}

export class InventoryService {
  /**
   * Default low stock threshold if not configured.
   */
  public static readonly DEFAULT_LOW_STOCK_THRESHOLD = 3;

  /**
   * Get current stock status for a variant from in-memory dbStore or fallback.
   */
  public static getVariantStock(variantId: string): DbInventory | null {
    const inv = dbStore.inventory.get(variantId);
    if (!inv) return null;
    return inv;
  }

  /**
   * Get current stock status for a variant with threshold-aware status.
   */
  public static getStockStatus(variantId: string): StockCheckResult | null {
    const inv = dbStore.inventory.get(variantId);
    if (!inv) return null;
    const variant = dbStore.variants.get(variantId);
    const threshold = inv.reorderLevel ?? this.DEFAULT_LOW_STOCK_THRESHOLD;
    const available = inv.availableStock;
    const stockQty = inv.stockQuantity ?? (inv.availableStock + inv.reservedStock);

    const status: 'IN_STOCK' | 'LOW_STOCK' | 'SOLD_OUT' =
      available <= 0
        ? 'SOLD_OUT'
        : available <= threshold
        ? 'LOW_STOCK'
        : 'IN_STOCK';

    return {
      variantId: inv.variantId,
      sku: variant?.sku,
      available,
      availableStock: available,
      stockQuantity: stockQty,
      reservedQuantity: inv.reservedStock,
      reservedStock: inv.reservedStock,
      soldStock: inv.soldStock,
      damagedStock: inv.damagedStock,
      returnedStock: inv.returnedStock,
      totalStock: stockQty + inv.soldStock,
      reorderLevel: threshold,
      belowReorder: available <= threshold && available > 0,
      status,
    };
  }

  /**
   * Check availability for a single variant or multiple variants.
   */
  public static checkAvailability(
    variantIdOrItems: string | Array<{ variantId: string; quantity: number }>,
    qty?: number
  ): any {
    if (typeof variantIdOrItems === 'string') {
      const inv = dbStore.inventory.get(variantIdOrItems);
      const needed = qty !== undefined ? qty : 1;
      return (inv ? inv.availableStock : 0) >= needed;
    }
    const availabilityMap = new Map<string, number>();
    for (const item of variantIdOrItems) {
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
    if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
      return false;
    }

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
      referenceType: 'ORDER',
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
        referenceType: 'ORDER',
        reason: 'Reservation released/expired',
        createdAt: new Date().toISOString(),
      });
    }

    return true;
  }

  /**
   * Finalize a sale — converts reserved or available stock to sold.
   * Fully idempotent: prevents duplicate deductions for the same order and variant.
   */
  public static finalizeSale(
    variantId: string,
    quantity: number,
    orderNumber: string
  ): boolean {
    const inv = dbStore.inventory.get(variantId);
    if (!inv) return false;

    // Idempotency check: if a SALE transaction already exists for this orderNumber and variantId, do not deduct again!
    const alreadyDeducted = dbStore.inventoryTransactions.some(
      (tx) => tx.reference === orderNumber && tx.variantId === variantId && tx.type === 'SALE'
    );
    if (alreadyDeducted) {
      return true;
    }

    // Check for active reservations matching this orderNumber
    let reservedForThisOrder = 0;
    for (const res of dbStore.reservations.values()) {
      if (res.reference === orderNumber && res.variantId === variantId && res.status === 'ACTIVE') {
        res.status = 'FULFILLED';
        reservedForThisOrder += res.quantity;
      }
    }

    const previousStock = inv.stockQuantity ?? (inv.availableStock + inv.reservedStock);

    if (reservedForThisOrder > 0) {
      // Reserved quantity was already removed from availableStock at reservation time.
      // Now decrement physical stockQuantity and reservedStock.
      inv.reservedStock = Math.max(0, inv.reservedStock - reservedForThisOrder);
      inv.stockQuantity = Math.max(0, previousStock - quantity);
      inv.availableStock = Math.max(0, inv.stockQuantity - inv.reservedStock);
      inv.soldStock += quantity;
    } else {
      // Direct deduction (no reservation held)
      if (inv.availableStock < quantity) {
        return false;
      }
      inv.stockQuantity = Math.max(0, previousStock - quantity);
      inv.availableStock = Math.max(0, inv.stockQuantity - inv.reservedStock);
      inv.soldStock += quantity;
    }

    inv.updatedAt = new Date().toISOString();

    dbStore.inventoryTransactions.unshift({
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      inventoryId: inv.id,
      variantId,
      quantity: -quantity,
      previousStock,
      newStock: inv.stockQuantity,
      type: 'SALE',
      reference: orderNumber,
      referenceType: 'ORDER',
      reason: `Sale finalized for order ${orderNumber}`,
      createdAt: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Restore inventory if an order is cancelled or refunded.
   * If stock was deducted via SALE, restore stockQuantity and decrement soldStock.
   * If stock was held via reservation, release reservation.
   * Idempotent: cannot restore twice.
   */
  public static restoreOrderStock(orderNumber: string): { restored: boolean; unitsRestored: number } {
    // 1. Release any active reservations for this order
    this.releaseReservation(orderNumber);

    // 2. Check if already restored
    const alreadyRestored = dbStore.inventoryTransactions.some(
      (tx) => tx.reference === orderNumber && tx.type === 'RETURN' && tx.referenceType === 'ORDER'
    );
    if (alreadyRestored) {
      return { restored: false, unitsRestored: 0 };
    }

    // 3. Find SALE transactions for this order
    const saleTxs = dbStore.inventoryTransactions.filter(
      (tx) => tx.reference === orderNumber && tx.type === 'SALE'
    );

    if (saleTxs.length === 0) {
      return { restored: false, unitsRestored: 0 };
    }

    let totalRestored = 0;
    for (const saleTx of saleTxs) {
      const inv = dbStore.inventory.get(saleTx.variantId);
      if (!inv) continue;

      const qty = Math.abs(saleTx.quantity);
      const prevStock = inv.stockQuantity ?? (inv.availableStock + inv.reservedStock);
      inv.stockQuantity = prevStock + qty;
      inv.availableStock = Math.max(0, inv.stockQuantity - inv.reservedStock);
      inv.soldStock = Math.max(0, inv.soldStock - qty);
      inv.updatedAt = new Date().toISOString();
      totalRestored += qty;

      dbStore.inventoryTransactions.unshift({
        id: `tx-rest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        inventoryId: inv.id,
        variantId: saleTx.variantId,
        quantity: qty,
        previousStock: prevStock,
        newStock: inv.stockQuantity,
        type: 'RETURN',
        reference: orderNumber,
        referenceType: 'ORDER',
        reason: `Order ${orderNumber} cancelled/refunded, stock restored`,
        createdAt: new Date().toISOString(),
      });
    }

    return { restored: true, unitsRestored: totalRestored };
  }

  /**
   * Adjust stock manually (e.g. Purchase, Damage, Audit adjustment, Set exact).
   * Validates non-negative integer values.
   */
  public static adjustStock(
    variantId: string,
    quantity: number,
    type: 'PURCHASE' | 'SALE' | 'RESERVATION' | 'RELEASE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE' | 'RESTOCK' | 'SET_EXACT',
    reference: string,
    reason?: string,
    adminId?: string
  ): boolean {
    if (!Number.isFinite(quantity) || !Number.isInteger(quantity)) {
      throw new Error('Stock adjustment quantity must be a whole integer.');
    }

    const inv = dbStore.inventory.get(variantId);
    if (!inv) return false;

    const previousStock = inv.stockQuantity ?? (inv.availableStock + inv.reservedStock);
    let newStock = previousStock;
    let delta = 0;

    if (type === 'ADJUSTMENT' || type === 'SET_EXACT') {
      if (quantity < 0) {
        throw new Error('Stock quantity must be a non-negative integer.');
      }
      newStock = quantity;
      delta = newStock - previousStock;
    } else if (type === 'PURCHASE' || type === 'RESTOCK' || type === 'RETURN') {
      if (quantity <= 0) {
        throw new Error('Stock increase quantity must be a positive whole number.');
      }
      newStock = previousStock + quantity;
      delta = quantity;
      if (type === 'RETURN') {
        inv.returnedStock += quantity;
      }
    } else if (type === 'DAMAGE' || type === 'SALE') {
      if (quantity <= 0) {
        throw new Error('Stock reduction quantity must be a positive whole number.');
      }
      if (previousStock < quantity) {
        throw new Error(`Cannot reduce stock below 0. Current physical stock is ${previousStock}.`);
      }
      newStock = previousStock - quantity;
      delta = -quantity;
      if (type === 'DAMAGE') {
        inv.damagedStock += quantity;
      }
    } else {
      newStock = Math.max(0, previousStock - quantity);
      delta = -quantity;
    }

    if (newStock < 0) {
      throw new Error('Stock quantity cannot become negative.');
    }

    inv.stockQuantity = newStock;
    inv.availableStock = Math.max(0, newStock - inv.reservedStock);
    inv.updatedAt = new Date().toISOString();

    const txType =
      type === 'PURCHASE' ? 'PURCHASE' :
      type === 'RESTOCK' ? 'RESTOCK' :
      type === 'DAMAGE' ? 'DAMAGE' :
      type === 'RETURN' ? 'RETURN' :
      type === 'ADJUSTMENT' || type === 'SET_EXACT' ? 'ADJUSTMENT' : type;

    dbStore.inventoryTransactions.unshift({
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      inventoryId: inv.id,
      variantId,
      quantity: delta,
      previousStock,
      newStock,
      type: txType as any,
      reference,
      referenceType: 'MANUAL',
      reason: reason || `Manual stock ${type.toLowerCase()}`,
      adminId,
      createdAt: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Preview bulk stock updates before saving.
   */
  public static bulkAdjustStockPreview(
    items: Array<{
      variantId: string;
      quantity: number;
      type: 'PURCHASE' | 'DAMAGE' | 'ADJUSTMENT' | 'SET_EXACT' | 'RESTOCK' | 'RETURN';
      reference?: string;
      reason?: string;
    }>
  ) {
    const previewItems = items.map((item) => {
      const inv = dbStore.inventory.get(item.variantId);
      const variant = dbStore.variants.get(item.variantId);
      const product = variant ? dbStore.products.get(variant.productId) : null;

      if (!inv || !variant) {
        return {
          variantId: item.variantId,
          sku: variant?.sku || item.variantId,
          productName: product?.name || 'Unknown',
          previousStockQuantity: 0,
          previousAvailableStock: 0,
          adjustmentQuantity: item.quantity,
          type: item.type,
          resultingStockQuantity: 0,
          resultingAvailableStock: 0,
          valid: false,
          error: 'Variant or inventory record not found',
        };
      }

      if (!Number.isFinite(item.quantity) || !Number.isInteger(item.quantity)) {
        return {
          variantId: item.variantId,
          sku: variant.sku,
          productName: product?.name || 'Unknown',
          previousStockQuantity: inv.stockQuantity ?? (inv.availableStock + inv.reservedStock),
          previousAvailableStock: inv.availableStock,
          adjustmentQuantity: item.quantity,
          type: item.type,
          resultingStockQuantity: 0,
          resultingAvailableStock: 0,
          valid: false,
          error: 'Quantity must be a whole integer',
        };
      }

      const prevStock = inv.stockQuantity ?? (inv.availableStock + inv.reservedStock);
      let resultingStock = prevStock;

      if (item.type === 'ADJUSTMENT' || item.type === 'SET_EXACT') {
        if (item.quantity < 0) {
          return {
            variantId: item.variantId,
            sku: variant.sku,
            productName: product?.name || 'Unknown',
            previousStockQuantity: prevStock,
            previousAvailableStock: inv.availableStock,
            adjustmentQuantity: item.quantity,
            type: item.type,
            resultingStockQuantity: 0,
            resultingAvailableStock: 0,
            valid: false,
            error: 'Stock quantity must be non-negative',
          };
        }
        resultingStock = item.quantity;
      } else if (item.type === 'PURCHASE' || item.type === 'RESTOCK' || item.type === 'RETURN') {
        if (item.quantity <= 0) {
          return {
            variantId: item.variantId,
            sku: variant.sku,
            productName: product?.name || 'Unknown',
            previousStockQuantity: prevStock,
            previousAvailableStock: inv.availableStock,
            adjustmentQuantity: item.quantity,
            type: item.type,
            resultingStockQuantity: 0,
            resultingAvailableStock: 0,
            valid: false,
            error: 'Quantity to add must be greater than zero',
          };
        }
        resultingStock = prevStock + item.quantity;
      } else if (item.type === 'DAMAGE') {
        if (item.quantity <= 0) {
          return {
            variantId: item.variantId,
            sku: variant.sku,
            productName: product?.name || 'Unknown',
            previousStockQuantity: prevStock,
            previousAvailableStock: inv.availableStock,
            adjustmentQuantity: item.quantity,
            type: item.type,
            resultingStockQuantity: 0,
            resultingAvailableStock: 0,
            valid: false,
            error: 'Quantity to remove must be greater than zero',
          };
        }
        if (prevStock < item.quantity) {
          return {
            variantId: item.variantId,
            sku: variant.sku,
            productName: product?.name || 'Unknown',
            previousStockQuantity: prevStock,
            previousAvailableStock: inv.availableStock,
            adjustmentQuantity: item.quantity,
            type: item.type,
            resultingStockQuantity: 0,
            resultingAvailableStock: 0,
            valid: false,
            error: `Cannot reduce below 0. Current stock is ${prevStock}`,
          };
        }
        resultingStock = prevStock - item.quantity;
      }

      const resultingAvailable = Math.max(0, resultingStock - inv.reservedStock);

      return {
        variantId: item.variantId,
        sku: variant.sku,
        productName: product?.name || 'Unknown',
        previousStockQuantity: prevStock,
        previousAvailableStock: inv.availableStock,
        adjustmentQuantity: item.quantity,
        type: item.type,
        resultingStockQuantity: resultingStock,
        resultingAvailableStock: resultingAvailable,
        valid: true,
      };
    });

    const allValid = previewItems.every((item) => item.valid);
    return {
      allValid,
      items: previewItems,
      totalAdjustments: previewItems.length,
    };
  }

  /**
   * Apply bulk stock adjustments atomically.
   */
  public static bulkAdjustStock(
    items: Array<{
      variantId: string;
      quantity: number;
      type: 'PURCHASE' | 'DAMAGE' | 'ADJUSTMENT' | 'SET_EXACT' | 'RESTOCK' | 'RETURN';
      reference?: string;
      reason?: string;
    }>,
    adminId?: string
  ) {
    const preview = this.bulkAdjustStockPreview(items);
    if (!preview.allValid) {
      const invalid = preview.items.find((i) => !i.valid);
      throw new Error(`Bulk adjustment validation failed: ${invalid?.error || 'Invalid items'}`);
    }

    const batchRef = `BULK-ADJ-${Date.now()}`;
    const results = [];

    for (const item of items) {
      this.adjustStock(
        item.variantId,
        item.quantity,
        item.type,
        item.reference || batchRef,
        item.reason || 'Bulk inventory adjustment',
        adminId
      );
      const inv = dbStore.inventory.get(item.variantId)!;
      results.push({
        variantId: item.variantId,
        newStock: inv.stockQuantity,
        availableStock: inv.availableStock,
      });
    }

    return {
      success: true,
      updatedCount: results.length,
      items: results,
    };
  }

  /**
   * Get all inventory items with optional filtering and threshold calculation.
   */
  public static getAllInventory(filter?: {
    lowStockOnly?: boolean;
    outOfStockOnly?: boolean;
    search?: string;
  }): any[] {
    const list: any[] = [];
    for (const [variantId, inv] of dbStore.inventory.entries()) {
      const variant = dbStore.variants.get(variantId);
      const product = variant ? dbStore.products.get(variant.productId) : null;
      if (!variant) continue;

      const threshold = inv.reorderLevel ?? this.DEFAULT_LOW_STOCK_THRESHOLD;
      const stockQty = inv.stockQuantity ?? (inv.availableStock + inv.reservedStock);

      if (filter?.outOfStockOnly && inv.availableStock > 0) continue;
      if (filter?.lowStockOnly && inv.availableStock > threshold) continue;
      if (filter?.search) {
        const s = filter.search.toLowerCase();
        const matchesSku = variant.sku.toLowerCase().includes(s);
        const matchesName = product ? product.name.toLowerCase().includes(s) : false;
        if (!matchesSku && !matchesName) continue;
      }

      list.push({
        variantId: inv.variantId,
        sku: variant.sku,
        productName: product?.name || 'Unknown',
        productId: product?.id || variant.productId,
        category: product?.categoryId || '',
        colour: variant.colour,
        size: variant.size,
        stockQuantity: stockQty,
        availableStock: inv.availableStock,
        reservedStock: inv.reservedStock,
        soldStock: inv.soldStock,
        damagedStock: inv.damagedStock,
        returnedStock: inv.returnedStock,
        status: inv.availableStock === 0
          ? 'SOLD_OUT'
          : inv.availableStock <= threshold
          ? 'LOW_STOCK'
          : 'IN_STOCK',
        reorderLevel: threshold,
        updatedAt: inv.updatedAt,
      });
    }
    return list;
  }

  /**
   * Retrieve ledger transaction history for a variant or all variants.
   */
  public static getLedger(variantId?: string, limit: number = 100): DbInventoryTransaction[] {
    let list = dbStore.inventoryTransactions;
    if (variantId) {
      list = list.filter((tx) => tx.variantId === variantId);
    }
    return list
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
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
