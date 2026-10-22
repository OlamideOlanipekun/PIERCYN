import { describe, expect, it } from 'vitest';
import { createOrderAccessToken, verifyOrderAccessToken } from '../apps/api/src/security/orderAccessToken';
import {
  hasExpectedReceiptSignature,
  validateReceiptBuffer,
} from '../apps/api/src/modules/payments/receiptStorage';
import { buildBankTransferInstructions } from '../apps/api/src/modules/payments/bankTransfer';

describe('order access token hardening', () => {
  it('issues an order-bound token with an expiry', () => {
    const token = createOrderAccessToken('order_123');
    const claims = verifyOrderAccessToken(token);

    expect(claims?.orderId).toBe('order_123');
    expect(claims?.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejects expired order tokens', () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const token = createOrderAccessToken('order_123', thirtyOneDaysAgo);

    expect(verifyOrderAccessToken(token)).toBeNull();
  });

  it('rejects tampered order tokens', () => {
    const token = createOrderAccessToken('order_123');
    const [payload, signature] = token.slice(4).split('.');
    const tamperedPayload = `${payload[0] === 'A' ? 'B' : 'A'}${payload.slice(1)}`;
    const tampered = `ord_${tamperedPayload}.${signature}`;

    expect(verifyOrderAccessToken(tampered)).toBeNull();
  });
});

describe('bank transfer receipt validation', () => {
  it('accepts a real JPEG signature within the size limit', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(hasExpectedReceiptSignature(jpeg, 'image/jpeg')).toBe(true);
    expect(validateReceiptBuffer(jpeg, 'image/jpeg').valid).toBe(true);
  });

  it('rejects a file whose bytes do not match its declared type', () => {
    const fakePdf = Buffer.from('not really a pdf');
    expect(validateReceiptBuffer(fakePdf, 'application/pdf').valid).toBe(false);
  });

  it('rejects unsupported receipt types', () => {
    const gif = Buffer.from('GIF89a');
    expect(validateReceiptBuffer(gif, 'image/gif').valid).toBe(false);
  });

  it('rejects oversized receipts', () => {
    const pdf = Buffer.concat([
      Buffer.from('%PDF-1.4'),
      Buffer.alloc(3 * 1024 * 1024),
    ]);
    const result = validateReceiptBuffer(pdf, 'application/pdf');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/3 MB/);
  });
});

describe('direct bank transfer instructions', () => {
  it('returns the verified Kuda account, exact amount and order narration', () => {
    const result = buildBankTransferInstructions('PCY-ORDER-123', 45000);

    expect(result).toMatchObject({
      bankName: 'Kuda',
      accountName: 'Adedeji Taiwo',
      accountNumber: '2072114942',
      narration: 'PCY-ORDER-123',
      amountNGN: 45000,
    });
  });
});
