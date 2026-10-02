import 'dotenv/config';
import { createRequire } from 'module';
import type { PrismaClient } from '@prisma/client';

const require = createRequire(import.meta.url);

// Singleton instance
let _prisma: any = null;
let _available: boolean | null = null;
let _initAttempted = false;

// Create a safe dummy target that never crashes when properties/methods are chained
function createSafeDummy(): any {
  const dummyFn = () => Promise.resolve(null);
  return new Proxy(dummyFn, {
    get(_target, _prop) {
      return createSafeDummy();
    },
    apply(_target, _thisArg, _argArray) {
      return Promise.resolve(null);
    },
  });
}

function initPrismaClientSync(): any {
  if (_initAttempted) return _prisma;
  _initAttempted = true;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  try {
    // Dynamic requires to prevent import-time crashes in serverless if env is missing
    const { PrismaClient } = require('@prisma/client');
    const { PrismaPg } = require('@prisma/adapter-pg');
    const { Pool } = require('pg');

    let cleanUrl = connectionString;
    try {
      const urlObj = new URL(connectionString);
      urlObj.searchParams.delete('sslmode');
      cleanUrl = urlObj.toString();
    } catch {
      // use as-is
    }

    const pool = new Pool({
      connectionString: cleanUrl,
      connectionTimeoutMillis: 2000,
      ssl: { rejectUnauthorized: false },
    });
    pool.on('error', (err: any) => {
      console.warn('[PRISMA_POOL_WARN]', err?.message || err);
    });

    const adapter = new PrismaPg(pool);
    _prisma = new PrismaClient({
      adapter,
      log: ['error'],
    });
    return _prisma;
  } catch (err) {
    console.error('[PRISMA_INIT_ERROR]', err);
    _prisma = null;
    return null;
  }
}

// Global cache for development hot reloading
const globalForPrisma = globalThis as unknown as {
  prisma: any;
  isPrismaAvailable: boolean | null;
};

function getPrisma(): any {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (_prisma) return _prisma;

  const client = initPrismaClientSync();
  if (!client) {
    return null;
  }

  _prisma = client;
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

// Deep proxy that safely intercepts any chain: prisma.order.findUnique(...)
// If Prisma is unavailable, it returns a safe promise that resolves to null
export const prisma: PrismaClient = new Proxy({} as any, {
  get(_target, prop) {
    const client = getPrisma();
    if (client && client[prop] !== undefined) {
      return client[prop];
    }
    return createSafeDummy();
  },
});

export async function isPrismaAvailable(): Promise<boolean> {
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_WITH_DATABASE) {
    return false;
  }
  if (!process.env.DATABASE_URL) {
    return false;
  }
  if (_available !== null) return _available;
  if (globalForPrisma.isPrismaAvailable !== null && globalForPrisma.isPrismaAvailable !== undefined) {
    _available = globalForPrisma.isPrismaAvailable;
    return _available;
  }
  try {
    const client = getPrisma();
    if (!client || typeof client.$queryRaw !== 'function') {
      _available = false;
    } else {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB check timeout')), 1500));
      await Promise.race([client.$queryRaw`SELECT 1`, timeoutPromise]);
      _available = true;
    }
  } catch {
    _available = false;
  }
  globalForPrisma.isPrismaAvailable = _available;
  return _available;
}
