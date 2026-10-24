import { describe, expect, it } from 'vitest';
import type { Product } from '../src/types';
import { findProductVariant, resolveProductVariant, usesSizeOnlyOptions } from '../src/utils/variants';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'short-denim-jeans',
  name: 'Short Denim Jeans',
  category: 'trousers',
  categoryName: 'Short jeans',
  collection: 'essentials',
  priceNGN: 20000,
  priceUSD: 20,
  priceGBP: 18,
  priceEUR: 19,
  description: 'Denim shorts',
  fit: 'Relaxed',
  fabric: 'Denim',
  origin: 'Lagos',
  colors: [{ name: 'Pitch Black', hex: '#111111', image: '/shorts.jpg' }],
  sizes: ['M', 'L', 'XL', '2XL', '3XL'],
  images: ['/shorts.jpg'],
  stock: 4,
  variants: [
    { id: 'variant-m-black', productId: 'short-denim-jeans', sku: 'SHORT-M-BLK', size: 'M', colour: 'Pitch Black', colourHex: '#111111', active: true, availableStock: 4 },
    { id: 'variant-2xl-no-colour', productId: 'short-denim-jeans', sku: 'SHORT-2XL-NOCOL', size: '2XL', colour: 'No colour', colourHex: '#F2F0EB', active: false, availableStock: 0 },
    { id: 'variant-3xl-no-colour', productId: 'short-denim-jeans', sku: 'SHORT-3XL-NOCOL', size: '3XL', colour: 'No colour', colourHex: '#F2F0EB', active: true, availableStock: 3 },
  ],
  ...overrides,
});

describe('size-only bottoms variants', () => {
  it('identifies trousers, shorts, and jeans by their catalog category', () => {
    expect(usesSizeOnlyOptions({ category: 'trousers', categoryName: 'Short jeans' })).toBe(true);
    expect(usesSizeOnlyOptions({ category: 'jeans', categoryName: 'Baggy Jeans' })).toBe(true);
    expect(usesSizeOnlyOptions({ category: 'hoodies', categoryName: 'Hoodies' })).toBe(false);
  });

  it('resolves a size-only variant without exposing a color choice', () => {
    const product = makeProduct();
    expect(findProductVariant(product, 'Pitch Black', '3XL')?.id).toBe('variant-3xl-no-colour');
    expect(resolveProductVariant(product, 'Pitch Black', '3XL').id).toBe('variant-3xl-no-colour');
  });

  it('retains zero-stock size variants as unavailable inventory records', () => {
    const variant = findProductVariant(makeProduct(), 'Pitch Black', '2XL');
    expect(variant?.id).toBe('variant-2xl-no-colour');
    expect(variant?.availableStock).toBe(0);
    expect(variant?.active).toBe(false);
  });

  it('prefers a stocked existing variant when legacy product records still contain colors', () => {
    const product = makeProduct({
      variants: [
        { id: 'out-of-stock-first', productId: 'short-denim-jeans', sku: 'S-XL-A', size: 'XL', colour: 'Pitch Black', colourHex: '#111111', active: false, availableStock: 0 },
        { id: 'stocked-second', productId: 'short-denim-jeans', sku: 'S-XL-B', size: 'XL', colour: 'Olive Sage', colourHex: '#556B2F', active: true, availableStock: 5 },
      ],
    });
    expect(findProductVariant(product, 'Pitch Black', 'XL')?.id).toBe('stocked-second');
  });
});
