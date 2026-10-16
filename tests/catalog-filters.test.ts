import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server/app';
import { dbStore } from '../src/server/db/store';

describe('public catalog filtering', () => {
  beforeEach(() => dbStore.seedFromCatalog());

  it('filters by category, size, price, availability, and sorts numerically', async () => {
    const res = await request(app).get('/api/products')
      .query({ category: 'hoodies', sizes: 'M', minPrice: 1, maxPrice: 100000, inStock: true, sort: 'price-asc', limit: 100 });

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(res.body.count);
    expect(res.body.data.every((product: any) =>
      product.variants.some((variant: any) => variant.size === 'M' && variant.isAvailable)
      && product.priceNGN >= 1
      && product.priceNGN <= 100000
    )).toBe(true);
    const prices = res.body.data.map((product: any) => product.priceNGN);
    expect(prices).toEqual([...prices].sort((left: number, right: number) => left - right));
  });

  it('combines search with catalog filters and rejects invalid ranges', async () => {
    const valid = await request(app).get('/api/products').query({ search: 'hoodie', maxPrice: 100000, sort: 'newest' });
    expect(valid.status).toBe(200);
    expect(valid.body.data.every((product: any) => product.name.toLowerCase().includes('hoodie') || product.description.toLowerCase().includes('hoodie') || product.tag?.toLowerCase().includes('hoodie'))).toBe(true);

    const invalid = await request(app).get('/api/products').query({ minPrice: 10000, maxPrice: 5000 });
    expect(invalid.status).toBe(400);
    expect(invalid.body.success).toBe(false);
  });

  it('includes published-only rating summaries in listing and search responses', async () => {
    const allProducts = Array.from(dbStore.products.values());
    const reviewedProduct = allProducts[0];
    const unreviewedProduct = allProducts[allProducts.length - 1];

    const listing = await request(app).get('/api/products').query({ limit: 100 });
    expect(listing.status).toBe(200);
    expect(listing.body.data.find((product: any) => product.id === reviewedProduct.id).ratingSummary)
      .toMatchObject({ averageRating: 4.7, totalReviews: 3 });
    expect(listing.body.data.find((product: any) => product.id === unreviewedProduct.id).ratingSummary)
      .toEqual({ averageRating: null, totalReviews: 0 });

    const search = await request(app).get('/api/products').query({ search: reviewedProduct.name, limit: 100 });
    expect(search.status).toBe(200);
    expect(search.body.data.find((product: any) => product.id === reviewedProduct.id).ratingSummary)
      .toMatchObject({ averageRating: 4.7, totalReviews: 3 });
  });
});
