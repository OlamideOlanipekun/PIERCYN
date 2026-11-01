import type { Product, ProductCategory } from '../types';

export const NEW_PRODUCT_WINDOW_DAYS = 30;
const NEW_PRODUCT_WINDOW_MS = NEW_PRODUCT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export type NewCategory =
  | 'ALL'
  | 'HOODIES'
  | 'SWEATSHIRTS'
  | 'T-SHIRTS'
  | 'POLOS'
  | 'JACKETS'
  | 'TROUSERS'
  | 'DENIM'
  | 'ACCESSORIES';

export type SortKey = 'FEATURED' | 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC';

export const NEW_ARRIVAL_CATEGORIES: NewCategory[] = [
  'ALL',
  'HOODIES',
  'SWEATSHIRTS',
  'T-SHIRTS',
  'POLOS',
  'JACKETS',
  'TROUSERS',
  'DENIM',
  'ACCESSORIES',
];

const CATEGORY_MAP: Partial<Record<NewCategory, ProductCategory[]>> = {
  HOODIES: ['hoodies'],
  SWEATSHIRTS: ['sweatshirts'],
  'T-SHIRTS': ['t-shirts', 'tees'],
  POLOS: ['polos'],
  JACKETS: ['jackets', 'outerwear'],
  TROUSERS: ['trousers'],
  DENIM: ['jeans'],
  ACCESSORIES: ['accessories'],
};

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'ONE SIZE', 'ONE_SIZE'];

function productCreatedAt(product: Product): number {
  if (!product.createdAt) return Number.NEGATIVE_INFINITY;
  const timestamp = Date.parse(product.createdAt);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

export function isNewArrival(product: Product, now: Date = new Date()): boolean {
  if (product.status === 'archived' || product.status === 'draft') return false;
  if (product.isNewDrop === true) return true;

  const createdAt = productCreatedAt(product);
  const age = now.getTime() - createdAt;
  return Number.isFinite(createdAt) && age >= 0 && age <= NEW_PRODUCT_WINDOW_MS;
}

export function getNewArrivalProducts(products: Product[], now: Date = new Date()): Product[] {
  return products.filter((product) => isNewArrival(product, now));
}

function hasAvailableSize(product: Product, size: string): boolean {
  const matchingVariants = product.variants?.filter(
    (variant) => variant.size.toUpperCase() === size.toUpperCase()
  ) ?? [];

  if (product.availabilityType === 'available_to_order') {
    return matchingVariants.length > 0 || product.sizes.some((item) => item.toUpperCase() === size.toUpperCase());
  }

  if (matchingVariants.length > 0) {
    return matchingVariants.some(
      (variant) => variant.active !== false && (variant.availableStock === undefined || variant.availableStock > 0)
    );
  }

  return !product.isSoldOut && product.sizes.some((item) => item.toUpperCase() === size.toUpperCase());
}

export function filterNewArrivals(
  products: Product[],
  category: NewCategory,
  sizes: string[] = []
): Product[] {
  return products.filter((product) => {
    const allowedCategories = CATEGORY_MAP[category];
    const matchesCategory = category === 'ALL' || Boolean(allowedCategories?.includes(product.category));
    const matchesSize = sizes.length === 0 || sizes.some((size) => hasAvailableSize(product, size));
    return matchesCategory && matchesSize;
  });
}

export function getAvailableNewArrivalSizes(products: Product[]): string[] {
  const available = new Set<string>();

  for (const product of products) {
    const variants = product.variants ?? [];
    if (product.availabilityType === 'available_to_order') {
      for (const variant of variants) available.add(variant.size);
      if (variants.length === 0) product.sizes.forEach((size) => available.add(size));
      continue;
    }

    if (variants.length > 0) {
      for (const variant of variants) {
        if (variant.active !== false && (variant.availableStock === undefined || variant.availableStock > 0)) {
          available.add(variant.size);
        }
      }
    } else if (!product.isSoldOut) {
      product.sizes.forEach((size) => available.add(size));
    }
  }

  return [...available].sort((left, right) => {
    const leftIndex = SIZE_ORDER.indexOf(left.toUpperCase());
    const rightIndex = SIZE_ORDER.indexOf(right.toUpperCase());
    if (leftIndex >= 0 || rightIndex >= 0) {
      return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex)
        - (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
    }
    return left.localeCompare(right);
  });
}

export function sortNewArrivals(products: Product[], sortKey: SortKey): Product[] {
  return [...products].sort((left, right) => {
    const newestFirst = productCreatedAt(right) - productCreatedAt(left);
    const stableNameOrder = left.name.localeCompare(right.name);

    switch (sortKey) {
      case 'NEWEST':
        return newestFirst || stableNameOrder;
      case 'PRICE_ASC':
        return left.priceNGN - right.priceNGN || newestFirst || stableNameOrder;
      case 'PRICE_DESC':
        return right.priceNGN - left.priceNGN || newestFirst || stableNameOrder;
      case 'FEATURED':
      default:
        return Number(Boolean(right.isBestSeller)) - Number(Boolean(left.isBestSeller))
          || newestFirst
          || stableNameOrder;
    }
  });
}
