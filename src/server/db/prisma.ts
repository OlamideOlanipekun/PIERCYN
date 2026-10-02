import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || '';

  // Clean URL to prevent pg query-parser from overriding ssl config
  let cleanUrl = connectionString;
  try {
    const urlObj = new URL(connectionString);
    urlObj.searchParams.delete('sslmode');
    cleanUrl = urlObj.toString();
  } catch (_e) {
    // fallback to original if parsing fails
  }

  const pool = new Pool({
    connectionString: cleanUrl,
    connectionTimeoutMillis: 2000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  });
}

// Prevent multiple Prisma Client instances in development (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  isPrismaAvailable: boolean | null;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function isPrismaAvailable(): Promise<boolean> {
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_WITH_DATABASE) {
    return false;
  }
  if (globalForPrisma.isPrismaAvailable !== null && globalForPrisma.isPrismaAvailable !== undefined) {
    return globalForPrisma.isPrismaAvailable;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    globalForPrisma.isPrismaAvailable = true;
  } catch {
    globalForPrisma.isPrismaAvailable = false;
  }
  return globalForPrisma.isPrismaAvailable;
}
