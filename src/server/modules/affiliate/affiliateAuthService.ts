import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db/prisma';

export interface AffiliateUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  createdAt: string | Date;
}

export interface AffiliateLoginResult {
  affiliate: AffiliateUserResponse;
  token: string;
}

const HMAC_SECRET =
  process.env.AFFILIATE_JWT_SECRET ||
  process.env.JWT_SECRET ||
  'piercyn-affiliate-secret-key-2026';

const revokedTokens = new Set<string>();
const affiliateSessions = new Map<string, { affiliate: AffiliateUserResponse; expiresAt: Date }>();
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function generateSignedToken(affiliate: AffiliateUserResponse): string {
  const payload = {
    id: affiliate.id,
    email: affiliate.email,
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    status: affiliate.status,
    createdAt: affiliate.createdAt instanceof Date ? affiliate.createdAt.toISOString() : affiliate.createdAt,
    exp: Date.now() + SESSION_DURATION_MS,
    iat: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', HMAC_SECRET).update(payloadB64).digest('base64url');
  return `aff_tok_${payloadB64}.${signature}`;
}

export class AffiliateAuthService {
  /** Public wrapper — generates a signed token for a given affiliate record. */
  public static generateToken(affiliate: AffiliateUserResponse): string {
    const token = generateSignedToken(affiliate);
    affiliateSessions.set(token, {
      affiliate,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    });
    return token;
  }

  public static async login(email: string, password: string): Promise<AffiliateLoginResult> {
    const dbAffiliate = await prisma.affiliate.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!dbAffiliate) {
      throw new Error('No affiliate account found with this email address.');
    }

    if (dbAffiliate.status === 'REJECTED') {
      throw new Error('Your affiliate application was not approved.');
    }

    const passwordMatches = await bcrypt.compare(password, dbAffiliate.passwordHash);
    if (!passwordMatches) {
      throw new Error('Invalid credentials. Please check your email and password.');
    }

    const affiliateRecord: AffiliateUserResponse = {
      id: dbAffiliate.id,
      email: dbAffiliate.email,
      firstName: dbAffiliate.firstName,
      lastName: dbAffiliate.lastName,
      status: dbAffiliate.status as AffiliateUserResponse['status'],
      createdAt: dbAffiliate.createdAt.toISOString(),
    };

    await prisma.affiliate.update({
      where: { id: dbAffiliate.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateSignedToken(affiliateRecord);
    affiliateSessions.set(token, {
      affiliate: affiliateRecord,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    });

    return { affiliate: affiliateRecord, token };
  }

  public static verifyToken(token: string): AffiliateUserResponse | null {
    if (!token || !token.startsWith('aff_tok_')) return null;
    if (revokedTokens.has(token)) return null;

    // 1. Stateless HMAC token verification
    const raw = token.slice('aff_tok_'.length);
    if (raw.includes('.')) {
      try {
        const [payloadB64, signature] = raw.split('.');
        if (payloadB64 && signature) {
          const expectedSig = crypto
            .createHmac('sha256', HMAC_SECRET)
            .update(payloadB64)
            .digest('base64url');
          const sigBuffer = Buffer.from(signature);
          const expBuffer = Buffer.from(expectedSig);
          if (
            sigBuffer.length === expBuffer.length &&
            crypto.timingSafeEqual(sigBuffer, expBuffer)
          ) {
            const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
            if (payload.exp && payload.exp > Date.now() && typeof payload.createdAt === 'string') {
              return {
                id: payload.id,
                email: payload.email,
                firstName: payload.firstName,
                lastName: payload.lastName,
                status: payload.status,
                createdAt: payload.createdAt,
              };
            }
          }
        }
      } catch {
        // Fallback to in-memory
      }
    }

    // 2. In-memory session fallback
    const session = affiliateSessions.get(token);
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      affiliateSessions.delete(token);
      return null;
    }

    return session.affiliate;
  }

  public static logout(token: string): void {
    revokedTokens.add(token);
    affiliateSessions.delete(token);
  }
}
