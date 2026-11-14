import { prisma } from '../../db/prisma';
import type { AuthenticatedUser } from '../../middleware/authenticate';
import { recordEvent, PIERCYN_EVENTS } from '../notifications/events';
import { triggerNotificationProcessingAsync } from '../notifications';

export interface SyncInput {
  user: AuthenticatedUser;
  fullName?: string;
  avatarUrl?: string;
}

export class AuthService {
  /**
   * Idempotent upsert: find or create the PIERCYN Customer for a Supabase user.
   * If a guest Customer already exists with the same email, links the supabaseUserId.
   * Never creates duplicate customers. Safe to call on every login.
   */
  static async syncCustomer(input: SyncInput) {
    const { user, fullName, avatarUrl } = input;
    const nameParts = (fullName || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');

    // 1. Check if customer already linked by Supabase UUID
    let customer = await prisma.customer.findUnique({
      where: { supabaseUserId: user.supabaseId },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    if (customer) {
      // Record regular sign-in audit without triggering registration email or Telegram spam
      try {
        await prisma.customerAuthEvent.create({
          data: {
            userId: customer.id,
            eventType: 'CUSTOMER_SIGNED_IN',
            provider: 'google',
            metadata: { email: user.email },
          },
        });
      } catch (e) {
        // Non-blocking telemetry
      }

      // Update with latest avatar or names if changed
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          email: user.email || customer.email,
          ...(firstName && !customer.firstName ? { firstName } : {}),
          ...(lastName && !customer.lastName ? { lastName } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
        },
        include: {
          addresses: {
            orderBy: { isDefault: 'desc' },
          },
        },
      });
      return customer;
    }

    // 2. Check if a guest customer profile with this verified email already exists
    if (user.email) {
      const existingByEmail = await prisma.customer.findUnique({
        where: { email: user.email },
      });

      if (existingByEmail) {
        // Link the existing customer record to this Supabase identity
        customer = await prisma.customer.update({
          where: { id: existingByEmail.id },
          data: {
            supabaseUserId: user.supabaseId,
            ...(firstName && !existingByEmail.firstName ? { firstName } : {}),
            ...(lastName && !existingByEmail.lastName ? { lastName } : {}),
            ...(avatarUrl ? { avatarUrl } : {}),
          },
          include: {
            addresses: {
              orderBy: { isDefault: 'desc' },
            },
          },
        });

        // Also retroactively associate previous guest orders with matching email
        try {
          await prisma.order.updateMany({
            where: {
              customerEmail: user.email,
              customerId: null,
            },
            data: {
              customerId: customer.id,
            },
          });
        } catch (err) {
          console.error('[AuthService] Failed to auto-link legacy guest orders:', err);
        }

        return customer;
      }
    }

    // 3. New customer creation
    customer = await prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          supabaseUserId: user.supabaseId,
          email: user.email || null,
          firstName,
          lastName,
          avatarUrl: avatarUrl || null,
        },
        include: {
          addresses: {
            orderBy: { isDefault: 'desc' },
          },
        },
      });

      // Audit registration event
      await tx.customerAuthEvent.create({
        data: {
          userId: created.id,
          eventType: 'CUSTOMER_REGISTERED',
          provider: 'google',
          metadata: { email: user.email, firstName, lastName },
        },
      });

      // Emit transactional CUSTOMER_REGISTERED event for welcome email & Telegram fan-out
      await recordEvent(tx, {
        eventKey: `customer:${created.id}:registered:v1`,
        eventType: PIERCYN_EVENTS.CUSTOMER_REGISTERED,
        payload: {
          customerId: created.id,
          supabaseUserId: user.supabaseId,
          email: user.email || '',
          firstName,
          lastName,
          registeredAt: new Date().toISOString(),
        },
      });

      return created;
    });

    // The registration event is committed at this point; process it now
    // instead of waiting for the maintenance cron fallback.
    triggerNotificationProcessingAsync();

    // Check if there are past guest orders matching this new customer's email
    if (user.email) {
      try {
        await prisma.order.updateMany({
          where: {
            customerEmail: user.email,
            customerId: null,
          },
          data: {
            customerId: customer.id,
          },
        });
      } catch (err) {
        console.error('[AuthService] Failed to link past guest orders for new user:', err);
      }
    }

    return customer;
  }

  /**
   * Resolve the PIERCYN Customer.id from a verified Supabase UUID.
   */
  static async resolveCustomerId(supabaseId: string): Promise<string | null> {
    const customer = await prisma.customer.findUnique({
      where: { supabaseUserId: supabaseId },
      select: { id: true },
    });
    return customer?.id ?? null;
  }

  /**
   * Fetch complete customer profile including addresses and order count.
   */
  static async getCustomerProfile(customerId: string) {
    return prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        supabaseUserId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    });
  }

  /**
   * Fetch customer orders with items, pricing snapshots, and statuses.
   */
  static async getCustomerOrders(customerId: string) {
    return prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        shipment: true,
      },
    });
  }

  /**
   * Update customer profile details.
   */
  static async updateProfile(
    customerId: string,
    data: { firstName?: string; lastName?: string; phone?: string }
  ) {
    return prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName.trim() } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone.trim() } : {}),
      },
    });
  }

  /**
   * Save or update an address for an authenticated customer.
   */
  static async saveAddress(
    customerId: string,
    address: {
      fullName: string;
      phone: string;
      state: string;
      city: string;
      addressLine: string;
      additionalInfo?: string;
      isDefault?: boolean;
    }
  ) {
    if (address.isDefault) {
      await prisma.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    return prisma.address.create({
      data: {
        customerId,
        fullName: address.fullName,
        phone: address.phone,
        state: address.state,
        city: address.city,
        addressLine: address.addressLine,
        additionalInfo: address.additionalInfo,
        isDefault: address.isDefault ?? false,
      },
    });
  }

  /**
   * Claim a guest order into the authenticated customer account.
   */
  static async claimOrder(customerId: string, orderNumber: string, customerEmail: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    if (order.customerId === customerId) {
      return { success: true, message: 'Order is already in your account.' };
    }

    if (order.customerId && order.customerId !== customerId) {
      return { success: false, error: 'Order is already associated with another account.' };
    }

    // Verify email matches to ensure legitimate claiming
    if (order.customerEmail.toLowerCase().trim() !== customerEmail.toLowerCase().trim()) {
      return {
        success: false,
        error: 'Order email does not match your account email. Please verify the order number.',
      };
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { customerId },
    });

    return { success: true, orderId: order.id };
  }
}
