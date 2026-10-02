import { dbStore, DbCart, DbCartItem } from '../../db/store';
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
  /**
   * Authoritatively calculate cart without trusting any client prices or totals
   */
  public static calculateItems(
    sessionId: string,
    rawItems: { variantId: string; quantity: number }[]
  ): CalculatedCart {
    const items: CalculatedCartLineItem[] = [];
    let subtotal = 0;
    let totalCount = 0;
    const errors: string[] = [];

    for (const line of rawItems) {
      const variant = ProductService.getVariantByIdOrSku(line.variantId);
      if (!variant) {
        errors.push(`Variant ${line.variantId} was not found.`);
        continue;
      }

      const product = dbStore.products.get(variant.productId);
      if (!product || product.status !== 'ACTIVE' || !variant.active) {
        errors.push(`${variant.sku} is currently inactive or unavailable.`);
        continue;
      }

      const category = dbStore.categories.get(product.categoryId);
      const stock = InventoryService.getVariantStock(variant.id);
      const availableStock = stock ? stock.availableStock : 0;
      const requestedQty = Math.max(1, Math.min(line.quantity, COMMERCE_CONFIG.LIMITS.MAX_CART_QUANTITY_PER_ITEM));

      const isAvailable = availableStock >= requestedQty;
      if (!isAvailable) {
        errors.push(
          `Only ${availableStock} unit(s) of ${product.name} (${variant.colour} / ${variant.size}) available.`
        );
      }

      const unitPrice = variant.priceNGN || product.priceNGN;
      const costPrice = variant.costPriceNGN || product.costPriceNGN;
      const lineTotal = unitPrice * requestedQty;

      subtotal += lineTotal;
      totalCount += requestedQty;

      items.push({
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        sku: variant.sku,
        category: category?.name || 'ESSENTIALS',
        colour: variant.colour,
        size: variant.size,
        image: variant.image || product.images[0],
        unitPriceNGN: unitPrice,
        costPriceNGN: costPrice,
        quantity: requestedQty,
        lineTotalNGN: lineTotal,
        isAvailable,
        availableStock,
        errorMessage: isAvailable ? undefined : `Requested ${requestedQty}, only ${availableStock} available`,
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

  /**
   * Retrieve or create cart for guest session
   */
  public static getOrCreateCart(sessionId: string): DbCart {
    let cart = dbStore.carts.get(sessionId);
    if (!cart) {
      const cartId = `cart-${sessionId}`;
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + COMMERCE_CONFIG.LIMITS.CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();

      cart = {
        id: cartId,
        sessionId,
        expiresAt,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      dbStore.carts.set(sessionId, cart);
      dbStore.cartItems.set(cartId, []);
    }
    return cart;
  }

  /**
   * Get calculated cart for session
   */
  public static calculateCart(sessionId: string): CalculatedCart {
    const cart = this.getOrCreateCart(sessionId);
    const storedLines = dbStore.cartItems.get(cart.id) || [];
    return this.calculateItems(
      sessionId,
      storedLines.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))
    );
  }

  /**
   * Add item to session cart
   */
  public static addItem(sessionId: string, variantId: string, quantity: number = 1): CalculatedCart {
    const cart = this.getOrCreateCart(sessionId);
    const lines = dbStore.cartItems.get(cart.id) || [];

    // Verify variant and stock
    const variant = ProductService.getVariantByIdOrSku(variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    const existing = lines.find((i) => i.variantId === variant.id);
    const newQuantity = existing ? existing.quantity + quantity : quantity;

    if (!InventoryService.checkAvailability(variant.id, newQuantity)) {
      const stock = InventoryService.getVariantStock(variant.id);
      throw new Error(`Insufficient stock. Only ${stock?.availableStock || 0} unit(s) available.`);
    }

    if (existing) {
      existing.quantity = newQuantity;
      existing.updatedAt = new Date().toISOString();
    } else {
      lines.push({
        id: `ci-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        cartId: cart.id,
        variantId: variant.id,
        quantity: newQuantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    dbStore.cartItems.set(cart.id, lines);
    cart.updatedAt = new Date().toISOString();

    return this.calculateCart(sessionId);
  }

  /**
   * Update item quantity in session cart
   */
  public static updateItem(sessionId: string, variantId: string, quantity: number): CalculatedCart {
    const cart = this.getOrCreateCart(sessionId);
    let lines = dbStore.cartItems.get(cart.id) || [];

    if (quantity <= 0) {
      lines = lines.filter((i) => i.variantId !== variantId);
    } else {
      if (!InventoryService.checkAvailability(variantId, quantity)) {
        const stock = InventoryService.getVariantStock(variantId);
        throw new Error(`Insufficient stock. Only ${stock?.availableStock || 0} unit(s) available.`);
      }

      const existing = lines.find((i) => i.variantId === variantId);
      if (existing) {
        existing.quantity = quantity;
        existing.updatedAt = new Date().toISOString();
      } else {
        lines.push({
          id: `ci-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          cartId: cart.id,
          variantId,
          quantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    dbStore.cartItems.set(cart.id, lines);
    cart.updatedAt = new Date().toISOString();

    return this.calculateCart(sessionId);
  }

  /**
   * Remove item from cart
   */
  public static removeItem(sessionId: string, variantId: string): CalculatedCart {
    return this.updateItem(sessionId, variantId, 0);
  }

  /**
   * Clear entire session cart
   */
  public static clearCart(sessionId: string): void {
    const cart = dbStore.carts.get(sessionId);
    if (cart) {
      dbStore.cartItems.set(cart.id, []);
      cart.updatedAt = new Date().toISOString();
    }
  }
}
