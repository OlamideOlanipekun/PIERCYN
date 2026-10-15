import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/server/db/store';
import { AdminAuthService } from '../src/server/modules/admin/adminAuthService';
import { OrderService } from '../src/server/modules/orders/orderService';
import { ProductService } from '../src/server/modules/products/productService';
import { InventoryService } from '../src/server/modules/inventory/inventoryService';
import { AnalyticsService } from '../src/server/modules/analytics/analyticsService';
import { AuditService } from '../src/server/modules/admin/auditService';

describe('PIERCYN V1 Admin Dashboard & Operations Engine', () => {
  beforeEach(() => {
    dbStore.seedFromCatalog();
  });

  describe('1. Admin Authentication & Route Protection', () => {
    it('authenticates seeded admin credentials and yields a valid session token', async () => {
      const result = await AdminAuthService.login('admin@piercyn.com', 'piercynAdmin2026', 'test-ip-1');
      expect(result.token).toBeDefined();
      expect(result.token.startsWith('adm_tok_')).toBe(true);
      expect(result.admin.role).toBe('ADMIN');
      expect(result.admin.email).toBe('admin@piercyn.com');
    });

    it('rejects invalid admin passwords', async () => {
      await expect(
        AdminAuthService.login('admin@piercyn.com', 'wrongPassword', 'test-ip-2')
      ).rejects.toThrow(/Invalid administrative credentials/);
    });

    it('rejects non-admin customer accounts from admin authentication', async () => {
      await expect(
        AdminAuthService.login('client@piercyn.com', 'piercyn2026', 'test-ip-3')
      ).rejects.toThrow(/Invalid administrative credentials/);
    });

    it('verifies valid admin tokens and rejects expired/invalid tokens', async () => {
      const loginRes = await AdminAuthService.login('admin@piercyn.com', 'piercynAdmin2026', 'test-ip-4');
      const verified = AdminAuthService.verifyToken(loginRes.token);
      expect(verified).not.toBeNull();
      expect(verified?.email).toBe('admin@piercyn.com');

      const fakeTokenVerified = AdminAuthService.verifyToken('adm_tok_fake_99999');
      expect(fakeTokenVerified).toBeNull();
    });

    it('invalidates admin token upon logout', async () => {
      const loginRes = await AdminAuthService.login('admin@piercyn.com', 'piercynAdmin2026', 'test-ip-5');
      expect(AdminAuthService.verifyToken(loginRes.token)).not.toBeNull();

      AdminAuthService.logout(loginRes.token);
      expect(AdminAuthService.verifyToken(loginRes.token)).toBeNull();
    });
  });

  describe('Product image galleries', () => {
    it('persists gallery order when a new primary image is selected', () => {
      const product = ProductService.getAllProducts()[0];
      const images = ['https://example.test/front.jpg', 'https://example.test/side.jpg', 'https://example.test/back.jpg'];

      ProductService.updateProduct(product.id, { images: [images[2], images[0], images[1]] });

      expect(ProductService.getProductBySlugOrId(product.id, true)?.images).toEqual([
        'https://example.test/back.jpg',
        'https://example.test/front.jpg',
        'https://example.test/side.jpg',
      ]);
    });

    it('replaces one gallery image without changing the other entries', () => {
      const product = ProductService.getAllProducts()[0];
      ProductService.updateProduct(product.id, { images: ['first.jpg', 'replacement.jpg', 'third.jpg'] });

      expect(ProductService.getProductBySlugOrId(product.id, true)?.images).toEqual([
        'first.jpg',
        'replacement.jpg',
        'third.jpg',
      ]);
    });
  });

  describe('2. Order Operations & State Machine Transitions', () => {
    it('creates an order and respects valid state transitions: PENDING_PAYMENT -> PAID -> PROCESSING -> PACKED -> SHIPPED -> DELIVERED -> COMPLETED', () => {
      const products = ProductService.getAllProducts();
      const variant = products[0].variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Tade Ogundimu',
          email: 'tade@lagos.ng',
          phone: '+2348022334455',
          state: 'Lagos State',
          city: 'Victoria Island',
          address: '10 Bishop Oluwole',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'card',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      expect(order.orderStatus).toBe('PENDING_PAYMENT');

      // 1. Mark PAID
      const paidOrder = OrderService.updateStatus(order.id, 'PAID', 'Payment received via Paystack');
      expect(paidOrder.orderStatus).toBe('PAID');
      expect(paidOrder.paymentStatus).toBe('PAID');

      // 2. Mark PROCESSING
      const processingOrder = OrderService.updateStatus(order.id, 'PROCESSING', 'Atelier cutting started');
      expect(processingOrder.orderStatus).toBe('PROCESSING');

      // 3. Mark PACKED
      const packedOrder = OrderService.updateStatus(order.id, 'PACKED', 'Packaged in matte box');
      expect(packedOrder.orderStatus).toBe('PACKED');

      // 4. Mark SHIPPED
      const shippedOrder = OrderService.updateStatus(order.id, 'SHIPPED', 'Handed to Kwik Dispatch');
      expect(shippedOrder.orderStatus).toBe('SHIPPED');

      // 5. Mark DELIVERED
      const deliveredOrder = OrderService.updateStatus(order.id, 'DELIVERED', 'Delivered to client');
      expect(deliveredOrder.orderStatus).toBe('DELIVERED');

      // 6. Mark COMPLETED
      const completedOrder = OrderService.updateStatus(order.id, 'COMPLETED', 'Order cycle completed');
      expect(completedOrder.orderStatus).toBe('COMPLETED');
    });

    it('rejects arbitrary invalid order state transitions (e.g. COMPLETED directly to PENDING_PAYMENT)', () => {
      const products = ProductService.getAllProducts();
      const variant = products[0].variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Test Transition',
          email: 'transition@lagos.ng',
          phone: '+2348000000001',
          state: 'Lagos State',
          city: 'Ikoyi',
          address: 'Bourdillon Road',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'card',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      // Cannot jump from PENDING_PAYMENT directly to DELIVERED or COMPLETED
      expect(() => {
        OrderService.updateStatus(order.id, 'DELIVERED');
      }).toThrow(/Invalid order status transition/);

      expect(() => {
        OrderService.updateStatus(order.id, 'COMPLETED');
      }).toThrow(/Invalid order status transition/);
    });
  });

  describe('3. Variant-Level Inventory & Ledger Audit Trail', () => {
    it('manually restocks inventory and records immutable ledger transaction', () => {
      const products = ProductService.getAllProducts();
      const variant = products[0].variants[0];
      const invBefore = InventoryService.getVariantStock(variant.id)!;
      const initialStock = invBefore.availableStock;

      const success = InventoryService.adjustStock(
        variant.id,
        25,
        'PURCHASE',
        'RESTOCK-TEST-BATCH-01',
        'New factory delivery'
      );

      expect(success).toBe(true);
      const invAfter = InventoryService.getVariantStock(variant.id)!;
      expect(invAfter.availableStock).toBe(initialStock + 25);

      // Verify ledger has the transaction
      const ledger = InventoryService.getLedger(variant.id);
      expect(ledger.length).toBeGreaterThan(0);
      const latestTx = ledger[0];
      expect(latestTx.reference).toBe('RESTOCK-TEST-BATCH-01');
      expect(latestTx.quantity).toBe(25);
      expect(latestTx.type).toBe('PURCHASE');
    });

    it('records administrative actions into AuditService', () => {
      const log = AuditService.log({
        adminId: 'usr-admin-01',
        adminEmail: 'admin@piercyn.com',
        action: 'ORDER_STATUS_CHANGED',
        resource: 'ORDER',
        resourceId: 'PCY-999',
        previousValue: 'PAID',
        newValue: 'PROCESSING',
        note: 'Order fulfillment started',
      });

      expect(log.id).toBeDefined();
      expect(log.createdAt).toBeDefined();

      const retrieved = AuditService.getLogs(10, 'ORDER');
      expect(retrieved.some((l) => l.id === log.id)).toBe(true);
    });
  });

  describe('4. Cycle 1 Analytics & Financial Statement', () => {
    it('accurately computes Revenue, Cost of Goods Sold (COGS), Gross Profit and Margins', () => {
      const products = ProductService.getAllProducts();
      const p = products[0];
      const variant = p.variants[0];

      // Place and pay for an order
      const order = OrderService.createOrder({
        customer: {
          fullName: 'Chidi Mokeme',
          email: 'chidi@piercyn.com',
          phone: '+2348099887766',
          state: 'Lagos State',
          city: 'Lekki',
          address: 'Admiralty Road',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'card',
        items: [{ variantId: variant.id, quantity: 2 }],
      });

      OrderService.markOrderPaid(order.orderNumber, 'ref-test-analytics');

      const analytics = AnalyticsService.getAnalyticsSummary();
      expect(analytics.paidOrders).toBeGreaterThanOrEqual(1);
      expect(analytics.revenueNGN).toBeGreaterThanOrEqual(order.totalNGN);
      expect(analytics.cogsNGN).toBeGreaterThan(0);
      expect(analytics.grossProfitNGN).toBe(analytics.revenueNGN - analytics.cogsNGN);
      expect(analytics.grossMarginPercent).toBeGreaterThan(0);
      expect(analytics.averageOrderValueNGN).toBeGreaterThan(0);
      expect(analytics.topSellingSizes.length).toBeGreaterThan(0);
    });
  });
});
