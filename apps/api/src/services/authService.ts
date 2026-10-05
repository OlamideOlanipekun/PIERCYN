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

const authSessions = new Map<string, { userId: string; expiresAt: Date; email: string }>();

function generateToken(): string {
  return `tok_${Date.now()}_${Math.random().toString(36).substring(2, 14)}`;
}

function createSession(userId: string, email: string): string {
  const token = generateToken();
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

    const session = authSessions.get(token);
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      authSessions.delete(token);
      return null;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.userId },
      include: { addresses: true, orders: true },
    });

    if (customer) {
      const defaultAddr = customer.addresses[0];
      return {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || session.email,
        phone: customer.phone || undefined,
        city: defaultAddr?.city,
        address: defaultAddr?.addressLine,
        role: 'CUSTOMER',
        ordersCount: customer.orders.length,
      };
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.userId },
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

    return null;
  }

  public static logout(token: string): boolean {
    return authSessions.delete(token);
  }
}
