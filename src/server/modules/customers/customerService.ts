import { dbStore, DbCustomer, DbAddress, DbOrder } from '../../db/store';

export interface CustomerDetail extends DbCustomer {
  addresses: DbAddress[];
  orders: DbOrder[];
  totalSpendNGN: number;
  orderCount: number;
}

export class CustomerService {
  /**
   * Find or create customer record based on checkout information
   */
  public static findOrCreateCustomer(data: {
    email: string;
    fullName: string;
    phone?: string;
    address?: {
      addressLine: string;
      city: string;
      state: string;
      country?: string;
    };
  }): DbCustomer {
    return dbStore.findOrCreateCustomer(data);
  }

  /**
   * Get single customer with linked addresses, orders, and total lifetime spend
   */
  public static getCustomerById(id: string): CustomerDetail | null {
    const customer = dbStore.customers.get(id);
    if (!customer) return null;

    const addresses: DbAddress[] = [];
    for (const addr of dbStore.addresses.values()) {
      if (addr.customerId === customer.id) {
        addresses.push(addr);
      }
    }

    const orders: DbOrder[] = [];
    let totalSpendNGN = 0;

    for (const ord of dbStore.orders.values()) {
      if (ord.customerEmail === customer.email || ord.customerId === customer.id) {
        orders.push(ord);
        if (ord.paymentStatus === 'PAID') {
          totalSpendNGN += ord.totalNGN;
        }
      }
    }

    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      ...customer,
      addresses,
      orders,
      totalSpendNGN,
      orderCount: orders.length,
    };
  }

  /**
   * Admin: List all customers with summary analytics
   */
  public static getAllCustomers(filter?: { search?: string }): Array<DbCustomer & { orderCount: number; totalSpendNGN: number; lastOrderDate?: string }> {
    const list: Array<DbCustomer & { orderCount: number; totalSpendNGN: number; lastOrderDate?: string }> = [];

    for (const customer of dbStore.customers.values()) {
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        const matches =
          customer.fullName.toLowerCase().includes(q) ||
          customer.email.toLowerCase().includes(q) ||
          (customer.phone && customer.phone.includes(q));
        if (!matches) continue;
      }

      let orderCount = 0;
      let totalSpendNGN = 0;
      let lastOrderDate: string | undefined;

      for (const ord of dbStore.orders.values()) {
        if (ord.customerEmail === customer.email || ord.customerId === customer.id) {
          orderCount++;
          if (ord.paymentStatus === 'PAID') {
            totalSpendNGN += ord.totalNGN;
          }
          if (!lastOrderDate || ord.createdAt > lastOrderDate) {
            lastOrderDate = ord.createdAt;
          }
        }
      }

      list.push({
        ...customer,
        orderCount,
        totalSpendNGN,
        lastOrderDate,
      });
    }

    return list.sort((a, b) => b.totalSpendNGN - a.totalSpendNGN);
  }
}
