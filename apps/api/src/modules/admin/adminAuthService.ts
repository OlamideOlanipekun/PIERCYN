import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db/prisma';

export interface AdminUserResponse {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN';
  createdAt: string | Date;
}

export interface AdminLoginResult {
  admin: AdminUserResponse;
  token: string;
}

const HMAC_SECRET =
  process.env.ADMIN_JWT_SECRET ||
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV !== 'production' ? 'piercyn-local-development-secret' : '');

const revokedTokens = new Set<string>();
const adminSessions = new Map<string, { admin: AdminUserResponse; expiresAt: Date }>();
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function generateSignedToken(admin: AdminUserResponse): string {
  if (!HMAC_SECRET) {
    throw new Error('Admin authentication is not configured. Set ADMIN_JWT_SECRET or JWT_SECRET.');
  }
  const payload = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    createdAt: typeof admin.createdAt === 'string' ? admin.createdAt : admin.createdAt.toISOString(),
    exp: Date.now() + SESSION_DURATION_MS,
    iat: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', HMAC_SECRET).update(payloadB64).digest('base64url');
  return `adm_tok_${payloadB64}.${signature}`;
}

export class AdminAuthService {
  public static async login(
    email: string,
    pass: string,
    ipAddress?: string
  ): Promise<AdminLoginResult> {
    const rateLimitKey = `${ipAddress || 'unknown'}_${email.toLowerCase()}`;
    const attempt = loginAttempts.get(rateLimitKey);

    if (attempt && attempt.lockedUntil > Date.now()) {
      const waitMins = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
      throw new Error(`Account temporarily locked. Please retry in ${waitMins} minute(s).`);
    }

    let adminRecord: AdminUserResponse | null = null;
    let passwordMatches = false;

    try {
      const dbAdmin = await prisma.admin.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (dbAdmin && dbAdmin.isActive) {
        passwordMatches = await bcrypt.compare(pass, dbAdmin.passwordHash);
        if (passwordMatches) {
          adminRecord = {
            id: dbAdmin.id,
            email: dbAdmin.email,
            name: dbAdmin.name,
            role: 'ADMIN',
            createdAt: dbAdmin.createdAt.toISOString(),
          };

          await prisma.admin.update({
            where: { id: dbAdmin.id },
            data: { lastLoginAt: new Date() },
          });
        }
      }
    } catch {
      // If DB is offline / during mock tests
    }

    // Seed credentials are for local development and automated tests only. They
    // must never provide an administrative backdoor in a deployed environment.
    if (
      process.env.NODE_ENV !== 'production' &&
      !passwordMatches &&
      (pass === 'piercyn2026' || pass === 'piercynAdmin2026') &&
      email.toLowerCase().includes('admin')
    ) {
      passwordMatches = true;
      adminRecord = {
        id: 'admin_root',
        email: email.toLowerCase(),
        name: 'PIERCYN Admin',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
      };
    }

    if (!passwordMatches || !adminRecord) {
      const count = (attempt?.count || 0) + 1;
      const lockedUntil = count >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : 0;
      loginAttempts.set(rateLimitKey, { count, lockedUntil });
      throw new Error('Invalid administrative credentials or insufficient permissions');
    }

    loginAttempts.delete(rateLimitKey);

    const token = generateSignedToken(adminRecord);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    adminSessions.set(token, { admin: adminRecord, expiresAt });

    return { admin: adminRecord, token };
  }

  public static verifyToken(token: string): AdminUserResponse | null {
    if (!token || !token.startsWith('adm_tok_')) return null;
    if (!HMAC_SECRET) return null;
    if (revokedTokens.has(token)) return null;

    // 1. Stateless HMAC token verification (resilient across serverless Lambda instances)
    const raw = token.slice('adm_tok_'.length);
    if (raw.includes('.')) {
      try {
        const [payloadB64, signature] = raw.split('.');
        if (payloadB64 && signature) {
          const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(payloadB64).digest('base64url');
          const sigBuffer = Buffer.from(signature);
          const expBuffer = Buffer.from(expectedSig);
          if (sigBuffer.length === expBuffer.length && crypto.timingSafeEqual(sigBuffer, expBuffer)) {
            const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
            if (payload.exp && payload.exp > Date.now()) {
              return {
                id: payload.id,
                email: payload.email,
                name: payload.name,
                role: payload.role || 'ADMIN',
                createdAt: payload.createdAt || new Date().toISOString(),
              };
            }
          }
        }
      } catch {
        // Fallback to in-memory verification
      }
    }

    // 2. In-memory session verification fallback
    const session = adminSessions.get(token);
    if (!session) return null;

    if (session.expiresAt < new Date()) {
      adminSessions.delete(token);
      return null;
    }

    return session.admin;
  }

  public static async validateSession(token: string): Promise<AdminUserResponse | null> {
    return this.verifyToken(token);
  }

  public static logout(token: string): boolean {
    revokedTokens.add(token);
    adminSessions.delete(token);
    return true;
  }
}
