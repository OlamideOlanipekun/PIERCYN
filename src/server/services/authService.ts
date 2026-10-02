import bcrypt from 'bcryptjs';
import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore, DbUser } from '../db/store';

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

// In-memory session store (stateless token → userId mapping)
const authSessions = new Map<string, { userId: string; expiresAt: Date }>();

function generateToken(): string {
  return `tok_${Date.now()}_${Math.random().toString(36).substring(2, 14)}`;
}

function createSession(userId: string): string {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  authSessions.set(token, { userId, expiresAt });
  return token;
}

async function countOrdersForEmail(email: string): Promise<number> {
  const normalized = email.toLowerCase();
  if (await isPrismaAvailable()) {
    try {
      const prismaCount = await prisma.order.count({ where: { customerEmail: normalized } });
      if (prismaCount > 0) return prismaCount;
    } catch {
      // Continue to local count
    }
  }

  let count = 0;
  for (const ord of dbStore.orders.values()) {
    if (ord.customerEmail === normalized) count++;
  }
  return count;
}

async function toSafeProfile(user: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
  customer?: { phone: string | null; addresses?: Array<{ addressLine: string; city: string }> } | null;
}): Promise<UserProfileResponse> {
  const ordersCount = await countOrdersForEmail(user.email);
  const defaultAddress = user.customer?.addresses?.[0];

  return {
    id: user.id,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email,
    phone: user.phone || user.customer?.phone || undefined,
    city: user.city || defaultAddress?.city || undefined,
    address: user.address || defaultAddress?.addressLine || undefined,
    role: (user.role === 'ADMIN' || user.role === 'ATELIER_ADMIN' ? 'ADMIN' : 'CUSTOMER') as 'CUSTOMER' | 'ADMIN',
    ordersCount,
  };
}

export class AuthService {
  /**
   * Register a new client account
   */
  public static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    address?: string;
  }): Promise<AuthResult> {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check store index for duplicates
    if (dbStore.userEmailIndex.has(normalizedEmail)) {
      throw new Error('An account with this email address already exists. Please sign in.');
    }

    const passwordHash = await bcrypt.hash(data.password.trim(), 10);
    const now = new Date().toISOString();

    if (await isPrismaAvailable()) {
      try {
        const existing = await (prisma as any).user?.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
          throw new Error('An account with this email address already exists. Please sign in.');
        }

        const user = await (prisma as any).user?.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            role: 'CUSTOMER',
            customer: {
              create: {
                email: normalizedEmail,
                fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
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
                          country: 'Nigeria',
                          isDefault: true,
                        },
                      },
                    }
                  : {}),
              },
            },
          },
          include: {
            customer: {
              include: { addresses: true },
            },
          },
        });

        if (user) {
          const token = createSession(user.id);
          return {
            user: await toSafeProfile(user),
            token,
          };
        }
      } catch (err: any) {
        if (err.message && err.message.includes('already exists')) {
          throw err;
        }
      }
    }

    // Persist to store
    const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const dbUser: DbUser = {
      id: userId,
      email: normalizedEmail,
      passwordHash,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone?.trim(),
      city: data.city?.trim(),
      address: data.address?.trim(),
      role: 'CUSTOMER',
      createdAt: now,
      updatedAt: now,
    };

    dbStore.users.set(userId, dbUser);
    dbStore.userEmailIndex.set(normalizedEmail, userId);

    const token = createSession(userId);
    return {
      user: await toSafeProfile(dbUser),
      token,
    };
  }

  /**
   * Sign in an existing client or admin account
   */
  public static async login(data: { email: string; password: string }): Promise<AuthResult> {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check store first
    const localUserId = dbStore.userEmailIndex.get(normalizedEmail);
    const localUser = localUserId ? dbStore.users.get(localUserId) : undefined;

    if (localUser && localUser.passwordHash) {
      let passwordValid = false;
      try {
        passwordValid = await bcrypt.compare(data.password.trim(), localUser.passwordHash);
      } catch {
        passwordValid = data.password.trim() === localUser.passwordHash;
      }
      if (!passwordValid && data.password.trim() === localUser.passwordHash) {
        passwordValid = true;
      }

      if (!passwordValid) {
        throw new Error('Incorrect password. Please verify your credentials.');
      }

      const token = createSession(localUser.id);
      return {
        user: await toSafeProfile(localUser),
        token,
      };
    }

    // Try Prisma database if available
    if (await isPrismaAvailable()) {
      try {
        const user = await (prisma as any).user?.findUnique({
          where: { email: normalizedEmail },
          include: {
            customer: {
              include: { addresses: true },
            },
          },
        });

        if (user && user.passwordHash) {
          let passwordValid = false;
          try {
            passwordValid = await bcrypt.compare(data.password.trim(), user.passwordHash);
          } catch {
            passwordValid = data.password.trim() === user.passwordHash;
          }

          if (!passwordValid) {
            throw new Error('Incorrect password. Please verify your credentials.');
          }

          const token = createSession(user.id);
          return {
            user: await toSafeProfile(user),
            token,
          };
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Incorrect password')) {
          throw err;
        }
      }
    }

    throw new Error('No account found with this email address.');
  }

  /**
   * Look up user by session token
   */
  public static async getUserByToken(token: string): Promise<UserProfileResponse | null> {
    if (!token) return null;

    const session = authSessions.get(token);
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      authSessions.delete(token);
      return null;
    }

    const localUser = dbStore.users.get(session.userId);
    if (localUser) {
      return toSafeProfile(localUser);
    }

    if (await isPrismaAvailable()) {
      try {
        const user = await (prisma as any).user?.findUnique({
          where: { id: session.userId },
          include: {
            customer: {
              include: { addresses: true },
            },
          },
        });

        if (user) {
          return toSafeProfile(user);
        }
      } catch {
        // Fall through
      }
    }

    return null;
  }

  /**
   * Invalidate a session token
   */
  public static logout(token: string): boolean {
    if (!token) return false;
    return authSessions.delete(token);
  }
}
