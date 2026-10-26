import crypto from 'crypto';
import { describe, expect, it } from 'vitest';
import {
  getWhatsAppWebhookChallenge,
  isValidWhatsAppWebhookSignature,
} from '../apps/api/src/security/whatsappWebhook';

describe('WhatsApp webhook security', () => {
  it('returns Meta challenge only for subscribe mode and the exact configured token', () => {
    expect(getWhatsAppWebhookChallenge('subscribe', 'token-123', 'challenge-456', 'token-123'))
      .toBe('challenge-456');
    expect(getWhatsAppWebhookChallenge('subscribe', 'wrong-token', 'challenge-456', 'token-123'))
      .toBeNull();
    expect(getWhatsAppWebhookChallenge('other', 'token-123', 'challenge-456', 'token-123'))
      .toBeNull();
    expect(getWhatsAppWebhookChallenge('subscribe', 'token-123', 'challenge-456', undefined))
      .toBeNull();
  });

  it('authenticates the exact raw POST body using the Meta app secret', () => {
    const rawBody = '{"object":"whatsapp_business_account","entry":[]}';
    const appSecret = 'test-app-secret';
    const digest = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

    expect(isValidWhatsAppWebhookSignature(rawBody, `sha256=${digest}`, appSecret)).toBe(true);
    expect(isValidWhatsAppWebhookSignature(`${rawBody} `, `sha256=${digest}`, appSecret)).toBe(false);
    expect(isValidWhatsAppWebhookSignature(rawBody, `sha256=${digest}`, undefined)).toBe(false);
    expect(isValidWhatsAppWebhookSignature(rawBody, 'invalid', appSecret)).toBe(false);
  });
});
