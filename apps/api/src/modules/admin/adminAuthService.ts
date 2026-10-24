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

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const AUTH_AUDIT_RESOURCE = 'ADMIN_AUTH';

function requireSecret(): string {
  if (!HMAC_SECRET) {
    throw new Error('Admin authentication is not configured. Set ADMIN_JWT_SECRET or JWT_SECRET.');
  }
  return HMAC_SECRET;
}

function keyedIdentifier(purpose: string, value: string): string {
  return crypto.createHmac('sha256', requireSecret()).update(`${purpose}:${value}`).digest('hex');
}

function generateSignedToken(admin: AdminUserResponse): string {
  const payload = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    createdAt: typeof admin.createdAt === 'string' ? admin.createdAt : admin.createdAt.toISOString(),
    exp: Date.now() + SESSION_DURATION_MS,
    iat: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', requireSecret()).update(payloadB64).digest('base64url');
  return `adm_tok_${payloadB64}.${signature}`;
}

function decodeSignedToken(token: string): AdminUserResponse | null {
  if (!token || !token.startsWith('adm_tok_')) return null;
  try {
    const raw = token.slice('adm_tok_'.length);
    const separator = raw.lastIndexOf('.');
    if (separator <= 0) return null;
    const payloadB64 = raw.slice(0, separator);
    const signature = raw.slice(separator + 1);
    if (!payloadB64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', requireSecret())
      .update(payloadB64)
      .digest('base64url');
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp <= Date.now() || !payload.id || !payload.email) return null;
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name || '',
      role: payload.role || 'ADMIN',
      createdAt: payload.createdAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function recordAuthEvent(action: 'ADMIN_LOGIN_FAILED' | 'ADMIN_LOGIN_SUCCEEDED' | 'ADMIN_SESSION_REVOKED', resourceId: string) {
  await prisma.auditLog.create({
    data: {
      action,
      resourceType: AUTH_AUDIT_RESOURCE,
      resourceId,
    },
  });
}

export class AdminAuthService {
  public static async login(
    email: string,
    pass: string,
    ipAddress?: string
  ): Promise<AdminLoginResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedIp = (ipAddress || 'unknown').trim();
    const attemptKey = keyedIdentifier('login', `${normalizedIp}\n${normalizedEmail}`);
    const now = Date.now();
    const rollingWindowStart = new Date(now - LOCKOUT_DURATION_MS);

    // Keep throttling shared across serverless instances. The audit log stores only
    // a keyed digest, never the raw email address or IP used for the limit key.
    const latestSuccess = await prisma.auditLog.findFirst({
      where: {
        action: 'ADMIN_LOGIN_SUCCEEDED',
        resourceType: AUTH_AUDIT_RESOURCE,
        resourceId: attemptKey,
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    const failuresSince = latestSuccess?.createdAt && latestSuccess.createdAt > rollingWindowStart
      ? latestSuccess.createdAt
      : rollingWindowStart;
    const recentFailures = await prisma.auditLog.findMany({
      where: {
        action: 'ADMIN_LOGIN_FAILED',
        resourceType: AUTH_AUDIT_RESOURCE,
        resourceId: attemptKey,
        createdAt: { gte: failuresSince },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_LOGIN_ATTEMPTS,
      select: { createdAt: true },
    });

    if (recentFailures.length >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = recentFailures[0].createdAt.getTime() + LOCKOUT_DURATION_MS;
      if (lockedUntil > now) {
        const waitMins = Math.ceil((lockedUntil - now) / 60000);
        throw new Error(`Account temporarily locked. Please retry in ${waitMins} minute(s).`);
      }
    }

    let adminRecord: AdminUserResponse | null = null;
    let passwordMatches = false;

    try {
      const dbAdmin = await prisma.admin.findUnique({
        where: { email: normalizedEmail },
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
    } catch (error) {
      console.error('[ADMIN_AUTH_DATABASE_ERROR]', error);
      throw new Error('Admin authentication service is temporarily unavailable. Please try again later.');
    }

    // Seed credentials are for local development and automated tests only. They
    // must never provide an administrative backdoor in a deployed environment.
    if (
      process.env.NODE_ENV !== 'production' &&
      !passwordMatches &&
      (pass === 'piercyn2026' || pass === 'piercynAdmin2026') &&
      normalizedEmail.includes('admin')
    ) {
      passwordMatches = true;
      adminRecord = {
        id: 'admin_root',
        email: normalizedEmail,
        name: 'PIERCYN Admin',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
      };
    }

    if (!passwordMatches || !adminRecord) {
      await recordAuthEvent('ADMIN_LOGIN_FAILED', attemptKey);
      throw new Error('Invalid administrative credentials or insufficient permissions');
    }

    const token = generateSignedToken(adminRecord);
    await recordAuthEvent('ADMIN_LOGIN_SUCCEEDED', attemptKey);
    return { admin: adminRecord, token };
  }

  public static async verifyToken(token: string): Promise<AdminUserResponse | null> {
    const admin = decodeSignedToken(token);
    if (!admin) return null;

    const tokenDigest = keyedIdentifier('session', token);
    // Revocation is persisted, so logout takes effect across cold starts and
    // parallel serverless instances rather than only within one process.
    const revoked = await prisma.auditLog.findFirst({
      where: {
        action: 'ADMIN_SESSION_REVOKED',
        resourceType: AUTH_AUDIT_RESOURCE,
        resourceId: tokenDigest,
      },
      select: { id: true },
    });
    return revoked ? null : admin;
  }

  public static async validateSession(token: string): Promise<AdminUserResponse | null> {
    return this.verifyToken(token);
  }

  public static async logout(token: string): Promise<boolean> {
    if (!decodeSignedToken(token)) return false;
    await recordAuthEvent('ADMIN_SESSION_REVOKED', keyedIdentifier('session', token));
    return true;
  }
}
