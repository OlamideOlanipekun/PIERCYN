import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  if (prismaInstance) {
    return prismaInstance;
  }

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_NON_POOLING ||
    'postgresql://postgres:postgres@localhost:5432/piercyn';

  let cleanUrl = connectionString;
  try {
    const urlObj = new URL(connectionString);
    urlObj.searchParams.delete('sslmode');
    cleanUrl = urlObj.toString();
  } catch {
    // fallback
  }

  const pool = new Pool({
    connectionString: cleanUrl,
    connectionTimeoutMillis: 5000,
    ssl: process.env.NODE_ENV === 'production' || cleanUrl.includes('supabase.co')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  pool.on('error', (err: any) => {
    console.warn('[DB_POOL_WARN]', err?.message || err);
  });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  prismaInstance = client;
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
    globalForPrisma.pgPool = pool;
  }

  return client;
}

export const prisma = getPrismaClient();

export async function checkDatabaseHealth(): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, message: 'Database connected', latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Database connection error', latencyMs: Date.now() - start };
  }
}
