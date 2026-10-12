import { Product, ProductColor, ProductVariant } from '../types';
import { api } from './apiClient';

/**
 * Maps a backend EnrichedProduct to the frontend Product model
 */
export function mapServerProduct(p: any): Product {
  if (!p) return null as any;

  // Extract distinct colors from variants or fallback
  const colorsMap = new Map<string, ProductColor>();
  const sizesSet = new Set<string>();
  const variants: ProductVariant[] = [];

  if (Array.isArray(p.variants) && p.variants.length > 0) {
    p.variants.forEach((v: any) => {
      const colName = v.colour || 'Default';
      if (!colorsMap.has(colName)) {
        colorsMap.set(colName, {
          name: colName,
          hex: v.colourHex || '#111111',
          image: v.image || p.images?.[0] || '',
          altImage: v.altImage,
        });
      }
      if (v.size) {
        sizesSet.add(v.size);
      }
      variants.push({
        id: v.id,
        productId: v.productId || p.id,
        sku: v.sku,
        size: v.size,
        colour: v.colour,
        colourHex: v.colourHex,
        image: v.image,
        altImage: v.altImage,
        active: v.active !== false && (v.stock?.availableStock === undefined || v.stock.availableStock > 0),
        availableStock: v.stock?.availableStock,
      });
    });
  }

  const colors: ProductColor[] = colorsMap.size > 0
    ? Array.from(colorsMap.values())
    : Array.isArray(p.colors) && p.colors.length > 0
      ? p.colors
      : [{ name: 'Default', hex: '#111111', image: (Array.isArray(p.images) ? p.images[0] : '') || '' }];

  const sizes = sizesSet.size > 0 
    ? (Array.from(sizesSet) as any[]) 
    : (p.sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL']);

  const totalStock = typeof p.totalAvailableStock === 'number'
    ? p.totalAvailableStock
    : (typeof p.stock === 'number' ? p.stock : undefined);

  return {
    id: p.id || '',
    name: p.name || '',
    slug: p.slug || p.id || '',
    category: p.categorySlug || p.category || 'hoodies',
    collection: p.collection || 'essentials',
    priceNGN: p.priceNGN,
    priceUSD: p.priceUSD || Math.round(p.priceNGN / 1500),
    priceGBP: p.priceGBP || Math.round(p.priceNGN / 1900),
    priceEUR: p.priceEUR || Math.round(p.priceNGN / 1650),
    description: p.description,
    gsm: p.gsm,
    fit: p.fit || 'Relaxed silhouette',
    fabric: p.fabric || '100% Heavyweight Cotton',
    origin: p.origin || 'Handmade in Lagos, Nigeria',
    colors,
    sizes,
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [colors[0]?.image].filter(Boolean),
    variants,
    stock: totalStock,
    isSoldOut: p.isSoldOut || totalStock === 0,
    isNewDrop: Boolean(p.isNewDrop),
    isBestSeller: Boolean(p.isBestSeller),
    isLimited: Boolean(p.isLimited),
    tag: p.tag,
    createdAt: p.createdAt,
    status: p.status === 'ARCHIVED' ? 'archived' : p.status === 'DRAFT' ? 'draft' : 'active',
  };
}

export const catalogService = {
  async getProducts(params?: { category?: string; collection?: string }): Promise<Product[]> {
    const res = await api.getProducts(params);
    if (res.success && Array.isArray(res.data)) {
      return res.data.map(mapServerProduct);
    }
    return [];
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!slug) return null;
    const res = await api.getProduct(slug);
    if (res.success && res.data) {
      return mapServerProduct(res.data);
    }
    return null;
  },
};
