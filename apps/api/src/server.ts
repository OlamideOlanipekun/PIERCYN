import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { checkDatabaseHealth } from './db/prisma';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  console.log(`[PIERCYN API] Initializing standalone service on port ${PORT}...`);

  // Check database connectivity on startup
  const dbHealth = await checkDatabaseHealth();
  if (dbHealth.ok) {
    console.log(`[PIERCYN API] Database connected successfully (${dbHealth.latencyMs}ms)`);
  } else {
    console.warn(`[PIERCYN API] Database check warning: ${dbHealth.message}`);
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`[PIERCYN API] Standalone server running at http://${HOST}:${PORT}`);
    console.log(`[PIERCYN API] Health endpoint at http://${HOST}:${PORT}/health`);
    console.log(`[PIERCYN API] Products endpoint at http://${HOST}:${PORT}/api/products`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n[PIERCYN API] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[PIERCYN API] HTTP server closed.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[PIERCYN API] Forceful shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[PIERCYN API] Fatal startup error:', err);
  process.exit(1);
});
