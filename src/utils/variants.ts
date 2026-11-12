import { Product } from '../types';

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Deterministically compute the variant SKU from productId, size, and optional legacy colorName
 */
export function getVariantSku(productId: string, colorName: string = 'Default', size: string = 'M'): string {
  const pSlug = slugify(productId).toUpperCase();
  const cleanSize = size || 'M';
  if (!colorName || colorName.toLowerCase() === 'default' || colorName.toLowerCase() === 'no colour') {
    return `PCY-${pSlug}-${cleanSize}`;
  }
  const cSlug = slugify(colorName).toUpperCase().slice(0, 3);
  return `PCY-${pSlug}-${cSlug}-${cleanSize}`;
}

/**
 * Deterministically compute the variant ID from productId, size, and optional legacy colorName
 */
export function getVariantId(productId: string, colorName: string = 'Default', size: string = 'M'): string {
  const sku = getVariantSku(productId, colorName, size);
  return `var-${slugify(sku)}`;
}

/**
 * PIERCYN operates entirely on size-only variant selection for all categories.
 */
export function usesSizeOnlyOptions(_product?: Pick<Product, 'category' | 'categoryName'>): boolean {
  return true;
}

/**
 * Find product variant by size (with backward compatibility for legacy colorName parameter order)
 */
export function findProductVariant(product: Product, param2?: string, param3?: string) {
  // Overload 1: findProductVariant(product, size) -> param2 is size, param3 is undefined
  // Overload 2: findProductVariant(product, colorName, size) -> param2 is colorName, param3 is size
  const size = (param3 !== undefined ? param3 : param2)?.trim();
  const legacyColor = param3 !== undefined ? param2 : undefined;
  if (!size || !product.variants?.length) return undefined;

  const matchingSize = product.variants.filter(
    (variant) => variant.size.toUpperCase() === size.toUpperCase()
  );
  if (!matchingSize.length) return undefined;

  // 1. Prefer an active variant with available stock
  const stocked = matchingSize.find((variant) => variant.active !== false && (variant.availableStock ?? 0) > 0);
  if (stocked) return stocked;

  // 2. If legacy color was passed, check for exact match
  if (legacyColor) {
    const normalizedColor = legacyColor.toLowerCase().trim();
    const colorMatch = matchingSize.find((variant) =>
      variant.colour.toLowerCase().trim() === normalizedColor ||
      variant.colourHex === legacyColor
    );
    if (colorMatch) return colorMatch;
  }

  // 3. Fallback to first active variant
  const active = matchingSize.find((variant) => variant.active !== false);
  if (active) return active;

  return matchingSize[0];
}

/**
 * Resolve the real variant details for a given product selection
 */
export function resolveProductVariant(
  product: Product,
  param2?: string,
  param3?: string
): { id: string; sku: string; colour: string; size: string; productId: string; availableStock?: number } {
  const selectedSize = (param3 !== undefined ? param3 : param2) || product.sizes?.[0] || 'M';
  const legacyColor = param3 !== undefined ? param2 : undefined;

  // If product already contains enriched variants from the backend, find exact match
  if (product.variants && product.variants.length > 0) {
    const match = findProductVariant(product, legacyColor, selectedSize);
    if (match) {
      return {
        id: match.id,
        sku: match.sku,
        colour: match.colour || 'Default',
        size: match.size,
        productId: match.productId || product.id,
        availableStock: match.availableStock,
      };
    }
  }

  // Fallback to deterministic generation
  const sku = getVariantSku(product.id, legacyColor || 'Default', selectedSize);
  const id = `var-${slugify(sku)}`;

  return {
    id,
    sku,
    colour: legacyColor || 'Default',
    size: selectedSize,
    productId: product.id,
    availableStock: product.stock,
  };
}
