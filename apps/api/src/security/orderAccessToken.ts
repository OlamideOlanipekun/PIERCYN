import crypto from 'crypto';

const orderAccessSecret =
  process.env.ORDER_ACCESS_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production' ? '' : crypto.randomBytes(32).toString('hex'));

const ORDER_ACCESS_TTL_DAYS = Math.max(
  1,
  Math.min(90, Number(process.env.ORDER_ACCESS_TOKEN_TTL_DAYS) || 30)
);

export function isOrderAccessTokenConfigured(): boolean {
  return Boolean(orderAccessSecret);
}

export function createOrderAccessToken(orderId: string, now: Date = new Date()): string {
  if (!orderAccessSecret) {
    throw new Error('Order access token signing is not configured. Set ORDER_ACCESS_TOKEN_SECRET.');
  }
  const issuedAt = Math.floor(now.getTime() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      orderId,
      iat: issuedAt,
      exp: issuedAt + ORDER_ACCESS_TTL_DAYS * 24 * 60 * 60,
      nonce: crypto.randomBytes(24).toString('hex'),
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', orderAccessSecret).update(payload).digest('base64url');
  return `ord_${payload}.${signature}`;
}

export function verifyOrderAccessToken(
  token: string,
  now: Date = new Date()
): { orderId: string; expiresAt: number } | null {
  if (!orderAccessSecret || typeof token !== 'string' || !token.startsWith('ord_')) return null;

  const [payload, signature] = token.slice(4).split('.');
  if (!payload || !signature) return null;

  const expected = crypto.createHmac('sha256', orderAccessSecret).update(payload).digest('base64url');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const nowSeconds = Math.floor(now.getTime() / 1000);
    if (claims?.v !== 1) return null;
    if (typeof claims.orderId !== 'string' || !claims.orderId) return null;
    if (!Number.isInteger(claims.exp) || claims.exp <= nowSeconds) return null;
    if (!Number.isInteger(claims.iat) || claims.iat > nowSeconds + 60) return null;
    return { orderId: claims.orderId, expiresAt: claims.exp };
  } catch {
    return null;
  }
}
