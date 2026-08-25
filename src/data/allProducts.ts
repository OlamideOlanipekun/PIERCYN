import { Product } from '../types';
import { PRODUCTS } from './products';
import { MENS_PRODUCTS } from './mensProducts';
import { WOMENS_PRODUCTS } from './womensProducts';

// Combine all products into a unified deduplicated dataset
const productMap = new Map<string, Product>();

[...PRODUCTS, ...MENS_PRODUCTS, ...WOMENS_PRODUCTS].forEach((p) => {
  if (!productMap.has(p.id)) {
    productMap.set(p.id, p);
  }
});

export const ALL_PRODUCTS: Product[] = Array.from(productMap.values());
