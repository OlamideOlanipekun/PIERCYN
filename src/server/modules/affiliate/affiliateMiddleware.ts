import { Request, Response, NextFunction } from 'express';
import { AffiliateAuthService, AffiliateUserResponse } from './affiliateAuthService';

export interface AuthenticatedAffiliateRequest extends Request {
  affiliate?: AffiliateUserResponse;
}

export async function requireAffiliate(
  req: AuthenticatedAffiliateRequest,
  res: Response,
  next: NextFunction
) {
  let token = '';

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-affiliate-token']) {
    token = (req.headers['x-affiliate-token'] as string).trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthenticated: Affiliate access token is required.',
    });
  }

  const affiliate = await AffiliateAuthService.verifyToken(token);
  if (!affiliate) {
    return res.status(401).json({
      success: false,
      error: 'Unauthenticated: Invalid or expired affiliate session token.',
    });
  }

  // Only ACTIVE affiliates can access protected dashboard endpoints
  if (affiliate.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      error:
        affiliate.status === 'PENDING'
          ? 'Your application is under review. Access is granted after approval.'
          : affiliate.status === 'SUSPENDED'
          ? 'Your affiliate account has been suspended.'
          : 'Your affiliate access has been revoked.',
    });
  }

  req.affiliate = affiliate;
  next();
}

// Middleware variant that allows PENDING affiliates to view application status
export async function requireAffiliateLoose(
  req: AuthenticatedAffiliateRequest,
  res: Response,
  next: NextFunction
) {
  let token = '';

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-affiliate-token']) {
    token = (req.headers['x-affiliate-token'] as string).trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthenticated: Affiliate access token is required.',
    });
  }

  const affiliate = await AffiliateAuthService.verifyToken(token);
  if (!affiliate) {
    return res.status(401).json({
      success: false,
      error: 'Unauthenticated: Invalid or expired affiliate session token.',
    });
  }

  if (affiliate.status === 'REJECTED') {
    return res.status(403).json({
      success: false,
      error: 'Your affiliate application was not approved.',
    });
  }

  req.affiliate = affiliate;
  next();
}
