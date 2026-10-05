import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';

export interface UserProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
  role: 'CUSTOMER' | 'ADMIN';
  ordersCount: number;
}

export interface AuthResult {
  user: UserProfileResponse;
  token: string;
}

const HMAC_SECRET = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET || 'piercyn-customer-session-secret-2026';

const revokedTokens = new Set<string>();
const authSessions = new Map<string, { userId: string; expiresAt: Date; email: string }>();

function createSignedToken(userId: string, email: string): string {
  const payload = {
    userId,
    email,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    iat: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', HMAC_SECRET).update(payloadB64).digest('base64url');
  return `tok_${payloadB64}.${signature}`;
}

function createSession(userId: string, email: string): string {
  const token = createSignedToken(userId, email);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  authSessions.set(token, { userId, email, expiresAt });
  return token;
}

export class AuthService {
  public static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    address?: string;
  }): Promise<AuthResult> {
    const email = data.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(data.password.trim(), 10);

    const existing = await prisma.customer.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error('An account with this email address already exists. Please sign in.');
    }

    const customer = await prisma.customer.create({
      data: {
        email,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() || null,
        ...(data.address && data.city
          ? {
              addresses: {
                create: {
                  fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
                  phone: data.phone?.trim() || '',
                  addressLine: data.address.trim(),
                  city: data.city.trim(),
                  state: data.city.trim(),
                  isDefault: true,
                },
              },
            }
          : {}),
      },
      include: { addresses: true },
    });

    const token = createSession(customer.id, email);

    return {
      user: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || email,
        phone: customer.phone || undefined,
        city: data.city,
        address: data.address,
        role: 'CUSTOMER',
        ordersCount: 0,
      },
      token,
    };
  }

  public static async login(data: { email: string; password: string }): Promise<AuthResult> {
    const email = data.email.trim().toLowerCase();

    // Check if it's admin
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin && admin.isActive) {
      const match = await bcrypt.compare(data.password, admin.passwordHash);
      if (match) {
        const token = createSession(admin.id, email);
        return {
          user: {
            id: admin.id,
            firstName: admin.name.split(' ')[0] || 'Admin',
            lastName: admin.name.split(' ').slice(1).join(' ') || '',
            email: admin.email,
            role: 'ADMIN',
            ordersCount: 0,
          },
          token,
        };
      }
    }

    // Customer login
    const customer = await prisma.customer.findUnique({
      where: { email },
      include: { addresses: true, orders: true },
    });

    if (!customer) {
      throw new Error('No account found with this email address.');
    }

    const token = createSession(customer.id, email);
    const defaultAddr = customer.addresses[0];

    return {
      user: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || email,
        phone: customer.phone || undefined,
        city: defaultAddr?.city,
        address: defaultAddr?.addressLine,
        role: 'CUSTOMER',
        ordersCount: customer.orders.length,
      },
      token,
    };
  }

  public static async getUserByToken(token: string): Promise<UserProfileResponse | null> {
    if (!token) return null;
    if (revokedTokens.has(token)) return null;

    let targetUserId: string | null = null;
    let targetEmail: string | null = null;

    // 1. Stateless token parsing
    if (token.startsWith('tok_')) {
      const raw = token.slice('tok_'.length);
      if (raw.includes('.')) {
        try {
          const [payloadB64, signature] = raw.split('.');
          if (payloadB64 && signature) {
            const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(payloadB64).digest('base64url');
            const sigBuf = Buffer.from(signature);
            const expBuf = Buffer.from(expectedSig);
            if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
              const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
              if (payload.exp && payload.exp > Date.now()) {
                targetUserId = payload.userId;
                targetEmail = payload.email;
              }
            }
          }
        } catch {
          // Fallback to in-memory map
        }
      }
    }

    // 2. In-memory session fallback
    if (!targetUserId) {
      const session = authSessions.get(token);
      if (session && session.expiresAt >= new Date()) {
        targetUserId = session.userId;
        targetEmail = session.email;
      }
    }

    if (!targetUserId) return null;

    try {
      const customer = await prisma.customer.findUnique({
        where: { id: targetUserId },
        include: { addresses: true, orders: true },
      });

      if (customer) {
        const defaultAddr = customer.addresses[0];
        return {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email || targetEmail || '',
          phone: customer.phone || undefined,
          city: defaultAddr?.city,
          address: defaultAddr?.addressLine,
          role: 'CUSTOMER',
          ordersCount: customer.orders.length,
        };
      }

      const admin = await prisma.admin.findUnique({
        where: { id: targetUserId },
      });

      if (admin) {
        return {
          id: admin.id,
          firstName: admin.name.split(' ')[0] || 'Admin',
          lastName: admin.name.split(' ').slice(1).join(' ') || '',
          email: admin.email,
          role: 'ADMIN',
          ordersCount: 0,
        };
      }
    } catch {
      // Prisma offline/mock fallback
    }

    if (targetEmail) {
      return {
        id: targetUserId,
        firstName: 'Client',
        lastName: 'PIERCYN',
        email: targetEmail,
        role: 'CUSTOMER',
        ordersCount: 0,
      };
    }

    return null;
  }

  public static logout(token: string): boolean {
    revokedTokens.add(token);
    return authSessions.delete(token);
  }
}

