import type { PrismaClient } from '@prisma/client';

// Singleton instance
let _prisma: any = null;
let _available: boolean | null = null;
let _initAttempted = false;
let _initPromise: Promise<any> | null = null;

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

async function initPrismaClient(): Promise<any> {
  if (_initAttempted) return _prisma;
  _initAttempted = true;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  try {
    // Dynamic imports work in both ESM (Vite) and CJS (Vercel serverless)
    const prismaClientModule = await import('@prisma/client');
    const adapterModule = await import('@prisma/adapter-pg');
    const pgModule = await import('pg');

    const PrismaClientCtor = prismaClientModule.PrismaClient;
    const PrismaPgCtor = adapterModule.PrismaPg;
    const PoolCtor = pgModule.default?.Pool || pgModule.Pool;

    let cleanUrl = connectionString;
    try {
      const urlObj = new URL(connectionString);
      urlObj.searchParams.delete('sslmode');
      cleanUrl = urlObj.toString();
    } catch {
      // use as-is
    }

    const pool = new PoolCtor({
      connectionString: cleanUrl,
      connectionTimeoutMillis: 2000,
      ssl: { rejectUnauthorized: false },
    });
    pool.on('error', (err: any) => {
      console.warn('[PRISMA_POOL_WARN]', err?.message || err);
    });

    const adapter = new PrismaPgCtor(pool);
    _prisma = new PrismaClientCtor({
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

async function getPrisma(): Promise<any> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (_prisma) return _prisma;

  // Deduplicate concurrent init calls
  if (!_initPromise) {
    _initPromise = initPrismaClient();
  }

  const client = await _initPromise;
  if (!client) {
    return null;
  }

  _prisma = client;
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

// Synchronous getter for proxy — returns cached client or null
function getPrismaSync(): any {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (_prisma) return _prisma;

  // Kick off async init in background if not started
  if (!_initPromise) {
    _initPromise = initPrismaClient().then((client) => {
      if (client) {
        _prisma = client;
        if (process.env.NODE_ENV !== 'production') {
          globalForPrisma.prisma = client;
        }
      }
      return client;
    });
  }

  return null;
}

// Deep proxy that safely intercepts any chain: prisma.order.findUnique(...)
// If Prisma is unavailable, it returns a safe promise that resolves to null
export const prisma: PrismaClient = new Proxy({} as any, {
  get(_target, prop) {
    const client = getPrismaSync();
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
    const client = await getPrisma();
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
