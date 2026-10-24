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

  /** Public catalog query used by the storefront. Prices are stored and displayed in NGN. */
  public static getCatalog(filter: CatalogFilter = {}): CatalogResult {
    const page = Math.max(1, Math.floor(filter.page || 1));
    const limit = Math.min(100, Math.max(1, Math.floor(filter.limit || 24)));
    const minPrice = Number.isFinite(filter.minPrice) ? Math.max(0, filter.minPrice!) : undefined;
    const maxPrice = Number.isFinite(filter.maxPrice) ? Math.max(0, filter.maxPrice!) : undefined;
    const sizes = new Set((filter.sizes || []).map((size) => size.trim().toLowerCase()).filter(Boolean));
    const colours = new Set((filter.colours || []).map((colour) => colour.trim().toLowerCase()).filter(Boolean));

    let products = this.getAllProducts({
      category: filter.category,
      collection: filter.collection,
      search: filter.search?.trim() || undefined,
    }).filter((product) => {
      if (minPrice !== undefined && product.priceNGN < minPrice) return false;
      if (maxPrice !== undefined && product.priceNGN > maxPrice) return false;
      if (sizes.size && !product.variants.some((variant) => sizes.has(variant.size.toLowerCase()))) return false;
      if (colours.size && !product.variants.some((variant) => colours.has(variant.colour.toLowerCase()))) return false;
      if (filter.inStock === true && !product.variants.some((variant) => variant.isAvailable)) return false;
      if (filter.inStock === false && product.variants.some((variant) => variant.isAvailable)) return false;
      return true;
    });

    products = [...products].sort((left, right) => {
      if (filter.sort === 'newest') return Date.parse(right.createdAt) - Date.parse(left.createdAt) || left.sortOrder - right.sortOrder;
      if (filter.sort === 'price-asc') return left.priceNGN - right.priceNGN || left.sortOrder - right.sortOrder;
      if (filter.sort === 'price-desc') return right.priceNGN - left.priceNGN || left.sortOrder - right.sortOrder;
      return left.sortOrder - right.sortOrder || Date.parse(right.createdAt) - Date.parse(left.createdAt);
    });

    const total = products.length;
    return {
      products: products.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
        stockQuantity: stockQty,
        availableStock: stockQty,
        reservedStock: 0,
        soldStock: 0,
        damagedStock: 0,
        returnedStock: 0,
        reorderLevel: 3,
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
   * Category listing — active only (public storefront)
   */
  public static getCategories(includeInactive = false): (DbCategory & { _count: { products: number } })[] {
    const all = Array.from(dbStore.categories.values()).filter(
      (cat) => includeInactive || cat.isActive
    );
    return all
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((cat) => ({
        ...cat,
        _count: {
          products: Array.from(dbStore.products.values()).filter(
            (p) => p.categoryId === cat.id && p.status !== 'ARCHIVED'
          ).length,
        },
      }));
  }

  /**
   * Admin: Create a new category
   */
  public static createCategory(input: {
    name: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
  }): DbCategory & { _count: { products: number } } {
    const name = input.name.trim();
    if (!name) throw new Error('Category name is required.');

    const slug = (input.slug?.trim() || this.slugify(name));
    if (!slug) throw new Error('Category slug is required.');

    // Uniqueness checks
    for (const cat of dbStore.categories.values()) {
      if (cat.name.toLowerCase() === name.toLowerCase()) {
        throw new Error(`A category named "${name}" already exists.`);
      }
      if (cat.slug === slug) {
        throw new Error(`A category with slug "${slug}" already exists.`);
      }
    }

    const now = new Date().toISOString();
    const id = `cat-${slug}-${Date.now().toString().slice(-5)}`;
    const sortOrder = input.sortOrder ?? dbStore.categories.size;

    const category: DbCategory = {
      id,
      name,
      slug,
      description: input.description?.trim() || undefined,
      imageUrl: input.imageUrl || undefined,
      isActive: true,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    };

    dbStore.categories.set(id, category);
    return { ...category, _count: { products: 0 } };
  }

  /**
   * Admin: Update an existing category
   */
  public static updateCategory(
    id: string,
    updates: Partial<Pick<DbCategory, 'name' | 'slug' | 'description' | 'imageUrl' | 'isActive' | 'sortOrder'>>
  ): DbCategory & { _count: { products: number } } {
    const category = dbStore.categories.get(id);
    if (!category) throw new Error(`Category not found: ${id}`);

    if (updates.name !== undefined) {
      const name = updates.name.trim();
      for (const cat of dbStore.categories.values()) {
        if (cat.id !== id && cat.name.toLowerCase() === name.toLowerCase()) {
          throw new Error(`A category named "${name}" already exists.`);
        }
      }
      updates.name = name;
    }

    if (updates.slug !== undefined) {
      const slug = updates.slug.trim() || (updates.name ? this.slugify(updates.name) : this.slugify(category.name));
      for (const cat of dbStore.categories.values()) {
        if (cat.id !== id && cat.slug === slug) {
          throw new Error(`A category with slug "${slug}" already exists.`);
        }
      }
      updates.slug = slug;
    }

    Object.assign(category, updates, { updatedAt: new Date().toISOString() });

    const productCount = Array.from(dbStore.products.values()).filter(
      (p) => p.categoryId === id && p.status !== 'ARCHIVED'
    ).length;

    return { ...category, _count: { products: productCount } };
  }

  /**
   * Admin: Deactivate a category (soft delete). Blocks if products are assigned.
   * Pass `force: true` to deactivate even with products (they are NOT deleted).
   */
  public static deactivateCategory(
    id: string,
    force = false
  ): { success: boolean; message: string } {
    const category = dbStore.categories.get(id);
    if (!category) throw new Error(`Category not found: ${id}`);

    const productCount = Array.from(dbStore.products.values()).filter(
      (p) => p.categoryId === id && p.status !== 'ARCHIVED'
    ).length;

    if (productCount > 0 && !force) {
      throw new Error(
        `Cannot deactivate "${category.name}" — it has ${productCount} active product(s). ` +
        `Reassign or archive those products first, or confirm forced deactivation.`
      );
    }

    category.isActive = false;
    category.updatedAt = new Date().toISOString();
    return { success: true, message: `Category "${category.name}" deactivated.` };
  }
}
