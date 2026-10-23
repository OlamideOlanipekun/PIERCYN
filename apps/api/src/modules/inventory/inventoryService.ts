import { prisma } from '../../db/prisma';
import {
  NotificationQueueService,
  triggerNotificationProcessingAsync,
} from '../notifications';

export interface FinalizeSaleResult {
  finalized: boolean;
  alreadyFinalized: boolean;
  shortfall: number;
}

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

export interface BulkAdjustmentItem {
  variantId: string;
  quantity: number;
  type: 'PURCHASE' | 'DAMAGE' | 'ADJUSTMENT' | 'SET_EXACT' | 'RESTOCK' | 'RETURN';
  reference?: string;
  reason?: string;
}

export class InventoryService {
  /**
   * Default low stock threshold if not configured on the inventory item.
   */
  public static readonly DEFAULT_LOW_STOCK_THRESHOLD = 3;

  public static async getVariantStock(variantId: string) {
    return prisma.inventory.findUnique({
      where: { variantId },
    });
  }

  public static async getStockStatus(variantId: string): Promise<StockCheckResult | null> {
    const inv = await prisma.inventory.findUnique({
      where: { variantId },
      include: { variant: true },
    });

    if (!inv) return null;

    const available = Math.max(0, inv.stockQuantity - inv.reservedQuantity);
    const threshold = inv.reorderLevel ?? this.DEFAULT_LOW_STOCK_THRESHOLD;
    const status: 'IN_STOCK' | 'LOW_STOCK' | 'SOLD_OUT' =
      available <= 0
        ? 'SOLD_OUT'
        : available <= threshold
        ? 'LOW_STOCK'
        : 'IN_STOCK';

    return {
      variantId: inv.variantId,
      sku: inv.variant?.sku,
      available,
      availableStock: available,
      stockQuantity: inv.stockQuantity,
      reservedQuantity: inv.reservedQuantity,
      reservedStock: inv.reservedQuantity,
      soldStock: inv.soldQuantity,
      damagedStock: inv.damagedQuantity,
      returnedStock: inv.returnedQuantity,
      totalStock: inv.stockQuantity + inv.soldQuantity,
      reorderLevel: threshold,
      belowReorder: available <= threshold && available > 0,
      status,
    };
  }

  public static async checkAvailability(
    variantIdOrItems: string | Array<{ variantId: string; quantity: number }>,
    qty?: number
  ): Promise<any> {
    if (typeof variantIdOrItems === 'string') {
      const inv = await prisma.inventory.findUnique({
        where: { variantId: variantIdOrItems },
      });
      const needed = qty !== undefined ? qty : 1;
      const available = inv ? Math.max(0, inv.stockQuantity - inv.reservedQuantity) : 0;
      return available >= needed;
    }

    const availabilityMap = new Map<string, number>();
    for (const item of variantIdOrItems) {
      const inv = await prisma.inventory.findUnique({
        where: { variantId: item.variantId },
      });
      const available = inv ? Math.max(0, inv.stockQuantity - inv.reservedQuantity) : 0;
      availabilityMap.set(item.variantId, available);
    }
    return availabilityMap;
  }

  public static async reserveStock(
    variantId: string,
    quantity: number,
    reference: string,
    expiresInMinutes: number = 30,
    txPrisma?: any
  ): Promise<boolean> {
    if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Reservation quantity must be a positive whole number.');
    }

    const client = txPrisma || prisma;

    if (!txPrisma) {
      await InventoryService.expireReservations().catch(() => {});
    }

    const execute = async (tx: any) => {
      // Atomic conditional update: the availability check and the reservation
      // happen in one statement, so two concurrent buyers cannot reserve the
      // same last unit.
      const updated = await tx.$queryRaw<
        Array<{ id: string; stockQuantity: number; reservedQuantity: number }>
      >`
        UPDATE "Inventory"
        SET "reservedQuantity" = "reservedQuantity" + ${quantity},
            "updatedAt" = NOW()
        WHERE "variantId" = ${variantId}
          AND ("stockQuantity" - "reservedQuantity") >= ${quantity}
        RETURNING "id", "stockQuantity", "reservedQuantity"
      `;

      if (!updated || updated.length === 0) return false;
      const inv = updated[0];

      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      await tx.inventoryReservation.create({
        data: {
          variantId,
          quantity,
          reference,
          status: 'ACTIVE',
          expiresAt,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inv.id,
          variantId,
          quantity,
          previousStock: inv.stockQuantity,
          newStock: inv.stockQuantity,
          type: 'RESERVATION',
          referenceType: 'ORDER',
          referenceId: reference,
          reason: `Reserved ${quantity} unit(s) for ${reference}`,
        },
      });

      return true;
    };

    if (txPrisma) {
      return execute(txPrisma);
    }
    return client.$transaction(execute);
  }

  public static async releaseReservation(
    referenceOrId: string,
    txPrisma?: any,
    terminalStatus: 'RELEASED' | 'EXPIRED' = 'RELEASED'
  ): Promise<boolean> {
    const client = txPrisma || prisma;

    const execute = async (tx: any) => {
      // Row locks make release exactly-once even under concurrent cancellation,
      // expiry jobs and payment callbacks.
      const reservations = await tx.$queryRaw<Array<{ id: string; variantId: string; quantity: number; reference: string }>>`
        SELECT "id", "variantId", "quantity", "reference"
        FROM "InventoryReservation"
        WHERE ("id" = ${referenceOrId} OR "reference" = ${referenceOrId})
          AND "status" = 'ACTIVE'
        FOR UPDATE
      `;

      if (!reservations || reservations.length === 0) return false;

      for (const res of reservations) {
        const invRows = await tx.$queryRaw<
          Array<{ id: string; stockQuantity: number; reservedQuantity: number }>
        >`
          UPDATE "Inventory"
          SET "reservedQuantity" = GREATEST(0, "reservedQuantity" - ${res.quantity}),
              "updatedAt" = NOW()
          WHERE "variantId" = ${res.variantId}
          RETURNING "id", "stockQuantity", "reservedQuantity"
        `;

        if (invRows && invRows.length > 0) {
          const inv = invRows[0];
          await tx.inventoryTransaction.create({
            data: {
              inventoryId: inv.id,
              variantId: res.variantId,
              quantity: res.quantity,
              previousStock: inv.stockQuantity,
              newStock: inv.stockQuantity,
              type: 'RELEASE',
              referenceType: 'ORDER',
              referenceId: res.reference,
              reason: terminalStatus === 'EXPIRED' ? 'Reservation expired' : 'Reservation released',
            },
          });
        }

        await tx.inventoryReservation.update({
          where: { id: res.id },
          data: { status: terminalStatus },
        });
      }

      return true;
    };

    if (txPrisma) {
      return execute(txPrisma);
    }
    return client.$transaction(execute);
  }

  public static async finalizeSale(
    variantId: string,
    quantity: number,
    orderNumber: string,
    txPrisma?: any
  ): Promise<FinalizeSaleResult> {
    const client = txPrisma || prisma;

    const execute = async (tx: any): Promise<FinalizeSaleResult> => {
      // 1. Idempotency guard: check if SALE transaction was already logged for this order item
      const alreadySoldTx = await tx.inventoryTransaction.findFirst({
        where: {
          variantId,
          referenceId: orderNumber,
          type: 'SALE',
        },
        select: { id: true },
      });
      if (alreadySoldTx) {
        return { finalized: true, alreadyFinalized: true, shortfall: 0 };
      }

      // Check reservation status
      const alreadyFulfilled = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "InventoryReservation"
        WHERE "reference" = ${orderNumber} AND "variantId" = ${variantId} AND "status" = 'FULFILLED'
        LIMIT 1
      `;
      if (alreadyFulfilled && alreadyFulfilled.length > 0) {
        return { finalized: true, alreadyFinalized: true, shortfall: 0 };
      }

      const activeReservations = await tx.$queryRaw<Array<{ id: string; quantity: number }>>`
        SELECT "id", "quantity" FROM "InventoryReservation"
        WHERE "reference" = ${orderNumber} AND "variantId" = ${variantId} AND "status" = 'ACTIVE'
        FOR UPDATE
      `;
      const reservedQty = (activeReservations || []).reduce((sum: number, r: any) => sum + r.quantity, 0);

      // Payment arrived after expiry and stock is no longer available: never
      // oversell. The caller flags the order for manual reconciliation.
      if (reservedQty > 0 && reservedQty < quantity) {
        return { finalized: false, alreadyFinalized: false, shortfall: quantity - reservedQty };
      }

      const invRows = reservedQty >= quantity
        ? await tx.$queryRaw<Array<{ id: string; stockQuantity: number; reservedQuantity: number; soldQuantity: number }>>`
            UPDATE "Inventory"
            SET "stockQuantity" = "stockQuantity" - ${quantity},
                "reservedQuantity" = GREATEST(0, "reservedQuantity" - ${reservedQty}),
                "soldQuantity" = "soldQuantity" + ${quantity},
                "updatedAt" = NOW()
            WHERE "variantId" = ${variantId} AND "stockQuantity" >= ${quantity}
            RETURNING "id", "stockQuantity", "reservedQuantity", "soldQuantity"
          `
        : await tx.$queryRaw<Array<{ id: string; stockQuantity: number; reservedQuantity: number; soldQuantity: number }>>`
            UPDATE "Inventory"
            SET "stockQuantity" = "stockQuantity" - ${quantity},
                "soldQuantity" = "soldQuantity" + ${quantity},
                "updatedAt" = NOW()
            WHERE "variantId" = ${variantId}
              AND ("stockQuantity" - "reservedQuantity") >= ${quantity}
            RETURNING "id", "stockQuantity", "reservedQuantity", "soldQuantity"
          `;

      if (!invRows || invRows.length === 0) {
        return { finalized: false, alreadyFinalized: false, shortfall: quantity };
      }

      for (const res of activeReservations || []) {
        await tx.inventoryReservation.update({
          where: { id: res.id },
          data: { status: 'FULFILLED' },
        });
      }

      const inv = invRows[0];
      const invTx = await tx.inventoryTransaction.create({
        data: {
          inventoryId: inv.id,
          variantId,
          quantity: -quantity,
          previousStock: inv.stockQuantity + quantity,
          newStock: inv.stockQuantity,
          type: 'SALE',
          referenceType: 'ORDER',
          referenceId: orderNumber,
          reason: `Sale finalized for order ${orderNumber}`,
        },
      });

      // Queue PRODUCT_OUT_OF_STOCK if inventory transitioned from positive to 0
      if (inv.stockQuantity === 0 && (inv.stockQuantity + quantity) > 0) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true },
        });
        if (variant) {
          await NotificationQueueService.queueOutOfStock(
            variant,
            invTx.id,
            orderNumber,
            `Sold out on finalized order ${orderNumber}`,
            variant.product?.name,
            tx
          );
        }
      }

      return { finalized: true, alreadyFinalized: false, shortfall: 0 };
    };

    if (txPrisma) {
      return execute(txPrisma);
    }
    return client.$transaction(execute);
  }

  /**
   * Restore stock if an order is cancelled or refunded.
   * If stock was previously finalized/deducted via SALE, restore stockQuantity and decrement soldQuantity.
   * If stock was held via reservation, release reservation.
   * Fully idempotent: prevents duplicate restoration.
   */
  public static async restoreOrderStock(
    orderNumber: string,
    txPrisma?: any
  ): Promise<{ restored: boolean; alreadyRestored: boolean; unitsRestored: number }> {
    const client = txPrisma || prisma;

    const execute = async (tx: any) => {
      // 1. Release any active reservations
      await this.releaseReservation(orderNumber, tx);

      // 2. Check if already restored
      const alreadyRestored = await tx.inventoryTransaction.findFirst({
        where: {
          referenceId: orderNumber,
          type: 'RETURN',
          referenceType: 'ORDER',
        },
        select: { id: true },
      });
      if (alreadyRestored) {
        return { restored: false, alreadyRestored: true, unitsRestored: 0 };
      }

      // 3. Find all SALE transactions for this order
      const saleTxs = await tx.inventoryTransaction.findMany({
        where: {
          referenceId: orderNumber,
          type: 'SALE',
        },
      });

      if (!saleTxs || saleTxs.length === 0) {
        return { restored: false, alreadyRestored: false, unitsRestored: 0 };
      }

      let totalRestored = 0;
      for (const saleTx of saleTxs) {
        const qty = Math.abs(saleTx.quantity);
        const invRows = await tx.$queryRaw<Array<{ id: string; stockQuantity: number; reservedQuantity: number; soldQuantity: number }>>`
          UPDATE "Inventory"
          SET "stockQuantity" = "stockQuantity" + ${qty},
              "soldQuantity" = GREATEST(0, "soldQuantity" - ${qty}),
              "updatedAt" = NOW()
          WHERE "variantId" = ${saleTx.variantId}
          RETURNING "id", "stockQuantity", "reservedQuantity", "soldQuantity"
        `;

        if (invRows && invRows.length > 0) {
          const inv = invRows[0];
          totalRestored += qty;
          await tx.inventoryTransaction.create({
            data: {
              inventoryId: inv.id,
              variantId: saleTx.variantId,
              type: 'RETURN',
              quantity: qty,
              previousStock: inv.stockQuantity - qty,
              newStock: inv.stockQuantity,
              referenceType: 'ORDER',
              referenceId: orderNumber,
              reason: `Order ${orderNumber} cancelled/refunded, inventory restored`,
            },
          });
        }
      }

      return { restored: true, alreadyRestored: false, unitsRestored: totalRestored };
    };

    if (txPrisma) {
      return execute(txPrisma);
    }
    return client.$transaction(execute);
  }

  /**
   * Releases reservations whose payment window elapsed. Receipts submitted
   * before expiry move the order into manual review and are never auto-released
   * while a genuine bank payment may still exist.
   *
   * Safe to run repeatedly: every release is row-locked and state-checked.
   */
  public static async expireReservations(now: Date = new Date()): Promise<{
    released: number;
    expired: number;
    flaggedForReview: number;
  }> {
    const candidates = await prisma.inventoryReservation.findMany({
      where: { status: 'ACTIVE', expiresAt: { lte: now } },
      orderBy: { expiresAt: 'asc' },
      take: 200,
    });

    if (candidates.length === 0) {
      return { released: 0, expired: 0, flaggedForReview: 0 };
    }

    const references = Array.from(new Set(candidates.map((r) => r.reference)));
    const orders = await prisma.order.findMany({
      where: { orderNumber: { in: references } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentReviewDeadlineAt: true,
      },
    });
    const orderByNumber = new Map(orders.map((o) => [o.orderNumber, o]));

    let released = 0;
    let expired = 0;
    let flaggedForReview = 0;

    for (const reservation of candidates) {
      const order = orderByNumber.get(reservation.reference);

      if (order?.paymentStatus === 'PAID') continue;

      const awaitingReview =
        order?.status === 'AWAITING_PAYMENT_VERIFICATION' ||
        order?.paymentStatus === 'AWAITING_VERIFICATION';

      if (order && awaitingReview) {
        if (order.paymentReviewDeadlineAt && order.paymentReviewDeadlineAt <= now) {
          const updated = await prisma.order.updateMany({
            where: { id: order.id, needsManualReview: false },
            data: {
              needsManualReview: true,
              manualReviewReason:
                'Receipt review deadline elapsed without an admin decision. Stock remains reserved pending bank reconciliation.',
            },
          });
          if (updated.count > 0) {
            await prisma.orderStatusHistory.create({
              data: {
                orderId: order.id,
                fromStatus: 'AWAITING_PAYMENT_VERIFICATION',
                toStatus: 'AWAITING_PAYMENT_VERIFICATION',
                changedBy: 'SYSTEM',
                note: 'Payment review deadline elapsed. Order flagged for manual bank reconciliation; stock was not released automatically.',
              },
            });
            flaggedForReview += 1;
          }
        }
        // Keep the stock reserved while the payment may be genuine.
        await prisma.inventoryReservation.update({
          where: { id: reservation.id },
          data: { expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
        });
        continue;
      }

      const didRelease = order
        ? await prisma.$transaction(async (tx) => {
            const locked = await tx.$queryRaw<Array<{ id: string }>>`
              SELECT "id" FROM "Order" WHERE "id" = ${order.id} FOR UPDATE
            `;
            if (!locked || locked.length === 0) return false;

            const fresh = await tx.order.findUnique({
              where: { id: order.id },
              select: { status: true, paymentStatus: true },
            });
            if (!fresh || fresh.paymentStatus === 'PAID') return false;
            if (
              fresh.status === 'AWAITING_PAYMENT_VERIFICATION' ||
              fresh.paymentStatus === 'AWAITING_VERIFICATION'
            ) {
              return false;
            }

            const stillExpired = await tx.inventoryReservation.findFirst({
              where: { id: reservation.id, status: 'ACTIVE', expiresAt: { lte: now } },
              select: { id: true },
            });
            if (!stillExpired) return false;

            const result = await this.releaseReservation(reservation.reference, tx, 'EXPIRED');
            if (result && fresh.status === 'PENDING_PAYMENT') {
              await tx.order.updateMany({
                where: { id: order.id, status: 'PENDING_PAYMENT' },
                data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
              });
              await tx.orderStatusHistory.create({
                data: {
                  orderId: order.id,
                  fromStatus: 'PENDING_PAYMENT',
                  toStatus: 'CANCELLED',
                  changedBy: 'SYSTEM',
                  note: 'Payment window expired before a receipt was submitted. Reservation released.',
                },
              });
            }
            return result;
          })
        : false;

      if (didRelease) released += 1;
      expired += 1;
    }

    return { released, expired, flaggedForReview };
  }

  public static async getActiveReservationExpiry(orderNumber: string): Promise<Date | null> {
    const reservation = await prisma.inventoryReservation.findFirst({
      where: { reference: orderNumber, status: 'ACTIVE' },
      orderBy: { expiresAt: 'asc' },
      select: { expiresAt: true },
    });
    return reservation?.expiresAt ?? null;
  }

  public static async extendReservations(orderNumber: string, until: Date, txPrisma?: any): Promise<number> {
    const client = txPrisma || prisma;
    const result = await client.inventoryReservation.updateMany({
      where: { reference: orderNumber, status: 'ACTIVE' },
      data: { expiresAt: until },
    });
    return result.count;
  }

  public static async adjustStock(
    variantId: string,
    quantity: number,
    type: 'PURCHASE' | 'SALE' | 'RESERVATION' | 'RELEASE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE' | 'RESTOCK' | 'SET_EXACT',
    reference: string,
    reason?: string,
    adminId?: string
  ): Promise<boolean> {
    if (!Number.isFinite(quantity) || !Number.isInteger(quantity)) {
      throw new Error('Stock adjustment quantity must be a whole integer.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findUnique({
        where: { variantId },
      });

      if (!inv) return false;

      let newStock = inv.stockQuantity;
      let newDamaged = inv.damagedQuantity;
      let newReturned = inv.returnedQuantity;
      let delta = 0;

      if (type === 'ADJUSTMENT' || type === 'SET_EXACT') {
        if (quantity < 0) {
          throw new Error('Stock quantity must be a non-negative integer.');
        }
        newStock = quantity;
        delta = newStock - inv.stockQuantity;
      } else if (type === 'PURCHASE' || type === 'RESTOCK' || type === 'RETURN') {
        if (quantity <= 0) {
          throw new Error('Stock increase quantity must be a positive whole number.');
        }
        newStock += quantity;
        delta = quantity;
        if (type === 'RETURN') {
          newReturned += quantity;
        }
      } else if (type === 'DAMAGE' || type === 'SALE') {
        if (quantity <= 0) {
          throw new Error('Stock reduction quantity must be a positive whole number.');
        }
        if (inv.stockQuantity < quantity) {
          throw new Error(`Cannot reduce stock below 0. Current physical stock is ${inv.stockQuantity}.`);
        }
        newStock = inv.stockQuantity - quantity;
        delta = -quantity;
        if (type === 'DAMAGE') {
          newDamaged += quantity;
        }
      } else {
        newStock = Math.max(0, inv.stockQuantity - quantity);
        delta = -quantity;
      }

      if (newStock < 0) {
        throw new Error('Stock quantity cannot become negative.');
      }

      await tx.inventory.update({
        where: { variantId },
        data: {
          stockQuantity: newStock,
          damagedQuantity: newDamaged,
          returnedQuantity: newReturned,
        },
      });

      const txType =
        type === 'PURCHASE' || type === 'RESTOCK' ? 'RESTOCK' :
        type === 'DAMAGE' ? 'DAMAGE' :
        type === 'RETURN' ? 'RETURN' :
        type === 'ADJUSTMENT' || type === 'SET_EXACT' ? 'ADJUSTMENT' : 'RESTOCK';

      const invTx = await tx.inventoryTransaction.create({
        data: {
          inventoryId: inv.id,
          variantId,
          type: txType as any,
          quantity: delta,
          previousStock: inv.stockQuantity,
          newStock,
          referenceType: 'MANUAL',
          referenceId: reference,
          reason,
          adminId,
        },
      });

      // Queue PRODUCT_OUT_OF_STOCK if inventory transitioned from positive to 0
      if (newStock === 0 && inv.stockQuantity > 0) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true },
        });
        if (variant) {
          await NotificationQueueService.queueOutOfStock(
            variant,
            invTx.id,
            reference,
            reason || `Stock manually adjusted to 0 (${type})`,
            variant.product?.name,
            tx
          );
        }
      }

      return true;
    });

    if (result) {
      triggerNotificationProcessingAsync();
    }

    return result;
  }

  /**
   * Preview bulk stock updates before saving.
   */
  public static async bulkAdjustStockPreview(
    items: Array<{
      variantId: string;
      quantity: number;
      type: 'PURCHASE' | 'DAMAGE' | 'ADJUSTMENT' | 'SET_EXACT' | 'RESTOCK' | 'RETURN';
      reference?: string;
      reason?: string;
    }>
  ) {
    const variantIds = items.map((i) => i.variantId);
    const inventories = await prisma.inventory.findMany({
      where: { variantId: { in: variantIds } },
      include: {
        variant: {
          include: { product: { select: { id: true, name: true } } },
        },
      },
    });

    const invMap = new Map(inventories.map((inv) => [inv.variantId, inv]));

    const previewItems = items.map((item) => {
      const inv = invMap.get(item.variantId);
      if (!inv || !inv.variant) {
        return {
          variantId: item.variantId,
          sku: item.variantId,
          productName: 'Unknown',
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
          sku: inv.variant.sku,
          productName: inv.variant.product?.name || 'Unknown',
          previousStockQuantity: inv.stockQuantity,
          previousAvailableStock: Math.max(0, inv.stockQuantity - inv.reservedQuantity),
          adjustmentQuantity: item.quantity,
          type: item.type,
          resultingStockQuantity: 0,
          resultingAvailableStock: 0,
          valid: false,
          error: 'Quantity must be a whole integer',
        };
      }

      const prevStock = inv.stockQuantity;
      let resultingStock = prevStock;

      if (item.type === 'ADJUSTMENT' || item.type === 'SET_EXACT') {
        if (item.quantity < 0) {
          return {
            variantId: item.variantId,
            sku: inv.variant.sku,
            productName: inv.variant.product?.name || 'Unknown',
            previousStockQuantity: prevStock,
            previousAvailableStock: Math.max(0, inv.stockQuantity - inv.reservedQuantity),
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
            sku: inv.variant.sku,
            productName: inv.variant.product?.name || 'Unknown',
            previousStockQuantity: prevStock,
            previousAvailableStock: Math.max(0, inv.stockQuantity - inv.reservedQuantity),
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
            sku: inv.variant.sku,
            productName: inv.variant.product?.name || 'Unknown',
            previousStockQuantity: prevStock,
            previousAvailableStock: Math.max(0, inv.stockQuantity - inv.reservedQuantity),
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
            sku: inv.variant.sku,
            productName: inv.variant.product?.name || 'Unknown',
            previousStockQuantity: prevStock,
            previousAvailableStock: Math.max(0, inv.stockQuantity - inv.reservedQuantity),
            adjustmentQuantity: item.quantity,
            type: item.type,
            resultingStockQuantity: 0,
            resultingAvailableStock: 0,
            valid: false,
            error: `Cannot reduce below 0. Current physical stock is ${prevStock}`,
          };
        }
        resultingStock = prevStock - item.quantity;
      }

      const resultingAvailable = Math.max(0, resultingStock - inv.reservedQuantity);

      return {
        variantId: item.variantId,
        sku: inv.variant.sku,
        productName: inv.variant.product?.name || 'Unknown',
        previousStockQuantity: prevStock,
        previousAvailableStock: Math.max(0, inv.stockQuantity - inv.reservedQuantity),
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
   * Apply bulk stock adjustments atomically in a single database transaction.
   */
  public static async bulkAdjustStock(
    items: Array<{
      variantId: string;
      quantity: number;
      type: 'PURCHASE' | 'DAMAGE' | 'ADJUSTMENT' | 'SET_EXACT' | 'RESTOCK' | 'RETURN';
      reference?: string;
      reason?: string;
    }>,
    adminId?: string
  ) {
    const preview = await this.bulkAdjustStockPreview(items);
    if (!preview.allValid) {
      const invalid = preview.items.find((i) => !i.valid);
      throw new Error(`Bulk adjustment validation failed: ${invalid?.error || 'Invalid items'}`);
    }

    const batchRef = `BULK-ADJ-${Date.now()}`;

    return prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of items) {
        await this.adjustStock(
          item.variantId,
          item.quantity,
          item.type,
          item.reference || batchRef,
          item.reason || 'Bulk inventory adjustment',
          adminId
        );
        const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
        if (inv) {
          results.push({
            variantId: item.variantId,
            newStock: inv.stockQuantity,
            availableStock: Math.max(0, inv.stockQuantity - inv.reservedQuantity),
          });
        }
      }
      return {
        success: true,
        updatedCount: results.length,
        items: results,
      };
    });
  }

  public static async getAllInventory(filter?: {
    lowStockOnly?: boolean;
    outOfStockOnly?: boolean;
    search?: string;
  }): Promise<any[]> {
    const invList = await prisma.inventory.findMany({
      include: {
        variant: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
    });

    const result: any[] = [];
    for (const inv of invList) {
      if (!inv.variant) continue;
      const available = Math.max(0, inv.stockQuantity - inv.reservedQuantity);
      const threshold = inv.reorderLevel ?? this.DEFAULT_LOW_STOCK_THRESHOLD;

      if (filter?.outOfStockOnly && available > 0) continue;
      if (filter?.lowStockOnly && available > threshold) continue;
      if (filter?.search) {
        const s = filter.search.toLowerCase();
        const matchesSku = inv.variant.sku.toLowerCase().includes(s);
        const matchesName = inv.variant.product?.name.toLowerCase().includes(s) || false;
        if (!matchesSku && !matchesName) continue;
      }

      const status: 'IN_STOCK' | 'LOW_STOCK' | 'SOLD_OUT' =
        available <= 0
          ? 'SOLD_OUT'
          : available <= threshold
          ? 'LOW_STOCK'
          : 'IN_STOCK';

      result.push({
        variantId: inv.variantId,
        sku: inv.variant.sku,
        productName: inv.variant.product?.name || 'Unknown',
        productId: inv.variant.productId,
        category: inv.variant.product?.category?.name || '',
        colour: inv.variant.colour,
        size: inv.variant.size,
        availableStock: available,
        stockQuantity: inv.stockQuantity,
        reservedStock: inv.reservedQuantity,
        soldStock: inv.soldQuantity,
        damagedStock: inv.damagedQuantity,
        returnedStock: inv.returnedQuantity,
        reorderLevel: threshold,
        status,
        updatedAt: inv.updatedAt.toISOString(),
      });
    }

    return result;
  }

  public static async getLedger(variantId?: string, limit: number = 100): Promise<any[]> {
    const where: any = {};
    if (variantId) {
      where.variantId = variantId;
    }

    return prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        variant: {
          select: { sku: true, colour: true, size: true },
        },
      },
    });
  }

  public static async getDbStockStatus(variantId: string) {
    return prisma.inventory.findUnique({
      where: { variantId },
      include: { variant: { select: { sku: true } } },
    });
  }
}
