import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { ProductService } from '../modules/products/productService';
import { CartService } from '../modules/cart/cartService';
import { CheckoutService } from '../modules/checkout/checkoutService';
import { OrderService } from '../modules/orders/orderService';
import { PaymentService, MockPaymentProvider } from '../modules/payments/paymentService';
import { WebhookService } from '../modules/payments/webhookService';
import { InventoryService } from '../modules/inventory/inventoryService';
import { ShippingService } from '../modules/shipping/shippingService';
import { EventService } from '../services/eventService';
import { AuthService } from '../services/authService';
import { adminRouter } from '../modules/admin/adminRouter';
import { affiliateRouter } from '../modules/affiliate/affiliateRouter';
import {
  AddToCartSchema,
  UpdateCartItemSchema,
  CheckoutQuoteSchema,
  CreateOrderSchema,
  VerifyPaymentSchema,
  TrackEventSchema,
  RegisterUserSchema,
  LoginUserSchema,
} from '../schemas/commerce';

export const apiRouter = Router();

apiRouter.use('/admin', adminRouter);
apiRouter.use('/affiliate', affiliateRouter);

const getSessionId = (req: Request): string => {
  return (req.headers['x-session-id'] as string) || (req.query.sessionId as string) || 'guest-session';
};

const getAuthToken = (req: Request): string => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return (req.headers['x-auth-token'] as string) || '';
};

const orderAccessSecret =
  process.env.ORDER_ACCESS_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production' ? '' : crypto.randomBytes(32).toString('hex'));

function createOrderAccessToken(orderId: string): string {
  if (!orderAccessSecret) {
    throw new Error('Order access token signing is not configured. Set ORDER_ACCESS_TOKEN_SECRET.');
  }
  const payload = Buffer.from(JSON.stringify({ orderId, nonce: crypto.randomBytes(24).toString('hex') })).toString('base64url');
  const signature = crypto.createHmac('sha256', orderAccessSecret).update(payload).digest('base64url');
  return `ord_${payload}.${signature}`;
}

function getAuthorizedOrderId(req: Request): string | null {
  const token = req.headers['x-order-access-token'];
  if (typeof token !== 'string' || !token.startsWith('ord_') || !orderAccessSecret) return null;

  const [payload, signature] = token.slice(4).split('.');
  if (!payload || !signature) return null;

  const expected = crypto.createHmac('sha256', orderAccessSecret).update(payload).digest('base64url');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const orderId = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).orderId;
    return typeof orderId === 'string' ? orderId : null;
  } catch {
    return null;
  }
}

// 1. PRODUCTS & CATEGORIES
apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const { category, collection, status, search } = req.query;
    const products = await ProductService.getAllProducts({
      category: category as string,
      collection: collection as string,
      status: status as string,
      search: search as string,
    });
    res.json({ success: true, count: products.length, data: products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/products/:slug', async (req: Request, res: Response) => {
  try {
    const product = await ProductService.getProductBySlugOrId(req.params.slug);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await ProductService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. CART
apiRouter.get('/cart', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await CartService.calculateCart(sessionId);
    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/cart/items', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const validated = AddToCartSchema.parse(req.body);
    const cart = await CartService.addItem(sessionId, validated.variantId, validated.quantity);
    res.json({ success: true, data: cart });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

apiRouter.put('/cart/items', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const validated = UpdateCartItemSchema.parse(req.body);
    const cart = await CartService.updateItem(sessionId, validated.variantId, validated.quantity);
    res.json({ success: true, data: cart });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

apiRouter.delete('/cart/items/:variantId', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await CartService.removeItem(sessionId, req.params.variantId);
    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/cart', async (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  await CartService.clearCart(sessionId);
  res.json({ success: true, message: 'Cart cleared' });
});

// 3. SHIPPING
apiRouter.get('/shipping/options', async (req: Request, res: Response) => {
  const subtotal = parseInt(req.query.subtotal as string, 10) || 0;
  const options = await ShippingService.getShippingOptions(subtotal);
  res.json({ success: true, data: options });
});

// 4. CHECKOUT & ORDERS
apiRouter.post('/checkout/quote', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const validated = CheckoutQuoteSchema.parse(req.body);
    const quote = await CheckoutService.calculateQuote(
      sessionId,
      validated.shippingRegion,
      validated.items,
      validated.discountCode
    );
    res.json({ success: true, data: quote });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

apiRouter.post('/orders', async (req: Request, res: Response) => {
  try {
    if (!orderAccessSecret) {
      return res.status(503).json({ success: false, error: 'Guest order tracking is not configured.' });
    }
    const sessionId = getSessionId(req);
    const validated = CreateOrderSchema.parse(req.body);

    const order = await CheckoutService.createOrder({
      ...validated,
      sessionId,
    });

    res.status(201).json({ success: true, data: { ...order, orderAccessToken: createOrderAccessToken(order.id) } });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

apiRouter.get('/orders', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Order listing is available only to authorized administrators.' });
});

apiRouter.get('/orders/:id', async (req: Request, res: Response) => {
  const authorizedOrderId = getAuthorizedOrderId(req);
  if (!authorizedOrderId) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  const order = await OrderService.getOrderDetail(req.params.id);
  if (!order || order.id !== authorizedOrderId) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, data: order });
});

// 5. PAYMENTS & WEBHOOKS
apiRouter.post('/payments/initialize', async (req: Request, res: Response) => {
  try {
    const { orderNumber, callbackUrl } = req.body;
    if (!orderNumber) {
      return res.status(400).json({ success: false, error: 'orderNumber is required' });
    }

    const result = await PaymentService.initializePayment(orderNumber, callbackUrl);
    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: result.message || 'Payment provider could not initialize this payment.',
        data: result,
      });
    }
    return res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/payments/verify', async (req: Request, res: Response) => {
  try {
    const validated = VerifyPaymentSchema.parse(req.body);
    const result = await PaymentService.verifyPayment(validated.reference);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Payment could not be verified. The order remains unpaid.',
        data: result,
      });
    }
    return res.json({ success: true, data: result });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

apiRouter.post('/payments/webhook', async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-paystack-signature'] as string) || '';
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await WebhookService.handlePaystackWebhook(signature, rawBody, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ received: false, error: err.message });
  }
});

apiRouter.post('/payments/mock/complete', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ success: false, error: 'reference is required' });
    }
    const result = await PaymentService.verifyPayment(reference);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Mock payment could not be completed for this order.',
        data: result,
      });
    }
    return res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. INVENTORY
apiRouter.get('/inventory/:variantId', async (req: Request, res: Response) => {
  const stock = await InventoryService.getStockStatus(req.params.variantId);
  if (!stock) {
    return res.status(404).json({ success: false, error: 'Inventory record not found' });
  }
  res.json({
    success: true,
    data: {
      variantId: stock.variantId,
      availableStock: stock.available,
      isInStock: stock.available > 0,
    },
  });
});

// 7. EVENTS & ANALYTICS
apiRouter.post('/events', async (req: Request, res: Response) => {
  try {
    const validated = TrackEventSchema.parse(req.body);
    const event = await EventService.track(validated);
    res.json({ success: true, data: event });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

apiRouter.get('/analytics/overview', async (_req: Request, res: Response) => {
  try {
    const summary = await EventService.getAnalyticsSummary();
    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. AUTH
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const validated = RegisterUserSchema.parse(req.body);
    const result = await AuthService.register(validated);
    res.json({ success: true, data: result });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const validated = LoginUserSchema.parse(req.body);
    const result = await AuthService.login(validated);
    res.json({ success: true, data: result });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(401).json({ success: false, error: msg });
  }
});

apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthenticated' });
    }
    const user = await AuthService.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
    }
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  AuthService.logout(token);
  res.json({ success: true, message: 'Logged out successfully' });
});
