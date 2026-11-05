import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (process.env.NODE_ENV === 'production' && !serviceRoleKey) {
  throw new Error('[SECURITY_CRITICAL] SUPABASE_SERVICE_ROLE_KEY must be configured in production.');
}

// Single shared server client for identity verification
export const supabaseAuthServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface AuthenticatedUser {
  supabaseId: string;      // auth.users UUID
  email: string;
  emailVerified: boolean;
  metadata?: Record<string, any>;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      customerId?: string;   // resolved PIERCYN Customer.id
    }
  }
}

/**
 * requireAuth — Strict gate.
 * Rejects with 401 if no valid Supabase JWT is present.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ success: false, error: 'Session token missing.' });
    return;
  }

  try {
    const { data, error } = await supabaseAuthServer.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ success: false, error: 'Invalid or expired session. Please sign in again.' });
      return;
    }

    const u = data.user;
    req.user = {
      supabaseId: u.id,
      email: u.email ?? '',
      emailVerified: Boolean(u.email_confirmed_at),
      metadata: u.user_metadata,
    };
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Authentication verification failed.' });
  }
}

/**
 * optionalAuth — Soft gate.
 * Attaches req.user if a valid token is present; continues anonymously otherwise.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next();
  }

  try {
    const { data } = await supabaseAuthServer.auth.getUser(token);
    if (data?.user) {
      req.user = {
        supabaseId: data.user.id,
        email: data.user.email ?? '',
        emailVerified: Boolean(data.user.email_confirmed_at),
        metadata: data.user.user_metadata,
      };
    }
  } catch {
    // Silently continue for optional authentication
  }
  next();
}
