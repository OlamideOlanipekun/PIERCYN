import { prisma, checkDatabaseHealth } from '../../db/prisma';
import { slugify } from '@piercyn/utils';

// Cached availability flag - reset after 30s so transient failures recover automatically.
let _dbAvailable: boolean | null = null;
let _dbAvailableCheckedAt = 0;
const DB_CACHE_TTL_MS = 30_000;

export class CatalogUnavailableError extends Error {
  status = 503;

  constructor() {
    super('Catalogue is temporarily unavailable. Please try again shortly.');
  }
}

async function isDatabaseAvailable(): Promise<boolean> {
  const now = Date.now();
  if (_dbAvailable !== null && now - _dbAvailableCheckedAt < DB_CACHE_TTL_MS) {
    return _dbAvailable;
  }
  const health = await checkDatabaseHealth();
  _dbAvailable = health.ok;
  _dbAvailableCheckedAt = now;
  return health.ok;
}

function markDatabaseUnavailable() {
  _dbAvailable = false;
  _dbAvailableCheckedAt = Date.now();
}

export interface EnrichedProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  colour: string;
  colourHex: string;
  priceNGN?: number | null;
  costPriceNGN?: number | null;
  priceUSD?: number | null;
  priceGBP?: number | null;
  priceEUR?: number | null;
  image?: string | null;
  altImage?: string | null;
  active: boolean;
  sortOrder: number;
  availableStock: number;
  stock: {
    availableStock: number;
    reservedStock: number;
    soldStock: number;
    damagedStock: number;
    returnedStock: number;
  };
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnrichedProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string | null;
  priceNGN: number;
  costPriceNGN: number;
  priceUSD: number;
  priceGBP: number;
  priceEUR: number;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  collection: string;
  status: string;
  images: string[];
  videoUrl?: string | null;
  gsm?: string | null;
  fit?: string | null;
  fabric?: string | null;
  origin?: string | null;
  careInstructions?: string | null;
  productStory?: string | null;
  tag?: string | null;
  isNewDrop: boolean;
  isBestSeller: boolean;
  isSoldOut: boolean;
  isLimited: boolean;
  sortOrder: number;
  variants: EnrichedProductVariant[];
  totalAvailableStock: number;
  createdAt: string;
  updatedAt: string;
}

export type CatalogSort = 'featured' | 'newest' | 'price-asc' | 'price-desc';

export interface CatalogFilter {
  category?: string;
  collection?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colours?: string[];
  inStock?: boolean;
  sort?: CatalogSort;
  page?: number;
  limit?: number;
}

export interface CatalogResult {
  products: EnrichedProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  priceNGN: number;
  costPriceNGN?: number;
  priceUSD?: number;
  priceGBP?: number;
  priceEUR?: number;
  categoryId: string;
  collection?: string;
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  images: string[];
  videoUrl?: string;
  gsm?: string;
  fit?: string;
  fabric?: string;
  origin?: string;
  careInstructions?: string;
  productStory?: string;
  tag?: string;
  isNewDrop?: boolean;
  isBestSeller?: boolean;
  isLimited?: boolean;
  variants?: Array<{
    sku?: string;
    size: string;
    colour: string;
    colourHex?: string;
    priceNGN?: number;
    costPriceNGN?: number;
    initialStock?: number;
    image?: string;
  }>;
}

export class ProductService {
  public static mapPrismaProduct(prod: any): EnrichedProduct {
    let totalStock = 0;
    const variants: EnrichedProductVariant[] = (prod.variants || []).map((v: any) => {
      const stockQty = v.inventory ? v.inventory.stockQuantity : 0;
      const reservedQty = v.inventory ? v.inventory.reservedQuantity : 0;
      const available = Math.max(0, stockQty - reservedQty);
      totalStock += available;

      return {
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        size: v.size,
        colour: v.colour,
        colourHex: v.colourHex,
        priceNGN: v.priceNGN,
        costPriceNGN: v.costPriceNGN,
        priceUSD: v.priceUSD,
        priceGBP: v.priceGBP,
        priceEUR: v.priceEUR,
        image: v.image,
        altImage: v.altImage,
        active: v.isActive ?? true,
        sortOrder: v.sortOrder ?? 0,
        availableStock: available,
        // Keep the nested stock shape consumed by the admin Products dashboard.
        // The storefront also uses the flat availableStock field above.
        stock: {
          availableStock: available,
          reservedStock: reservedQty,
          soldStock: v.inventory?.soldQuantity ?? 0,
          damagedStock: v.inventory?.damagedQuantity ?? 0,
          returnedStock: v.inventory?.returnedQuantity ?? 0,
        },
        isAvailable: (v.isActive ?? true) && available > 0,
        createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : new Date().toISOString(),
      };
    });

    variants.sort((a, b) => a.sortOrder - b.sortOrder);
    const hasSellableStock = variants.some((variant) => variant.active && variant.availableStock > 0);
    const isSoldOut = variants.length > 0
      ? !hasSellableStock
      : Boolean(prod.isSoldOut) || totalStock === 0;

    return {
      id: prod.id,
      slug: prod.slug,
      name: prod.name,
      description: prod.description,
      shortDescription: prod.shortDescription,
      priceNGN: prod.priceNGN,
      costPriceNGN: prod.costPriceNGN ?? Math.round(prod.priceNGN * 0.38),
      priceUSD: prod.priceUSD ?? 0,
      priceGBP: prod.priceGBP ?? 0,
      priceEUR: prod.priceEUR ?? 0,
      categoryId: prod.categoryId,
      categoryName: prod.category ? prod.category.name : undefined,
      categorySlug: prod.category ? prod.category.slug : undefined,
      collection: prod.collection || 'essentials',
      status: prod.status || 'ACTIVE',
      images: prod.images || [],
      videoUrl: prod.videoUrl,
      gsm: prod.gsm,
      fit: prod.fit,
      fabric: prod.fabric,
      origin: prod.origin || 'Handmade in Lagos, Nigeria',
      careInstructions: prod.careInstructions,
      productStory: prod.productStory,
      tag: prod.tag,
      isNewDrop: Boolean(prod.isNewDrop),
      isBestSeller: Boolean(prod.isBestSeller),
      isSoldOut,
      isLimited: Boolean(prod.isLimited),
      sortOrder: prod.sortOrder ?? 0,
      variants,
      totalAvailableStock: totalStock,
      createdAt: prod.createdAt ? new Date(prod.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: prod.updatedAt ? new Date(prod.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public static async getAllProducts(filter?: {
    category?: string;
    collection?: string;
    status?: string;
    search?: string;
    includeInactive?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    colours?: string[];
    inStock?: boolean;
    sort?: CatalogSort;
  }): Promise<EnrichedProduct[]> {
    const dbUp = await isDatabaseAvailable();
    if (!dbUp) {
      throw new CatalogUnavailableError();
    }

    try {
        const where: any = {};

        if (!filter?.includeInactive && !filter?.status) {
          where.status = 'ACTIVE';
          where.category = { isActive: true };
        } else if (filter?.status) {
          where.status = filter.status;
        }

        if (filter?.category) {
          where.category = {
            OR: [
              { slug: filter.category.toLowerCase() },
              { name: { equals: filter.category, mode: 'insensitive' } },
            ],
          };
        }

        if (filter?.collection) {
          where.collection = { equals: filter.collection, mode: 'insensitive' };
        }

        if (filter?.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } },
            { tag: { contains: filter.search, mode: 'insensitive' } },
          ];
        }

        if (filter?.minPrice !== undefined || filter?.maxPrice !== undefined) {
          where.priceNGN = {
            ...(filter.minPrice !== undefined ? { gte: filter.minPrice } : {}),
            ...(filter.maxPrice !== undefined ? { lte: filter.maxPrice } : {}),
          };
        }

        const variantConditions: any[] = [];
        if (filter?.sizes?.length) variantConditions.push({ variants: { some: { size: { in: filter.sizes } } } });
        if (filter?.colours?.length) variantConditions.push({ variants: { some: { colour: { in: filter.colours, mode: 'insensitive' } } } });
        if (filter?.inStock) variantConditions.push({ variants: { some: { isActive: true, inventory: { stockQuantity: { gt: 0 } } } } });
        if (variantConditions.length) where.AND = [...(where.AND || []), ...variantConditions];

        const orderBy = filter?.sort === 'newest'
          ? [{ createdAt: 'desc' }, { sortOrder: 'asc' }]
          : filter?.sort === 'price-asc'
            ? [{ priceNGN: 'asc' }, { sortOrder: 'asc' }]
            : filter?.sort === 'price-desc'
              ? [{ priceNGN: 'desc' }, { sortOrder: 'asc' }]
              : [{ sortOrder: 'asc' }, { createdAt: 'desc' }];

        const products = await prisma.product.findMany({
          where,
          include: {
            category: true,
            variants: {
              include: { inventory: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: orderBy as any,
        });

        return products.map((p) => this.mapPrismaProduct(p));
      } catch (err) {
        console.error('[ProductService] DB query failed; refusing to serve a stale catalogue:', (err as any)?.message);
        markDatabaseUnavailable();
        throw new CatalogUnavailableError();
      }
  }


  public static async getCatalog(filter: CatalogFilter = {}): Promise<CatalogResult> {
    const page = Math.max(1, Math.floor(filter.page || 1));
    const limit = Math.min(100, Math.max(1, Math.floor(filter.limit || 24)));
    const minPrice = Number.isFinite(filter.minPrice) ? Math.max(0, filter.minPrice!) : undefined;
    const maxPrice = Number.isFinite(filter.maxPrice) ? Math.max(0, filter.maxPrice!) : undefined;
    const sizes = (filter.sizes || []).map((size) => size.trim()).filter(Boolean);
    const colours = (filter.colours || []).map((colour) => colour.trim()).filter(Boolean);
    const products = (await this.getAllProducts({
      category: filter.category,
      collection: filter.collection,
      search: filter.search?.trim() || undefined,
      minPrice,
      maxPrice,
      sizes,
      colours,
      inStock: filter.inStock,
      sort: filter.sort,
    })).filter((product) => filter.inStock === undefined || (filter.inStock
      ? product.variants.some((variant) => variant.isAvailable)
      : !product.variants.some((variant) => variant.isAvailable)));
    const total = products.length;
    return {
      products: products.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public static async getProductBySlugOrId(
    slugOrId: string,
    includeInactive: boolean = false
  ): Promise<EnrichedProduct | null> {
    const dbUp = await isDatabaseAvailable();
    if (!dbUp) {
      throw new CatalogUnavailableError();
    }

    try {
      const where: any = {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      };

      if (!includeInactive) {
        where.status = 'ACTIVE';
        where.category = { isActive: true };
      }

      const prod = await prisma.product.findFirst({
        where,
        include: {
          category: true,
          variants: {
            include: { inventory: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!prod) return null;
      return this.mapPrismaProduct(prod);
    } catch (err) {
      console.error('[ProductService] DB query failed; refusing to serve a stale catalogue:', (err as any)?.message);
      markDatabaseUnavailable();
      throw new CatalogUnavailableError();
    }
  }

  public static async getProductBySlug(slug: string): Promise<EnrichedProduct | null> {
    return this.getProductBySlugOrId(slug, true);
  }

  public static async getVariantByIdOrSku(identifier: string): Promise<EnrichedProductVariant | null> {
    const dbUp = await isDatabaseAvailable();
    if (!dbUp) {
      throw new CatalogUnavailableError();
    }

    try {
        const variant = await prisma.productVariant.findFirst({
          where: {
            OR: [{ id: identifier }, { sku: identifier }],
          },
          include: {
            product: { include: { category: true } },
            inventory: true,
          },
        });

        if (!variant) return null;

        const stockQty = variant.inventory ? variant.inventory.stockQuantity : 0;
        const reservedQty = variant.inventory ? variant.inventory.reservedQuantity : 0;
        const available = Math.max(0, stockQty - reservedQty);

        return {
          id: variant.id,
          productId: variant.productId,
          sku: variant.sku,
          size: variant.size,
          colour: variant.colour,
          colourHex: variant.colourHex,
          priceNGN: variant.priceNGN,
          costPriceNGN: variant.costPriceNGN,
          priceUSD: variant.priceUSD,
          priceGBP: variant.priceGBP,
          priceEUR: variant.priceEUR,
          image: variant.image,
          altImage: variant.altImage,
          active: variant.isActive,
          sortOrder: variant.sortOrder,
          availableStock: available,
          stock: {
            availableStock: available,
            reservedStock: reservedQty,
            soldStock: variant.inventory?.soldQuantity ?? 0,
            damagedStock: variant.inventory?.damagedQuantity ?? 0,
            returnedStock: variant.inventory?.returnedQuantity ?? 0,
          },
          isAvailable: variant.isActive && available > 0,
          createdAt: variant.createdAt.toISOString(),
          updatedAt: variant.updatedAt.toISOString(),
        };
      } catch (err) {
        console.error('[ProductService] DB query failed; refusing to serve a stale catalogue:', (err as any)?.message);
        markDatabaseUnavailable();
        throw new CatalogUnavailableError();
      }
  }

  public static async createProduct(input: CreateProductInput): Promise<EnrichedProduct> {
    const slug = input.slug || slugify(input.name);
    const costPriceNGN = input.costPriceNGN ?? Math.round(input.priceNGN * 0.38);

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          slug,
          name: input.name.trim(),
          description: input.description.trim(),
          shortDescription: input.shortDescription?.trim(),
          priceNGN: input.priceNGN,
          costPriceNGN,
          priceUSD: input.priceUSD || Math.round(input.priceNGN / 1500),
          priceGBP: input.priceGBP || Math.round(input.priceNGN / 1900),
          priceEUR: input.priceEUR || Math.round(input.priceNGN / 1650),
          categoryId: input.categoryId,
          collection: input.collection || 'essentials',
          status: (input.status as any) || 'ACTIVE',
          images: input.images && input.images.length > 0 ? input.images : [],
          videoUrl: input.videoUrl,
          gsm: input.gsm,
          fit: input.fit,
          fabric: input.fabric,
          origin: input.origin || 'Handmade in Lagos, Nigeria',
          careInstructions: input.careInstructions,
          productStory: input.productStory,
          tag: input.tag,
          isNewDrop: Boolean(input.isNewDrop),
          isBestSeller: Boolean(input.isBestSeller),
          isSoldOut: false,
          isLimited: Boolean(input.isLimited),
        },
      });

      const variantInputs = input.variants && input.variants.length > 0
        ? input.variants
        : [{ size: 'M', colour: 'Black', colourHex: '#111111', initialStock: 10 }];

      for (let idx = 0; idx < variantInputs.length; idx++) {
        const vInput = variantInputs[idx];
        const colourSlug = slugify(vInput.colour).toUpperCase().slice(0, 3);
        const sku = vInput.sku || `PCY-${slugify(product.name).toUpperCase().slice(0, 8)}-${colourSlug}-${vInput.size.toUpperCase()}`;
        const stockQty = vInput.initialStock ?? 10;

        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku,
            size: vInput.size,
            colour: vInput.colour,
            colourHex: vInput.colourHex || '#111111',
            priceNGN: vInput.priceNGN,
            costPriceNGN: vInput.costPriceNGN ?? costPriceNGN,
            image: vInput.image || (product.images[0] ?? ''),
            isActive: true,
            sortOrder: idx,
          },
        });

        const inv = await tx.inventory.create({
          data: {
            variantId: variant.id,
            stockQuantity: stockQty,
            reservedQuantity: 0,
            soldQuantity: 0,
            damagedQuantity: 0,
            returnedQuantity: 0,
            reorderLevel: 5,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            inventoryId: inv.id,
            variantId: variant.id,
            quantity: stockQty,
            type: 'RESTOCK',
            previousStock: 0,
            newStock: stockQty,
            referenceType: 'MANUAL',
            reason: 'Initial stock on product creation',
          },
        });
      }

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: {
          category: true,
          variants: {
            include: { inventory: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    return this.mapPrismaProduct(result);
  }

  public static async updateProduct(id: string, updates: Partial<CreateProductInput>): Promise<EnrichedProduct> {
    const data: any = { ...updates };
    delete data.variants;

    if (updates.name && !updates.slug) {
      data.slug = slugify(updates.name);
    }

    if (updates.images !== undefined && (!Array.isArray(updates.images) || updates.images.length === 0)) {
      throw new Error('A product must retain at least one image.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      let currentVariants: Array<{ id: string; image: string | null; altImage: string | null }> = [];
      const removedImageUrls = new Set<string>();

      if (Array.isArray(updates.images)) {
        const current = await tx.product.findUnique({
          where: { id },
          select: {
            images: true,
            variants: { select: { id: true, image: true, altImage: true } },
          },
        });
        if (!current) throw new Error('Product not found.');
        currentVariants = current.variants;

        const retainedUrls = new Set(updates.images);
        const existingUrls = [
          ...(current.images || []),
          ...currentVariants.flatMap((variant) => [variant.image, variant.altImage]),
        ];
        for (const url of existingUrls) {
          if (url && !retainedUrls.has(url)) removedImageUrls.add(url);
        }
      }

      await tx.product.update({ where: { id }, data });

      // Variant image fields are also included in the dashboard gallery. Clear removed
      // references in the same transaction, falling back to the new primary image.
      if (removedImageUrls.size > 0) {
        const fallbackImage = updates.images?.[0] || null;
        for (const variant of currentVariants) {
          const imageRemoved = Boolean(variant.image && removedImageUrls.has(variant.image));
          const altImageRemoved = Boolean(variant.altImage && removedImageUrls.has(variant.altImage));
          if (!imageRemoved && !altImageRemoved) continue;

          const variantData: { image?: string | null; altImage?: string | null } = {};
          if (imageRemoved) variantData.image = fallbackImage;
          if (altImageRemoved) variantData.altImage = null;
          await tx.productVariant.update({ where: { id: variant.id }, data: variantData });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: {
          category: true,
          variants: {
            include: { inventory: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    return this.mapPrismaProduct(updated);
  }

  public static async deleteProduct(id: string): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: { status: 'ARCHIVED' },
        });
        await tx.productVariant.updateMany({
          where: { productId: id },
          data: { isActive: false },
        });
      });
      return true;
    } catch {
      return false;
    }
  }

  public static async getCategories(): Promise<any[]> {
    const dbUp = await isDatabaseAvailable();
    if (!dbUp) {
      throw new CatalogUnavailableError();
    }

    try {
      return await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    } catch (err) {
      console.error('[ProductService] DB getCategories failed; refusing to serve a stale catalogue:', (err as any)?.message);
      markDatabaseUnavailable();
      throw new CatalogUnavailableError();
    }
  }
}
