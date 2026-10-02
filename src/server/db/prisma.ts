import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Lazy singleton — only created when first accessed
let _prisma: PrismaClient | null = null;
let _available: boolean | null = null;

function createPrismaClient(): PrismaClient | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // No database configured — running in static/offline mode
    return null;
  }

  try {
    // Strip sslmode query param — pg handles SSL via the ssl option below
    let cleanUrl = connectionString;
    try {
      const urlObj = new URL(connectionString);
      urlObj.searchParams.delete('sslmode');
      cleanUrl = urlObj.toString();
    } catch {
      // Not a valid URL — use as-is
    }

    const pool = new Pool({
      connectionString: cleanUrl,
      connectionTimeoutMillis: 2000,
      ssl: { rejectUnauthorized: false },
    });
    pool.on('error', (err) => {
      console.warn('[PRISMA_POOL_WARN]', err?.message || err);
    });

    const adapter = new PrismaPg(pool);

    return new PrismaClient({
      adapter,
      log: ['error'],
    });
  } catch (err) {
    console.error('[PRISMA_INIT_ERROR]', err);
    return null;
  }
}

// Prevent multiple instances in development (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  isPrismaAvailable: boolean | null;
};

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (_prisma) return _prisma;

  const client = createPrismaClient();
  if (!client) {
    // Return a no-op stub so import never throws
    // Actual DB calls will fail gracefully via isPrismaAvailable() check
    return {} as unknown as PrismaClient;
  }

  _prisma = client;
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

// Lazily-resolved proxy — the PrismaClient is only constructed on first property access
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma() as any;
    if (!client || Object.keys(client).length === 0) {
      return undefined;
    }
    return client[prop];
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
    if (!client || Object.keys(client).length === 0 || typeof (client as any).$queryRaw !== 'function') {
      _available = false;
    } else {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB check timeout')), 1500));
      await Promise.race([(client as any).$queryRaw`SELECT 1`, timeoutPromise]);
      _available = true;
    }
  } catch {
    _available = false;
  }
  globalForPrisma.isPrismaAvailable = _available;
  return _available;
}
