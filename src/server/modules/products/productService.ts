import { dbStore, DbProduct, DbVariant, DbCategory, DbInventory } from '../../db/store';

export interface EnrichedProductVariant extends DbVariant {
  stock?: DbInventory;
  isAvailable: boolean;
}

export interface EnrichedProduct extends DbProduct {
  categoryName?: string;
  variants: EnrichedProductVariant[];
  totalAvailableStock: number;
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
  private static slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  /**
   * Enrich a base DbProduct with live variant inventory and category metadata
   */
  public static enrichProduct(prod: DbProduct): EnrichedProduct {
    const variants: EnrichedProductVariant[] = [];
    let totalStock = 0;

    for (const v of dbStore.variants.values()) {
      if (v.productId === prod.id) {
        const inv = dbStore.inventory.get(v.id);
        const available = inv ? inv.availableStock : 0;
        totalStock += available;

        variants.push({
          ...v,
          stock: inv,
          isAvailable: v.active && available > 0,
        });
      }
    }

    variants.sort((a, b) => a.sortOrder - b.sortOrder);
    const category = dbStore.categories.get(prod.categoryId);

    return {
      ...prod,
      categoryName: category?.name,
      variants,
      totalAvailableStock: totalStock,
    };
  }

  /**
   * Retrieve catalog products with filtering.
   * Public caller defaults to active products only.
   */
  public static getAllProducts(filter?: {
    category?: string;
    collection?: string;
    status?: string;
    search?: string;
    includeInactive?: boolean;
  }): EnrichedProduct[] {
    const list: EnrichedProduct[] = [];

    for (const p of dbStore.products.values()) {
      // Normal customer catalog only sees ACTIVE products unless includeInactive is specified
      if (!filter?.includeInactive && !filter?.status && p.status !== 'ACTIVE') {
        continue;
      }
      if (filter?.status && p.status !== filter.status) {
        continue;
      }
      if (filter?.category) {
        const cat = dbStore.categories.get(p.categoryId);
        if (cat?.slug !== filter.category && cat?.name.toLowerCase() !== filter.category.toLowerCase()) {
          continue;
        }
      }
      if (filter?.collection && p.collection.toLowerCase() !== filter.collection.toLowerCase()) {
        continue;
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tag && p.tag.toLowerCase().includes(q));
        if (!matches) continue;
      }

      list.push(this.enrichProduct(p));
    }

    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Retrieve single product by slug or id
   */
  public static getProductBySlugOrId(slugOrId: string, includeInactive: boolean = false): EnrichedProduct | null {
    let prod: DbProduct | undefined = dbStore.products.get(slugOrId);
    if (!prod) {
      for (const p of dbStore.products.values()) {
        if (p.slug === slugOrId) {
          prod = p;
          break;
        }
      }
    }

    if (!prod) return null;
    if (!includeInactive && prod.status !== 'ACTIVE') return null;

    return this.enrichProduct(prod);
  }

  public static getProductBySlug(slug: string): EnrichedProduct | null {
    return this.getProductBySlugOrId(slug, true);
  }

  /**
   * Look up a variant by id or sku
   */
  public static getVariantByIdOrSku(identifier: string): EnrichedProductVariant | null {
    let variant = dbStore.variants.get(identifier);
    if (!variant) {
      const vid = dbStore.skuToVariantId.get(identifier);
      if (vid) {
        variant = dbStore.variants.get(vid);
      }
    }

    if (!variant) return null;
    const inv = dbStore.inventory.get(variant.id);
    const available = inv ? inv.availableStock : 0;

    return {
      ...variant,
      stock: inv,
      isAvailable: variant.active && available > 0,
    };
  }

  /**
   * Admin: Create a new product with variants and initial stock
   */
  public static createProduct(input: CreateProductInput): EnrichedProduct {
    const slug = input.slug || this.slugify(input.name);
    const id = `prod-${slug}-${Date.now().toString().slice(-4)}`;
    const costPriceNGN = input.costPriceNGN ?? Math.round(input.priceNGN * 0.38);
    const now = new Date().toISOString();

    const product: DbProduct = {
      id,
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
      status: input.status || 'ACTIVE',
      images: input.images && input.images.length > 0 ? input.images : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop'],
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
      sortOrder: dbStore.products.size + 1,
      createdAt: now,
      updatedAt: now,
    };

    dbStore.products.set(product.id, product);

    // Variants handling
    const variantInputs = input.variants && input.variants.length > 0
      ? input.variants
      : [{ size: 'M', colour: 'Black', colourHex: '#111111', initialStock: 10 }];

    variantInputs.forEach((vInput, idx) => {
      const colourSlug = this.slugify(vInput.colour).toUpperCase().slice(0, 3);
      const sku = vInput.sku || `PCY-${this.slugify(product.name).toUpperCase().slice(0, 8)}-${colourSlug}-${vInput.size.toUpperCase()}`;
      const variantId = `var-${this.slugify(sku)}`;

      const variant: DbVariant = {
        id: variantId,
        productId: product.id,
        sku,
        size: vInput.size,
        colour: vInput.colour,
        colourHex: vInput.colourHex || '#111111',
        priceNGN: vInput.priceNGN,
        costPriceNGN: vInput.costPriceNGN ?? costPriceNGN,
        image: vInput.image || product.images[0],
        active: true,
        sortOrder: idx,
        createdAt: now,
        updatedAt: now,
      };

      dbStore.variants.set(variantId, variant);
      dbStore.skuToVariantId.set(sku, variantId);

      const stockQty = vInput.initialStock ?? 10;
      const invId = `inv-${variantId}`;
      const inv: DbInventory = {
        id: invId,
        variantId,
        availableStock: stockQty,
        reservedStock: 0,
        soldStock: 0,
        damagedStock: 0,
        returnedStock: 0,
        updatedAt: now,
      };

      dbStore.inventory.set(variantId, inv);

      dbStore.inventoryTransactions.push({
        id: `tx-init-${variantId}`,
        inventoryId: invId,
        variantId,
        quantity: stockQty,
        type: 'PURCHASE',
        reference: 'ADMIN_PRODUCT_CREATION',
        reason: 'Initial stock on product creation',
        createdAt: now,
      });
    });

    return this.enrichProduct(product);
  }

  /**
   * Admin: Update existing product
   */
  public static updateProduct(id: string, updates: Partial<DbProduct>): EnrichedProduct {
    const product = dbStore.products.get(id);
    if (!product) {
      throw new Error(`Product ${id} not found`);
    }

    if (updates.name && !updates.slug) {
      updates.slug = this.slugify(updates.name);
    }

    Object.assign(product, updates, { updatedAt: new Date().toISOString() });
    return this.enrichProduct(product);
  }

  /**
   * Admin: Archive or soft delete product
   */
  public static deleteProduct(id: string): boolean {
    const product = dbStore.products.get(id);
    if (!product) {
      return false;
    }
    product.status = 'ARCHIVED';
    product.updatedAt = new Date().toISOString();

    // Mark variants inactive
    for (const v of dbStore.variants.values()) {
      if (v.productId === id) {
        v.active = false;
        v.updatedAt = product.updatedAt;
      }
    }
    return true;
  }

  /**
   * Category listing
   */
  public static getCategories(): DbCategory[] {
    return Array.from(dbStore.categories.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
