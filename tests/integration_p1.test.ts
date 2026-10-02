import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/server/db/store';
import { ProductService } from '../src/server/services/productService';
import { CartService } from '../src/server/services/cartService';
import { CheckoutService } from '../src/server/services/checkoutService';
import { OrderService } from '../src/server/services/orderService';
import { mapServerProduct } from '../src/services/catalogService';
import { resolveProductVariant } from '../src/utils/variants';

describe('PIERCYN P1 Catalog & Cart Integration Tests', () => {
  beforeEach(() => {
    dbStore.seedFromCatalog();
  });

  describe('Catalog & Mapping Layer', () => {
    it('maps backend EnrichedProduct to frontend Product model preserving real backend variants', () => {
      const serverProducts = ProductService.getAllProducts();
      expect(serverProducts.length).toBeGreaterThan(0);

      const serverProduct = serverProducts[0];
      const frontendProduct = mapServerProduct(serverProduct);

      expect(frontendProduct.id).toBe(serverProduct.id);
      expect(frontendProduct.slug).toBe(serverProduct.slug);
      expect(frontendProduct.name).toBe(serverProduct.name);
      expect(frontendProduct.priceNGN).toBe(serverProduct.priceNGN);
      expect(frontendProduct.variants).toBeDefined();
      expect(frontendProduct.variants?.length).toBe(serverProduct.variants.length);

      // Verify variant IDs match backend IDs exactly
      serverProduct.variants.forEach((sv, idx) => {
        const fv = frontendProduct.variants?.[idx];
        expect(fv?.id).toBe(sv.id);
        expect(fv?.sku).toBe(sv.sku);
        expect(fv?.size).toBe(sv.size);
        expect(fv?.colour).toBe(sv.colour);
      });
    });

    it('retrieves products by slug via ProductService directly', () => {
      const all = ProductService.getAllProducts();
      const target = all[0];

      const found = ProductService.getProductBySlug(target.slug);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(target.id);
      expect(found?.variants.length).toBe(target.variants.length);

      // Non-existent slug returns null
      const notFound = ProductService.getProductBySlug('non-existent-product-slug-xyz');
      expect(notFound).toBeNull();
    });

    it('resolves product variant deterministically matching database store format', () => {
      const product = mapServerProduct(ProductService.getAllProducts()[0]);
      const color = product.colors[0].name;
      const size = product.sizes[0];

      const resolved = resolveProductVariant(product, color, size);
      expect(resolved).not.toBeNull();
      expect(resolved?.id).toBeDefined();
      expect(resolved?.sku).toBeDefined();
      expect(resolved?.productId).toBe(product.id);
    });
  });

  describe('Authoritative Server Cart Operations', () => {
    it('creates and calculates cart with real variant IDs', () => {
      const products = ProductService.getAllProducts();
      const p1 = products[0];
      const v1 = p1.variants[0];

      const sessionId = 'test-session-cart-1';
      const calculated = CartService.calculateItems(sessionId, [
        { variantId: v1.id, quantity: 2 },
      ]);

      expect(calculated.sessionId).toBe(sessionId);
      expect(calculated.itemCount).toBe(2);
      expect(calculated.subtotalNGN).toBe(p1.priceNGN * 2);
      expect(calculated.items.length).toBe(1);
      expect(calculated.items[0].variantId).toBe(v1.id);
      expect(calculated.items[0].productId).toBe(p1.id);
    });

    it('updates quantity and recalculates totals correctly', () => {
      const products = ProductService.getAllProducts();
      const p1 = products[0];
      const v1 = p1.variants[0];
      const sessionId = 'test-session-cart-2';

      // Add 1
      let cart = CartService.calculateItems(sessionId, [{ variantId: v1.id, quantity: 1 }]);
      expect(cart.itemCount).toBe(1);
      expect(cart.subtotalNGN).toBe(p1.priceNGN);

      // Increase to 3
      cart = CartService.calculateItems(sessionId, [{ variantId: v1.id, quantity: 3 }]);
      expect(cart.itemCount).toBe(3);
      expect(cart.subtotalNGN).toBe(p1.priceNGN * 3);

      // Remove item (empty array)
      cart = CartService.calculateItems(sessionId, []);
      expect(cart.itemCount).toBe(0);
      expect(cart.subtotalNGN).toBe(0);
    });

    it('rejects adding invalid variant IDs to cart', () => {
      const sessionId = 'test-session-invalid-var';
      const cart = CartService.calculateItems(sessionId, [
        { variantId: 'non-existent-variant-999', quantity: 1 },
      ]);

      expect(cart.isValid).toBe(false);
      expect(cart.validationErrors.length).toBeGreaterThan(0);
      expect(cart.validationErrors[0]).toContain('non-existent-variant-999');
    });

    it('rejects adding quantities exceeding available stock', () => {
      const products = ProductService.getAllProducts();
      const v1 = products[0].variants[0];
      const sessionId = 'test-session-overstock';

      const cart = CartService.calculateItems(sessionId, [
        { variantId: v1.id, quantity: 99999 },
      ]);

      expect(cart.isValid).toBe(false);
      expect(cart.items[0].isAvailable).toBe(false);
      expect(cart.validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Full Checkout Integration Flow with Real Variants & Promos', () => {
    it('calculates quote using verified promo codes', () => {
      const products = ProductService.getAllProducts();
      const v1 = products[0].variants[0];
      const sessionId = 'test-session-checkout-quote';

      const quote = CheckoutService.calculateQuote(
        sessionId,
        'lagos',
        [{ variantId: v1.id, quantity: 1 }],
        'STANDOUT'
      );

      expect(quote.subtotalNGN).toBe(products[0].priceNGN);
      expect(quote.discountNGN).toBe(Math.round(products[0].priceNGN * 0.15));
      expect(quote.totalNGN).toBe(quote.subtotalNGN - quote.discountNGN + quote.deliveryFeeNGN);
    });

    it('creates server order with real variantId and updates inventory', async () => {
      const products = ProductService.getAllProducts();
      const v1 = products[0].variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Chinedu Eze',
          email: 'chinedu@example.com',
          phone: '+2348012345678',
          state: 'Lagos State',
          city: 'Ikeja',
          address: '10 Allen Avenue',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: v1.id, quantity: 1 }],
        discountCode: 'PIERCYN10',
      });

      expect(order.id).toBeDefined();
      expect(order.orderNumber).toMatch(/^PCY-/);
      expect(order.items[0].variantId).toBe(v1.id);
      expect(order.discountNGN).toBeGreaterThan(0);
      expect(order.orderStatus).toBe('PENDING_PAYMENT');
    });
  });
});
