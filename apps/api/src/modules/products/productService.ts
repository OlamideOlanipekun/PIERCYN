import { prisma } from '../../db/prisma';
import { slugify } from '@piercyn/utils';

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
        isAvailable: (v.isActive ?? true) && available > 0,
        createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : new Date().toISOString(),
      };
    });

    variants.sort((a, b) => a.sortOrder - b.sortOrder);

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
      isSoldOut: Boolean(prod.isSoldOut) || totalStock === 0,
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
  }): Promise<EnrichedProduct[]> {
    const where: any = {};

    if (!filter?.includeInactive && !filter?.status) {
      where.status = 'ACTIVE';
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

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: {
          include: {
            inventory: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return products.map((p) => this.mapPrismaProduct(p));
  }

  public static async getProductBySlugOrId(
    slugOrId: string,
    includeInactive: boolean = false
  ): Promise<EnrichedProduct | null> {
    const where: any = {
      OR: [{ id: slugOrId }, { slug: slugOrId }],
    };

    if (!includeInactive) {
      where.status = 'ACTIVE';
    }

    const prod = await prisma.product.findFirst({
      where,
      include: {
        category: true,
        variants: {
          include: {
            inventory: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!prod) return null;
    return this.mapPrismaProduct(prod);
  }

  public static async getProductBySlug(slug: string): Promise<EnrichedProduct | null> {
    return this.getProductBySlugOrId(slug, true);
  }

  public static async getVariantByIdOrSku(identifier: string): Promise<EnrichedProductVariant | null> {
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
      isAvailable: variant.isActive && available > 0,
      createdAt: variant.createdAt.toISOString(),
      updatedAt: variant.updatedAt.toISOString(),
    };
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

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        variants: {
          include: { inventory: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
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
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
