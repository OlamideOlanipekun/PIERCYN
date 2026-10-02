import { dbStore } from '../../db/store';
import { prisma } from '../../db/prisma';

export interface AuditLogEntry {
  id: string;
  adminId?: string;
  adminEmail?: string;
  action: string;
  resource: string;
  resourceType?: string;
  resourceId: string;
  previousValue?: any;
  newValue?: any;
  oldValue?: any;
  note?: string;
  ipAddress?: string;
  createdAt: string;
}

// In-memory store for audit logs
const inMemoryAuditLogs: AuditLogEntry[] = [];

export class AuditService {
  /**
   * Log an administrative action (supports in-memory and background Prisma persistence)
   */
  public static log(entry: {
    adminId?: string;
    adminEmail?: string;
    action: string;
    resource?: string;
    resourceType?: string;
    resourceId: string;
    previousValue?: any;
    newValue?: any;
    oldValue?: any;
    note?: string;
    ipAddress?: string;
  }): AuditLogEntry {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    const record: AuditLogEntry = {
      id,
      adminId: entry.adminId,
      adminEmail: entry.adminEmail,
      action: entry.action,
      resource: entry.resource || entry.resourceType || 'SYSTEM',
      resourceType: entry.resourceType || entry.resource,
      resourceId: entry.resourceId,
      previousValue: entry.previousValue ?? entry.oldValue,
      newValue: entry.newValue,
      oldValue: entry.oldValue ?? entry.previousValue,
      note: entry.note,
      ipAddress: entry.ipAddress,
      createdAt,
    };

    inMemoryAuditLogs.unshift(record);

    // Fire-and-forget async DB log if available
    try {
      if (prisma && prisma.auditLog) {
        prisma.auditLog.create({
          data: {
            adminId: entry.adminId || null,
            action: entry.action,
            resourceType: (entry.resourceType || entry.resource || 'ADMIN') as any,
            resourceId: entry.resourceId,
            oldValue: record.oldValue != null ? JSON.stringify(record.oldValue) : null,
            newValue: record.newValue != null ? JSON.stringify(record.newValue) : null,
            ipAddress: entry.ipAddress || null,
          },
        }).catch(() => {});
      }
    } catch {
      // Ignore DB errors during offline testing
    }

    return record;
  }

  /**
   * Retrieve audit logs filtered by resource or limit
   */
  public static getLogs(limit: number = 50, resource?: string): AuditLogEntry[] {
    let logs = inMemoryAuditLogs;
    if (resource) {
      logs = logs.filter((l) => l.resource === resource || l.resourceType === resource);
    }
    return logs.slice(0, limit);
  }

  /**
   * Async DB fetch for audit logs
   */
  public static async getDbLogs(options?: {
    resourceType?: any;
    resourceId?: string;
    adminId?: string;
    limit?: number;
    offset?: number;
  }) {
    const { resourceType, resourceId, adminId, limit = 50, offset = 0 } = options || {};
    return prisma.auditLog.findMany({
      where: {
        ...(resourceType ? { resourceType } : {}),
        ...(resourceId ? { resourceId } : {}),
        ...(adminId ? { adminId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { admin: { select: { id: true, email: true, name: true } } },
    });
  }
}
