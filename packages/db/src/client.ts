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

function getDatabaseConnectionString(): string {
  if (process.env.NODE_ENV === 'test') {
    const testUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL_NON_POOLING_TEST;
    if (!testUrl) {
      throw new Error('Database-backed tests require DATABASE_URL_TEST or DATABASE_URL_NON_POOLING_TEST. Refusing to fall back to DATABASE_URL.');
    }

    const productionUrl = process.env.DATABASE_URL_NON_POOLING || process.env.DATABASE_URL;
    if (productionUrl && testUrl === productionUrl) {
      throw new Error('DATABASE_URL_TEST must not match the production database connection.');
    }

    return testUrl;
  }

  if (process.env.NODE_ENV === 'production') {
    const prodUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_NON_POOLING;
    if (!prodUrl) {
      throw new Error('[DATABASE_FATAL] DATABASE_URL or DATABASE_URL_NON_POOLING must be set in production.');
    }
    return prodUrl;
  }

  return process.env.DATABASE_URL || process.env.DATABASE_URL_NON_POOLING || 'postgresql://postgres:postgres@localhost:5432/piercyn';
}

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  if (prismaInstance) {
    return prismaInstance;
  }

  const connectionString = getDatabaseConnectionString();

  let cleanUrl = connectionString;
  try {
    const urlObj = new URL(connectionString);
    urlObj.searchParams.delete('sslmode');
    cleanUrl = urlObj.toString();
  } catch {
    // fallback
  }

  const isRemote =
    cleanUrl.includes('supabase.com') ||
    cleanUrl.includes('supabase.co') ||
    cleanUrl.includes('pooler.supabase') ||
    cleanUrl.includes('sslmode=require') ||
    process.env.NODE_ENV === 'production';

  const isProduction = process.env.NODE_ENV === 'production';
  const maxConnections = process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : (isProduction ? 2 : 10);

  const pool = new Pool({
    connectionString: cleanUrl,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 20000,
    max: maxConnections,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
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
  globalForPrisma.prisma = client;
  globalForPrisma.pgPool = pool;

  return client;
}

export const prisma: PrismaClient = new Proxy(Object.create(PrismaClient.prototype), {
  get(target, prop) {
    if (prop in target) {
      return (target as any)[prop];
    }
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
  set(target, prop, value) {
    (target as any)[prop] = value;
    return true;
  },
  has(target, prop) {
    if (prop in target) return true;
    return true;
  },
  getOwnPropertyDescriptor(target, prop) {
    if (prop in target) {
      return Object.getOwnPropertyDescriptor(target, prop);
    }
    const client = getPrismaClient();
    const val = (client as any)[prop];
    return {
      configurable: true,
      enumerable: true,
      writable: true,
      value: typeof val === 'function' ? val.bind(client) : val,
    };
  },
});

export async function checkDatabaseHealth(): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, message: 'Database connected', latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Database connection error', latencyMs: Date.now() - start };
  }
}
