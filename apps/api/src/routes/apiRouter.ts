import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { requireAdmin } from '../modules/admin/adminMiddleware';
import { CatalogUnavailableError, ProductService } from '../modules/products/productService';
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
import { reviewRouter } from '../modules/reviews/reviewRouter';
import { ReviewService } from '../modules/reviews/reviewService';
import { NotificationWorker } from '../modules/notifications';
import { prisma } from '../db/prisma';
import {
  createOrderAccessToken,
  isOrderAccessTokenConfigured,
  verifyOrderAccessToken,
} from '../security/orderAccessToken';
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
apiRouter.use('/', reviewRouter);

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

const getSessionId = (req: Request): string => {
  const supplied = (req.headers['x-session-id'] as string) || (req.query.sessionId as string);
  if (typeof supplied === 'string' && SESSION_ID_PATTERN.test(supplied)) return supplied;
  // Never share a catch-all guest session: an unidentified client gets an
  // isolated, ephemeral session instead of another customer's cart.
  return `anon_${crypto.randomUUID()}`;
};

const getAuthToken = (req: Request): string => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return (req.headers['x-auth-token'] as string) || '';
};

export { createOrderAccessToken, verifyOrderAccessToken } from '../security/orderAccessToken';

function getAuthorizedOrderId(req: Request): string | null {
  const token = req.headers['x-order-access-token'];
  if (typeof token !== 'string') return null;
  return verifyOrderAccessToken(token)?.orderId ?? null;
}

// 1. PRODUCTS & CATEGORIES
apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const list = (value: unknown) => typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
    const number = (value: unknown) => typeof value === 'string' && value.trim() !== '' ? Number(value) : undefined;
    const boolean = (value: unknown) => value === 'true' ? true : value === 'false' ? false : undefined;
    const minPrice = number(req.query.minPrice);
    const maxPrice = number(req.query.maxPrice);
    if ((minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
      (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
      return res.status(400).json({ success: false, error: 'Invalid price range.' });
    }
    const sort = req.query.sort;
    if (sort !== undefined && !['featured', 'newest', 'price-asc', 'price-desc'].includes(String(sort))) {
      return res.status(400).json({ success: false, error: 'Invalid sort option.' });
    }
    const catalog = await ProductService.getCatalog({
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      collection: typeof req.query.collection === 'string' ? req.query.collection : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      minPrice,
      maxPrice,
      sizes: list(req.query.sizes),
      colours: list(req.query.colours),
      inStock: boolean(req.query.inStock),
      sort: sort as any,
      page: number(req.query.page),
      limit: number(req.query.limit),
    });
    const productIds = catalog.products.map((p) => p.id);
    const ratingSummaries = await ReviewService.batchGetRatingSummaries(productIds);
    const enriched = catalog.products.map((p) => ({
      ...p,
      ratingSummary: ratingSummaries[p.id] || { averageRating: null, totalReviews: 0 },
    }));
    res.json({ success: true, count: catalog.total, data: enriched, meta: {
      total: catalog.total, page: catalog.page, limit: catalog.limit, totalPages: catalog.totalPages,
    } });
  } catch (err: any) {
    const status = err instanceof CatalogUnavailableError ? 503 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

apiRouter.get('/products/:slug', async (req: Request, res: Response) => {
  try {
    const product = await ProductService.getProductBySlugOrId(req.params.slug);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    const ratingSummary = await ReviewService.getProductRatingSummary(product.id);
    res.json({ success: true, data: { ...product, ratingSummary } });
  } catch (err: any) {
    const status = err instanceof CatalogUnavailableError ? 503 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

apiRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await ProductService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err: any) {
    const status = err instanceof CatalogUnavailableError ? 503 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

apiRouter.get('/categories/:slug/products', async (req: Request, res: Response) => {
  try {
    const category = (await ProductService.getCategories()).find((item) => item.slug === req.params.slug.toLowerCase());
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });

    const catalog = await ProductService.getCatalog({ category: category.slug, page: 1, limit: 100 });
    const ratingSummaries = await ReviewService.batchGetRatingSummaries(catalog.products.map((product) => product.id));
    const products = catalog.products.map((product) => ({
      ...product,
      ratingSummary: ratingSummaries[product.id] || { averageRating: null, totalReviews: 0 },
    }));
    res.json({ success: true, data: { category, products, meta: { total: catalog.total } } });
  } catch (err: any) {
    const status = err instanceof CatalogUnavailableError ? 503 : 500;
    res.status(status).json({ success: false, error: err.message });
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
    if (!isOrderAccessTokenConfigured()) {
      return res.status(503).json({ success: false, error: 'Guest order tracking is not configured.' });
    }
    const sessionId = getSessionId(req);
    const validated = CreateOrderSchema.parse(req.body);
    if (process.env.NODE_ENV === 'production' && validated.paymentMethod === 'mock') {
      return res.status(400).json({ success: false, error: 'Mock payments are not available in production.' });
    }

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
  const order = await OrderService.getPublicOrderDetail(req.params.id);
  if (!order || order.id !== authorizedOrderId) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, data: order });
});

// 5. PAYMENTS & WEBHOOKS
const PaymentReceiptSchema = z.object({
  fileBase64: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'application/pdf']),
});

apiRouter.post('/payments/initialize', async (req: Request, res: Response) => {
  try {
    const orderNumber = typeof req.body?.orderNumber === 'string' ? req.body.orderNumber.trim() : '';
    if (!orderNumber) {
      return res.status(400).json({ success: false, error: 'orderNumber is required' });
    }

    const authorizedOrderId = getAuthorizedOrderId(req);
    const order = await OrderService.getOrder(orderNumber);
    if (!authorizedOrderId || !order || order.id !== authorizedOrderId) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const result = await PaymentService.initializePayment(order.orderNumber);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/payments/verify', async (req: Request, res: Response) => {
  try {
    const validated = VerifyPaymentSchema.parse(req.body);
    const authorizedOrderId = getAuthorizedOrderId(req);
    if (!authorizedOrderId) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: validated.reference },
          { payments: { some: { providerReference: validated.reference } } },
        ],
      },
      select: { id: true, orderNumber: true },
    });
    if (!order || order.id !== authorizedOrderId) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const result = await PaymentService.verifyPayment(order.orderNumber, validated.reference);
    if (!result.success) {
      return res.status(400).json({ success: false, error: 'Payment could not be verified. Please wait for provider confirmation or contact support.', data: result });
    }
    res.json({ success: true, data: result });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

apiRouter.post('/orders/:id/payment-receipt', async (req: Request, res: Response) => {
  try {
    const authorizedOrderId = getAuthorizedOrderId(req);
    if (!authorizedOrderId || authorizedOrderId !== req.params.id) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const validated = PaymentReceiptSchema.parse(req.body);
    const order = await OrderService.getOrderDetail(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const result = await PaymentService.submitPaymentReceipt(
      order.orderNumber,
      validated.fileBase64,
      validated.mimeType
    );
    res.status(202).json({ success: true, data: result });
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
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_MOCK_PAYMENTS !== 'true') {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  try {
    PaymentService.setProvider(new MockPaymentProvider());
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ success: false, error: 'reference is required' });
    }
    const result = await PaymentService.verifyPayment(reference);
    res.json({ success: true, data: result });
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

const handleReservationCron = async (req: Request, res: Response) => {
  const configuredSecret = process.env.CRON_SECRET || '';
  if (!configuredSecret) {
    return res.status(503).json({ success: false, error: 'CRON_SECRET is not configured.' });
  }
  const auth = req.headers['authorization'] || '';
  const supplied = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(configuredSecret);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const result = await InventoryService.expireReservations();
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[RESERVATION_CRON]', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

apiRouter.get('/internal/cron/reservations', handleReservationCron);
apiRouter.post('/internal/cron/reservations', handleReservationCron);

const handleNotificationCron = async (req: Request, res: Response) => {
  const configuredSecret = process.env.CRON_SECRET || '';
  if (!configuredSecret) {
    return res.status(503).json({ success: false, error: 'CRON_SECRET is not configured.' });
  }
  const auth = req.headers['authorization'] || '';
  const supplied = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(configuredSecret);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const batchSize = parseInt(req.query.batchSize as string, 10) || 10;
    const result = await NotificationWorker.processNotifications(batchSize);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[NOTIFICATION_CRON_ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

apiRouter.get('/internal/cron/notifications', handleNotificationCron);
apiRouter.post('/internal/cron/notifications', handleNotificationCron);
apiRouter.get('/cron/process-notifications', handleNotificationCron);
apiRouter.post('/cron/process-notifications', handleNotificationCron);

apiRouter.get('/analytics/overview', requireAdmin, async (_req: Request, res: Response) => {
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
