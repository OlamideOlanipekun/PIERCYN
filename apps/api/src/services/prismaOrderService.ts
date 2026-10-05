import { prisma } from '../db/prisma';

export class PrismaOrderService {
  static getOrder(identifier: string) {
    return prisma.order.findFirst({ where: { OR: [{ id: identifier }, { orderNumber: identifier }] }, include: { items: true, payments: true } });
  }

  static getAllOrders(filter?: { email?: string; status?: string }) {
    return prisma.order.findMany({
      where: { ...(filter?.email ? { customerEmail: filter.email.toLowerCase() } : {}), ...(filter?.status ? { orderStatus: filter.status as any } : {}) },
      include: { items: true, payments: true }, orderBy: { createdAt: 'desc' },
    });
  }
}
