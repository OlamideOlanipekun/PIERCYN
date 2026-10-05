import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from './routes/apiRouter';

export const app = express();

// Lightweight Zero-Dependency CORS Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id, x-paystack-signature');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Capture raw body for Paystack HMAC verification while parsing JSON
app.use(
  express.json({
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as any).rawBody = buf.toString();
    },
  })
);

app.use(express.urlencoded({ extended: true }));

// Request logger for API routes
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Health check endpoint
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount domain routes
app.use('/api', apiRouter);

// Fallback 404 JSON handler for unhandled API routes
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl?.startsWith('/api') || req.url?.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
    });
  }
  next();
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[UNHANDLED_ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected error occurred. Please try again.',
  });
});
