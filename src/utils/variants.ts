import { Product } from '../types';

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Deterministically compute the variant SKU from productId, colorName, and size
 * Exactly matching backend `dbStore.ts` generation:
 * SKU: `PCY-${slugify(productId).toUpperCase()}-${slugify(colorName).toUpperCase().slice(0, 3)}-${size}`
 */
export function getVariantSku(productId: string, colorName: string = 'Default', size: string = 'M'): string {
  const pSlug = slugify(productId).toUpperCase();
  const cSlug = slugify(colorName || 'Default').toUpperCase().slice(0, 3);
  return `PCY-${pSlug}-${cSlug}-${size || 'M'}`;
}

/**
 * Deterministically compute the variant ID from productId, colorName, and size
 * Matching backend `dbStore.ts` generation: `var-${slugify(sku)}`
 */
export function getVariantId(productId: string, colorName: string = 'Default', size: string = 'M'): string {
  const sku = getVariantSku(productId, colorName, size);
  return `var-${slugify(sku)}`;
}

export function usesSizeOnlyOptions(product: Pick<Product, 'category' | 'categoryName'>): boolean {
  const category = `${product.categoryName || ''} ${product.category || ''}`.toLowerCase();
  return /trouser|jean|short/.test(category);
}

export function findProductVariant(product: Product, colorName?: string, size?: string) {
  if (!size || !product.variants?.length) return undefined;
  const matchingSize = product.variants.filter((variant) => variant.size.toUpperCase() === size.toUpperCase());
  if (usesSizeOnlyOptions(product)) {
    return matchingSize.find((variant) => variant.active !== false && (variant.availableStock ?? 0) > 0)
      || matchingSize.find((variant) => variant.colour.toLowerCase() === (colorName || '').toLowerCase())
      || matchingSize[0];
  }
  return matchingSize.find((variant) =>
    variant.colour.toLowerCase() === (colorName || '').toLowerCase() || variant.colourHex === colorName
  );
}

/**
 * Resolve the real variant details for a given product selection
 */
export function resolveProductVariant(
  product: Product,
  colorName?: string,
  size?: string
): { id: string; sku: string; colour: string; size: string; productId: string; availableStock?: number } {
  const selectedColor = colorName || product.colors?.[0]?.name || 'Default';
  const selectedSize = size || product.sizes?.[0] || 'M';

  // If product already contains enriched variants from the backend, find exact match
  if (product.variants && product.variants.length > 0) {
    const match = findProductVariant(product, selectedColor, selectedSize);
    if (match) {
      return {
        id: match.id,
        sku: match.sku,
        colour: match.colour,
        size: match.size,
        productId: match.productId || product.id,
        availableStock: match.availableStock,
      };
    }
  }

  // Fallback to deterministic generation
  const sku = getVariantSku(product.id, selectedColor, selectedSize);
  const id = `var-${slugify(sku)}`;

  return {
    id,
    sku,
    colour: selectedColor,
    size: selectedSize,
    productId: product.id,
    availableStock: product.stock,
  };
}
