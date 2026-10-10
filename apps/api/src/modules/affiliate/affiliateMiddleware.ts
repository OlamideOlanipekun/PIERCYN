import { Request, Response, NextFunction } from 'express';
import { AffiliateAuthService, AffiliateUserResponse } from './affiliateAuthService';
import { prisma } from '../../db/prisma';

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

  // Token claims are intentionally not the authority for current account status:
  // an administrator may suspend or reject an affiliate after a token was issued.
  const currentAffiliate = await prisma.affiliate.findUnique({
    where: { id: affiliate.id },
    select: { id: true, email: true, firstName: true, lastName: true, status: true, isActive: true, createdAt: true },
  });
  if (!currentAffiliate || currentAffiliate.status !== 'ACTIVE' || !currentAffiliate.isActive) {
    const status = currentAffiliate?.status || affiliate.status;
    return res.status(403).json({
      success: false,
      error:
        status === 'PENDING'
          ? 'Your application is under review. Access is granted after approval.'
          : status === 'SUSPENDED'
          ? 'Your affiliate account has been suspended.'
          : 'Your affiliate access has been revoked.',
    });
  }

  req.affiliate = { ...currentAffiliate, createdAt: currentAffiliate.createdAt.toISOString() };
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

  const currentAffiliate = await prisma.affiliate.findUnique({
    where: { id: affiliate.id },
    select: { id: true, email: true, firstName: true, lastName: true, status: true, isActive: true, createdAt: true },
  });
  if (!currentAffiliate || currentAffiliate.status === 'REJECTED') {
    return res.status(403).json({
      success: false,
      error: 'Your affiliate application was not approved.',
    });
  }

  req.affiliate = { ...currentAffiliate, createdAt: currentAffiliate.createdAt.toISOString() };
  next();
}
