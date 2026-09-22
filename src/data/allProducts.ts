import { Product } from '../types';
import { PRODUCTS } from './products';
import { MENS_PRODUCTS } from './mensProducts';
import { WOMENS_PRODUCTS } from './womensProducts';

// Helper to ensure all items conform to full Product model
const normalizeProduct = (p: Product): Product => {
  const slug = p.slug || p.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const stock = p.stock !== undefined ? p.stock : (p.isSoldOut ? 0 : 25);
  const status = p.status || 'active';
  const createdAt = p.createdAt || '2026-01-01T00:00:00.000Z';
  return {
    ...p,
    slug,
    stock,
    status,
    createdAt,
  };
};

const productMap = new Map<string, Product>();

[...PRODUCTS, ...MENS_PRODUCTS, ...WOMENS_PRODUCTS].forEach((p) => {
  const normalized = normalizeProduct(p);
  if (!productMap.has(normalized.id)) {
    productMap.set(normalized.id, normalized);
  }
});

export const ALL_PRODUCTS: Product[] = Array.from(productMap.values());

