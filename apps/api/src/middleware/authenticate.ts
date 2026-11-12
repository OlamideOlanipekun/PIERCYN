import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseClient: SupabaseClient | null = null;

export function getSupabaseAuthServer(): SupabaseClient | null {
  if (_supabaseClient) return _supabaseClient;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[SECURITY_WARNING] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured. Server-side token verification will reject or bypass.');
    }
    return null;
  }

  try {
    _supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return _supabaseClient;
  } catch (err: any) {
    console.error('[SUPABASE_CLIENT_ERROR]', err?.message || err);
    return null;
  }
}

// Retain exported proxy for backward compatibility without throwing on module import
export const supabaseAuthServer: any = new Proxy({}, {
  get(_target, prop) {
    const client = getSupabaseAuthServer();
    if (!client) {
      if (prop === 'auth') {
        return {
          getUser: async () => ({ data: { user: null }, error: new Error('Supabase client not configured') }),
        };
      }
      return undefined;
    }
    return (client as any)[prop];
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

  const client = getSupabaseAuthServer();
  if (!client) {
    res.status(503).json({ success: false, error: 'Authentication service temporarily unavailable.' });
    return;
  }

  try {
    const { data, error } = await client.auth.getUser(token);
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

  const client = getSupabaseAuthServer();
  if (!client) {
    // If Supabase server auth is not configured, continue anonymously as guest
    return next();
  }

  try {
    const { data } = await client.auth.getUser(token);
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
