import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/server/db/store';
import { DeliveryQuoteService } from '../src/server/modules/orders/deliveryQuoteService';
import { OrderService } from '../src/server/services/orderService';
import { ProductService } from '../src/server/services/productService';

describe('Open WhatsApp & Copy Quotation Workflow', () => {
  beforeEach(() => {
    dbStore.seedFromCatalog();
  });

  it('generates the quotation with correct customer details, pricing, delivery fee and wa.me URL', () => {
    const product = ProductService.getAllProducts()[0];
    const variant = product.variants[0];

    const order = OrderService.createOrder({
      customer: {
        fullName: 'Folashade Adeleke',
        email: 'folashade@example.com',
        phone: '08123456789',
        state: 'Lagos',
        city: 'Ikoyi',
        address: '15 Queens Drive',
      },
      shippingRegion: 'lagos',
      paymentMethod: 'paystack',
      items: [{ variantId: variant.id, quantity: 2 }],
    });

    // Set delivery fee
    DeliveryQuoteService.setDeliveryQuote(
      order.orderNumber,
      {
        deliveryFeeNGN: 4500,
        estimatedTimeframe: 'Same-day delivery (Ikoyi)',
      },
      'admin-1'
    );

    const quoteData = DeliveryQuoteService.generateWhatsAppUrl(order.orderNumber);

    expect(quoteData.error).toBeNull();
    expect(quoteData.phone).toBe('+2348123456789');
    expect(quoteData.url).toContain('https://wa.me/2348123456789?text=');

    // Verifies PIERCYN quotation template formatting
    expect(quoteData.message).toContain('Hello Folashade 👋');
    expect(quoteData.message).toContain('Thank you for shopping with PIERCYN!');
    expect(quoteData.message).toContain(`*Order:* ${order.orderNumber}`);
    expect(quoteData.message).toContain('Delivery fee: ₦4,500');
    expect(quoteData.message).toContain('Delivery location: Ikoyi, Lagos');
    expect(quoteData.message).toContain('Estimated delivery: Same-day delivery (Ikoyi)');
    expect(quoteData.message).toContain('Reply *YES* to accept or *NO*');
  });

  it('prevents generating an invalid quotation when delivery fee is missing or quote is PENDING', () => {
    const product = ProductService.getAllProducts()[0];
    const variant = product.variants[0];

    const order = OrderService.createOrder({
      customer: {
        fullName: 'Amaka Obi',
        email: 'amaka@example.com',
        phone: '07033445566',
        state: 'Abuja',
        city: 'Maitama',
        address: '5 Gana Street',
      },
      shippingRegion: 'nationwide',
      paymentMethod: 'paystack',
      items: [{ variantId: variant.id, quantity: 1 }],
    });

    const quoteData = DeliveryQuoteService.generateWhatsAppUrl(order.orderNumber);
    expect(quoteData.error).toMatch(/has not been set/i);
    expect(quoteData.url).toBeNull();
    expect(quoteData.message).toBe('');
  });

  it('validates and normalises diverse Nigerian phone formats without losing recipient accuracy', () => {
    const product = ProductService.getAllProducts()[0];
    const variant = product.variants[0];

    const formats = [
      { raw: '08099887766', expected: '+2348099887766' },
      { raw: '+2348099887766', expected: '+2348099887766' },
      { raw: '2348099887766', expected: '+2348099887766' },
      { raw: '0901 234 5678', expected: '+2349012345678' },
    ];

    for (const { raw, expected } of formats) {
      const order = OrderService.createOrder({
        customer: {
          fullName: 'Test Recipient',
          email: 'test@example.com',
          phone: raw,
          state: 'Lagos',
          city: 'Lekki',
          address: 'Admiralty Way',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      DeliveryQuoteService.setDeliveryQuote(
        order.orderNumber,
        { deliveryFeeNGN: 2500 },
        'admin-test'
      );

      const quoteData = DeliveryQuoteService.generateWhatsAppUrl(order.orderNumber);
      expect(quoteData.error).toBeNull();
      expect(quoteData.phone).toBe(expected);
      expect(quoteData.url).toContain(`wa.me/${expected.replace('+', '')}`);
    }
  });
});
