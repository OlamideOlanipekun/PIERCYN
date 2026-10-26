import crypto from 'crypto';

export function getWhatsAppWebhookChallenge(
  mode: unknown,
  suppliedToken: unknown,
  challenge: unknown,
  expectedToken: string | undefined
): string | null {
  if (!expectedToken || mode !== 'subscribe' || suppliedToken !== expectedToken || typeof challenge !== 'string') {
    return null;
  }
  return challenge;
}

export function isValidWhatsAppWebhookSignature(
  rawBody: string | undefined,
  signature: string,
  appSecret: string | undefined
): boolean {
  if (!rawBody || !appSecret || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return false;

  const suppliedDigest = Buffer.from(signature.slice('sha256='.length), 'hex');
  const expectedDigest = crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest();
  return suppliedDigest.length === expectedDigest.length && crypto.timingSafeEqual(suppliedDigest, expectedDigest);
}
