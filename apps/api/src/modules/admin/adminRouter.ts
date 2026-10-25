import { Router, Request, Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AdminAuthService } from './adminAuthService';
import { requireAdmin, AuthenticatedAdminRequest } from './adminMiddleware';
import { OrderService } from '../orders/orderService';
import { DeliveryQuoteService } from '../orders/deliveryQuoteService';
import { PaymentService } from '../payments/paymentService';
import { ProductService } from '../products/productService';
import { InventoryService } from '../inventory/inventoryService';
import { CustomerService } from '../customers/customerService';
import { ShippingService } from '../shipping/shippingService';
import { AnalyticsService } from '../analytics/analyticsService';
import { AuditService } from './auditService';
import { affiliateAdminRouter } from '../affiliate/affiliateAdminRouter';
import { ReviewService } from '../reviews/reviewService';
import { getLowStockThreshold, isValidLowStockThreshold, saveLowStockThreshold } from './storeSettingsService';
import { COMMERCE_CONFIG } from '../../config/constants';
import { prisma } from '../../db/prisma';
import { z } from 'zod';
import { commitProductCsv, createProductCsvTemplate, productRowsToCsv, validateProductCsv } from './bulkProductService';

// Storage is optional for API boot. Create the privileged client only on upload requests.
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to upload images.');
  }

  supabaseAdmin = createClient(url, serviceRoleKey);
  return supabaseAdmin;
}

export const adminRouter = Router();

adminRouter.use('/affiliates', affiliateAdminRouter);

export const storeSettingsState = {
  storeName: 'PIERCYN',
  tagline: 'Look Good. Spend Less.',
  atelierAddress: '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
  supportEmail: 'director@piercyn.com',
  supportPhone: '+2348076431059',
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

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function hasExpectedImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === 'image/gif') return buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'));
  if (mimeType === 'image/webp') return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

const UploadImageSchema = z.object({
  fileBase64: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string(),
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


const CreateVariantSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().trim().min(1).max(100).optional(),
  size: z.string().trim().min(1).max(30),
  colour: z.string().trim().min(1).max(60),
  colourHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  priceNGN: z.number().int().positive().optional(),
  priceUSD: z.number().int().positive().optional(),
  priceGBP: z.number().int().positive().optional(),
  priceEUR: z.number().int().positive().optional(),
  costPriceNGN: z.number().int().nonnegative().optional(),
  image: z.string().url().optional().or(z.literal('')),
  altImage: z.string().url().optional().or(z.literal('')),
  initialStock: z.number().int().nonnegative().default(0),
});
const UpdateVariantSchema = z.object({
  sku: z.string().trim().min(1).max(100).optional(),
  size: z.string().trim().min(1).max(30).optional(),
  colour: z.string().trim().min(1).max(60).optional(),
  colourHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  priceNGN: z.number().int().positive().nullable().optional(),
  priceUSD: z.number().int().positive().nullable().optional(),
  priceGBP: z.number().int().positive().nullable().optional(),
  priceEUR: z.number().int().positive().nullable().optional(),
  costPriceNGN: z.number().int().nonnegative().nullable().optional(),
  image: z.string().url().nullable().optional().or(z.literal('')),
  altImage: z.string().url().nullable().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one variant field to update');


const CreateCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  sortOrder: z.number().int().nonnegative().optional(),
});

const BulkProductSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(100),
  operation: z.enum(['SET_CATEGORY', 'SET_STATUS', 'ADJUST_PRICE']),
  categoryId: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
  priceAdjustment: z.object({
    type: z.enum(['FIXED', 'PERCENTAGE']),
    amount: z.number().finite(),
  }).optional(),
}).superRefine((value, context) => {
  if (value.operation === 'SET_CATEGORY' && !value.categoryId) context.addIssue({ code: 'custom', message: 'A category is required.' });
  if (value.operation === 'SET_STATUS' && !value.status) context.addIssue({ code: 'custom', message: 'A status is required.' });
  if (value.operation === 'ADJUST_PRICE' && !value.priceAdjustment) context.addIssue({ code: 'custom', message: 'A price adjustment is required.' });
});

const CsvImportSchema = z.object({
  csvText: z.string().min(1).max(750_000),
  mode: z.enum(['CREATE', 'UPDATE']),
  allowPublish: z.boolean().optional(),
});

const PermanentDeleteSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(25),
  confirmation: z.string().min(1),
});
const UpdateCategorySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  slug: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  sortOrder: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one category field to update');

const InventoryAdjustmentSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int(),
  type: z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'DAMAGE', 'RETURN', 'RESTOCK', 'SET_EXACT']),
  reference: z.string().min(1),
  reason: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === 'ADJUSTMENT' || data.type === 'SET_EXACT') {
      return data.quantity >= 0;
    }
    return data.quantity > 0;
  },
  { message: 'Quantity must be non-negative for set/adjust, and positive for restock/damage/return.' }
);

const BulkInventoryAdjustmentSchema = z.object({
  items: z.array(
    z.object({
      variantId: z.string().min(1),
      quantity: z.number().int(),
      type: z.enum(['PURCHASE', 'DAMAGE', 'ADJUSTMENT', 'SET_EXACT', 'RESTOCK', 'RETURN']),
      reference: z.string().optional(),
      reason: z.string().optional(),
    })
  ).min(1).max(200),
});
const RestockAllSchema = z.object({
  quantity: z.number().int().min(1).max(100_000),
  reference: z.string().trim().max(120).optional(),
  reason: z.string().trim().max(500).optional(),
});

// 1. AUTH
adminRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const validated = AdminLoginSchema.parse(req.body);
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'global';
    const result = await AdminAuthService.login(validated.email, validated.password, ip);

    await AuditService.log({
      adminId: result.admin.id,
      adminEmail: result.admin.email,
      action: 'LOGIN',
      resource: 'SETTINGS',
      resourceId: result.admin.id,
      note: `Admin logged in successfully from IP: ${ip}`,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.issues[0]?.message || 'Invalid login request.' });
    }

    const msg = err instanceof Error ? err.message : 'Admin login failed.';
    if (msg === 'Invalid administrative credentials or insufficient permissions') {
      return res.status(401).json({ success: false, error: msg });
    }
    if (msg.startsWith('Account temporarily locked.')) {
      return res.status(429).json({ success: false, error: msg });
    }

    console.error('[ADMIN_LOGIN_ERROR]', err);
    return res.status(503).json({
      success: false,
      error: 'Admin authentication service is temporarily unavailable. Please try again later.',
    });
  }
});

adminRouter.get('/auth/me', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  res.json({ success: true, data: req.admin });
});

adminRouter.post('/auth/logout', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const token =
    (req.headers['authorization']?.replace('Bearer ', '') ||
      req.headers['x-admin-token'] ||
      req.headers['x-auth-token']) as string;
  await AdminAuthService.logout(token);

  if (req.admin) {
    await AuditService.log({
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

// 1b. IMAGE UPLOAD (proxied via service-role to bypass RLS)
adminRouter.post('/upload-image', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { fileBase64, mimeType } = UploadImageSchema.parse(req.body);

    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return res.status(400).json({ success: false, error: 'Only JPEG, PNG, WebP, and GIF images are supported.' });
    }

    // Strip data URI prefix if present (e.g. "data:image/png;base64,")
    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data) || base64Data.length % 4 !== 0) {
      return res.status(400).json({ success: false, error: 'The image payload is not valid base64 data.' });
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

    const storage = getSupabaseAdmin();
    const { error } = await storage.storage
      .from('products')
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,
      });

    if (error) {
      console.error('[UPLOAD_IMAGE]', error);
      return res.status(500).json({ success: false, error: `Image upload failed: ${error.message}` });
    }

    const { data } = storage.storage.from('products').getPublicUrl(filePath);

    if (!data?.publicUrl) {
      return res.status(500).json({ success: false, error: 'Could not retrieve public URL after upload.' });
    }

    res.json({ success: true, data: { publicUrl: data.publicUrl } });
  } catch (err: any) {
    console.error('[UPLOAD_IMAGE]', err);
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    res.status(err instanceof z.ZodError ? 400 : 500).json({ success: false, error: message });
  }
});


adminRouter.get('/media', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const storage = getSupabaseAdmin();
    const { data: files, error } = await storage.storage.from('products').list('products', {
      limit, offset, sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) throw error;
    const assets = (files || []).filter((file) => file.name && !file.name.startsWith('.')).map((file) => {
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
    const path = z.string().regex(/^products\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/i, 'Invalid media path.').parse(req.body?.path);
    const storage = getSupabaseAdmin();
    const { data: urlData } = storage.storage.from('products').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    const [productReference, variantReference] = await Promise.all([
      prisma.product.findFirst({ where: { images: { has: publicUrl } }, select: { id: true, name: true } }),
      prisma.productVariant.findFirst({ where: { OR: [{ image: publicUrl }, { altImage: publicUrl }] }, select: { id: true, sku: true } }),
    ]);
    if (productReference || variantReference) {
      return res.status(409).json({ success: false, error: 'This image is still used by a product or variant. Remove it from the product first, then delete the unused asset.' });
    }
    const { error } = await storage.storage.from('products').remove([path]);
    if (error) throw error;
    await AuditService.log({
      adminId: req.admin?.id || 'admin', adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'MEDIA_DELETED', resource: 'PRODUCT', resourceId: path,
      previousValue: publicUrl, note: 'Unused product image removed from storage',
    });
    res.json({ success: true, message: 'Image permanently deleted from storage.' });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    res.status(err instanceof z.ZodError ? 400 : 500).json({ success: false, error: message });
  }
});

// 2. ORDERS
adminRouter.get('/orders', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, email, search, startDate, endDate, limit, offset } = req.query;
    const orders = await OrderService.getAllOrders({
      status: status as any,
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

adminRouter.get('/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  const order = await OrderService.getOrderDetail(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, data: order });
});

adminRouter.get('/orders/:orderNumber/payment-receipt', requireAdmin, async (req: Request, res: Response) => {
  try {
    const receipt = await PaymentService.getReceiptForAdmin(req.params.orderNumber);
    res.json({ success: true, data: receipt });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

adminRouter.post('/orders/:orderNumber/payment/approve', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const input = z.object({ note: z.string().trim().max(500).optional() }).parse(req.body ?? {});
    const result = await PaymentService.approvePayment(
      req.params.orderNumber,
      req.admin?.id || 'admin',
      req.admin?.email || 'admin@piercyn.com',
      input.note
    );
    await AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'PAYMENT_APPROVED',
      resource: 'ORDER',
      resourceId: result.orderNumber,
      previousValue: 'AWAITING_PAYMENT_VERIFICATION',
      newValue: 'PAID',
      note: input.note || 'Bank-transfer receipt verified and payment approved.',
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    res.status(400).json({ success: false, error: message });
  }
});

adminRouter.post('/orders/:orderNumber/payment/reject', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const input = z.object({ reason: z.string().trim().min(5).max(500) }).parse(req.body);
    const result = await PaymentService.rejectPayment(
      req.params.orderNumber,
      req.admin?.id || 'admin',
      req.admin?.email || 'admin@piercyn.com',
      input.reason
    );
    await AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'PAYMENT_REJECTED',
      resource: 'ORDER',
      resourceId: result.orderNumber,
      previousValue: 'AWAITING_PAYMENT_VERIFICATION',
      newValue: result.orderStatus,
      note: `Receipt rejected: ${input.reason}`,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    res.status(400).json({ success: false, error: message });
  }
});

const SetDeliveryQuoteSchema = z.object({
  deliveryFeeNGN: z.number().int().min(0, 'Delivery fee must be a non-negative integer'),
  estimatedDeliveryTimeframe: z.string().trim().max(200).optional(),
  internalNote: z.string().trim().max(1000).optional(),
});

const RejectQuoteSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

const AssignRiderSchema = z.object({
  riderName: z.string().trim().min(1, 'Rider name is required'),
  riderPhone: z.string().trim().min(5, 'Rider phone number is required'),
  note: z.string().trim().max(500).optional(),
});

const DispatchOrderSchema = z.object({
  riderName: z.string().trim().optional(),
  riderPhone: z.string().trim().optional(),
  dispatchNote: z.string().trim().max(500).optional(),
  note: z.string().trim().max(500).optional(),
});

/**
 * POST /api/admin/orders/:id/quote
 * Admin sets or updates the per-order delivery fee.
 * Server validates amount and recalculates authoritative total.
 * Every change increments quoteVersion and invalidates prior acceptance.
 */
adminRouter.post('/orders/:id/quote', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = SetDeliveryQuoteSchema.parse(req.body);
    const adminId = req.admin?.id || 'admin';
    const adminEmail = req.admin?.email || 'admin@piercyn.com';

    const existing = await OrderService.getOrder(req.params.id);
    const prevFee = existing?.quoteDeliveryFeeNGN ?? existing?.deliveryFeeNGN;

    const updated = await DeliveryQuoteService.setDeliveryQuote(
      req.params.id,
      {
        deliveryFeeNGN: validated.deliveryFeeNGN,
        estimatedTimeframe: validated.estimatedDeliveryTimeframe,
        internalNote: validated.internalNote,
      },
      adminId
    );

    await AuditService.log({
      adminId,
      adminEmail,
      action: 'DELIVERY_QUOTE_SET',
      resourceType: 'ORDER',
      resourceId: updated.orderNumber,
      oldValue: prevFee !== undefined && prevFee !== null ? `₦${prevFee.toLocaleString()}` : 'Not set',
      newValue: `₦${validated.deliveryFeeNGN.toLocaleString()} (v${updated.quoteVersion})`,
    });

    const detailed = await OrderService.getOrderDetail(updated.id);
    res.json({ success: true, data: detailed });
  } catch (err: any) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

/**
 * GET /api/admin/orders/:id/quote/whatsapp
 * Generates the personalised WhatsApp message and wa.me click-to-chat URL.
 * Does NOT mark the quote as sent.
 */
adminRouter.get('/orders/:id/quote/whatsapp', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await DeliveryQuoteService.generateWhatsAppUrl(req.params.id);
    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json({
      success: true,
      data: {
        whatsappUrl: result.url,
        message: result.message,
        customerPhone: result.phone,
        quoteVersion: result.quoteVersion,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/orders/:id/quote/send
 * Admin explicitly marks the quote as sent via WhatsApp.
 */
adminRouter.post('/orders/:id/quote/send', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const adminId = req.admin?.id || 'admin';
    const adminEmail = req.admin?.email || 'admin@piercyn.com';

    const updated = await DeliveryQuoteService.markQuoteSent(req.params.id, adminId);

    await AuditService.log({
      adminId,
      adminEmail,
      action: 'DELIVERY_QUOTE_SENT',
      resourceType: 'ORDER',
      resourceId: updated.orderNumber,
      newValue: 'SENT',
    });

    const detailed = await OrderService.getOrderDetail(updated.id);
    res.json({ success: true, data: detailed });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/orders/:id/quote/accept
 * Admin records customer acceptance via WhatsApp.
 * Snapshots agreed fee and total, and unlocks order for payment.
 */
adminRouter.post('/orders/:id/quote/accept', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const adminId = req.admin?.id || 'admin';
    const adminEmail = req.admin?.email || 'admin@piercyn.com';

    const updated = await DeliveryQuoteService.recordAcceptance(req.params.id, adminId);

    await AuditService.log({
      adminId,
      adminEmail,
      action: 'DELIVERY_QUOTE_ACCEPTED',
      resourceType: 'ORDER',
      resourceId: updated.orderNumber,
      newValue: `ACCEPTED (Fee: ₦${updated.quoteAcceptedFeeNGN?.toLocaleString()}, Total: ₦${updated.quoteAcceptedTotalNGN?.toLocaleString()})`,
    });

    const detailed = await OrderService.getOrderDetail(updated.id);
    res.json({ success: true, data: detailed });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/orders/:id/quote/reject
 * Admin records customer rejection via WhatsApp.
 */
adminRouter.post('/orders/:id/quote/reject', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const parsed = RejectQuoteSchema.safeParse(req.body);
    const reason = parsed.success ? parsed.data.reason : undefined;
    const adminId = req.admin?.id || 'admin';
    const adminEmail = req.admin?.email || 'admin@piercyn.com';

    const updated = await DeliveryQuoteService.recordRejection(req.params.id, adminId, reason);

    await AuditService.log({
      adminId,
      adminEmail,
      action: 'DELIVERY_QUOTE_REJECTED',
      resourceType: 'ORDER',
      resourceId: updated.orderNumber,
      newValue: reason ? `REJECTED: ${reason}` : 'REJECTED',
    });

    const detailed = await OrderService.getOrderDetail(updated.id);
    res.json({ success: true, data: detailed });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/orders/:id/payment/whatsapp
 * Generate the Kuda bank-transfer payment instructions WhatsApp URL.
 * Only allowed once the customer has accepted the delivery quotation.
 * Does NOT mark payment as sent or order as paid.
 */
adminRouter.get('/orders/:id/payment/whatsapp', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await DeliveryQuoteService.generateWhatsAppPaymentUrl(req.params.id);
    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json({
      success: true,
      data: {
        whatsappUrl: result.url,
        message: result.message,
        customerPhone: result.phone,
        quoteVersion: result.quoteVersion,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/orders/:id/payment/whatsapp/sent
 * Admin explicitly records that Kuda payment instructions were sent via WhatsApp.
 * Does NOT mark payment as confirmed or order as paid.
 */
adminRouter.post('/orders/:id/payment/whatsapp/sent', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const adminId = req.admin?.id || 'admin';
    const adminEmail = req.admin?.email || 'admin@piercyn.com';

    const order = await DeliveryQuoteService.markPaymentInstructionsSent(req.params.id, adminId);

    await AuditService.log({
      adminId,
      adminEmail,
      action: 'PAYMENT_INSTRUCTIONS_SENT',
      resourceType: 'ORDER',
      resourceId: order.orderNumber,
      newValue: 'Kuda bank transfer payment instructions sent via WhatsApp',
    });

    res.json({ success: true, data: { orderNumber: order.orderNumber } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/orders/:id/rider
 * Admin assigns a manual rider to the order.
 * Requires confirmed payment.
 */
adminRouter.post('/orders/:id/rider', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = AssignRiderSchema.parse(req.body);
    const adminId = req.admin?.id || 'admin';
    const adminEmail = req.admin?.email || 'admin@piercyn.com';

    const updated = await DeliveryQuoteService.assignRider(
      req.params.id,
      { riderName: validated.riderName, riderPhone: validated.riderPhone },
      adminId
    );

    await AuditService.log({
      adminId,
      adminEmail,
      action: 'RIDER_ASSIGNED',
      resourceType: 'ORDER',
      resourceId: updated.orderNumber,
      newValue: `${validated.riderName} (${validated.riderPhone})`,
    });

    const detailed = await OrderService.getOrderDetail(updated.id);
    res.json({ success: true, data: detailed });
  } catch (err: any) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

/**
 * POST /api/admin/orders/:id/dispatch
 * Admin records manual dispatch with assigned rider.
 */
adminRouter.post('/orders/:id/dispatch', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const parsed = DispatchOrderSchema.safeParse(req.body);
    const adminId = req.admin?.id || 'admin';
    const adminEmail = req.admin?.email || 'admin@piercyn.com';

    if (parsed.success && parsed.data.riderName && parsed.data.riderPhone) {
      await DeliveryQuoteService.assignRider(
        req.params.id,
        { riderName: parsed.data.riderName, riderPhone: parsed.data.riderPhone },
        adminId
      );
    }

    const updated = await DeliveryQuoteService.recordDispatch(
      req.params.id,
      { dispatchNote: parsed.success ? (parsed.data.dispatchNote || parsed.data.note) : undefined },
      adminId
    );

    await AuditService.log({
      adminId,
      adminEmail,
      action: 'ORDER_DISPATCHED',
      resourceType: 'ORDER',
      resourceId: updated.orderNumber,
      newValue: updated.status,
    });

    const detailed = await OrderService.getOrderDetail(updated.id);
    res.json({ success: true, data: detailed });
  } catch (err: any) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

adminRouter.patch('/orders/:id/status', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = UpdateOrderStatusSchema.parse(req.body);
    const existing = await OrderService.getOrder(req.params.id);
    const previousStatus = existing ? existing.orderStatus : 'UNKNOWN';

    const updated = await OrderService.updateStatus(
      req.params.id,
      validated.status,
      validated.note,
      req.admin?.name || 'ADMIN'
    );

    await AuditService.log({
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

    await AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'SHIPMENT_CREATED',
      resource: 'SHIPMENT',
      resourceId: shipment.id,
      newValue: `${shipment.provider}: ${shipment.trackingNumber}`,
      note: `Shipment booked for order ${req.params.id}`,
    });

    res.status(201).json({ success: true, data: shipment });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});



/* Category CRUD; categories with active products cannot be deactivated. */
adminRouter.get('/categories', requireAdmin, async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const data = await prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Unable to load categories.' });
  }
});

adminRouter.post('/categories', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const input = CreateCategorySchema.parse(req.body);
    const slug = (input.slug || input.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = await prisma.category.create({ data: { name: input.name, slug, description: input.description, sortOrder: input.sortOrder ?? 0, isActive: true } });
    await AuditService.log({ adminId: req.admin?.id || 'admin', adminEmail: req.admin?.email || 'admin@piercyn.com', action: 'CATEGORY_CREATED', resource: 'PRODUCT', resourceId: category.id, newValue: category.name, note: 'Product category created' });
    res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.code === 'P2002' ? 'A category with this name or slug already exists.' : err.message;
    res.status(err instanceof z.ZodError ? 400 : 409).json({ success: false, error: message });
  }
});

adminRouter.patch('/categories/:id', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const input = UpdateCategorySchema.parse(req.body);
    const data: any = { ...input, ...(input.imageUrl === '' ? { imageUrl: null } : {}) };
    if (input.name && !input.slug) data.slug = input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    await AuditService.log({ adminId: req.admin?.id || 'admin', adminEmail: req.admin?.email || 'admin@piercyn.com', action: 'CATEGORY_UPDATED', resource: 'PRODUCT', resourceId: category.id, newValue: category.name, note: 'Product category updated' });
    res.json({ success: true, data: category });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.code === 'P2002' ? 'A category with this name or slug already exists.' : err.message;
    res.status(err instanceof z.ZodError ? 400 : err.code === 'P2025' ? 404 : 409).json({ success: false, error: message });
  }
});

adminRouter.delete('/categories/:id', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const activeProducts = await prisma.product.count({ where: { categoryId: req.params.id, status: 'ACTIVE' } });
    if (activeProducts > 0) return res.status(409).json({ success: false, error: 'Move or archive active products in this category before deactivating it.' });
    const category = await prisma.category.update({ where: { id: req.params.id }, data: { isActive: false } });
    await AuditService.log({ adminId: req.admin?.id || 'admin', adminEmail: req.admin?.email || 'admin@piercyn.com', action: 'CATEGORY_ARCHIVED', resource: 'PRODUCT', resourceId: category.id, previousValue: category.name, newValue: 'INACTIVE', note: 'Category deactivated; historical product references preserved' });
    res.json({ success: true, message: 'Category deactivated. Existing product records were preserved.' });
  } catch (err: any) {
    res.status(err.code === 'P2025' ? 404 : 400).json({ success: false, error: err.message });
  }
});

/* Product variant CRUD. Deletes are soft-deletes to preserve historical orders. */
adminRouter.get('/variants', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.productVariant.findMany({
      include: { product: { select: { id: true, name: true, status: true } }, inventory: true },
      orderBy: [{ createdAt: 'desc' }],
    });
    const data = rows.map((variant) => ({
      id: variant.id, productId: variant.productId, productName: variant.product.name,
      productStatus: variant.product.status, sku: variant.sku, size: variant.size,
      colour: variant.colour, colourHex: variant.colourHex, priceNGN: variant.priceNGN, priceUSD: variant.priceUSD, priceGBP: variant.priceGBP, priceEUR: variant.priceEUR,
      costPriceNGN: variant.costPriceNGN, image: variant.image, altImage: variant.altImage, active: variant.isActive,
      stockQuantity: variant.inventory?.stockQuantity ?? 0,
      reservedQuantity: variant.inventory?.reservedQuantity ?? 0,
      availableStock: (variant.inventory?.stockQuantity ?? 0) - (variant.inventory?.reservedQuantity ?? 0),
      sortOrder: variant.sortOrder, createdAt: variant.createdAt.toISOString(),
      updatedAt: variant.updatedAt.toISOString(),
    }));
    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Unable to load variants.' });
  }
});

adminRouter.post('/variants', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const input = CreateVariantSchema.parse(req.body);
    const product = await prisma.product.findUnique({ where: { id: input.productId }, select: { id: true, name: true, priceNGN: true, costPriceNGN: true, images: true } });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });
    const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').toUpperCase().slice(0, 8);
    const sku = input.sku || `PCY-${slug(product.name)}-${slug(input.colour).slice(0, 3)}-${input.size.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
    const created = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({ data: {
        productId: product.id, sku, size: input.size, colour: input.colour,
        colourHex: input.colourHex || '#111111', priceNGN: input.priceNGN ?? null,
        priceUSD: input.priceUSD ?? null, priceGBP: input.priceGBP ?? null, priceEUR: input.priceEUR ?? null,
        costPriceNGN: input.costPriceNGN ?? product.costPriceNGN,
        image: input.image || product.images[0] || null, altImage: input.altImage || null, isActive: true,
      }});
      const inventory = await tx.inventory.create({ data: { variantId: variant.id, stockQuantity: input.initialStock, reservedQuantity: 0, soldQuantity: 0, damagedQuantity: 0, returnedQuantity: 0, reorderLevel: 5 }});
      await tx.inventoryTransaction.create({ data: {
        inventoryId: inventory.id, variantId: variant.id, quantity: input.initialStock,
        type: 'RESTOCK', previousStock: 0, newStock: input.initialStock,
        referenceType: 'MANUAL', reason: 'Initial stock from admin variant creation',
      }});
      return tx.productVariant.findUniqueOrThrow({ where: { id: variant.id }, include: { product: { select: { id: true, name: true, status: true } }, inventory: true } });
    });
    await AuditService.log({ adminId: req.admin?.id || 'admin', adminEmail: req.admin?.email || 'admin@piercyn.com', action: 'VARIANT_CREATED', resource: 'PRODUCT', resourceId: created.id, newValue: created.sku, note: `Created variant for ${product.name}` });
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    res.status(err instanceof z.ZodError ? 400 : 400).json({ success: false, error: message });
  }
});

adminRouter.patch('/variants/:id', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const input = UpdateVariantSchema.parse(req.body);
    const updated = await prisma.productVariant.update({ where: { id: req.params.id }, data: input as any });
    await AuditService.log({ adminId: req.admin?.id || 'admin', adminEmail: req.admin?.email || 'admin@piercyn.com', action: 'VARIANT_UPDATED', resource: 'PRODUCT', resourceId: updated.id, newValue: updated.sku, note: 'Product variant updated' });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    res.status(err instanceof z.ZodError ? 400 : err.code === 'P2025' ? 404 : 400).json({ success: false, error: message });
  }
});

adminRouter.delete('/variants/:id', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const variant = await prisma.productVariant.update({ where: { id: req.params.id }, data: { isActive: false } });
    await AuditService.log({ adminId: req.admin?.id || 'admin', adminEmail: req.admin?.email || 'admin@piercyn.com', action: 'VARIANT_ARCHIVED', resource: 'PRODUCT', resourceId: variant.id, previousValue: variant.sku, newValue: 'INACTIVE', note: 'Variant deactivated to preserve order history' });
    res.json({ success: true, message: 'Variant deactivated. Historical order records were preserved.' });
  } catch (err: any) {
    res.status(err.code === 'P2025' ? 404 : 400).json({ success: false, error: err.message });
  }
});

// 3. PRODUCTS
adminRouter.get('/products', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { category, status, search } = req.query;
    const products = await ProductService.getAllProducts({
      category: category as string,
      status: status as string,
      search: search as string,
      includeInactive: true,
      includePhysicalStock: true,
    });
    res.json({ success: true, count: products.length, data: products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.get('/products/export', requireAdmin, async (req: Request, res: Response) => {
  try {
    const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',').map((id) => id.trim()).filter(Boolean).slice(0, 100) : undefined;
    const products = await ProductService.getAllProducts({
      category: req.query.category as string,
      status: req.query.status as string,
      search: req.query.search as string,
      includeInactive: true,
    });
    const selected = ids?.length ? products.filter((product) => ids.includes(product.id)) : products;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="piercyn-products.csv"');
    return res.send(productRowsToCsv(selected));
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Unable to export products.' });
  }
});

adminRouter.get('/products/import-template', requireAdmin, (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="piercyn-product-import-template.csv"');
  return res.send(createProductCsvTemplate());
});

adminRouter.post('/products/import/preview', requireAdmin, async (req: Request, res: Response) => {
  try {
    const input = CsvImportSchema.parse(req.body);
    const rows = await validateProductCsv(input.csvText, input.mode);
    const validRows = rows.filter((row) => row.errors.length === 0).length;
    return res.json({ success: true, data: { rows, validRows, invalidRows: rows.length - validRows } });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    return res.status(400).json({ success: false, error: message || 'Invalid CSV import.' });
  }
});

adminRouter.post('/products/import/commit', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const input = CsvImportSchema.parse(req.body);
    const rows = await validateProductCsv(input.csvText, input.mode);
    const invalidRows = rows.filter((row) => row.errors.length > 0);
    if (invalidRows.length) {
      return res.status(409).json({ success: false, error: 'Resolve all CSV validation errors before importing.', data: { rows, invalidRows: invalidRows.length } });
    }
    const results = await commitProductCsv(rows, input.mode, input.allowPublish === true);
    const failed = results.filter((result) => result.action === 'FAILED');
    await AuditService.log({
      adminId: req.admin?.id, adminEmail: req.admin?.email,
      action: 'PRODUCT_CSV_IMPORT', resource: 'PRODUCT', resourceId: `import-${Date.now()}`,
      newValue: JSON.stringify({ mode: input.mode, imported: results.length - failed.length, failed: failed.length }),
      note: 'Bounded CSV catalogue import',
    });
    return res.status(failed.length ? 207 : 201).json({ success: true, data: { results, createdOrUpdated: results.length - failed.length, failed: failed.length } });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    return res.status(400).json({ success: false, error: message || 'Unable to import products.' });
  }
});

async function getBulkPreview(input: z.infer<typeof BulkProductSchema>) {
  const products = await prisma.product.findMany({
    where: { id: { in: input.productIds } },
    select: { id: true, name: true, priceNGN: true, status: true, categoryId: true },
  });
  let categoryId = input.categoryId;
  if (input.operation === 'SET_CATEGORY') {
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) throw new Error('The selected category does not exist.');
  }
  const items = products.map((product) => {
    const nextPrice = input.operation === 'ADJUST_PRICE'
      ? Math.round(input.priceAdjustment!.type === 'PERCENTAGE'
        ? product.priceNGN * (1 + input.priceAdjustment!.amount / 100)
        : product.priceNGN + input.priceAdjustment!.amount)
      : product.priceNGN;
    return {
      id: product.id, name: product.name, currentPriceNGN: product.priceNGN, nextPriceNGN: nextPrice,
      currentStatus: product.status, nextStatus: input.operation === 'SET_STATUS' ? input.status : product.status,
      currentCategoryId: product.categoryId, nextCategoryId: input.operation === 'SET_CATEGORY' ? categoryId : product.categoryId,
      valid: nextPrice > 0,
    };
  });
  return { items, missingProductIds: input.productIds.filter((id) => !products.some((product) => product.id === id)) };
}

adminRouter.post('/products/bulk-preview', requireAdmin, async (req: Request, res: Response) => {
  try {
    const input = BulkProductSchema.parse(req.body);
    return res.json({ success: true, data: await getBulkPreview(input) });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    return res.status(400).json({ success: false, error: message || 'Invalid bulk operation.' });
  }
});

adminRouter.post('/products/bulk', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const input = BulkProductSchema.parse(req.body);
    const preview = await getBulkPreview(input);
    if (preview.missingProductIds.length || preview.items.some((item) => !item.valid)) {
      return res.status(409).json({ success: false, error: 'The bulk operation is no longer valid. Refresh the preview and try again.', data: preview });
    }
    await prisma.$transaction(preview.items.map((item) => {
      const data = input.operation === 'SET_CATEGORY' ? { categoryId: input.categoryId! }
        : input.operation === 'SET_STATUS' ? { status: input.status! }
        : { priceNGN: item.nextPriceNGN };
      return prisma.product.update({ where: { id: item.id }, data });
    }));
    if (input.operation === 'SET_STATUS' && input.status === 'ARCHIVED') {
      await prisma.productVariant.updateMany({ where: { productId: { in: input.productIds } }, data: { isActive: false } });
    }
    await AuditService.log({
      adminId: req.admin?.id, adminEmail: req.admin?.email, action: 'PRODUCT_BULK_UPDATED', resource: 'PRODUCT',
      resourceId: input.productIds.join(','), newValue: JSON.stringify(input), note: `${preview.items.length} products updated`,
    });
    return res.json({ success: true, data: { updated: preview.items.length, skipped: 0, items: preview.items } });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    return res.status(400).json({ success: false, error: message || 'Unable to complete bulk operation.' });
  }
});

adminRouter.post('/products/bulk/restore', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const productIds = z.object({ productIds: z.array(z.string().min(1)).min(1).max(100) }).parse(req.body).productIds;
    const result = await prisma.product.updateMany({ where: { id: { in: productIds }, status: 'ARCHIVED' }, data: { status: 'DRAFT' } });
    await AuditService.log({ adminId: req.admin?.id, adminEmail: req.admin?.email, action: 'PRODUCT_BULK_RESTORED', resource: 'PRODUCT', resourceId: productIds.join(','), newValue: 'DRAFT', note: 'Restored as drafts; explicit publishing is required.' });
    return res.json({ success: true, data: { restored: result.count } });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    return res.status(400).json({ success: false, error: message || 'Unable to restore products.' });
  }
});

adminRouter.delete('/products/bulk/permanent', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const input = PermanentDeleteSchema.parse(req.body);
    const expected = `DELETE ${input.productIds.length} PRODUCTS`;
    if (input.confirmation.trim().toUpperCase() !== expected) return res.status(400).json({ success: false, error: `Type "${expected}" to confirm permanent deletion.` });
    const products = await prisma.product.findMany({ where: { id: { in: input.productIds } }, select: { id: true, name: true, _count: { select: { reviews: true } } } });
    const orderItems = await prisma.orderItem.findMany({ where: { productId: { in: input.productIds } }, select: { productId: true } });
    const orderedIds = new Set(orderItems.map((item) => item.productId));
    const eligible = products.filter((product) => !orderedIds.has(product.id) && product._count.reviews === 0);
    const protectedProducts = products.filter((product) => !eligible.includes(product)).map((product) => ({ id: product.id, name: product.name, reason: orderedIds.has(product.id) ? 'Referenced by historical order items.' : 'Has product reviews.' }));
    if (eligible.length) await prisma.product.deleteMany({ where: { id: { in: eligible.map((product) => product.id) } } });
    await AuditService.log({ adminId: req.admin?.id, adminEmail: req.admin?.email, action: 'PRODUCT_PERMANENT_DELETE', resource: 'PRODUCT', resourceId: input.productIds.join(','), newValue: JSON.stringify({ deleted: eligible.map((product) => product.id), protectedProducts }), note: 'Historical records and referenced images were not deleted.' });
    return res.json({ success: true, data: { deleted: eligible.map((product) => ({ id: product.id, name: product.name })), protectedProducts } });
  } catch (err: any) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
    return res.status(400).json({ success: false, error: message || 'Unable to permanently delete products.' });
  }
});

adminRouter.post('/products', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = CreateProductSchema.parse(req.body);
    const created = await ProductService.createProduct(validated as any);

    await AuditService.log({
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

adminRouter.patch('/products/:id', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const previous = await ProductService.getProductBySlugOrId(req.params.id, true);
    const prevDetails = previous ? `${previous.name} | ₦${previous.priceNGN} | ${previous.status}` : '';

    const updated = await ProductService.updateProduct(req.params.id, req.body);

    await AuditService.log({
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

adminRouter.delete('/products/:id', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const previous = await ProductService.getProductBySlugOrId(req.params.id, true);
    if (!previous) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    // ProductService archives products instead of hard-deleting records, preserving order references.
    const success = await ProductService.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    await AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'PRODUCT_ARCHIVED',
      resource: 'PRODUCT',
      resourceId: req.params.id,
      previousValue: previous.name,
      newValue: 'ARCHIVED',
      note: 'Product moved to archive; historical order references preserved',
    });

    return res.json({ success: true, message: 'Product archived successfully.' });
  } catch (err: any) {
    console.error('[ADMIN_PRODUCT_ARCHIVE]', err);
    return res.status(500).json({ success: false, error: 'Unable to archive this product. No records were intentionally hard-deleted.' });
  }
});

// 4. INVENTORY
adminRouter.get('/inventory', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { lowStockOnly, outOfStockOnly, search } = req.query;
    const inventory = await InventoryService.getAllInventory({
      lowStockOnly: lowStockOnly === 'true',
      outOfStockOnly: outOfStockOnly === 'true',
      search: search as string,
    });
    res.json({ success: true, count: inventory.length, data: inventory });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.post('/inventory/restock-all/preview', requireAdmin, async (req: Request, res: Response) => {
  try {
    const validated = RestockAllSchema.parse(req.body);
    const preview = await InventoryService.previewRestockAll(validated.quantity);
    res.json({ success: true, data: preview });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(err.errors ? 400 : 500).json({ success: false, error: msg });
  }
});

adminRouter.post('/inventory/restock-all', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = RestockAllSchema.parse(req.body);
    const reference = validated.reference || `BULK-RESTOCK-${Date.now()}`;
    const reason = validated.reason || 'Bulk restock across all inventory variants';
    const result = await InventoryService.restockAll(
      validated.quantity,
      reference,
      reason,
      req.admin?.id
    );

    let auditWarning: string | undefined;
    try {
      await AuditService.log({
        adminId: req.admin?.id || 'admin',
        adminEmail: req.admin?.email || 'admin@piercyn.com',
        action: 'STOCK_BULK_ADJUSTED',
        resource: 'INVENTORY',
        resourceId: reference,
        previousValue: `${result.currentPhysicalStock} physical units`,
        newValue: `${result.resultingPhysicalStock} physical units across ${result.updatedCount} variants`,
        note: `${reason}; added ${result.totalUnitsAdded} units (${validated.quantity} per variant). Reference: ${reference}`,
      });
    } catch (auditErr) {
      console.error('[ADMIN_RESTOCK_ALL_AUDIT]', auditErr);
      auditWarning = 'Stock was updated, but the admin audit log could not be written.';
    }

    res.json({
      success: true,
      message: `Added ${result.totalUnitsAdded} units across ${result.updatedCount} variants.`,
      data: { ...result, reference, auditWarning },
    });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(err.errors ? 400 : 500).json({ success: false, error: msg });
  }
});

adminRouter.post('/inventory/adjust', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = InventoryAdjustmentSchema.parse(req.body);
    const inv = await InventoryService.getVariantStock(validated.variantId);
    const prevAvailable = inv ? inv.stockQuantity - inv.reservedQuantity : 0;

    const success = await InventoryService.adjustStock(
      validated.variantId,
      validated.quantity,
      validated.type,
      validated.reference,
      validated.reason,
      req.admin?.id
    );

    if (!success) {
      return res.status(404).json({ success: false, error: 'Inventory record not found.' });
    }

    const newInv = await InventoryService.getVariantStock(validated.variantId);
    const newAvailable = newInv ? newInv.stockQuantity - newInv.reservedQuantity : prevAvailable;

    await AuditService.log({
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

adminRouter.get('/inventory/history', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { variantId, limit } = req.query;
    const ledger = await InventoryService.getLedger(
      variantId as string,
      limit ? parseInt(limit as string, 10) : 100
    );
    res.json({ success: true, count: ledger.length, data: ledger });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.post('/inventory/bulk-preview', requireAdmin, async (req: Request, res: Response) => {
  try {
    const validated = BulkInventoryAdjustmentSchema.parse(req.body);
    const preview = await InventoryService.bulkAdjustStockPreview(validated.items);
    res.json({ success: true, data: preview });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

adminRouter.post('/inventory/bulk-adjust', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validated = BulkInventoryAdjustmentSchema.parse(req.body);
    const result = await InventoryService.bulkAdjustStock(validated.items, req.admin?.id);

    await AuditService.log({
      adminId: req.admin?.id || 'admin',
      adminEmail: req.admin?.email || 'admin@piercyn.com',
      action: 'STOCK_BULK_ADJUSTED',
      resource: 'INVENTORY',
      resourceId: `bulk-${Date.now()}`,
      newValue: `Updated ${result.updatedCount} variant stock records`,
      note: `Bulk adjustment on ${result.updatedCount} items`,
    });

    res.json({ success: true, message: `Successfully updated ${result.updatedCount} items`, data: result });
  } catch (err: any) {
    const msg = err.errors ? err.errors[0].message : err.message;
    res.status(400).json({ success: false, error: msg });
  }
});

// 5. CUSTOMERS
adminRouter.get('/customers', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const customers = await CustomerService.getAllCustomers({ search: search as string });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.get('/customers/:id', requireAdmin, async (req: Request, res: Response) => {
  const customer = await CustomerService.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  const paidOrders = customer.orders.filter((o) => o.paymentStatus === 'PAID');
  const totalSpent = paidOrders.reduce((sum, o) => sum + o.totalNGN, 0);

  res.json({
    success: true,
    data: {
      ...customer,
      fullName: `${customer.firstName} ${customer.lastName}`.trim(),
      totalOrders: customer.orders.length,
      totalSpentNGN: totalSpent,
    },
  });
});

// 6. ANALYTICS
adminRouter.get('/analytics', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const summary = await AnalyticsService.getAnalyticsSummary();
    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. ALERTS
adminRouter.get('/alerts', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const threshold = await getLowStockThreshold();
    const inventories = await prisma.inventory.findMany({
      include: {
        variant: {
          include: { product: true },
        },
      },
    });

    const lowStockVariants: any[] = [];
    const outOfStockVariants: any[] = [];

    for (const inv of inventories) {
      if (!inv.variant || !inv.variant.product) continue;
      const available = Math.max(0, inv.stockQuantity - inv.reservedQuantity);

      if (available === 0) {
        outOfStockVariants.push({
          variantId: inv.variantId,
          sku: inv.variant.sku,
          productName: inv.variant.product.name,
          colour: inv.variant.colour,
          size: inv.variant.size,
          availableStock: 0,
        });
      } else if (available <= threshold) {
        lowStockVariants.push({
          variantId: inv.variantId,
          sku: inv.variant.sku,
          productName: inv.variant.product.name,
          colour: inv.variant.colour,
          size: inv.variant.size,
          availableStock: available,
        });
      }
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { status: { in: ['PAID', 'PROCESSING'] } },
          { paymentStatus: 'PENDING' },
        ],
      },
    });

    const ordersNeedingAttention = orders.filter(
      (o) => o.paymentStatus === 'PAID' && (o.status === 'PAID' || o.status === 'PROCESSING')
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

// 8. UNIVERSAL SEARCH
adminRouter.get('/search', requireAdmin, async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase();
    if (!q) {
      return res.json({ success: true, data: { orders: [], customers: [], products: [] } });
    }

    const [orders, customers, products] = await Promise.all([
      prisma.order.findMany({
        where: {
          OR: [
            { orderNumber: { contains: q, mode: 'insensitive' } },
            { customerFirstName: { contains: q, mode: 'insensitive' } },
            { customerLastName: { contains: q, mode: 'insensitive' } },
            { customerEmail: { contains: q, mode: 'insensitive' } },
            { customerPhone: { contains: q } },
          ],
        },
        include: { items: true },
        take: 10,
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
          ],
        },
        take: 10,
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { variants: { include: { inventory: true } } },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: {
        orders: orders.map((o) => ({
          ...o,
          orderStatus: o.status,
          customerName: `${o.customerFirstName} ${o.customerLastName}`.trim(),
        })),
        customers: customers.map((c) => ({
          ...c,
          fullName: `${c.firstName} ${c.lastName}`.trim(),
        })),
        products: products.map((p) => ProductService.mapPrismaProduct(p)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. AUDIT LOGS
adminRouter.get('/audit-logs', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const resource = req.query.resource as string;
    const logs = await AuditService.getLogs(limit, resource);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. SETTINGS
adminRouter.get('/settings', requireAdmin, async (_req: Request, res: Response) => {
  try {
    storeSettingsState.lowStockThreshold = await getLowStockThreshold();
    const shippingConfigs = await prisma.shippingConfig.findMany();
    const lagosConfig = shippingConfigs.find((c) => c.regionKey === 'lagos');
    const nationwideConfig = shippingConfigs.find((c) => c.regionKey === 'nationwide');

    if (lagosConfig) {
      storeSettingsState.lagosDeliveryFeeNGN = lagosConfig.feeNGN;
      storeSettingsState.freeShippingThresholdNGN = lagosConfig.freeShippingThresholdNGN;
    }
    if (nationwideConfig) {
      storeSettingsState.nationwideDeliveryFeeNGN = nationwideConfig.feeNGN;
    }

    res.json({
      success: true,
      data: storeSettingsState,
    });
  } catch (err: any) {
    res.json({
      success: true,
      data: storeSettingsState,
    });
  }
});

adminRouter.patch('/settings', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
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

    const parsedLowStockThreshold = lowStockThreshold === undefined ? undefined : Number(lowStockThreshold);
    if (parsedLowStockThreshold !== undefined) {
      if (!isValidLowStockThreshold(parsedLowStockThreshold)) {
        return res.status(400).json({ success: false, error: 'Low-stock threshold must be a whole number between 0 and 10000.' });
      }
      await saveLowStockThreshold(parsedLowStockThreshold);
      storeSettingsState.lowStockThreshold = parsedLowStockThreshold;
    }

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
    // Persist shipping fee and threshold updates to PostgreSQL
    try {
      if (lagosDeliveryFeeNGN !== undefined || freeShippingThresholdNGN !== undefined) {
        await prisma.shippingConfig.upsert({
          where: { regionKey: 'lagos' },
          update: {
            feeNGN: storeSettingsState.lagosDeliveryFeeNGN,
            freeShippingThresholdNGN: storeSettingsState.freeShippingThresholdNGN,
          },
          create: {
            regionKey: 'lagos',
            name: 'Lagos Doorstep Delivery',
            feeNGN: storeSettingsState.lagosDeliveryFeeNGN,
            freeShippingThresholdNGN: storeSettingsState.freeShippingThresholdNGN,
            estimatedTimeframe: '24–48 Hours',
            description: 'Direct dispatch to your doorstep across Lagos State.',
            isActive: true,
            sortOrder: 1,
          },
        });
      }

      if (nationwideDeliveryFeeNGN !== undefined || freeShippingThresholdNGN !== undefined) {
        await prisma.shippingConfig.upsert({
          where: { regionKey: 'nationwide' },
          update: {
            feeNGN: storeSettingsState.nationwideDeliveryFeeNGN,
            freeShippingThresholdNGN: storeSettingsState.freeShippingThresholdNGN,
          },
          create: {
            regionKey: 'nationwide',
            name: 'Nationwide Delivery (Nigeria)',
            feeNGN: storeSettingsState.nationwideDeliveryFeeNGN,
            freeShippingThresholdNGN: storeSettingsState.freeShippingThresholdNGN,
            estimatedTimeframe: '3–5 Business Days',
            description: 'Secure courier delivery to all 36 Nigerian states and FCT.',
            isActive: true,
            sortOrder: 2,
          },
        });
      }
    } catch (dbErr: any) {
      console.warn('[SETTINGS] Could not persist shipping config to DB:', dbErr?.message);
    }

    await AuditService.log({
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
