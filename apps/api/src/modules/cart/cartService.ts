import { prisma } from '../../db/prisma';
import { ProductService } from '../products/productService';
import { InventoryService } from '../inventory/inventoryService';
import { COMMERCE_CONFIG } from '../../config/constants';

export interface CalculatedCartLineItem {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  colour: string;
  size: string;
  image: string;
  unitPriceNGN: number;
  costPriceNGN: number;
  quantity: number;
  lineTotalNGN: number;
  isAvailable: boolean;
  availableStock: number;
  errorMessage?: string;
}

export interface CalculatedCart {
  sessionId: string;
  items: CalculatedCartLineItem[];
  itemCount: number;
  subtotalNGN: number;
  currency: string;
  isValid: boolean;
  validationErrors: string[];
}

export class CartService {
  public static async calculateItems(
    sessionId: string,
    rawItems: { variantId: string; quantity: number }[]
  ): Promise<CalculatedCart> {
    const items: CalculatedCartLineItem[] = [];
    let subtotal = 0;
    let totalCount = 0;
    const errors: string[] = [];

    for (const line of rawItems) {
      const variant = await ProductService.getVariantByIdOrSku(line.variantId);
      if (!variant) {
        errors.push(`Variant ${line.variantId} was not found.`);
        continue;
      }

      const product = await ProductService.getProductBySlugOrId(variant.productId);
      if (!product || product.status !== 'ACTIVE' || !variant.active) {
        errors.push(`${variant.sku} is currently inactive or unavailable.`);
        continue;
      }

      const stock = await InventoryService.getVariantStock(variant.id);
      const availableStock = stock ? Math.max(0, stock.stockQuantity - stock.reservedQuantity) : 0;
      const maxQuantity = COMMERCE_CONFIG.LIMITS.MAX_CART_QUANTITY_PER_ITEM;
      const quantityError = !Number.isInteger(line.quantity) || line.quantity < 1
        ? `Quantity must be a whole number between 1 and ${maxQuantity}.`
        : line.quantity > maxQuantity
          ? `Maximum quantity per item is ${maxQuantity}.`
          : undefined;
      const requestedQty = Number.isFinite(line.quantity)
        ? Math.max(1, Math.min(Math.trunc(line.quantity), maxQuantity))
        : 1;

      if (quantityError) errors.push(`${variant.sku}: ${quantityError}`);
      const isAvailable = !quantityError && availableStock >= requestedQty;
      if (!quantityError && !isAvailable) {
        errors.push(
          `Only ${availableStock} unit(s) of ${product.name} (${variant.colour} / ${variant.size}) available.`
        );
      }

      const unitPrice = variant.priceNGN || product.priceNGN;
      const costPrice = variant.costPriceNGN || product.costPriceNGN || Math.round(unitPrice * 0.38);
      const lineTotal = unitPrice * requestedQty;

      subtotal += lineTotal;
      totalCount += requestedQty;

      items.push({
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        sku: variant.sku,
        category: product.categoryName || 'ESSENTIALS',
        colour: variant.colour,
        size: variant.size,
        image: variant.image || product.images[0] || '',
        unitPriceNGN: unitPrice,
        costPriceNGN: costPrice,
        quantity: requestedQty,
        lineTotalNGN: lineTotal,
        isAvailable,
        availableStock,
        errorMessage: quantityError || (isAvailable ? undefined : `Requested ${requestedQty}, only ${availableStock} available`),
      });
    }

    return {
      sessionId,
      items,
      itemCount: totalCount,
      subtotalNGN: subtotal,
      currency: 'NGN',
      isValid: errors.length === 0 && items.length > 0,
      validationErrors: errors,
    };
  }

  public static async getOrCreateCart(sessionId: string) {
    const expiresAt = new Date(Date.now() + COMMERCE_CONFIG.LIMITS.CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    return prisma.cart.upsert({
      where: { sessionId },
      update: { expiresAt },
      create: {
        sessionId,
        expiresAt,
        status: 'ACTIVE',
      },
      include: {
        items: true,
      },
    });
  }

  public static async calculateCart(sessionId: string): Promise<CalculatedCart> {
    const cart = await this.getOrCreateCart(sessionId);
    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
    });

    return this.calculateItems(
      sessionId,
      cartItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))
    );
  }

  public static async addItem(
    sessionId: string,
    variantId: string,
    quantity: number = 1
  ): Promise<CalculatedCart> {
    const cart = await this.getOrCreateCart(sessionId);
    const variant = await ProductService.getVariantByIdOrSku(variantId);

    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: variant.id,
        },
      },
    });

    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
    const isAvailable = await InventoryService.checkAvailability(variant.id, newQuantity);

    if (!isAvailable) {
      const stock = await InventoryService.getStockStatus(variant.id);
      throw new Error(`Insufficient stock. Only ${stock?.available || 0} unit(s) available.`);
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: variant.id,
          quantity: newQuantity,
        },
      });
    }

    return this.calculateCart(sessionId);
  }

  public static async updateItem(
    sessionId: string,
    variantId: string,
    quantity: number
  ): Promise<CalculatedCart> {
    const cart = await this.getOrCreateCart(sessionId);
    const variant = await ProductService.getVariantByIdOrSku(variantId);

    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, variantId: variant.id },
      });
    } else {
      const isAvailable = await InventoryService.checkAvailability(variant.id, quantity);
      if (!isAvailable) {
        const stock = await InventoryService.getStockStatus(variant.id);
        throw new Error(`Insufficient stock. Only ${stock?.available || 0} unit(s) available.`);
      }

      await prisma.cartItem.upsert({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId: variant.id,
          },
        },
        update: { quantity },
        create: {
          cartId: cart.id,
          variantId: variant.id,
          quantity,
        },
      });
    }

    return this.calculateCart(sessionId);
  }

  public static async removeItem(sessionId: string, variantId: string): Promise<CalculatedCart> {
    return this.updateItem(sessionId, variantId, 0);
  }

  public static async clearCart(sessionId: string): Promise<void> {
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }
  }
}
