import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db/prisma';
import { supabaseAuthServer } from '../../middleware/authenticate';

export interface AffiliateUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  createdAt: string | Date;
  supabaseUserId?: string | null;
}

export interface AffiliateLoginResult {
  affiliate: AffiliateUserResponse;
  token: string;
}

const HMAC_SECRET =
  process.env.AFFILIATE_JWT_SECRET ||
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV !== 'production' ? 'piercyn-affiliate-dev-secret-key-2026' : '');

if (process.env.NODE_ENV === 'production' && !HMAC_SECRET) {
  throw new Error('[SECURITY_CRITICAL] AFFILIATE_JWT_SECRET or JWT_SECRET must be configured in production.');
}

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
  const signature = crypto.createHmac('sha256', HMAC_SECRET || 'fallback').update(payloadB64).digest('base64url');
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

  /**
   * Traditional email + password login (for existing accounts or credentials login)
   */
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

    if (!dbAffiliate.passwordHash) {
      throw new Error('This account was created with Google OAuth. Please sign in with Google.');
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
      supabaseUserId: dbAffiliate.supabaseUserId,
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

  /**
   * Dual token verifier: supports Supabase OAuth tokens and signed PIERCYN affiliate tokens.
   * Auto-links existing affiliate accounts by email when first authenticated via Supabase.
   */
  public static async verifyToken(token: string): Promise<AffiliateUserResponse | null> {
    if (!token) return null;
    if (revokedTokens.has(token)) return null;

    // 1. Supabase OAuth JWT verification (standard JWT starts with eyJ)
    if (token.startsWith('eyJ')) {
      try {
        const { data, error } = await supabaseAuthServer.auth.getUser(token);
        if (!error && data?.user) {
          const u = data.user;
          const userEmail = (u.email || '').toLowerCase().trim();

          let dbAffiliate = await prisma.affiliate.findFirst({
            where: {
              OR: [
                { supabaseUserId: u.id },
                ...(userEmail ? [{ email: userEmail }] : []),
              ],
            },
          });

          if (dbAffiliate) {
            // Auto-link supabaseUserId if this account had previous email-only registration
            if (!dbAffiliate.supabaseUserId) {
              dbAffiliate = await prisma.affiliate.update({
                where: { id: dbAffiliate.id },
                data: { supabaseUserId: u.id },
              });
            }

            return {
              id: dbAffiliate.id,
              email: dbAffiliate.email,
              firstName: dbAffiliate.firstName,
              lastName: dbAffiliate.lastName,
              status: dbAffiliate.status as AffiliateUserResponse['status'],
              createdAt: dbAffiliate.createdAt.toISOString(),
              supabaseUserId: dbAffiliate.supabaseUserId,
            };
          }
        }
      } catch (err) {
        console.warn('[AFFILIATE_AUTH] Supabase token verification failed:', err);
      }
    }

    // 2. Signed affiliate token (aff_tok_...)
    if (token.startsWith('aff_tok_')) {
      const raw = token.slice('aff_tok_'.length);
      if (raw.includes('.')) {
        try {
          const [payloadB64, signature] = raw.split('.');
          if (payloadB64 && signature && HMAC_SECRET) {
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
              if (payload.exp && payload.exp > Date.now()) {
                return {
                  id: payload.id,
                  email: payload.email,
                  firstName: payload.firstName,
                  lastName: payload.lastName,
                  status: payload.status,
                  createdAt: payload.createdAt,
                  supabaseUserId: payload.supabaseUserId || null,
                };
              }
            }
          }
        } catch {
          // Fallback to in-memory check
        }
      }
    }

    // 3. In-memory session fallback (for tests and short sessions)
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
