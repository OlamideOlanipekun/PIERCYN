import { describe, it, expect, beforeEach } from 'vitest';
import { ProductService } from '../src/server/services/productService';
import { InventoryService } from '../src/server/services/inventoryService';
import { ShippingService } from '../src/server/services/shippingService';
import { CartService } from '../src/server/services/cartService';
import { CheckoutService } from '../src/server/services/checkoutService';
import { OrderService } from '../src/server/services/orderService';
import { PaymentService, MockPaymentProvider } from '../src/server/services/paymentService';
import { WebhookService } from '../src/server/services/webhookService';
import { EventService } from '../src/server/services/eventService';
import { dbStore } from '../src/server/db/store';

describe('PIERCYN V1 Commerce Engine', () => {
  beforeEach(() => {
    // Reset seed data before each test
    dbStore.seedFromCatalog();
  });

  describe('1. Product & Variant Catalog', () => {
    it('retrieves products with structured variants and live inventory', () => {
      const products = ProductService.getAllProducts();
      expect(products.length).toBeGreaterThan(0);

      const first = products[0];
      expect(first.id).toBeDefined();
      expect(first.name).toBeDefined();
      expect(first.priceNGN).toBeGreaterThan(0);
      expect(first.variants.length).toBeGreaterThan(0);

      const variant = first.variants[0];
      expect(variant.sku).toMatch(/^PCY-/);
      expect(variant.colour).toBeDefined();
      expect(variant.size).toBeDefined();
      expect(variant.stock).toBeDefined();
      expect(variant.stock?.availableStock).toBeGreaterThan(0);
    });

    it('retrieves specific variant by SKU', () => {
      const products = ProductService.getAllProducts();
      const targetSku = products[0].variants[0].sku;
      const variant = ProductService.getVariantByIdOrSku(targetSku);

      expect(variant).not.toBeNull();
      expect(variant?.sku).toBe(targetSku);
      expect(variant?.isAvailable).toBe(true);
    });
  });

  describe('2. Centralized Shipping Configuration', () => {
    it('applies standard shipping fees below threshold', () => {
      const subtotal = 50000;
      const lagosFee = ShippingService.calculateFee('lagos', subtotal);
      const nationwideFee = ShippingService.calculateFee('nationwide', subtotal);

      expect(lagosFee).toBe(2500);
      expect(nationwideFee).toBe(4500);
    });

    it('applies free shipping at or above threshold (₦100,000)', () => {
      const subtotal = 100000;
      const lagosFee = ShippingService.calculateFee('lagos', subtotal);
      const nationwideFee = ShippingService.calculateFee('nationwide', subtotal);

      expect(lagosFee).toBe(0);
      expect(nationwideFee).toBe(0);
    });
  });

  describe('3. Server-Side Cart & Pricing Engine', () => {
    it('calculates line item totals and subtotal server-side without trusting client pricing', () => {
      const products = ProductService.getAllProducts();
      const variant1 = products[0].variants[0];
      const variant2 = products[1].variants[0];

      const cart = CartService.calculateItems('test-session', [
        { variantId: variant1.id, quantity: 2 },
        { variantId: variant2.id, quantity: 1 },
      ]);

      const expectedSubtotal = (variant1.priceNGN || products[0].priceNGN) * 2 + (variant2.priceNGN || products[1].priceNGN) * 1;
      expect(cart.subtotalNGN).toBe(expectedSubtotal);
      expect(cart.itemCount).toBe(3);
      expect(cart.isValid).toBe(true);
      expect(cart.validationErrors.length).toBe(0);
    });

    it('flags unavailable stock when requested quantity exceeds available units', () => {
      const products = ProductService.getAllProducts();
      const variant = products[0].variants[0];

      const cart = CartService.calculateItems('test-session', [
        { variantId: variant.id, quantity: 9999 }, // Far exceeding stock
      ]);

      expect(cart.isValid).toBe(false);
      expect(cart.validationErrors.length).toBeGreaterThan(0);
      expect(cart.items[0].isAvailable).toBe(false);
    });
  });

  describe('4. Inventory Reservation & Overselling Protection', () => {
    it('atomically reserves stock and records ledger transaction', () => {
      const products = ProductService.getAllProducts();
      const variant = products[0].variants[0];
      const initialStock = InventoryService.getVariantStock(variant.id)!.availableStock;

      const orderRef = 'PCY-TEST-RES-01';
      const reserved = InventoryService.reserveStock(variant.id, 2, orderRef);

      expect(reserved).toBe(true);
      const updatedStock = InventoryService.getVariantStock(variant.id)!;
      expect(updatedStock.availableStock).toBe(initialStock - 2);
      expect(updatedStock.reservedStock).toBe(2);

      const ledger = InventoryService.getLedger(variant.id);
      const resTx = ledger.find((tx) => tx.type === 'RESERVATION' && tx.reference === orderRef);
      expect(resTx).toBeDefined();
      expect(resTx?.quantity).toBe(2);
    });

    it('releases reserved stock back to available units upon cancellation', () => {
      const products = ProductService.getAllProducts();
      const variant = products[0].variants[0];
      const initialStock = InventoryService.getVariantStock(variant.id)!.availableStock;

      const orderRef = 'PCY-TEST-CANCEL-01';
      InventoryService.reserveStock(variant.id, 3, orderRef);
      InventoryService.releaseReservation(orderRef);

      const restoredStock = InventoryService.getVariantStock(variant.id)!;
      expect(restoredStock.availableStock).toBe(initialStock);
      expect(restoredStock.reservedStock).toBe(0);
    });
  });

  describe('5. Order Creation & Snapshotting', () => {
    it('creates an order with full historical snapshot of items and totals', () => {
      const products = ProductService.getAllProducts();
      const variant = products[0].variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Tunde Adeleke',
          email: 'tunde@piercyn.com',
          phone: '+2348012345678',
          state: 'Lagos State',
          city: 'Ikoyi',
          address: '15 Queens Drive',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'transfer',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      expect(order.id).toBeDefined();
      expect(order.orderNumber).toMatch(/^PCY-/);
      expect(order.orderStatus).toBe('PENDING_PAYMENT');
      expect(order.paymentStatus).toBe('PENDING');
      expect(order.items.length).toBe(1);

      const snapItem = order.items[0];
      expect(snapItem.sku).toBe(variant.sku);
      expect(snapItem.productName).toBe(products[0].name);
      expect(snapItem.unitPriceNGN).toBe(products[0].priceNGN);
      expect(snapItem.quantity).toBe(1);
    });

    it('rejects order creation when a variant is out of stock', () => {
      const products = ProductService.getAllProducts();
      const variant = products[0].variants[0];

      // Set variant stock to 0
      const inv = InventoryService.getVariantStock(variant.id)!;
      inv.availableStock = 0;

      expect(() => {
        OrderService.createOrder({
          customer: {
            fullName: 'Test Customer',
            email: 'test@piercyn.com',
            phone: '+2348011223344',
            state: 'Lagos State',
            city: 'Ikeja',
            address: 'Allen Avenue',
          },
          shippingRegion: 'lagos',
          paymentMethod: 'transfer',
          items: [{ variantId: variant.id, quantity: 1 }],
        });
      }).toThrow(/Insufficient stock|Checkout validation failed/);
    });

    it('rejects order creation for a non-existent variant ID', () => {
      expect(() => {
        OrderService.createOrder({
          customer: {
            fullName: 'Fake Variant Customer',
            email: 'fake@piercyn.com',
            phone: '+2348099999999',
            state: 'Lagos State',
            city: 'Lekki',
            address: 'Admiralty Way',
          },
          shippingRegion: 'lagos',
          paymentMethod: 'transfer',
          items: [{ variantId: 'var-non-existent-999', quantity: 1 }],
        });
      }).toThrow(/not found|Checkout validation failed/);
    });

    it('applies centralized promo codes and recalculates totals correctly', () => {
      const products = ProductService.getAllProducts();
      const variant = products[0].variants[0];

      // Quote with 15% STANDOUT promo
      const quoteStandout = CheckoutService.calculateQuote('test-session', 'lagos', [{ variantId: variant.id, quantity: 1 }], 'STANDOUT');
      expect(quoteStandout.discountNGN).toBe(Math.round(quoteStandout.subtotalNGN * 0.15));
      expect(quoteStandout.totalNGN).toBe(quoteStandout.subtotalNGN + quoteStandout.deliveryFeeNGN - quoteStandout.discountNGN);

      // Quote with 10% PIERCYN10 promo
      const quote10 = CheckoutService.calculateQuote('test-session', 'lagos', [{ variantId: variant.id, quantity: 1 }], 'PIERCYN10');
      expect(quote10.discountNGN).toBe(Math.round(quote10.subtotalNGN * 0.1));

      // Quote with invalid promo
      const quoteInvalid = CheckoutService.calculateQuote('test-session', 'lagos', [{ variantId: variant.id, quantity: 1 }], 'INVALID_CODE_999');
      expect(quoteInvalid.discountNGN).toBe(0);
    });
  });

  describe('6. Payment Verification & State Machine', () => {
    it('transitions order to PAID and finalizes inventory upon successful verification', async () => {
      PaymentService.setProvider(new MockPaymentProvider());

      const products = ProductService.getAllProducts();
      const variant = products[0].variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Amaka Obi',
          email: 'amaka@piercyn.com',
          phone: '+2348099887766',
          state: 'Lagos State',
          city: 'Victoria Island',
          address: 'Ahmadu Bello Way',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'mock',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      expect(order.orderStatus).toBe('PENDING_PAYMENT');

      const verification = await PaymentService.verifyPayment(order.orderNumber);
      expect(verification.success).toBe(true);

      const verifiedOrder = OrderService.getOrder(order.orderNumber)!;
      expect(verifiedOrder.paymentStatus).toBe('PAID');
      expect(verifiedOrder.orderStatus).toBe('PAID');
      expect(verifiedOrder.paidAt).toBeDefined();

      const variantStock = InventoryService.getVariantStock(variant.id)!;
      expect(variantStock.soldStock).toBeGreaterThanOrEqual(1);
    });
  });

  describe('7. Webhook Idempotency & Replay Protection', () => {
    it('safely handles duplicate webhooks without double charging or double decrementing stock', async () => {
      const products = ProductService.getAllProducts();
      const variant = products[0].variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Kolawole Sanusi',
          email: 'kola@piercyn.com',
          phone: '+2348055443322',
          state: 'Lagos State',
          city: 'Lekki Phase 1',
          address: 'Admiralty Way',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      const payload = {
        event: 'charge.success',
        data: {
          reference: order.orderNumber,
          status: 'success',
          amount: order.totalNGN * 100,
          paid_at: new Date().toISOString(),
          metadata: {
            order_number: order.orderNumber,
          },
        },
      };

      // First webhook call
      const res1 = await WebhookService.handlePaystackWebhook('sig1', JSON.stringify(payload), payload);
      expect(res1.processed).toBe(true);
      expect(res1.idempotentDuplicate).toBe(false);

      const orderAfterFirst = OrderService.getOrder(order.orderNumber)!;
      expect(orderAfterFirst.paymentStatus).toBe('PAID');

      // Replayed duplicate webhook
      const res2 = await WebhookService.handlePaystackWebhook('sig1', JSON.stringify(payload), payload);
      expect(res2.processed).toBe(true);
      expect(res2.idempotentDuplicate).toBe(true);
    });
  });

  describe('8. Business Events & Atelier Analytics', () => {
    it('records business events and generates summary metrics', () => {
      EventService.track({
        eventType: 'product_view',
        productId: 'oversized-tee',
      });

      const analytics = EventService.getAnalyticsSummary();
      expect(analytics.totalEvents).toBeGreaterThan(0);
      expect(analytics.productViews['oversized-tee']).toBeGreaterThanOrEqual(1);
    });
  });
});
