import { Router, Request, Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
import { COMMERCE_CONFIG } from '../../config/constants';
import { prisma } from '../../db/prisma';
import { z } from 'zod';

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
  supportPhone: '+2348000000000',
  currency: 'NGN (₦)',
  freeShippingThresholdNGN: COMMERCE_CONFIG.SHIPPING.FREE_THRESHOLD_NGN,
  lagosDeliveryFeeNGN: COMMERCE_CONFIG.SHIPPING.LAGOS_FEE_NGN,
  nationwideDeliveryFeeNGN: COMMERCE_CONFIG.SHIPPING.NATIONWIDE_FEE_NGN,
  lowStockThreshold: COMMERCE_CONFIG.INVENTORY.LOW_STOCK_THRESHOLD,
  reservationTtlMinutes: COMMERCE_CONFIG.INVENTORY.RESERVATION_TTL_MINUTES,
  paymentGatewayConfigured: Boolean(COMMERCE_CONFIG.PAYMENT.PAYSTACK.PUBLIC_KEY || process.env.PAYSTACK_SECRET_KEY),
  paymentEnvironment: process.env.NODE_ENV === 'production' ? 'LIVE' : 'TEST',
  shippingProviders: ['KWIK Delivery (Lagos Express)', 'GIG Logistics (Nationwide)', 'DHL Express (Global)'],
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
  costPriceNGN: z.number().int().nonnegative().optional(),
  image: z.string().url().optional().or(z.literal('')),
  initialStock: z.number().int().nonnegative().default(0),
});
const UpdateVariantSchema = z.object({
  sku: z.string().trim().min(1).max(100).optional(),
  size: z.string().trim().min(1).max(30).optional(),
  colour: z.string().trim().min(1).max(60).optional(),
  colourHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  priceNGN: z.number().int().positive().nullable().optional(),
  costPriceNGN: z.number().int().nonnegative().nullable().optional(),
  image: z.string().url().nullable().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one variant field to update');

const InventoryAdjustmentSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
  type: z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'DAMAGE', 'RETURN']),
  reference: z.string().min(1),
  reason: z.string().optional(),
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
  AdminAuthService.logout(token);

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
      colour: variant.colour, colourHex: variant.colourHex, priceNGN: variant.priceNGN,
      costPriceNGN: variant.costPriceNGN, image: variant.image, active: variant.isActive,
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
        costPriceNGN: input.costPriceNGN ?? product.costPriceNGN,
        image: input.image || product.images[0] || null, isActive: true,
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
    });
    res.json({ success: true, count: products.length, data: products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
  const previous = await ProductService.getProductBySlugOrId(req.params.id, true);
  const success = await ProductService.deleteProduct(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  await AuditService.log({
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
    const threshold = storeSettingsState.lowStockThreshold;
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
adminRouter.get('/settings', requireAdmin, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: storeSettingsState,
  });
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
