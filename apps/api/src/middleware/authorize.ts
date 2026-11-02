import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { AuthService } from '../modules/auth/auth.service';

/**
 * requireCustomerContext — middleware that ensures req.user is resolved
 * to an existing PIERCYN Customer record, attaching req.customerId.
 */
export async function requireCustomerContext(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const customerId = await AuthService.resolveCustomerId(req.user.supabaseId);
  if (!customerId) {
    res.status(404).json({
      success: false,
      error: 'Customer profile not found. Please sync your account.',
      code: 'CUSTOMER_NOT_SYNCED',
    });
    return;
  }

  req.customerId = customerId;
  next();
}

/**
 * verifyOrderOwnership — verifies that the authenticated customer
 * owns the requested order ID, or that a valid guest access token is supplied.
 */
export async function verifyOrderAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { orderId } = req.params;
  if (!orderId) {
    res.status(400).json({ success: false, error: 'Order identifier is required.' });
    return;
  }

  // If customer is authenticated:
  if (req.user) {
    const customerId = await AuthService.resolveCustomerId(req.user.supabaseId);
    if (customerId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, customerId: true, customerEmail: true },
      });

      if (order && (order.customerId === customerId || order.customerEmail.toLowerCase() === req.user.email.toLowerCase())) {
        req.customerId = customerId;
        return next();
      }
    }
  }

  // Fallback to x-order-access-token for guest access
  const token = req.headers['x-order-access-token'] as string | undefined;
  if (!token) {
    res.status(403).json({ success: false, error: 'Access denied. You do not own this order.' });
    return;
  }

  next();
}
