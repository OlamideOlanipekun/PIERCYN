import { config as loadEnv } from 'dotenv';
loadEnv();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/apiRouter';
import { checkDatabaseHealth } from './db/prisma';

export const app = express();

// Allowed Origins for CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://piercyn.vercel.app',
      'https://piercyn-full-store.vercel.app',
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-session-id',
      'x-admin-token',
      'x-auth-token',
      'x-paystack-signature',
    ],
  })
);

// Capture raw body for Paystack HMAC webhook verification
app.use(
  express.json({
    limit: '5mb',
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as any).rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health check endpoint
app.get(['/health', '/api/health'], async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  const status = dbHealth.ok ? 'ok' : 'degraded';
  res.status(dbHealth.ok ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    service: 'piercyn-api',
    version: '1.0.0',
    database: dbHealth,
  });
});

// Mount domain routes for both direct /api/* prefix and root rewrites
app.use('/api', apiRouter);
app.use('/', apiRouter);

// 404 Handler for undefined API routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API_UNHANDLED_ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Unknown server error',
  });
});
