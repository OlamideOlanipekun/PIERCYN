import { prisma } from '../../db/prisma';

export interface AuditLogEntry {
  adminId?: string;
  adminEmail?: string;
  action: string;
  resource?: string;
  resourceType?: string;
  resourceId: string;
  previousValue?: string;
  oldValue?: string;
  newValue?: string;
  note?: string;
  ipAddress?: string;
}

export class AuditService {
  public static async log(entry: AuditLogEntry) {
    try {
      await prisma.auditLog.create({
        data: {
          adminId: entry.adminId?.startsWith('admin_') ? undefined : entry.adminId,
          action: entry.action,
          resourceType: entry.resourceType || entry.resource || '',
          resourceId: entry.resourceId,
          oldValue: entry.oldValue ?? entry.previousValue,
          newValue: entry.newValue,
          ipAddress: entry.ipAddress,
        },
      });
    } catch {
      // Non-blocking for audit logs
    }
  }

  public static async getLogs(limit: number = 50, resource?: string) {
    const where: any = {};
    if (resource && resource !== 'ALL') {
      where.resourceType = resource;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: { email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((l) => ({
      id: l.id,
      adminId: l.adminId || 'SYSTEM',
      adminEmail: l.admin?.email || 'admin@piercyn.com',
      action: l.action,
      resource: l.resourceType,
      resourceId: l.resourceId,
      previousValue: l.oldValue,
      newValue: l.newValue,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
    }));
  }
}
