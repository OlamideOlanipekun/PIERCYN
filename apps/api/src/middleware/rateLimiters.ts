import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import type { Request } from 'express';

/**
 * Vercel places the API behind a proxy and supplies Forwarded/X-Forwarded-For.
 * Use Express's trusted `req.ip` and the library IPv6 helper instead of the
 * default key generator, whose strict proxy validation rejects those headers.
 */
const clientKeyGenerator = (req: Request) =>
  ipKeyGenerator(req.ip || 'unknown');

// Global API limiter: 300 requests per 15 minutes per IP
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  keyGenerator: clientKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

// Sensitive Auth limiter (Affiliate / Admin Login & Registration): 15 attempts per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyGenerator: clientKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// Checkout and Order creation limiter: 20 per 10 minutes
export const checkoutRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyGenerator: clientKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Checkout request rate limit exceeded. Please wait a moment before trying again.',
  },
});

// Quotation and delivery calculation limiter: 45 per minute
export const quoteRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 45,
  keyGenerator: clientKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit exceeded for delivery calculation requests.',
  },
});
