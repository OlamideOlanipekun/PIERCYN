// Explicit imports ensure @vercel/nft packages these dependencies with the serverless function
import '@prisma/client';
import '@prisma/adapter-pg';
import 'pg';

let cachedApp: any = null;

async function getApp() {
  if (cachedApp) return cachedApp;
  // Do NOT cache boot errors — allow each cold start to retry module load.
  // Caching bootError permanently bricks the serverless instance for the
  // remainder of its lifetime (until the next cold start) on any transient
  // failure, including a missing env var on first request.
  // @ts-ignore — resolved from the esbuild bundle produced by build:server
  const mod = await import('../build/serverless.js');
  cachedApp = mod.app;
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.error('[CRITICAL_FUNCTION_ERROR]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        success: false,
        error: 'SERVERLESS_INVOCATION_FAILED',
        message:
          process.env.NODE_ENV === 'production'
            ? 'A secure server error occurred. Please try again or contact support.'
            : (err?.message || String(err)),
        name: process.env.NODE_ENV === 'production' ? undefined : err?.name,
        code: process.env.NODE_ENV === 'production' ? undefined : err?.code,
        stack: process.env.NODE_ENV === 'production' ? undefined : err?.stack,
      })
    );
  }
}
