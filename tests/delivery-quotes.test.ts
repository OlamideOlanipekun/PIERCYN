import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/server/db/store';
import { DeliveryQuoteService, normalisePhone } from '../src/server/modules/orders/deliveryQuoteService';
import { OrderService } from '../src/server/services/orderService';
import { ProductService } from '../src/server/services/productService';

describe('Manual Delivery & WhatsApp Quotation Engine', () => {
  beforeEach(() => {
    dbStore.seedFromCatalog();
  });

  describe('1. Phone Normalisation', () => {
    it('normalises standard 11-digit Nigerian mobile numbers starting with 08, 07, 09', () => {
      expect(normalisePhone('08012345678')).toBe('+2348012345678');
      expect(normalisePhone('07098765432')).toBe('+2347098765432');
      expect(normalisePhone('09011223344')).toBe('+2349011223344');
    });

    it('handles formatted numbers with spaces, hyphens, and parentheses', () => {
      expect(normalisePhone('(080) 123-45678')).toBe('+2348012345678');
      expect(normalisePhone('080 1234 5678')).toBe('+2348012345678');
    });

    it('preserves existing valid E.164 international numbers', () => {
      expect(normalisePhone('+2348012345678')).toBe('+2348012345678');
      expect(normalisePhone('+447123456789')).toBe('+447123456789');
      expect(normalisePhone('+12025550123')).toBe('+12025550123');
    });

    it('converts bare 234 numbers without leading +', () => {
      expect(normalisePhone('2348012345678')).toBe('+2348012345678');
    });

    it('rejects invalid or too short phone numbers', () => {
      expect(normalisePhone('')).toBeNull();
      expect(normalisePhone('12345')).toBeNull();
      expect(normalisePhone('abcdefghijk')).toBeNull();
    });
  });

  describe('2. Delivery Fee Setting & Quote Calculation', () => {
    it('sets manual delivery fee and calculates authoritative final total', () => {
      const product = ProductService.getAllProducts()[0];
      const variant = product.variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Amina Yusuf',
          email: 'amina@piercyn.com',
          phone: '08023456789',
          state: 'Lagos State',
          city: 'Ikeja GRA',
          address: '15 Isaac John Street',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      const updated = DeliveryQuoteService.setDeliveryQuote(
        order.orderNumber,
        {
          deliveryFeeNGN: 3500,
          estimatedTimeframe: 'Same-day delivery before 6 PM',
          internalNote: 'Hand-deliver to reception',
        },
        'admin-operator-1'
      );

      expect(updated.quoteStatus).toBe('SET');
      expect(updated.deliveryFeeNGN).toBe(3500);
      expect(updated.quoteDeliveryFeeNGN).toBe(3500);
      expect(updated.quoteVersion).toBe(1);
      expect(updated.totalNGN).toBe(order.subtotalNGN + 3500 - order.discountNGN);
      expect(updated.quoteEstimatedTimeframe).toBe('Same-day delivery before 6 PM');
      expect(updated.quoteInternalNote).toBe('Hand-deliver to reception');
      expect(updated.quoteSetByAdmin).toBe('admin-operator-1');
      expect(updated.quoteSentAt).toBeUndefined();
    });

    it('rejects negative delivery fees', () => {
      const product = ProductService.getAllProducts()[0];
      const variant = product.variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Test Customer',
          email: 'test@piercyn.com',
          phone: '08011112222',
          state: 'Lagos',
          city: 'Surulere',
          address: 'Bode Thomas',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      expect(() => {
        DeliveryQuoteService.setDeliveryQuote(
          order.orderNumber,
          { deliveryFeeNGN: -500 },
          'admin-1'
        );
      }).toThrow(/non-negative/i);
    });

    it('sets different delivery fees for different orders independently without cross-mutation', () => {
      const product = ProductService.getAllProducts()[0];
      const variant = product.variants[0];

      const orderA = OrderService.createOrder({
        customer: {
          fullName: 'Customer A',
          email: 'a@piercyn.com',
          phone: '08011111111',
          state: 'Lagos',
          city: 'Yaba',
          address: 'Street A',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      const orderB = OrderService.createOrder({
        customer: {
          fullName: 'Customer B',
          email: 'b@piercyn.com',
          phone: '08022222222',
          state: 'Lagos',
          city: 'Ikeja',
          address: 'Street B',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      DeliveryQuoteService.setDeliveryQuote(orderA.orderNumber, { deliveryFeeNGN: 2000 }, 'admin-1');
      DeliveryQuoteService.setDeliveryQuote(orderB.orderNumber, { deliveryFeeNGN: 4500 }, 'admin-1');

      const dbA = dbStore.orders.get(orderA.id)!;
      const dbB = dbStore.orders.get(orderB.id)!;

      expect(dbA.quoteDeliveryFeeNGN).toBe(2000);
      expect(dbB.quoteDeliveryFeeNGN).toBe(4500);

      // Modify order A fee only
      DeliveryQuoteService.setDeliveryQuote(orderA.orderNumber, { deliveryFeeNGN: 3000 }, 'admin-2');
      const updatedA = dbStore.orders.get(orderA.id)!;
      const untouchedB = dbStore.orders.get(orderB.id)!;

      expect(updatedA.quoteDeliveryFeeNGN).toBe(3000);
      expect(untouchedB.quoteDeliveryFeeNGN).toBe(4500);
    });

    it('increments quote version and invalidates prior acceptance when fee is updated', () => {
      const product = ProductService.getAllProducts()[0];
      const variant = product.variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Chidi Obi',
          email: 'chidi@piercyn.com',
          phone: '08033334444',
          state: 'Lagos',
          city: 'Yaba',
          address: 'Herbert Macaulay',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      // 1. Initial quote
      DeliveryQuoteService.setDeliveryQuote(order.orderNumber, { deliveryFeeNGN: 2500 }, 'admin-1');
      DeliveryQuoteService.markQuoteSent(order.orderNumber, 'admin-1');
      DeliveryQuoteService.recordAcceptance(order.orderNumber, 'admin-1');

      const acceptedOrder = dbStore.orders.get(order.id)!;
      expect(acceptedOrder.quoteStatus).toBe('ACCEPTED');
      expect(acceptedOrder.quoteVersion).toBe(1);

      // 2. Admin revises fee (customer changed location or rider cost changed)
      const revised = DeliveryQuoteService.setDeliveryQuote(
        order.orderNumber,
        { deliveryFeeNGN: 4000 },
        'admin-2'
      );

      expect(revised.quoteVersion).toBe(2);
      expect(revised.quoteStatus).toBe('SET');
      expect(revised.quoteAcceptedAt).toBeUndefined();
      expect(revised.quoteAcceptedFeeNGN).toBeUndefined();
      expect(revised.quoteDeliveryFeeNGN).toBe(4000);
      expect(DeliveryQuoteService.isPaymentAllowed(revised)).toBe(false);
    });
  });

  describe('3. WhatsApp URL Generation & Security', () => {
    it('generates a personalised WhatsApp link without leaking internal notes or admin data', () => {
      const product = ProductService.getAllProducts()[0];
      const variant = product.variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Bolanle Adeyemi',
          email: 'bolanle@piercyn.com',
          phone: '08055667788',
          state: 'Lagos',
          city: 'Victoria Island',
          address: 'Ahmadu Bello Way',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      DeliveryQuoteService.setDeliveryQuote(
        order.orderNumber,
        {
          deliveryFeeNGN: 3000,
          estimatedTimeframe: 'Within 24 hours',
          internalNote: 'CONFIDENTIAL: Customer asked for discount',
        },
        'admin-secret-id'
      );

      const result = DeliveryQuoteService.generateWhatsAppUrl(order.orderNumber);

      expect(result.error).toBeNull();
      expect(result.phone).toBe('+2348055667788');
      expect(result.url).toBeDefined();
      expect(result.url).toContain('wa.me/2348055667788');

      // Security checks
      expect(result.message).not.toContain('CONFIDENTIAL');
      expect(result.message).not.toContain('admin-secret-id');
      expect(result.message).toContain('Bolanle');
      expect(result.message).toContain(order.orderNumber);
      expect(result.message).toContain('₦3,000');
    });

    it('returns error if delivery fee is not set before generating WhatsApp link', () => {
      const product = ProductService.getAllProducts()[0];
      const variant = product.variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Tunde Bakare',
          email: 'tunde@piercyn.com',
          phone: '08012345678',
          state: 'Lagos',
          city: 'Gbagada',
          address: 'Diya Street',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      // Clear delivery quote
      const dbOrder = dbStore.orders.get(order.id)!;
      dbOrder.quoteDeliveryFeeNGN = undefined;

      const result = DeliveryQuoteService.generateWhatsAppUrl(order.orderNumber);
      expect(result.error).toMatch(/has not been set/i);
      expect(result.url).toBeNull();
    });
  });

  describe('4. Lifecycle: Sent, Acceptance, Rejection & Payment Gate', () => {
    it('enforces SET -> SENT -> ACCEPTED state progression', () => {
      const product = ProductService.getAllProducts()[0];
      const variant = product.variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Emeka Eze',
          email: 'emeka@piercyn.com',
          phone: '08099887766',
          state: 'Lagos',
          city: 'Ikoyi',
          address: 'Kingsway Road',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      DeliveryQuoteService.setDeliveryQuote(order.orderNumber, { deliveryFeeNGN: 2500 }, 'admin-1');

      // Cannot accept before marking as sent
      expect(() => {
        DeliveryQuoteService.recordAcceptance(order.orderNumber, 'admin-1');
      }).toThrow(/quote has been sent/i);

      // Mark sent
      const sentOrder = DeliveryQuoteService.markQuoteSent(order.orderNumber, 'admin-1');
      expect(sentOrder.quoteStatus).toBe('SENT');
      expect(sentOrder.quoteSentAt).toBeDefined();

      // Accept
      const acceptedOrder = DeliveryQuoteService.recordAcceptance(order.orderNumber, 'admin-1');
      expect(acceptedOrder.quoteStatus).toBe('ACCEPTED');
      expect(acceptedOrder.quoteAcceptedFeeNGN).toBe(2500);
      expect(DeliveryQuoteService.isPaymentAllowed(acceptedOrder)).toBe(true);
    });

    it('properly records customer rejection and blocks payment', () => {
      const product = ProductService.getAllProducts()[0];
      const variant = product.variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Damilola Cole',
          email: 'damilola@piercyn.com',
          phone: '08012349999',
          state: 'Lagos',
          city: 'Ajah',
          address: 'Badore Road',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      DeliveryQuoteService.setDeliveryQuote(order.orderNumber, { deliveryFeeNGN: 5000 }, 'admin-1');
      DeliveryQuoteService.markQuoteSent(order.orderNumber, 'admin-1');

      const rejected = DeliveryQuoteService.recordRejection(order.orderNumber, 'admin-1');
      expect(rejected.quoteStatus).toBe('REJECTED');
      expect(rejected.quoteRejectedAt).toBeDefined();
      expect(DeliveryQuoteService.isPaymentAllowed(rejected)).toBe(false);
    });
  });

  describe('5. Manual Rider Management & Fulfilment', () => {
    it('blocks rider assignment before payment is confirmed', () => {
      const product = ProductService.getAllProducts()[0];
      const variant = product.variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Sola Shittu',
          email: 'sola@piercyn.com',
          phone: '08077665544',
          state: 'Lagos',
          city: 'Maryland',
          address: 'Mobolaji Bank Anthony Way',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      expect(() => {
        DeliveryQuoteService.assignRider(
          order.orderNumber,
          { riderName: 'Musa Ibrahim', riderPhone: '08012340000' },
          'admin-1'
        );
      }).toThrow(/after payment has been verified/i);
    });

    it('assigns rider and records dispatch once order is paid', () => {
      const product = ProductService.getAllProducts()[0];
      const variant = product.variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Zainab Ahmed',
          email: 'zainab@piercyn.com',
          phone: '08099001122',
          state: 'Lagos',
          city: 'Lekki',
          address: 'Freedom Way',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      // Mark order as paid
      const dbOrder = dbStore.orders.get(order.id)!;
      dbOrder.paymentStatus = 'PAID';
      dbOrder.orderStatus = 'PAID';

      const assigned = DeliveryQuoteService.assignRider(
        order.orderNumber,
        { riderName: 'Musa Ibrahim', riderPhone: '08012340000' },
        'admin-1'
      );

      expect(assigned.riderName).toBe('Musa Ibrahim');
      expect(assigned.riderPhone).toBe('08012340000');

      const dispatched = DeliveryQuoteService.recordDispatch(
        order.orderNumber,
        { dispatchNote: 'Package handed to rider at 2 PM' },
        'admin-1'
      );

      expect(dispatched.dispatchedAt).toBeDefined();
      expect(dispatched.dispatchNote).toBe('Package handed to rider at 2 PM');
    });
  });

  describe('6. Stranded Order Recovery & Quote Synchronization', () => {
    it('rejects generateWhatsAppUrl when quoteStatus is PENDING even if deliveryFeeNGN is 0', () => {
      const product = ProductService.getAllProducts()[0];
      const variant = product.variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Tola Shonibare',
          email: 'tola@piercyn.com',
          phone: '08033334444',
          state: 'Lagos',
          city: 'Yaba',
          address: 'Commercial Avenue',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      expect(order.quoteStatus).toBe('PENDING');
      const result = DeliveryQuoteService.generateWhatsAppUrl(order.orderNumber);
      expect(result.error).toMatch(/Delivery fee has not been set yet/i);
      expect(result.url).toBeNull();
    });

    it('allows reconciling stranded orders that were marked PAID while quoteStatus was PENDING', () => {
      const product = ProductService.getAllProducts()[0];
      const variant = product.variants[0];

      const order = OrderService.createOrder({
        customer: {
          fullName: 'Chidi Mokeme',
          email: 'chidi@piercyn.com',
          phone: '08055556666',
          state: 'Lagos',
          city: 'Lekki',
          address: 'Admiralty Way',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'transfer',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      // Simulate order erroneously marked paid/packed while quote is still pending
      const dbOrder = dbStore.orders.get(order.id)!;
      dbOrder.paymentStatus = 'PAID';
      dbOrder.orderStatus = 'PACKED';
      expect(dbOrder.quoteStatus).toBe('PENDING');

      // Admin reconciles the missing delivery fee
      const reconciled = DeliveryQuoteService.setDeliveryQuote(
        order.orderNumber,
        { deliveryFeeNGN: 3500 },
        'admin-recovery'
      );
      expect(reconciled.quoteStatus).toBe('SET');
      expect(reconciled.quoteDeliveryFeeNGN).toBe(3500);

      // Now acceptance can proceed
      DeliveryQuoteService.markQuoteSent(order.orderNumber, 'admin-recovery');
      const accepted = DeliveryQuoteService.recordAcceptance(order.orderNumber, 'admin-recovery');
      expect(accepted.quoteStatus).toBe('ACCEPTED');
      expect(accepted.quoteAcceptedFeeNGN).toBe(3500);
    });
  });
});
