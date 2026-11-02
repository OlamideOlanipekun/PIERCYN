import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/authenticate';
import { AuthService } from './auth.service';

export const authRouter = Router();

/**
 * POST /api/auth/sync
 * Called after every successful Supabase sign-in to create or update the PIERCYN customer profile.
 */
authRouter.post('/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const { fullName, avatarUrl } = req.body;
    const customer = await AuthService.syncCustomer({
      user: req.user!,
      fullName: typeof fullName === 'string' ? fullName : undefined,
      avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : undefined,
    });
    res.json({ success: true, data: customer });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Customer synchronization failed.' });
  }
});

/**
 * GET /api/auth/me
 * Returns the verified customer profile for the active session.
 */
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const customerId = await AuthService.resolveCustomerId(req.user!.supabaseId);
    if (!customerId) {
      // Auto-sync if not synced yet
      const synced = await AuthService.syncCustomer({
        user: req.user!,
        fullName: req.user!.metadata?.full_name || req.user!.metadata?.name,
        avatarUrl: req.user!.metadata?.avatar_url || req.user!.metadata?.picture,
      });
      return res.json({ success: true, data: synced });
    }
    const profile = await AuthService.getCustomerProfile(customerId);
    res.json({ success: true, data: profile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/auth/me
 * Updates customer profile details (firstName, lastName, phone).
 */
authRouter.put('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const customerId = await AuthService.resolveCustomerId(req.user!.supabaseId);
    if (!customerId) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }
    const { firstName, lastName, phone } = req.body;
    const updated = await AuthService.updateProfile(customerId, { firstName, lastName, phone });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auth/orders
 * Returns all past and present orders belonging to the authenticated customer.
 */
authRouter.get('/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const customerId = await AuthService.resolveCustomerId(req.user!.supabaseId);
    if (!customerId) {
      return res.json({ success: true, data: [] });
    }
    const orders = await AuthService.getCustomerOrders(customerId);
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/claim-order
 * Allows a signed-in customer to claim a guest order by orderNumber.
 */
authRouter.post('/claim-order', requireAuth, async (req: Request, res: Response) => {
  try {
    const customerId = await AuthService.resolveCustomerId(req.user!.supabaseId);
    if (!customerId) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }
    const { orderNumber } = req.body;
    if (!orderNumber || typeof orderNumber !== 'string') {
      return res.status(400).json({ success: false, error: 'Order number is required.' });
    }

    const result = await AuthService.claimOrder(customerId, orderNumber.trim(), req.user!.email);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({ success: true, message: 'Order successfully added to your account.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/addresses
 * Add a new saved shipping address for the customer.
 */
authRouter.post('/addresses', requireAuth, async (req: Request, res: Response) => {
  try {
    const customerId = await AuthService.resolveCustomerId(req.user!.supabaseId);
    if (!customerId) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }
    const { fullName, phone, state, city, addressLine, additionalInfo, isDefault } = req.body;
    if (!fullName || !phone || !state || !city || !addressLine) {
      return res.status(400).json({ success: false, error: 'Missing required address fields.' });
    }

    const saved = await AuthService.saveAddress(customerId, {
      fullName,
      phone,
      state,
      city,
      addressLine,
      additionalInfo,
      isDefault: Boolean(isDefault),
    });

    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
