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

export class InventoryService {
  private static async releaseExpiredReservations(variantId?: string, txPrisma?: any): Promise<void> {
    const client = txPrisma || prisma;
    const expired = await client.inventoryReservation.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lte: new Date() },
        ...(variantId ? { variantId } : {}),
      },
      select: { id: true },
    });

    for (const reservation of expired) {
      await this.releaseReservation(reservation.id, txPrisma);
    }
  }

  public static async getVariantStock(variantId: string) {
    await this.releaseExpiredReservations(variantId);
    return prisma.inventory.findUnique({
      where: { variantId },
    });
  }

  public static async getStockStatus(variantId: string): Promise<StockCheckResult | null> {
    await this.releaseExpiredReservations(variantId);
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
    expiresInMinutes: number = 15,
    txPrisma?: any
  ): Promise<boolean> {
    const client = txPrisma || prisma;

    const execute = async (tx: any) => {
      await this.releaseExpiredReservations(variantId, tx);
      const inv = await tx.inventory.findUnique({
        where: { variantId },
      });

      if (!inv) return false;

      const available = inv.stockQuantity - inv.reservedQuantity;
      if (available < quantity) return false;

      await tx.inventory.update({
        where: { variantId },
        data: {
          reservedQuantity: inv.reservedQuantity + quantity,
        },
      });

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
    } else {
      return client.$transaction(execute);
    }
  }

  public static async releaseReservation(referenceOrId: string, txPrisma?: any): Promise<boolean> {
    const client = txPrisma || prisma;

    const execute = async (tx: any) => {
      const reservations = await tx.inventoryReservation.findMany({
        where: {
          OR: [{ id: referenceOrId }, { reference: referenceOrId }],
          status: 'ACTIVE',
        },
      });

      if (reservations.length === 0) return false;

      for (const res of reservations) {
        const inv = await tx.inventory.findUnique({
          where: { variantId: res.variantId },
        });

        if (inv) {
          await tx.inventory.update({
            where: { variantId: res.variantId },
            data: {
              reservedQuantity: Math.max(0, inv.reservedQuantity - res.quantity),
            },
          });

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
              reason: 'Reservation released/expired',
            },
          });
        }

        await tx.inventoryReservation.update({
          where: { id: res.id },
          data: { status: 'RELEASED' },
        });
      }

      return true;
    };

    if (txPrisma) {
      return execute(txPrisma);
    } else {
      return client.$transaction(execute);
    }
  }

  public static async finalizeSale(
    variantId: string,
    quantity: number,
    orderNumber: string,
    txPrisma?: any
  ): Promise<boolean> {
    const client = txPrisma || prisma;

    const execute = async (tx: any) => {
      const inv = await tx.inventory.findUnique({
        where: { variantId },
      });

      if (!inv) return false;

      const activeReservations = await tx.inventoryReservation.findMany({
        where: {
          reference: orderNumber,
          variantId,
          status: 'ACTIVE',
        },
      });

      let reservedToRelease = 0;
      for (const res of activeReservations) {
        reservedToRelease += res.quantity;
        await tx.inventoryReservation.update({
          where: { id: res.id },
          data: { status: 'FULFILLED' },
        });
      }

      const newStock = Math.max(0, inv.stockQuantity - quantity);
      const newReserved = Math.max(0, inv.reservedQuantity - reservedToRelease);
      const newSold = inv.soldQuantity + quantity;

      await tx.inventory.update({
        where: { variantId },
        data: {
          stockQuantity: newStock,
          reservedQuantity: newReserved,
          soldQuantity: newSold,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inv.id,
          variantId,
          quantity: -quantity,
          previousStock: inv.stockQuantity,
          newStock,
          type: 'SALE',
          referenceType: 'ORDER',
          referenceId: orderNumber,
          reason: `Sale finalized for order ${orderNumber}`,
        },
      });

      return true;
    };

    if (txPrisma) {
      return execute(txPrisma);
    } else {
      return client.$transaction(execute);
    }
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

    return prisma.$transaction(async (tx) => {
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

      await tx.inventoryTransaction.create({
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

      return true;
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
