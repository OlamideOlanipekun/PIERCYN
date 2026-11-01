import { describe, expect, it } from 'vitest';
import type { Product } from '../src/types';
import {
  filterNewArrivals,
  getAvailableNewArrivalSizes,
  getNewArrivalProducts,
  isNewArrival,
  sortNewArrivals,
} from '../src/utils/newArrivals';

const now = new Date('2026-11-01T12:00:00.000Z');

function product(overrides: Partial<Product> & Pick<Product, 'id' | 'name'>): Product {
  return {
    id: overrides.id,
    name: overrides.name,
    slug: overrides.slug || overrides.id,
    category: overrides.category || 'hoodies',
    collection: overrides.collection || 'everyday',
    priceNGN: overrides.priceNGN ?? 30000,
    priceUSD: 20,
    priceGBP: 18,
    priceEUR: 20,
    description: 'Product test description',
    fit: 'Regular fit',
    fabric: 'Cotton',
    origin: 'Lagos',
    colors: [],
    sizes: [],
    images: [],
    ...overrides,
  };
}

describe('New Arrivals product logic', () => {
  it('includes flagged drops and products created in the last 30 days only', () => {
    const flaggedOld = product({ id: 'flagged', name: 'Flagged old item', isNewDrop: true, createdAt: '2026-01-01T00:00:00Z' });
    const recent = product({ id: 'recent', name: 'Recent item', createdAt: '2026-10-10T12:00:00Z' });
    const old = product({ id: 'old', name: 'Old item', createdAt: '2026-09-30T12:00:00Z' });
    const future = product({ id: 'future', name: 'Future item', createdAt: '2026-11-02T12:00:00Z' });
    const archived = product({ id: 'archived', name: 'Archived item', createdAt: '2026-10-25T12:00:00Z', status: 'archived' });

    expect(isNewArrival(flaggedOld, now)).toBe(true);
    expect(isNewArrival(recent, now)).toBe(true);
    expect(isNewArrival(old, now)).toBe(false);
    expect(isNewArrival(future, now)).toBe(false);
    expect(getNewArrivalProducts([flaggedOld, recent, old, future, archived], now).map((item) => item.id))
      .toEqual(['flagged', 'recent']);
  });

  it('sorts NEWEST by createdAt and breaks featured ties deterministically', () => {
    const older = product({ id: 'older', name: 'Older', priceNGN: 25000, createdAt: '2026-10-20T00:00:00Z' });
    const newer = product({ id: 'newer', name: 'Newer', priceNGN: 40000, createdAt: '2026-10-30T00:00:00Z' });
    const featured = product({ id: 'featured', name: 'Featured', isBestSeller: true, createdAt: '2026-10-01T00:00:00Z' });

    expect(sortNewArrivals([older, newer], 'NEWEST').map((item) => item.id)).toEqual(['newer', 'older']);
    expect(sortNewArrivals([older, newer, featured], 'FEATURED').map((item) => item.id))
      .toEqual(['featured', 'newer', 'older']);
    expect(sortNewArrivals([older, newer], 'PRICE_ASC').map((item) => item.id)).toEqual(['older', 'newer']);
    expect(sortNewArrivals([older, newer], 'PRICE_DESC').map((item) => item.id)).toEqual(['newer', 'older']);
  });

  it('filters by real garment categories and available sizes, including category aliases', () => {
    const tee = product({
      id: 'tee',
      name: 'Heavyweight tee',
      category: 'tees',
      sizes: ['S', 'M'],
      variants: [
        { id: 'tee-s', productId: 'tee', sku: 'TEE-S', size: 'S', colour: 'Black', colourHex: '#000', active: true, availableStock: 2 },
        { id: 'tee-m', productId: 'tee', sku: 'TEE-M', size: 'M', colour: 'Black', colourHex: '#000', active: false, availableStock: 0 },
      ],
    });
    const jacket = product({ id: 'jacket', name: 'Jacket', category: 'outerwear', sizes: ['M'], variants: [] });

    expect(filterNewArrivals([tee, jacket], 'T-SHIRTS', ['S']).map((item) => item.id)).toEqual(['tee']);
    expect(filterNewArrivals([tee, jacket], 'JACKETS').map((item) => item.id)).toEqual(['jacket']);
    expect(filterNewArrivals([tee], 'T-SHIRTS', ['M'])).toEqual([]);
    expect(getAvailableNewArrivalSizes([tee, jacket])).toEqual(['S', 'M']);
  });

  it('keeps available-to-order sizes available even when the variant has no local stock', () => {
    const orderable = product({
      id: 'orderable',
      name: 'Orderable jacket',
      category: 'jackets',
      availabilityType: 'available_to_order',
      sizes: ['M'],
      variants: [{ id: 'j-m', productId: 'orderable', sku: 'J-M', size: 'M', colour: 'Navy', colourHex: '#123', active: false, availableStock: 0 }],
    });

    expect(filterNewArrivals([orderable], 'JACKETS', ['M'])).toHaveLength(1);
    expect(getAvailableNewArrivalSizes([orderable])).toEqual(['M']);
  });
});
