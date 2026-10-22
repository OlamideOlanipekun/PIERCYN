import { Router, Request, Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { AdminAuthService } from './adminAuthService';
import { requireAdmin, AuthenticatedAdminRequest } from './adminMiddleware';
import { OrderService } from '../orders/orderService';
import { ProductService } from '../products/productService';
import { InventoryService } from '../inventory/inventoryService';
import { CustomerService } from '../customers/customerService';
import { ShippingService } from '../shipping/shippingService';
import { AnalyticsService } from '../analytics/analyticsService';
import { AuditService } from './auditService';
import { affiliateAdminRouter } from '../affiliate/affiliateAdminRouter';
import { ReviewService } from '../reviews/reviewService';
import { DeliveryQuoteService } from '../orders/deliveryQuoteService';
import { dbStore, DbOrder, OrderStatusType } from '../../db/store';
import { COMMERCE_CONFIG } from '../../config/constants';
import { z } from 'zod';

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  try {
    supabaseAdmin = createClient(url, serviceRoleKey);
    return supabaseAdmin;
  } catch {
    return null;
  }
}

export const adminRouter = Router();

adminRouter.use('/affiliates', affiliateAdminRouter);

// Mutable store settings initialized from COMMERCE_CONFIG
export const storeSettingsState = {
  storeName: 'PIERCYN',
  tagline: 'Look Good. Spend Less.',
  atelierAddress: '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
  supportEmail: 'director@piercyn.com',
  supportPhone: '+2348000000000',
  currency: 'NGN (₦)',
  freeShippingThresholdNGN: COMMERCE_CONFIG.SHIPPING.FREE_THRESHOLD_NGN,
  lagosDeliveryFeeNGN: COMMERCE_CONFIG.SHIPPING.LAGOS_FEE_NGN,
  nationwideDeliveryFeeNGN: COMMERCE_CONFIG.SHIPPING.NATIONWIDE_FEE_NGN,
  lowStockThreshold: COMMERCE_CONFIG.INVENTORY.LOW_STOCK_THRESHOLD,
  reservationTtlMinutes: COMMERCE_CONFIG.INVENTORY.RESERVATION_TTL_MINUTES,
  paymentGatewayConfigured: Boolean(COMMERCE_CONFIG.PAYMENT.PAYSTACK.PUBLIC_KEY || process.env.PAYSTACK_SECRET_KEY),
  paymentEnvironment: process.env.NODE_ENV === 'production' ? 'LIVE' : 'TEST',
  shippingProviders: ['Manual Dispatch Rider (Lagos Doorstep)', 'Verified Interstate Courier (Nationwide)'],
};

// Validation Schemas
const AdminLoginSchema = z.object({
  email: z.string().trim().email('Valid admin email is required'),
  password: z.string().min(1, 'Password is required'),
});

const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING_PAYMENT',
    'PAID',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'FAILED',
    'RETURNED',
    'REFUNDED',
    'EXCHANGED',
  ]),
  note: z.string().max(500).optional(),
});

const CreateShipmentSchema = z.object({
  courier: z.string().optional(),
  trackingNumber: z.string().optional(),
  deliveryFeeNGN: z.number().int().nonnegative().optional(),
  deliveryAddress: z.string().min(5),
  recipientName: z.string().min(2),
  recipientPhone: z.string().min(7),
  itemDescription: z.string().optional(),
});

// ── Delivery Quotation Schemas ────────────────────────────────────────────────
const SetDeliveryQuoteSchema = z.object({
  deliveryFeeNGN: z
    .number({ required_error: 'deliveryFeeNGN is required' })
    .int('Delivery fee must be a whole number (NGN)')
    .nonnegative('Delivery fee cannot be negative'),
  estimatedTimeframe: z.string().max(200).optional(),
  internalNote: z.string().max(1000).optional(),
});

const AssignRiderSchema = z.object({
  riderName: z.string().min(2, 'Rider name must be at least 2 characters'),
  riderPhone: z.string().min(7, 'Rider phone must be at least 7 characters'),
});

const DispatchSchema = z.object({
  dispatchNote: z.string().max(500).optional(),
});

const RejectQuoteSchema = z.object({
  reason: z.string().max(500).optional(),
});

const CreateProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().min(5),
  shortDescription: z.string().optional(),
  priceNGN: z.number().int().positive(),
  costPriceNGN: z.number().int().nonnegative().optional(),
  priceUSD: z.number().int().optional(),
  priceGBP: z.number().int().optional(),
  priceEUR: z.number().int().optional(),
  categoryId: z.string().min(1),
  collection: z.string().optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
  images: z.array(z.string()).min(1),
  videoUrl: z.string().optional(),
  gsm: z.string().optional(),
  fit: z.string().optional(),
  fabric: z.string().optional(),
  origin: z.string().optional(),
  careInstructions: z.string().optional(),
  productStory: z.string().optional(),
  tag: z.string().optional(),
  isNewDrop: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isLimited: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        sku: z.string().optional(),
        size: z.string(),
        colour: z.string(),
        colourHex: z.string().optional(),
        priceNGN: z.number().int().optional(),
        costPriceNGN: z.number().int().optional(),
        initialStock: z.number().int().nonnegative().optional(),
        image: z.string().optional(),
      })
    )
    .optional(),
});

const InventoryAdjustmentSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int(),
  type: z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'DAMAGE', 'RETURN']),
  reference: z.string().min(1),
  reason: z.string().optional(),
});

const CreateCategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters.'),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only.').optional().or(z.literal('')),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url('Image URL must be a valid URL.').optional().or(z.literal('')),
  sortOrder: z.number().int().nonnegative().optional(),
});

const UpdateCategorySchema = z.object({
  name: z.string().trim().min(2).optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().or(z.literal('')),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  sortOrder: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

// -------------------------------------------------------------
// 1. ADMIN AUTHENTICATION
// -------------------------------------------------------------
adminRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const validated = AdminLoginSchema.parse(req.body);
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'global';
    const result = await AdminAuthService.login(validated.email, validated.password, ip);

    AuditService.log({
      adminId: result.admin.id,
      adminEmail: result.admin.email,
      action: 'LOGIN',
      resource: 'SETTINGS',
      resourceId: result.admin.id,
      note: `Admin logged in successfully from IP: ${ip}`,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(401).json({ success: false, error: msg });
  }
});

adminRouter.get('/auth/me', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  res.json({ success: true, data: req.admin });
});

adminRouter.post('/auth/logout', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  const token =
    (req.headers['authorization']?.replace('Bearer ', '') ||
      req.headers['x-admin-token'] ||
      req.headers['x-auth-token']) as string;
  AdminAuthService.logout(token);

  if (req.admin) {
    AuditService.log({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'LOGOUT',
      resource: 'SETTINGS',
      resourceId: req.admin.id,
      note: 'Admin logged out',
    });
  }

  res.json({ success: true, message: 'Logged out successfully' });
});

// -------------------------------------------------------------
// 1b. IMAGE UPLOAD (proxied via Supabase service-role key)
// -------------------------------------------------------------
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const PRODUCT_IMAGE_PATH = /^\/storage\/v1\/object\/public\/products\/products\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/i;

function hasExpectedImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === 'image/gif') return buffer.length >= 6 && (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a');
  return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
}

function isManagedProductImageUrl(value: string): boolean {
  try {
    const storageUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    if (!storageUrl) return false;
    const url = new URL(value);
    return url.origin === new URL(storageUrl).origin && PRODUCT_IMAGE_PATH.test(url.pathname);
  } catch {
    return false;
  }
}

function assertAuthorizedProductImages(images: string[], existingImages: string[] = []): void {
  const existing = new Set(existingImages);
  if (images.length === 0 || images.some((image) => !isManagedProductImageUrl(image) && !existing.has(image))) {
    throw new Error('Product images must be uploaded through the admin image uploader.');
  }
}

adminRouter.post('/upload-image', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const storage = getSupabaseAdmin();
    if (!storage) {
      return res.status(503).json({ success: false, error: 'Image uploads require Supabase credentials (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY). Add them to .env to enable uploads.' });
    }

    const { fileBase64, mimeType } = req.body;
    if (!fileBase64 || !mimeType) {
      return res.status(400).json({ success: false, error: 'fileBase64 and mimeType are required.' });
    }
    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return res.status(400).json({ success: false, error: 'Only JPEG, PNG, WebP, and GIF images are supported.' });
    }

    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64Data)) {
      return res.status(400).json({ success: false, error: 'Invalid image encoding.' });
    }
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ success: false, error: 'Image must be between 1 byte and 3 MB.' });
    }
    if (!hasExpectedImageSignature(buffer, mimeType)) {
      return res.status(400).json({ success: false, error: 'Image contents do not match the declared file type.' });
    }

    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
    const uniqueName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `products/${uniqueName}`;

    const { error } = await storage.storage
      .from('products')
      .upload(filePath, buffer, { cacheControl: '3600', upsert: false, contentType: mimeType });

    if (error) {
      return res.status(500).json({ success: false, error: `Upload failed: ${error.message}` });
    }

    const { data } = storage.storage.from('products').getPublicUrl(filePath);
    if (!data?.publicUrl) {
      return res.status(500).json({ success: false, error: 'Could not retrieve public URL after upload.' });
    }

    res.json({ success: true, data: { publicUrl: data.publicUrl } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Upload failed.' });
  }
});

adminRouter.get('/media', requireAdmin, async (req: Request, res: Response) => {
  try {
    const storage = getSupabaseAdmin();
    if (!storage) return res.json({ success: true, data: [], count: 0 });

    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const { data: files, error } = await storage.storage
      .from('products')
      .list('products', { limit, offset, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) throw error;

    const assets = (files || [])
      .filter((file) => file.name && !file.name.startsWith('.'))
      .map((file) => {
        const path = `products/${file.name}`;
        const { data } = storage.storage.from('products').getPublicUrl(path);
        return {
          name: file.name, path, publicUrl: data.publicUrl,
          createdAt: file.created_at || null, updatedAt: file.updated_at || null,
          sizeBytes: typeof file.metadata?.size === 'number' ? file.metadata.size : null,
          contentType: file.metadata?.mimetype || null,
        };
      });

    res.json({ success: true, data: assets, count: assets.length, limit, offset });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Unable to load media library.' });
  }
});

adminRouter.delete('/media', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const storage = getSupabaseAdmin();
    if (!storage) return res.status(503).json({ success: false, error: 'Supabase not configured.' });

    const path = req.body?.path as string;
    if (!path || !/^products\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/i.test(path)) {
      return res.status(400).json({ success: false, error: 'Invalid media path.' });
    }

    const { error } = await storage.storage.from('products').remove([path]);
    if (error) throw error;

    res.json({ success: true, message: 'Image permanently deleted from storage.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Delete failed.' });
  }
});

// -------------------------------------------------------------
// 2. ADMIN ORDERS MANAGEMENT
// -------------------------------------------------------------
adminRouter.get('/orders', requireAdmin, (req: Request, res: Response) => {
  try {
    const { status, quoteStatus, email, search, startDate, endDate, limit, offset } = req.query;
    const orders = OrderService.getAllOrders({
      status: status as any,
      quoteStatus: quoteStatus as any,
      email: email as string,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.get('/orders/:id', requireAdmin, (req: Request, res: Response) => {
  const order = OrderService.getOrderDetail(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, data: order });
});

adminRouter.patch('/orders/:id/status', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = UpdateOrderStatusSchema.parse(req.body);
    const existing = OrderService.getOrder(req.params.id);
    const previousStatus = existing ? existing.orderStatus : 'UNKNOWN';

    const updated = OrderService.updateStatus(req.params.id, validated.status, validated.note);

    AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'ORDER_STATUS_CHANGED',
      resource: 'ORDER',
      resourceId: updated.orderNumber,
      previousValue: previousStatus,
      newValue: validated.status,
      note: validated.note || `Transitioned status from ${previousStatus} to ${validated.status}`,
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

adminRouter.post('/orders/:id/shipment', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = CreateShipmentSchema.parse(req.body);
    const shipment = await ShippingService.createShipment({
      orderId: req.params.id,
      ...validated,
    });

    AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'SHIPMENT_CREATED',
      resource: 'SHIPMENT',
      resourceId: shipment.id,
      newValue: `${shipment.courier}: ${shipment.trackingNumber}`,
      note: `Shipment booked for order ${req.params.id}`,
    });

    res.status(201).json({ success: true, data: shipment });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

// -------------------------------------------------------------
// 2b. DELIVERY QUOTATION MANAGEMENT
// All routes require admin authentication.
// Business logic is in DeliveryQuoteService — router handles
// HTTP concerns, validation, and audit logging only.
// -------------------------------------------------------------

/**
 * POST /api/admin/orders/:id/quote
 * Admin sets or updates the per-order delivery fee.
 * Fee cannot be negative. Increments quoteVersion, invalidating
 * any prior customer acceptance.
 */
adminRouter.post('/orders/:id/quote', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = SetDeliveryQuoteSchema.parse(req.body);
    const adminId = req.admin?.id || 'admin';

    const existing = OrderService.getOrder(req.params.id);
    const prevFee = existing?.quoteDeliveryFeeNGN;

    const updated = DeliveryQuoteService.setDeliveryQuote(
      req.params.id,
      {
        deliveryFeeNGN: validated.deliveryFeeNGN,
        estimatedTimeframe: validated.estimatedTimeframe,
        internalNote: validated.internalNote,
      },
      adminId
    );

    AuditService.log({
      adminId,
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'DELIVERY_QUOTE_SET',
      resource: 'ORDER',
      resourceId: updated.orderNumber,
      previousValue: prevFee !== undefined ? `₦${prevFee.toLocaleString()}` : 'Not set',
      newValue: `₦${validated.deliveryFeeNGN.toLocaleString()} (v${updated.quoteVersion})`,
      note: `Delivery fee set for order ${updated.orderNumber}`,
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

/**
 * GET /api/admin/orders/:id/quote/whatsapp
 * Returns the WhatsApp URL and pre-filled message for the order.
 * Does NOT mark the quote as sent. Admin must click "Mark Sent" separately.
 */
adminRouter.get('/orders/:id/quote/whatsapp', requireAdmin, (req: Request, res: Response) => {
  try {
    const result = DeliveryQuoteService.generateWhatsAppUrl(req.params.id);
    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/orders/:id/quote/send
 * Admin explicitly marks the delivery quote as sent via WhatsApp.
 * This is NEVER inferred automatically from the URL being opened.
 */
adminRouter.post('/orders/:id/quote/send', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const adminId = req.admin?.id || 'admin';
    const updated = DeliveryQuoteService.markQuoteSent(req.params.id, adminId);

    AuditService.log({
      adminId,
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'DELIVERY_QUOTE_SENT',
      resource: 'ORDER',
      resourceId: updated.orderNumber,
      newValue: 'SENT',
      note: `Delivery quotation manually marked as sent via WhatsApp for order ${updated.orderNumber}`,
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/orders/:id/quote/accept
 * Admin records the customer's WhatsApp acceptance.
 * Snapshots the accepted fee and total. Enables payment.
 */
adminRouter.post('/orders/:id/quote/accept', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const adminId = req.admin?.id || 'admin';
    const updated = DeliveryQuoteService.recordAcceptance(req.params.id, adminId);

    AuditService.log({
      adminId,
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'DELIVERY_QUOTE_ACCEPTED',
      resource: 'ORDER',
      resourceId: updated.orderNumber,
      newValue: `ACCEPTED — Fee: ₦${updated.quoteAcceptedFeeNGN?.toLocaleString()}, Total: ₦${updated.quoteAcceptedTotalNGN?.toLocaleString()}`,
      note: `Customer acceptance recorded for order ${updated.orderNumber}`,
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/orders/:id/quote/reject
 * Admin records the customer's WhatsApp rejection.
 * Order cannot proceed to payment in this state.
 */
adminRouter.post('/orders/:id/quote/reject', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const parsed = RejectQuoteSchema.safeParse(req.body);
    const adminId = req.admin?.id || 'admin';
    const updated = DeliveryQuoteService.recordRejection(req.params.id, adminId);

    AuditService.log({
      adminId,
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'DELIVERY_QUOTE_REJECTED',
      resource: 'ORDER',
      resourceId: updated.orderNumber,
      newValue: 'REJECTED',
      note: parsed.success?.toString() && parsed.data?.reason
        ? `Customer rejected quotation: ${parsed.data.reason}`
        : `Customer rejection recorded for order ${updated.orderNumber}`,
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/orders/:id/rider
 * Admin assigns a manual rider to the order.
 * Payment must be confirmed first.
 */
adminRouter.post('/orders/:id/rider', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = AssignRiderSchema.parse(req.body);
    const adminId = req.admin?.id || 'admin';

    const updated = OrderService.assignRider(
      req.params.id,
      { riderName: validated.riderName, riderPhone: validated.riderPhone },
      adminId
    );

    AuditService.log({
      adminId,
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'RIDER_ASSIGNED',
      resource: 'ORDER',
      resourceId: updated.orderNumber,
      newValue: `${validated.riderName} (${validated.riderPhone})`,
      note: `Rider assigned to order ${updated.orderNumber}`,
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

/**
 * POST /api/admin/orders/:id/dispatch
 * Admin records that the order has been dispatched with the assigned rider.
 */
adminRouter.post('/orders/:id/dispatch', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const parsed = DispatchSchema.safeParse(req.body);
    const adminId = req.admin?.id || 'admin';

    const updated = OrderService.recordDispatch(
      req.params.id,
      { dispatchNote: parsed.success ? parsed.data.dispatchNote : undefined },
      adminId
    );

    AuditService.log({
      adminId,
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'ORDER_DISPATCHED',
      resource: 'ORDER',
      resourceId: updated.orderNumber,
      newValue: updated.orderStatus,
      note: `Order ${updated.orderNumber} dispatched${updated.riderName ? ` with ${updated.riderName}` : ''}`,
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

// -------------------------------------------------------------
// 3. ADMIN PRODUCTS MANAGEMENT
// -------------------------------------------------------------
adminRouter.get('/products', requireAdmin, (req: Request, res: Response) => {
  try {
    const { category, status, search } = req.query;
    const products = ProductService.getAllProducts({
      category: category as string,
      status: status as string,
      search: search as string,
      includeInactive: true,
    });
    res.json({ success: true, count: products.length, data: products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.post('/products', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = CreateProductSchema.parse(req.body);
    assertAuthorizedProductImages(validated.images);
    const created = ProductService.createProduct(validated as any);

    AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'PRODUCT_CREATED',
      resource: 'PRODUCT',
      resourceId: created.id,
      newValue: `${created.name} (₦${created.priceNGN.toLocaleString()})`,
      note: `Added new product with ${created.variants.length} variants`,
    });

    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

adminRouter.patch('/products/:id', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const previous = dbStore.products.get(req.params.id);
    if (!previous) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    if (req.body.images !== undefined) {
      if (!Array.isArray(req.body.images) || !req.body.images.every((image: unknown) => typeof image === 'string')) {
        return res.status(400).json({ success: false, error: 'images must be an array of image URLs.' });
      }
      assertAuthorizedProductImages(req.body.images, previous.images);
    }
    const prevDetails = previous ? `${previous.name} | ₦${previous.priceNGN} | ${previous.status}` : '';

    const updated = ProductService.updateProduct(req.params.id, req.body);

    AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'PRODUCT_UPDATED',
      resource: 'PRODUCT',
      resourceId: updated.id,
      previousValue: prevDetails,
      newValue: `${updated.name} | ₦${updated.priceNGN} | ${updated.status}`,
      note: 'Product updated',
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

adminRouter.delete('/products/:id', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  const previous = dbStore.products.get(req.params.id);
  const success = ProductService.deleteProduct(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  AuditService.log({
    adminId: req.admin?.id || 'admin',
    adminEmail: req.admin?.email || 'admin@piercyn.com',
    action: 'PRODUCT_ARCHIVED',
    resource: 'PRODUCT',
    resourceId: req.params.id,
    previousValue: previous?.name,
    newValue: 'ARCHIVED',
    note: 'Product moved to archive',
  });

  res.json({ success: true, message: 'Product archived successfully' });
});

// -------------------------------------------------------------
// 3b. ADMIN CATEGORY MANAGEMENT
// -------------------------------------------------------------

// GET /api/admin/categories — list all categories with product counts
adminRouter.get('/categories', requireAdmin, (_req: Request, res: Response) => {
  try {
    const includeInactive = (_req.query.includeInactive as string) === 'true';
    const categories = ProductService.getCategories(includeInactive);
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/categories — create a new category
adminRouter.post('/categories', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = CreateCategorySchema.parse(req.body);
    const created = ProductService.createCategory({
      ...validated,
      slug: validated.slug || undefined,
      imageUrl: validated.imageUrl || undefined,
    });

    AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'CATEGORY_CREATED',
      resource: 'PRODUCT',
      resourceId: created.id,
      newValue: `${created.name} (/${created.slug})`,
      note: 'New product category created',
    });

    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

// PATCH /api/admin/categories/:id — update a category
adminRouter.patch('/categories/:id', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const previous = dbStore.categories.get(req.params.id);
    if (!previous) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const validated = UpdateCategorySchema.parse(req.body);
    const updated = ProductService.updateCategory(req.params.id, {
      ...validated,
      slug: validated.slug || undefined,
      imageUrl: validated.imageUrl || undefined,
    });

    AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'CATEGORY_UPDATED',
      resource: 'PRODUCT',
      resourceId: updated.id,
      previousValue: previous.name,
      newValue: `${updated.name} (isActive: ${updated.isActive})`,
      note: 'Category details updated',
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

// DELETE /api/admin/categories/:id — deactivate a category (blocks if products assigned)
adminRouter.delete('/categories/:id', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const previous = dbStore.categories.get(req.params.id);
    if (!previous) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    // force=true allows deactivating a category that still has products assigned
    const force = req.query.force === 'true';
    const result = ProductService.deactivateCategory(req.params.id, force);

    AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'CATEGORY_DEACTIVATED',
      resource: 'PRODUCT',
      resourceId: req.params.id,
      previousValue: 'ACTIVE',
      newValue: 'INACTIVE',
      note: `Category "${previous.name}" deactivated${force ? ' (forced)' : ''}`,
    });

    res.json({ success: result.success, message: result.message });
  } catch (err: any) {
    // If the error is a product-count blocking error, return 409 Conflict
    const isConflict = err.message?.includes('active product');
    res.status(isConflict ? 409 : 400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 4. ADMIN INVENTORY MANAGEMENT
// -------------------------------------------------------------
adminRouter.get('/inventory', requireAdmin, (req: Request, res: Response) => {
  try {
    const { lowStockOnly, outOfStockOnly, search } = req.query;
    const inventory = InventoryService.getAllInventory({
      lowStockOnly: lowStockOnly === 'true',
      outOfStockOnly: outOfStockOnly === 'true',
      search: search as string,
    });
    res.json({ success: true, count: inventory.length, data: inventory });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.post('/inventory/adjust', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = InventoryAdjustmentSchema.parse(req.body);
    const inv = dbStore.inventory.get(validated.variantId);
    const prevAvailable = inv ? inv.availableStock : 0;

    const success = InventoryService.adjustStock(
      validated.variantId,
      validated.quantity,
      validated.type,
      validated.reference,
      validated.reason
    );

    const newAvailable = inv ? inv.availableStock : prevAvailable + validated.quantity;

    AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: validated.type === 'PURCHASE' ? 'STOCK_RESTOCKED' : 'STOCK_ADJUSTED',
      resource: 'INVENTORY',
      resourceId: validated.variantId,
      previousValue: `${prevAvailable} available`,
      newValue: `${newAvailable} available (${validated.quantity > 0 ? '+' : ''}${validated.quantity} ${validated.type})`,
      note: validated.reason || `Reference: ${validated.reference}`,
    });

    res.json({ success, message: 'Inventory adjusted successfully' });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

adminRouter.get('/inventory/history', requireAdmin, (req: Request, res: Response) => {
  try {
    const { variantId, limit } = req.query;
    const ledger = InventoryService.getLedger(
      variantId as string,
      limit ? parseInt(limit as string, 10) : 100
    );
    res.json({ success: true, count: ledger.length, data: ledger });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. ADMIN CUSTOMERS
// -------------------------------------------------------------
adminRouter.get('/customers', requireAdmin, (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const customers = CustomerService.getAllCustomers({ search: search as string });

    // Enrich with order statistics
    const enriched = customers.map((c) => {
      const customerOrders = Array.from(dbStore.orders.values()).filter(
        (o) => o.customerEmail.toLowerCase() === c.email.toLowerCase()
      );
      const totalSpent = customerOrders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + o.totalNGN, 0);
      const lastOrder = customerOrders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      return {
        ...c,
        orderCount: customerOrders.length,
        totalSpentNGN: totalSpent,
        lastOrderDate: lastOrder ? lastOrder.createdAt : null,
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.get('/customers/:id', requireAdmin, (req: Request, res: Response) => {
  const customer = CustomerService.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  // Get orders linked to this customer
  const orders = Array.from(dbStore.orders.values()).filter(
    (o) => o.customerEmail.toLowerCase() === customer.email.toLowerCase()
  );

  const totalSpent = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalNGN, 0);

  const addresses = Array.from(dbStore.addresses.values()).filter(
    (a) => a.customerId === customer.id
  );

  res.json({
    success: true,
    data: {
      ...customer,
      addresses,
      orders,
      totalOrders: orders.length,
      totalSpentNGN: totalSpent,
    },
  });
});

// -------------------------------------------------------------
// 6. ADMIN ANALYTICS & FINANCIAL DASHBOARD
// -------------------------------------------------------------
adminRouter.get('/analytics', requireAdmin, (_req: Request, res: Response) => {
  try {
    const summary = AnalyticsService.getAnalyticsSummary();
    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 7. OPERATIONAL ALERTS & NOTIFICATIONS
// -------------------------------------------------------------
adminRouter.get('/alerts', requireAdmin, (_req: Request, res: Response) => {
  try {
    const threshold = storeSettingsState.lowStockThreshold;
    const lowStockVariants: any[] = [];
    const outOfStockVariants: any[] = [];

    for (const [variantId, inv] of dbStore.inventory.entries()) {
      const variant = dbStore.variants.get(variantId);
      const product = variant ? dbStore.products.get(variant.productId) : null;
      if (!variant || !product) continue;

      if (inv.availableStock === 0) {
        outOfStockVariants.push({
          variantId,
          sku: variant.sku,
          productName: product.name,
          colour: variant.colour,
          size: variant.size,
          availableStock: 0,
        });
      } else if (inv.availableStock <= threshold) {
        lowStockVariants.push({
          variantId,
          sku: variant.sku,
          productName: product.name,
          colour: variant.colour,
          size: variant.size,
          availableStock: inv.availableStock,
        });
      }
    }

    const orders = Array.from(dbStore.orders.values());
    const ordersNeedingAttention = orders.filter(
      (o) => o.paymentStatus === 'PAID' && (o.orderStatus === 'PAID' || o.orderStatus === 'PROCESSING')
    );
    const pendingPaymentOrders = orders.filter((o) => o.paymentStatus === 'PENDING');

    const totalCount =
      lowStockVariants.length +
      outOfStockVariants.length +
      ordersNeedingAttention.length;

    res.json({
      success: true,
      data: {
        totalAlertsCount: totalCount,
        lowStockVariants,
        outOfStockVariants,
        ordersNeedingAttention,
        pendingPaymentOrders,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 8. UNIVERSAL ADMIN SEARCH
// -------------------------------------------------------------
adminRouter.get('/search', requireAdmin, (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase();
    if (!q) {
      return res.json({ success: true, data: { orders: [], customers: [], products: [] } });
    }

    // Search Orders
    const orders = Array.from(dbStore.orders.values())
      .filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.items.some((i) => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
      )
      .slice(0, 10);

    // Search Customers
    const customers = Array.from(dbStore.customers.values())
      .filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      )
      .slice(0, 10);

    // Search Products & Variants
    const products = Array.from(dbStore.products.values())
      .filter((p) => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCategory = p.categoryId.toLowerCase().includes(q);
        const hasVariantSku = Array.from(dbStore.variants.values())
          .filter((v) => v.productId === p.id)
          .some((v) => v.sku.toLowerCase().includes(q));
        return matchesName || matchesCategory || hasVariantSku;
      })
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        orders,
        customers,
        products,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 9. AUDIT LOGS
// -------------------------------------------------------------
adminRouter.get('/audit-logs', requireAdmin, (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const resource = req.query.resource as string;
    const logs = AuditService.getLogs(limit, resource);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 10. ADMIN SETTINGS
// -------------------------------------------------------------
adminRouter.get('/settings', requireAdmin, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: storeSettingsState,
  });
});

adminRouter.patch('/settings', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const {
      storeName,
      tagline,
      atelierAddress,
      supportEmail,
      supportPhone,
      freeShippingThresholdNGN,
      lagosDeliveryFeeNGN,
      nationwideDeliveryFeeNGN,
      lowStockThreshold,
    } = req.body;

    if (storeName !== undefined) storeSettingsState.storeName = storeName;
    if (tagline !== undefined) storeSettingsState.tagline = tagline;
    if (atelierAddress !== undefined) storeSettingsState.atelierAddress = atelierAddress;
    if (supportEmail !== undefined) storeSettingsState.supportEmail = supportEmail;
    if (supportPhone !== undefined) storeSettingsState.supportPhone = supportPhone;
    if (freeShippingThresholdNGN !== undefined)
      storeSettingsState.freeShippingThresholdNGN = Number(freeShippingThresholdNGN);
    if (lagosDeliveryFeeNGN !== undefined)
      storeSettingsState.lagosDeliveryFeeNGN = Number(lagosDeliveryFeeNGN);
    if (nationwideDeliveryFeeNGN !== undefined)
      storeSettingsState.nationwideDeliveryFeeNGN = Number(nationwideDeliveryFeeNGN);
    if (lowStockThreshold !== undefined)
      storeSettingsState.lowStockThreshold = Number(lowStockThreshold);

    AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'SETTINGS_UPDATED',
      resource: 'SETTINGS',
      resourceId: 'store-settings',
      note: 'Store operations configuration modified',
    });

    res.json({ success: true, data: storeSettingsState });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 11. CYCLE 1 SEED ORDERS HELPER (Operations initialization)
// -------------------------------------------------------------
adminRouter.post('/seed-sample-orders', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const products = Array.from(dbStore.products.values());
    if (products.length === 0) {
      return res.status(400).json({ success: false, error: 'No products available to seed orders' });
    }

    const seededOrders: DbOrder[] = [];
    const now = new Date();

    const sampleOrdersData: Array<{
      orderNumber: string;
      customer: { fullName: string; email: string; phone: string; address: string; city: string; state: string };
      itemsCount: number;
      status: OrderStatusType;
      paymentStatus: 'PENDING' | 'PAID';
      paymentMethod: string;
      courier?: string;
      trackingNumber?: string;
      daysAgo: number;
    }> = [
      {
        orderNumber: 'PCY-2601',
        customer: {
          fullName: 'Chuka Ekwueme',
          email: 'chuka.ekwueme@gmail.com',
          phone: '+2348033112244',
          address: '42 Adeola Odeku Street',
          city: 'Victoria Island',
          state: 'Lagos State',
        },
        itemsCount: 2,
        status: 'DELIVERED' as const,
        paymentStatus: 'PAID' as const,
        paymentMethod: 'Paystack Card (Mastercard •••• 4242)',
        courier: 'KWIK Express Dispatch',
        trackingNumber: 'KWK-LAG-88912',
        daysAgo: 3,
      },
      {
        orderNumber: 'PCY-2602',
        customer: {
          fullName: 'Zainab Bello',
          email: 'zainab.bello@lagosatelier.ng',
          phone: '+2348124455667',
          address: '18 Glover Road',
          city: 'Ikoyi',
          state: 'Lagos State',
        },
        itemsCount: 1,
        status: 'PROCESSING' as const,
        paymentStatus: 'PAID' as const,
        paymentMethod: 'Direct Bank Transfer (Access Bank)',
        daysAgo: 1,
      },
      {
        orderNumber: 'PCY-2603',
        customer: {
          fullName: 'Oluwaseun Vance',
          email: 'vance.seun@outlook.com',
          phone: '+2347068899001',
          address: 'Block 4, Flat 12, 1004 Estate',
          city: 'Victoria Island',
          state: 'Lagos State',
        },
        itemsCount: 3,
        status: 'PACKED' as const,
        paymentStatus: 'PAID' as const,
        paymentMethod: 'Paystack Card (Visa •••• 1122)',
        courier: 'GIG Logistics',
        trackingNumber: 'GIG-NGN-004519',
        daysAgo: 0,
      },
      {
        orderNumber: 'PCY-2604',
        customer: {
          fullName: 'Emeka Nwosu',
          email: 'emeka.nwosu@techhub.africa',
          phone: '+2348189922110',
          address: 'Plot 7 Admiralty Road',
          city: 'Lekki Phase 1',
          state: 'Lagos State',
        },
        itemsCount: 1,
        status: 'PENDING_PAYMENT' as const,
        paymentStatus: 'PENDING' as const,
        paymentMethod: 'Direct Bank Transfer',
        daysAgo: 0,
      },
    ];

    sampleOrdersData.forEach((sample, idx) => {
      // Don't re-seed if order number already exists
      if (dbStore.orderNumberIndex.has(sample.orderNumber)) {
        return;
      }

      const p = products[idx % products.length];
      const variants = Array.from(dbStore.variants.values()).filter((v) => v.productId === p.id);
      const v = variants[0] || {
        id: `var-${p.id}`,
        sku: `PCY-${p.id}-BLK-M`,
        size: 'M',
        colour: 'Onyx Black',
        costPriceNGN: p.costPriceNGN,
      };

      const orderDate = new Date(now.getTime() - sample.daysAgo * 86400000).toISOString();
      const orderId = `ord-seed-${Date.now()}-${idx}`;

      const items = [
        {
          id: `item-${orderId}-1`,
          orderId,
          variantId: v.id,
          productId: p.id,
          productName: p.name,
          sku: v.sku,
          category: p.categoryId.replace('cat-', '').toUpperCase(),
          colour: v.colour,
          size: v.size,
          unitPriceNGN: p.priceNGN,
          costPriceNGN: p.costPriceNGN,
          totalPriceNGN: p.priceNGN * sample.itemsCount,
          image: p.images[0] || '',
          quantity: sample.itemsCount,
          createdAt: orderDate,
        },
      ];

      const subtotal = p.priceNGN * sample.itemsCount;
      const deliveryFee = subtotal >= storeSettingsState.freeShippingThresholdNGN ? 0 : storeSettingsState.lagosDeliveryFeeNGN;
      const totalNGN = subtotal + deliveryFee;

      const order: DbOrder = {
        id: orderId,
        orderNumber: sample.orderNumber,
        customerName: sample.customer.fullName,
        customerEmail: sample.customer.email,
        customerPhone: sample.customer.phone,
        shippingAddressLine: sample.customer.address,
        shippingCity: sample.customer.city,
        shippingState: sample.customer.state,
        shippingCountry: 'Nigeria',
        subtotalNGN: subtotal,
        deliveryFeeNGN: deliveryFee,
        discountNGN: 0,
        totalNGN,
        currency: 'NGN',
        shippingMethodKey: 'lagos',
        shippingMethodName: 'Lagos Atelier Dispatch',
        paymentMethod: sample.paymentMethod,
        paymentStatus: sample.paymentStatus,
        orderStatus: sample.status,
        paidAt: sample.paymentStatus === 'PAID' ? orderDate : undefined,
        quoteStatus: sample.paymentStatus === 'PAID' ? 'ACCEPTED' : 'PENDING',
        quoteVersion: 1,
        quoteDeliveryFeeNGN: deliveryFee,
        quoteTotalNGN: totalNGN,
        timeline: [
          { status: 'PENDING_PAYMENT', timestamp: orderDate, note: 'Order placed by client' },
          ...(sample.paymentStatus === 'PAID'
            ? [{ status: 'PAID' as const, timestamp: orderDate, note: `Payment verified via ${sample.paymentMethod}` }]
            : []),
          ...(sample.status === 'PROCESSING' || sample.status === 'PACKED' || sample.status === 'SHIPPED' || sample.status === 'DELIVERED'
            ? [{ status: 'PROCESSING' as const, timestamp: orderDate, note: 'Atelier fulfillment started' }]
            : []),
          ...(sample.status === 'PACKED' || sample.status === 'SHIPPED' || sample.status === 'DELIVERED'
            ? [{ status: 'PACKED' as const, timestamp: orderDate, note: 'Packed and verified in atelier gift box' }]
            : []),
          ...(sample.status === 'SHIPPED' || sample.status === 'DELIVERED'
            ? [{ status: 'SHIPPED' as const, timestamp: orderDate, note: `Handed to ${sample.courier} (Tracking: ${sample.trackingNumber})` }]
            : []),
          ...(sample.status === 'DELIVERED'
            ? [{ status: 'DELIVERED' as const, timestamp: orderDate, note: 'Delivered and signed by recipient' }]
            : []),
        ],
        createdAt: orderDate,
        updatedAt: orderDate,
        items,
      };

      dbStore.orders.set(orderId, order);
      dbStore.orderNumberIndex.set(order.orderNumber, orderId);

      // Link or create customer
      dbStore.findOrCreateCustomer({
        email: sample.customer.email,
        fullName: sample.customer.fullName,
        phone: sample.customer.phone,
        address: {
          addressLine: sample.customer.address,
          city: sample.customer.city,
          state: sample.customer.state,
        },
      });

      // If courier tracking provided, create shipment record
      if (sample.courier && sample.trackingNumber) {
        dbStore.createShipment({
          orderId,
          courier: sample.courier,
          trackingNumber: sample.trackingNumber,
          deliveryFeeNGN: deliveryFee,
          deliveryAddress: `${sample.customer.address}, ${sample.customer.city}, ${sample.customer.state}`,
          recipientName: sample.customer.fullName,
          recipientPhone: sample.customer.phone,
        });
      }

      // Deduct stock if paid
      if (sample.paymentStatus === 'PAID') {
        const inv = dbStore.inventory.get(v.id);
        if (inv) {
          inv.availableStock = Math.max(1, inv.availableStock - sample.itemsCount);
          inv.soldStock += sample.itemsCount;
        }
      }

      seededOrders.push(order);
    });

    AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'SEEDED_CYCLE1_ORDERS',
      resource: 'ORDER',
      resourceId: 'BATCH_SEED',
      note: `Seeded ${seededOrders.length} realistic Cycle 1 validation orders`,
    });

    res.json({
      success: true,
      message: `Seeded ${seededOrders.length} validation orders`,
      data: seededOrders,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// ADMIN REVIEW MANAGEMENT
// All endpoints require admin authentication.
// ============================================================

const ModerateReviewSchema = z.object({
  action: z.enum(['PUBLISH', 'HIDE', 'REJECT', 'RESTORE']),
  note: z.string().max(500).optional(),
});

// GET /api/admin/reviews — List reviews with filters & metrics
adminRouter.get('/reviews', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { page, limit, status, rating, productId, search } = req.query;
    const result = await ReviewService.adminListReviews({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      status: status as string | undefined,
      rating: rating ? parseInt(rating as string, 10) : undefined,
      productId: productId as string | undefined,
      search: search as string | undefined,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch reviews.' });
  }
});

// GET /api/admin/reviews/:reviewId — Get full review detail
adminRouter.get('/reviews/:reviewId', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const result = await ReviewService.adminListReviews({ search: req.params.reviewId });
    // Find the specific review by ID
    const review = result.reviews.find((r) => r.id === req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }
    res.json({ success: true, data: review });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch review.' });
  }
});

// POST /api/admin/reviews/:reviewId/moderate — Publish, hide, reject, or restore a review
adminRouter.post('/reviews/:reviewId/moderate', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const parsed = ModerateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid moderation action.' });
    }
    const { action, note } = parsed.data;
    const adminId = req.admin?.id || 'admin';
    const updated = await ReviewService.adminModerateReview(req.params.reviewId, adminId, action, note);
    res.json({
      success: true,
      message: `Review ${action.toLowerCase()}ed successfully.`,
      data: updated,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Moderation action failed.' });
  }
});
