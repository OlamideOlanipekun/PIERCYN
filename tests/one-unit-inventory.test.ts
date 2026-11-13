import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/server/db/store';
import { InventoryService } from '../src/server/modules/inventory/inventoryService';
import { CheckoutService } from '../src/server/modules/checkout/checkoutService';
import { OrderService } from '../src/server/modules/orders/orderService';
import { CartService } from '../src/server/modules/cart/cartService';
import { ProductService } from '../src/server/modules/products/productService';

describe('PIERCYN One-Unit Inventory & Concurrent Purchase Prevention', () => {
  beforeEach(() => {
    dbStore.seedFromCatalog();
  });

  // Helper to isolate a single-unit piece in the catalog
  function setupSingleUnitProduct() {
    const products = ProductService.getAllProducts();
    const product = products[0];
    const variant = product.variants[0];

    // Ensure all other variants of this product have 0 stock so the entire piece has strictly 1 available unit
    for (const v of product.variants) {
      const itemInv = dbStore.inventory.get(v.id);
      if (itemInv) {
        itemInv.stockQuantity = v.id === variant.id ? 1 : 0;
        itemInv.availableStock = v.id === variant.id ? 1 : 0;
        itemInv.reservedStock = 0;
        itemInv.soldStock = 0;
      }
    }
    InventoryService.syncProductSoldOutFlag(variant.id);
    return { product, variant, inv: dbStore.inventory.get(variant.id)! };
  }

  describe('1. Single-Unit Cart Validation', () => {
    it('allows adding 1 unit of a single-unit product to cart', () => {
      const { variant } = setupSingleUnitProduct();

      const sessionId = 'cart-test-single-unit-ok';
      const cart = CartService.addItem(sessionId, variant.id, 1);

      expect(cart.isValid).toBe(true);
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].quantity).toBe(1);
      expect(cart.items[0].isAvailable).toBe(true);
      expect(cart.items[0].availableStock).toBe(1);
    });

    it('rejects adding quantity 2 for a single-unit product', () => {
      const { variant } = setupSingleUnitProduct();

      const sessionId = 'cart-test-single-unit-over';
      expect(() => {
        CartService.addItem(sessionId, variant.id, 2);
      }).toThrow(/Insufficient stock|Only 1 unit/);
    });

    it('rejects adding a second unit when 1 is already in the cart for a single-unit product', () => {
      const { variant } = setupSingleUnitProduct();

      const sessionId = 'cart-test-single-unit-repeat';
      // First unit succeeds
      CartService.addItem(sessionId, variant.id, 1);

      // Second attempt to add fails
      expect(() => {
        CartService.addItem(sessionId, variant.id, 1);
      }).toThrow(/Insufficient stock|Only 1 unit/);
    });

    it('rejects adding an item to cart when available stock is 0', () => {
      const { variant, inv } = setupSingleUnitProduct();

      // Set stock strictly to 0
      inv.stockQuantity = 1;
      inv.availableStock = 0;
      inv.reservedStock = 1;
      InventoryService.syncProductSoldOutFlag(variant.id);

      const sessionId = 'cart-test-single-unit-zero';
      expect(() => {
        CartService.addItem(sessionId, variant.id, 1);
      }).toThrow(/Insufficient stock|unavailable|reserved/);
    });
  });

  describe('2. Single-Unit Ownership & Concurrent Purchase Prevention', () => {
    it('guarantees that two concurrent checkout attempts for 1 available unit yield exactly one reservation and one rejection', async () => {
      const { variant } = setupSingleUnitProduct();

      const customerA = {
        customer: {
          fullName: 'Customer A',
          email: 'customerA@piercyn.com',
          phone: '+2348011111111',
          state: 'Lagos State',
          city: 'Victoria Island',
          address: 'Ahmadu Bello Way',
        },
        shippingRegion: 'lagos' as const,
        paymentMethod: 'transfer' as const,
        items: [{ variantId: variant.id, quantity: 1 }],
      };

      const customerB = {
        customer: {
          fullName: 'Customer B',
          email: 'customerB@piercyn.com',
          phone: '+2348022222222',
          state: 'Lagos State',
          city: 'Ikoyi',
          address: 'Bourdillon Road',
        },
        shippingRegion: 'lagos' as const,
        paymentMethod: 'transfer' as const,
        items: [{ variantId: variant.id, quantity: 1 }],
      };

      // Both customers attempt checkout simultaneously
      const results = await Promise.allSettled([
        CheckoutService.createOrder(customerA),
        CheckoutService.createOrder(customerB),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
      const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

      // Exactly ONE succeeds, exactly ONE fails
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      // Rejection reason must indicate stock failure
      expect(rejected[0].reason.message).toMatch(/reservation failed|sold out|Only 0 unit\(s\)/i);

      // Exactly one order was created
      const winningOrder = fulfilled[0].value;
      expect(winningOrder.orderNumber).toBeDefined();

      // Inventory state: strictly 1 physical unit, 1 reserved, 0 available
      const finalInv = dbStore.inventory.get(variant.id)!;
      expect(finalInv.stockQuantity).toBe(1);
      expect(finalInv.reservedStock).toBe(1);
      expect(finalInv.availableStock).toBe(0);

      // No negative inventory
      expect(finalInv.availableStock).toBeGreaterThanOrEqual(0);

      // Exactly one ACTIVE reservation in the database
      const activeReservations = Array.from(dbStore.reservations.values()).filter(
        (res) => res.variantId === variant.id && res.status === 'ACTIVE'
      );
      expect(activeReservations.length).toBe(1);
      expect(activeReservations[0].reference).toBe(winningOrder.orderNumber);
    });

    it('immediately reflects real-time sold-out status on product when single unit is reserved', () => {
      const { product, variant } = setupSingleUnitProduct();
      expect(dbStore.products.get(product.id)!.isSoldOut).toBe(false);

      // Reserve the single unit
      const orderNumber = 'PCY-TEST-SO-1';
      const reserved = InventoryService.reserveStock(variant.id, 1, orderNumber);
      expect(reserved).toBe(true);

      // Product must immediately reflect isSoldOut = true
      const updatedProduct = dbStore.products.get(product.id)!;
      expect(updatedProduct.isSoldOut).toBe(true);

      // A third customer attempting to reserve receives false
      const thirdCustomerReserved = InventoryService.reserveStock(variant.id, 1, 'PCY-TEST-SO-2');
      expect(thirdCustomerReserved).toBe(false);
    });
  });

  describe('3. Reservation Expiration and Idempotent Release', () => {
    it('releases reserved stock when reservation expires and returns unit to available', () => {
      const { product, variant, inv } = setupSingleUnitProduct();
      const orderNumber = 'PCY-EXPIRY-1';

      // Reserve it
      InventoryService.reserveStock(variant.id, 1, orderNumber);
      expect(inv.availableStock).toBe(0);
      expect(inv.reservedStock).toBe(1);
      expect(dbStore.products.get(product.id)!.isSoldOut).toBe(true);

      // Release reservation
      const released = InventoryService.releaseReservation(orderNumber);
      expect(released).toBe(true);

      // Stock returned to available
      expect(inv.availableStock).toBe(1);
      expect(inv.reservedStock).toBe(0);
      expect(dbStore.products.get(product.id)!.isSoldOut).toBe(false);

      // Ledger records RELEASE
      const lastTx = dbStore.inventoryTransactions[dbStore.inventoryTransactions.length - 1];
      expect(lastTx.type).toBe('RELEASE');
    });

    it('release is strictly idempotent: releasing twice does not double-increment stock', () => {
      const { variant, inv } = setupSingleUnitProduct();
      const orderNumber = 'PCY-EXPIRY-IDEMP';

      InventoryService.reserveStock(variant.id, 1, orderNumber);
      expect(inv.availableStock).toBe(0);

      // First release succeeds
      const release1 = InventoryService.releaseReservation(orderNumber);
      expect(release1).toBe(true);
      expect(inv.availableStock).toBe(1);
      expect(inv.reservedStock).toBe(0);

      // Second release fails gracefully (returns false) and does NOT add phantom stock
      const release2 = InventoryService.releaseReservation(orderNumber);
      expect(release2).toBe(false);
      expect(inv.availableStock).toBe(1); // Still 1, NOT 2!
      expect(inv.reservedStock).toBe(0);
    });
  });

  describe('4. Payment Verification & Inventory Commitment', () => {
    it('commits reservation to permanent SALE upon payment verification and reduces stockQuantity', () => {
      const { product, variant, inv } = setupSingleUnitProduct();
      const orderNumber = 'PCY-SALE-FINAL';

      // Reserve stock
      InventoryService.reserveStock(variant.id, 1, orderNumber);
      expect(inv.availableStock).toBe(0);
      expect(inv.reservedStock).toBe(1);

      // Finalize sale upon verified payment
      const finalized = InventoryService.finalizeSale(variant.id, 1, orderNumber);
      expect(finalized).toBe(true);

      // Physical stock is now 0, sold stock is 1, reserved is 0
      expect(inv.stockQuantity).toBe(0);
      expect(inv.soldStock).toBe(1);
      expect(inv.reservedStock).toBe(0);
      expect(inv.availableStock).toBe(0);

      // Reservation marked FULFILLED
      const res = Array.from(dbStore.reservations.values()).find((r) => r.reference === orderNumber);
      expect(res?.status).toBe('FULFILLED');

      // Product marked sold out
      expect(dbStore.products.get(product.id)!.isSoldOut).toBe(true);
    });

    it('finalizing sale is idempotent: double verification does not deduct stock twice', () => {
      const { variant, inv } = setupSingleUnitProduct();
      const orderNumber = 'PCY-SALE-IDEMP';

      InventoryService.reserveStock(variant.id, 1, orderNumber);
      InventoryService.finalizeSale(variant.id, 1, orderNumber);

      expect(inv.stockQuantity).toBe(0);
      expect(inv.soldStock).toBe(1);

      // Second finalization attempt
      const finalizedAgain = InventoryService.finalizeSale(variant.id, 1, orderNumber);
      expect(finalizedAgain).toBe(true);

      // Still 0 stock, sold count still 1 (not 2!)
      expect(inv.stockQuantity).toBe(0);
      expect(inv.soldStock).toBe(1);
    });
  });

  describe('5. Cart Invalidation When Stock Sells', () => {
    it('invalidates checkout when a single-unit item in cart is purchased by another customer', async () => {
      const { variant } = setupSingleUnitProduct();

      // Customer 1 adds item to cart
      const session1 = 'sess-customer-1-cart';
      const cart = CartService.addItem(session1, variant.id, 1);
      expect(cart.isValid).toBe(true);

      // Customer 2 checks out and claims that unit
      const customer2Checkout = {
        customer: {
          fullName: 'Customer 2',
          email: 'customer2@piercyn.com',
          phone: '+2348099999999',
          state: 'Lagos State',
          city: 'Lekki',
          address: 'Admiralty Way',
        },
        shippingRegion: 'lagos' as const,
        paymentMethod: 'transfer' as const,
        items: [{ variantId: variant.id, quantity: 1 }],
      };
      await CheckoutService.createOrder(customer2Checkout);

      // Customer 1 tries to calculate quote or checkout
      const quote = CheckoutService.calculateQuote(session1, 'lagos', [{ variantId: variant.id, quantity: 1 }]);
      expect(quote.isEligibleForCheckout).toBe(false);
      expect(quote.errors.length).toBeGreaterThan(0);
      expect(quote.errors[0]).toMatch(/Only 0 unit\(s\)/i);

      // Checkout attempt by Customer 1 must fail
      const customer1Checkout = {
        customer: {
          fullName: 'Customer 1',
          email: 'customer1@piercyn.com',
          phone: '+2348088888888',
          state: 'Lagos State',
          city: 'Ikeja',
          address: 'Isaac John St',
        },
        shippingRegion: 'lagos' as const,
        paymentMethod: 'transfer' as const,
        items: [{ variantId: variant.id, quantity: 1 }],
      };

      await expect(CheckoutService.createOrder(customer1Checkout)).rejects.toThrow(
        /Checkout validation failed|Only 0 unit\(s\)/
      );
    });
  });

  describe('6. Admin Inventory Adjustments & Audit Trail', () => {
    it('creates an immutable audit ledger entry when an admin adjusts inventory', () => {
      const { variant, inv } = setupSingleUnitProduct();

      // Admin sets exact stock to 2
      InventoryService.adjustStock(variant.id, 2, 'SET_EXACT', 'ADMIN_RESTOCK', 'Restocked atelier unit', 'admin-user-1');

      expect(inv.availableStock).toBe(2);

      // Verify audit transaction was created
      const ledger = InventoryService.getLedger(variant.id);
      expect(ledger.length).toBeGreaterThan(0);
      const adjustmentTx = ledger.find((tx) => tx.reason === 'Restocked atelier unit');
      expect(adjustmentTx).toBeDefined();
      expect(adjustmentTx?.adminId).toBe('admin-user-1');
    });
  });
});
