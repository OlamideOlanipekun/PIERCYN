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
}

export class InventoryService {
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
      reorderLevel: inv.reorderLevel,
      belowReorder: available <= inv.reorderLevel,
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
    if (!Number.isInteger(quantity) || quantity <= 0) {
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
      // Idempotency guard: this order item was already converted to a sale.
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
    type: 'PURCHASE' | 'SALE' | 'RESERVATION' | 'RELEASE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE',
    reference: string,
    reason?: string,
    adminId?: string
  ): Promise<boolean> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Inventory quantity must be a positive whole number.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findUnique({
        where: { variantId },
      });

      if (!inv) return false;

      let newStock = inv.stockQuantity;
      let newDamaged = inv.damagedQuantity;
      let newReturned = inv.returnedQuantity;

      switch (type) {
        case 'PURCHASE':
          newStock += quantity;
          break;
        case 'RETURN':
          newStock += quantity;
          newReturned += quantity;
          break;
        case 'DAMAGE':
          newStock = Math.max(0, inv.stockQuantity - quantity);
          newDamaged += quantity;
          break;
        case 'ADJUSTMENT':
          newStock = quantity;
          break;
        default:
          newStock = Math.max(0, inv.stockQuantity - quantity);
          break;
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
        type === 'PURCHASE' ? 'RESTOCK' :
        type === 'DAMAGE' ? 'DAMAGE' :
        type === 'RETURN' ? 'RETURN' :
        type === 'ADJUSTMENT' ? 'ADJUSTMENT' : 'RESTOCK';

      const invTx = await tx.inventoryTransaction.create({
        data: {
          inventoryId: inv.id,
          variantId,
          type: txType as any,
          quantity,
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

      if (filter?.outOfStockOnly && available > 0) continue;
      if (filter?.lowStockOnly && available > inv.reorderLevel) continue;
      if (filter?.search) {
        const s = filter.search.toLowerCase();
        const matchesSku = inv.variant.sku.toLowerCase().includes(s);
        const matchesName = inv.variant.product?.name.toLowerCase().includes(s) || false;
        if (!matchesSku && !matchesName) continue;
      }

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
        reorderLevel: inv.reorderLevel,
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
