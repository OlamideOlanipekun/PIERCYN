import express from 'express';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
vi.mock('../apps/api/src/modules/products/productService', () => ({
  CatalogUnavailableError: class CatalogUnavailableError extends Error {},
  ProductService: {
    getProductBySlugOrId: vi.fn(),
    getCategories: vi.fn(),
    getCatalog: vi.fn(),
  },
}));
vi.mock('../apps/api/src/modules/reviews/reviewService', () => ({
  ReviewService: { getProductRatingSummary: vi.fn() },
}));
import { seoFallbackRouter } from '../apps/api/src/routes/seoFallbackRouter';
import { ProductService } from '../apps/api/src/modules/products/productService';
import { ReviewService } from '../apps/api/src/modules/reviews/reviewService';

const buildDirectory = join(process.cwd(), 'build');
const templatePath = join(buildDirectory, 'index.html');
let hadTemplate = false;
let previousTemplate = '';
const app = express();
app.use('/api/seo', seoFallbackRouter);

const sampleProduct = {
  id: 'product-1',
  slug: 'heavy-weight-tee',
  name: 'Heavy Weight Tee',
  description: 'Quality heavyweight tee',
  shortDescription: '',
  priceNGN: 8000,
  categoryName: 'Tee',
  categorySlug: 'tee',
  category: 'tee',
  fit: 'Relaxed boxy cut',
  fabric: '100% heavyweight cotton',
  origin: 'Made in Lagos',
  images: ['https://cdn.example.test/heavy-tee.jpg'],
  isSoldOut: false,
  variants: [{ active: true, isAvailable: true, availableStock: 4, sku: 'TEE-M' }],
};

beforeAll(() => {
  mkdirSync(buildDirectory, { recursive: true });
  hadTemplate = existsSync(templatePath);
  if (hadTemplate) previousTemplate = readFileSync(templatePath, 'utf8');
  writeFileSync(templatePath, '<!doctype html><html><head><title>PIERCYN</title><meta name="description" content="old"><meta name="robots" content="index, follow"><link rel="canonical" href="https://piercyn.vercel.app/"><script type="application/ld+json">{"@type":"WebSite"}</script></head><body><div id="root"><section><div>Old homepage</div></section></div><script type="module" src="/assets/app.js"></script></body></html>');
});

afterEach(() => vi.restoreAllMocks());

afterAll(() => {
  if (hadTemplate) writeFileSync(templatePath, previousTemplate);
  else rmSync(templatePath, { force: true });
});

describe('SEO fallback routes', () => {
  it('returns an HTML 404 with noindex for a missing URL and removes stale canonical/schema markup', async () => {
    const response = await request(app).get('/api/seo/fallback').query({ path: 'made-up-page' });
    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('<title>Page not found | PIERCYN</title>');
    expect(response.text).toContain('noindex, nofollow');
    expect(response.text).toContain('This PIERCYN page does not exist');
    expect(response.text).not.toContain('rel="canonical"');
    expect(response.text).not.toContain('application/ld+json');
    expect(response.text).not.toContain('Old homepage');
    expect(response.text).toContain('<script type="module" src="/assets/app.js"></script>');
  });

  it('keeps private dynamic SPA routes available but marks them noindex and non-cacheable', async () => {
    const response = await request(app).get('/api/seo/fallback').query({ path: '/orders/private-order-reference' });
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toContain('private');
    expect(response.text).toContain('noindex, nofollow');
    expect(response.text).toContain('Loading your store page');
  });

  it('renders current product details and only real aggregated review data in Product JSON-LD', async () => {
    vi.spyOn(ProductService, 'getProductBySlugOrId').mockResolvedValue(sampleProduct as any);
    vi.spyOn(ReviewService, 'getProductRatingSummary').mockResolvedValue({
      averageRating: 4.5,
      totalReviews: 2,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
    });

    const response = await request(app).get('/api/seo/fallback').query({ path: '/products/heavy-weight-tee' });
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.headers['cache-control']).toContain('s-maxage=60');
    expect(response.text).toContain('<title>Heavy Weight Tee | PIERCYN Lagos</title>');
    expect(response.text).toContain('https://piercyn.vercel.app/products/heavy-weight-tee');
    expect(response.text).toContain('Heavy Weight Tee');
    expect(response.text).toContain('8000');
    const jsonLdText = response.text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    expect(jsonLdText).toBeTruthy();
    const jsonLd = JSON.parse(jsonLdText!);
    expect(jsonLd['@type']).toBe('Product');
    expect(jsonLd.offers.availability).toBe('https://schema.org/InStock');
    expect(jsonLd.aggregateRating).toMatchObject({ ratingValue: 4.5, reviewCount: 2 });
  });

  it('renders categories from the live catalog and returns a genuine 404 for an unknown category', async () => {
    vi.spyOn(ProductService, 'getCategories').mockResolvedValue([{ id: 'cat-1', slug: 'tees', name: 'Character Tees', description: 'Signature tees from PIERCYN.' }] as any);
    vi.spyOn(ProductService, 'getCatalog').mockResolvedValue({ products: [sampleProduct], total: 1, page: 1, limit: 100, totalPages: 1 } as any);

    const response = await request(app).get('/api/seo/fallback').query({ path: '/category/tees' });
    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>Character Tees Clothing | PIERCYN Lagos</title>');
    expect(response.text).toContain('<h1>Character Tees from PIERCYN</h1>');
    expect(response.text).toContain('/products/heavy-weight-tee');

    const missing = await request(app).get('/api/seo/fallback').query({ path: '/category/not-a-category' });
    expect(missing.status).toBe(404);
  });

  it('renders the homepage from the live catalog if the static file is bypassed', async () => {
    vi.spyOn(ProductService, 'getCatalog').mockResolvedValue({ products: [sampleProduct], total: 1, page: 1, limit: 12, totalPages: 1 } as any);
    vi.spyOn(ProductService, 'getCategories').mockResolvedValue([{ id: 'cat-1', slug: 'tees', name: 'Tees' }] as any);

    const response = await request(app).get('/api/seo/fallback');
    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>PIERCYN Lagos | Nigerian Streetwear &amp; Fashion</title>');
    expect(response.text).toContain('index, follow, max-image-preview:large');
    expect(response.text).toContain('https://piercyn.vercel.app/');
    expect(response.text).toContain('/category/tees');
    expect(response.text).toContain('/products/heavy-weight-tee');
    expect(response.text).toContain('application/ld+json');
  });

  it('redirects legacy product and category URL forms to their canonical routes', async () => {
    const productResponse = await request(app).get('/api/seo/fallback').query({ path: '/product/heavy-weight-tee' });
    expect(productResponse.status).toBe(301);
    expect(productResponse.headers.location).toBe('/products/heavy-weight-tee');

    const categoryResponse = await request(app).get('/api/seo/fallback').query({ path: '/categories/tees' });
    expect(categoryResponse.status).toBe(301);
    expect(categoryResponse.headers.location).toBe('/category/tees');
  });
});
