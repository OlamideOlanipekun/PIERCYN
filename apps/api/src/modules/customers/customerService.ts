import { prisma } from '../../db/prisma';

export interface CustomerInput {
  email: string;
  fullName: string;
  phone?: string;
  address?: {
    addressLine: string;
    city: string;
    state: string;
  };
}

export class CustomerService {
  public static async findOrCreateCustomer(input: CustomerInput, txPrisma?: any) {
    const client = txPrisma || prisma;
    const email = input.email.toLowerCase().trim();
    const nameParts = input.fullName.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'PIERCYN';

    let customer = await client.customer.findFirst({
      where: {
        OR: [
          { email },
          ...(input.phone ? [{ phone: input.phone }] : []),
        ],
      },
      include: { addresses: true },
    });

    if (!customer) {
      customer = await client.customer.create({
        data: {
          email,
          firstName,
          lastName,
          phone: input.phone,
        },
        include: { addresses: true },
      });
    }

    if (input.address && customer) {
      const existingAddress = await client.address.findFirst({
        where: {
          customerId: customer.id,
          addressLine: input.address.addressLine,
          city: input.address.city,
          state: input.address.state,
        },
      });

      if (!existingAddress) {
        await client.address.create({
          data: {
            customerId: customer.id,
            fullName: input.fullName,
            phone: input.phone || '',
            addressLine: input.address.addressLine,
            city: input.address.city,
            state: input.address.state,
            isDefault: customer.addresses?.length === 0,
          },
        });
      }
    }

    return customer;
  }

  public static async getCustomerById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  public static async getAllCustomers(filter?: { search?: string }) {
    const where: any = {};
    if (filter?.search) {
      const s = filter.search.toLowerCase();
      where.OR = [
        { email: { contains: s, mode: 'insensitive' } },
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        orders: true,
        addresses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => {
      const paidOrders = c.orders.filter((o) => o.paymentStatus === 'PAID');
      const totalSpent = paidOrders.reduce((sum, o) => sum + o.totalNGN, 0);

      return {
        id: c.id,
        email: c.email || '',
        fullName: `${c.firstName} ${c.lastName}`.trim(),
        phone: c.phone,
        addresses: c.addresses,
        orderCount: c.orders.length,
        totalSpentNGN: totalSpent,
        lastOrderDate: c.orders[0]?.createdAt.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });
  }
}
