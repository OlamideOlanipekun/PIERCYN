import { Request, Response, NextFunction } from 'express';
import { AdminAuthService, AdminUserResponse } from './adminAuthService';

export interface AuthenticatedAdminRequest extends Request {
  admin?: AdminUserResponse;
}

export function requireAdmin(req: AuthenticatedAdminRequest, res: Response, next: NextFunction) {
  let token = '';

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-admin-token']) {
    token = (req.headers['x-admin-token'] as string).trim();
  } else if (req.headers['x-auth-token']) {
    token = (req.headers['x-auth-token'] as string).trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthenticated: Admin access token is required.',
    });
  }

  const admin = AdminAuthService.verifyToken(token);
  if (!admin) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid or expired admin session token.',
    });
  }

  req.admin = admin;
  next();
}
