import { describe, expect, it } from 'vitest';
import crypto from 'crypto';
import {
  renderOrderCreatedEmail,
  renderReceiptUploadedEmail,
  renderReceiptSubmittedCustomerEmail,
  renderPaymentVerifiedEmail,
  renderOutOfStockEmail,
} from '../apps/api/src/modules/notifications/emailTemplates';
import {
  sanitizeError,
  getSmtpConfig,
  getCustomerSmtpConfig,
} from '../apps/api/src/modules/notifications/emailConfig';
import { escapeAffiliateHtml } from '../apps/api/src/modules/affiliate/affiliateNotificationService';
import {
  OrderCreatedPayload,
  ReceiptUploadedPayload,
  PaymentVerifiedPayload,
  ProductOutOfStockPayload,
} from '../apps/api/src/modules/notifications/types';

describe('PIERCYN Notification Engine - Email Template Rendering', () => {
  it('renders ORDER_CREATED email with luxury styling and accurate line items', () => {
    const payload: OrderCreatedPayload = {
      orderId: 'ord_test_123',
      orderNumber: 'PCY-2026-9999',
      customerName: 'Adunni Adeleke',
      customerEmail: 'adunni@example.com',
      customerPhone: '+2348012345678',
      deliveryAddress: '15 Victoria Island, Lagos',
      deliveryCity: 'Lagos',
      deliveryState: 'Lagos State',
      subtotalNGN: 45000,
      deliveryFeeNGN: 3500,
      discountNGN: 5000,
      totalNGN: 43500,
      paymentMethod: 'DIRECT_BANK_TRANSFER',
      items: [
        {
          name: 'Silk Linen Atelier Shirt',
          sku: 'PCY-SHIRT-WHT-M',
          size: 'M',
          colour: 'Pure White',
          quantity: 1,
          unitPriceNGN: 45000,
          totalNGN: 45000,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const rendered = renderOrderCreatedEmail(payload);

    expect(rendered.subject).toContain('PCY-2026-9999');
    expect(rendered.subject).toContain('43,500');
    expect(rendered.html).toContain('PIERCYN');
    expect(rendered.html).toContain('Adunni Adeleke');
    expect(rendered.html).toContain('Silk Linen Atelier Shirt');
    expect(rendered.html).toContain('PCY-SHIRT-WHT-M');
    expect(rendered.text).toContain('PCY-2026-9999');
    expect(rendered.text).toContain('adunni@example.com');
  });

  it('escapes customer-controlled text before inserting it into email HTML', () => {
    const rendered = renderOrderCreatedEmail({
      orderId: 'ord_html_test',
      orderNumber: 'PCY-2026-HTML',
      customerName: 'Customer <b>name</b>',
      customerEmail: 'customer@example.com',
      customerPhone: '+2348000000000',
      deliveryAddress: '1 Test <img src=x>',
      deliveryCity: 'Lagos',
      deliveryState: 'Lagos',
      orderNote: '<img src=x onerror=alert(1)>',
      subtotalNGN: 1000,
      deliveryFeeNGN: 0,
      discountNGN: 0,
      totalNGN: 1000,
      paymentMethod: 'TRANSFER',
      items: [{
        name: '<svg onload=alert(1)>', sku: 'SKU-1', size: 'M', colour: 'Black',
        quantity: 1, unitPriceNGN: 1000, totalNGN: 1000,
      }],
      createdAt: new Date().toISOString(),
    });

    expect(rendered.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(rendered.html).toContain('&lt;svg onload=alert(1)&gt;');
    expect(rendered.html).not.toContain('<img src=x onerror=alert(1)>');
    expect(rendered.html).not.toContain('<svg onload=alert(1)>');
  });

  it('renders RECEIPT_UPLOADED email with payment proof & review requirements', () => {
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const payload: ReceiptUploadedPayload = {
      orderId: 'ord_test_456',
      orderNumber: 'PCY-2026-8888',
      customerName: 'Kunle Afolayan',
      customerEmail: 'kunle@example.com',
      customerPhone: '+2348098765432',
      totalNGN: 75000,
      providerReference: 'ORD_KUNLE_REF',
      receiptPath: '/uploads/receipts/proof.jpg',
      uploadedAt: new Date().toISOString(),
      reviewDeadlineAt: deadline,
    };

    const rendered = renderReceiptUploadedEmail(payload);

    expect(rendered.subject).toContain('Payment Receipt Uploaded');
    expect(rendered.subject).toContain('PCY-2026-8888');
    expect(rendered.html).toContain('Kunle Afolayan');
    expect(rendered.html).toContain('75,000');
    expect(rendered.html).toContain('proof.jpg');
    expect(rendered.text).toContain('ORD_KUNLE_REF');
    expect(rendered.text).toContain('/uploads/receipts/proof.jpg');
  });

  it('renders customer-facing receipt confirmation email acknowledging review within 24 hours', () => {
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const payload: ReceiptUploadedPayload = {
      orderId: 'ord_cust_receipt_99',
      orderNumber: 'PCY-2026-RECEIPT-CUST',
      customerName: 'Chidinma Okeke',
      customerEmail: 'chidinma@example.com',
      customerPhone: '+2348055556666',
      totalNGN: 92000,
      providerReference: 'PROV_REF_CHIDINMA',
      receiptPath: '/uploads/receipts/chidinma.pdf',
      uploadedAt: new Date().toISOString(),
      reviewDeadlineAt: deadline,
    };

    const rendered = renderReceiptSubmittedCustomerEmail(payload);

    expect(rendered.subject).toContain('Payment Receipt Received');
    expect(rendered.subject).toContain('PCY-2026-RECEIPT-CUST');
    expect(rendered.html).toContain('Chidinma Okeke');
    expect(rendered.html).toContain('Your Payment Receipt Is Under Review');
    expect(rendered.html).toContain('92,000');
    expect(rendered.html).toContain('PROV_REF_CHIDINMA');
    expect(rendered.html).toContain('24 hours');
    expect(rendered.html).toContain('piercyn@gmail.com');
    expect(rendered.text).toContain('PCY-2026-RECEIPT-CUST');
    expect(rendered.text).toContain('PROV_REF_CHIDINMA');
    expect(rendered.text).toContain('24 hours');
  });

  it('renders PAYMENT_VERIFIED email with confirmation and gateway reference', () => {
    const payload: PaymentVerifiedPayload = {
      orderId: 'ord_test_789',
      orderNumber: 'PCY-2026-7777',
      customerName: 'Zainab Balogun',
      customerEmail: 'zainab@example.com',
      customerPhone: '+2348011112222',
      amountNGN: 120000,
      paymentMethod: 'PAYSTACK',
      providerReference: 'pstk_ref_99281726',
      verificationSource: 'PAYSTACK_VERIFY',
      verifiedAt: new Date().toISOString(),
    };

    const rendered = renderPaymentVerifiedEmail(payload);

    expect(rendered.subject).toContain('Payment Verified');
    expect(rendered.subject).toContain('PCY-2026-7777');
    expect(rendered.html).toContain('120,000');
    expect(rendered.html).toContain('pstk_ref_99281726');
    expect(rendered.html).toContain('PAYSTACK_VERIFY');
    expect(rendered.text).toContain('Zainab Balogun');
  });

  it('renders PRODUCT_OUT_OF_STOCK email with SKU and inventory trigger details', () => {
    const payload: ProductOutOfStockPayload = {
      productId: 'prod_999',
      variantId: 'var_test_001',
      productName: 'Raw Silk Pleated Kimono',
      sku: 'KIMONO-RAW-SILK-BLK-L',
      size: 'L',
      colour: 'Obsidian Black',
      depletedAt: new Date().toISOString(),
      triggerReference: 'PCY-2026-9999',
      reason: 'Sold out on finalized order PCY-2026-9999',
    };

    const rendered = renderOutOfStockEmail(payload);

    expect(rendered.subject).toContain('Out of Stock');
    expect(rendered.subject).toContain('KIMONO-RAW-SILK-BLK-L');
    expect(rendered.html).toContain('Raw Silk Pleated Kimono');
    expect(rendered.html).toContain('Obsidian Black');
    expect(rendered.text).toContain('PCY-2026-9999');
    expect(rendered.text).toContain('Sold out on finalized order');
  });
});

describe('PIERCYN Notification Engine - Security & Sanitization', () => {
  it('strips accidental 16-character Google App Passwords from error traces', () => {
    const leakedPasswordError = new Error(
      'SMTP Error: Invalid credentials with pass abcd efgh ijkl mnop on host smtp.gmail.com'
    );
    const sanitized = sanitizeError(leakedPasswordError);

    expect(sanitized).not.toContain('abcd efgh ijkl mnop');
    expect(sanitized).toContain('[REDACTED_PASSWORD]');
  });

  it('safely handles non-error objects and null values', () => {
    expect(sanitizeError(null)).toBe('Unknown error');
    expect(sanitizeError(undefined)).toBe('Unknown error');
    expect(sanitizeError('Plain string error')).toBe('Plain string error');
  });

  it('verifies timing-safe authorization evaluation', () => {
    const serverSecret = 'my_super_secret_cron_token_32_bytes_long';
    const validHeader = 'Bearer my_super_secret_cron_token_32_bytes_long';
    const invalidHeader = 'Bearer wrong_token_attempt_1234567890';

    const extractToken = (auth: string) =>
      auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

    const verify = (authHeader: string, configuredSecret: string) => {
      const supplied = extractToken(authHeader);
      const suppliedBuffer = Buffer.from(supplied);
      const expectedBuffer = Buffer.from(configuredSecret);
      if (suppliedBuffer.length !== expectedBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(suppliedBuffer, expectedBuffer);
    };

    expect(verify(validHeader, serverSecret)).toBe(true);
    expect(verify(invalidHeader, serverSecret)).toBe(false);
    expect(verify('Bearer short', serverSecret)).toBe(false);
  });

  it('correctly configures dedicated customer SMTP settings for Gmail STARTTLS', () => {
    const originalEnv = { ...process.env };
    try {
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'piercyn@gmail.com';
      process.env.SMTP_PASSWORD = 'abcd efgh ijkl mnop';
      process.env.SMTP_FROM_EMAIL = 'piercyn@gmail.com';
      process.env.SMTP_FROM_NAME = 'PIERCYN';
      process.env.SMTP_REPLY_TO = 'piercyn@gmail.com';
      delete process.env.SMTP_SECURE;

      const config = getCustomerSmtpConfig();
      expect(config).not.toBeNull();
      expect(config?.host).toBe('smtp.gmail.com');
      expect(config?.port).toBe(587);
      expect(config?.secure).toBe(false); // STARTTLS on 587
      expect(config?.user).toBe('piercyn@gmail.com');
      expect(config?.pass).toBe('abcdefghijklmnop'); // Strips spaces
      expect(config?.fromEmail).toBe('piercyn@gmail.com');
      expect(config?.fromName).toBe('PIERCYN');
      expect(config?.replyTo).toBe('piercyn@gmail.com');
    } finally {
      process.env = originalEnv;
    }
  });
  it('escapes affiliate-provided HTML metacharacters', () => {
    expect(escapeAffiliateHtml(`<img src=x onerror="x"> & 'name'`)).toBe(
      '&lt;img src=x onerror=&quot;x&quot;&gt; &amp; &#39;name&#39;'
    );
  });
  it('rejects a From address that differs from the authenticated SMTP user', () => {
    const originalEnv = { ...process.env };
    try {
      process.env.SMTP_USER = 'piercyn@gmail.com';
      process.env.SMTP_PASSWORD = 'test-app-password';
      process.env.SMTP_FROM_EMAIL = 'unverified@example.com';
      expect(getSmtpConfig()).toBeNull();
    } finally {
      process.env = originalEnv;
    }
  });
});
