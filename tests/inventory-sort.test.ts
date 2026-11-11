/**
 * PIERCYN — Availability-First Storefront Sort Tests
 *
 * Verifies that ProductService.getAllProducts() and the front-end ShopPage
 * useMemo sort both apply the availability-first → price-ascending rule.
 *
 * Uses mocked Prisma so no live DB is required; covers every acceptance
 * criterion from the inventory-sort implementation plan.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// ─── Hoist the mock fn so vi.mock factory can reference it ──────────────────
// vi.mock() is hoisted to the top of the compiled file; variables declared
// with vi.hoisted() are initialized before that hoisting happens.

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock('../apps/api/src/db/prisma', () => ({
  prisma: {
    product: { findMany: mockFindMany },
  },
  checkDatabaseHealth: vi.fn(async () => ({ ok: true, message: 'mocked' })),
}));

import { ProductService } from '../apps/api/src/modules/products/productService';

// ─── Fixtures ───────────────────────────────────────────────────────────────

function makeVariant(stock: number, reserved = 0) {
  return {
    id: `v-${Math.random().toString(36).slice(2)}`,
    productId: 'p',
    sku: `SKU-${Math.random().toString(36).slice(2)}`,
    size: 'M',
    colour: 'Black',
    colourHex: '#000',
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    inventory: {
      stockQuantity: stock,
      reservedQuantity: reserved,
      soldQuantity: 0,
      damagedQuantity: 0,
      returnedQuantity: 0,
    },
  };
}

function makeProduct(id: string, name: string, priceNGN: number, stock: number, reserved = 0) {
  return {
    id,
    slug: id,
    name,
    description: '',
    priceNGN,
    costPriceNGN: 0,
    priceUSD: 0,
    priceGBP: 0,
    priceEUR: 0,
    categoryId: 'cat-1',
    category: { id: 'cat-1', name: 'Tees', slug: 'tees', isActive: true, sortOrder: 0 },
    collection: 'essentials',
    status: 'ACTIVE',
    images: [],
    isSoldOut: stock - reserved <= 0,
    isNewDrop: false,
    isBestSeller: false,
    isLimited: false,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    variants: [makeVariant(stock, reserved)],
  };
}

// ─── Availability-first sort (the core behaviour) ───────────────────────────

describe('Availability-first storefront sort (getAllProducts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('places in-stock products before sold-out products', async () => {
    // DB returns products (the query sorts price-asc first; availability partition is applied after)
    mockFindMany.mockResolvedValue([
      makeProduct('tee-a', 'Graphics Tee A', 5000, 0),   // SOLD OUT
      makeProduct('tee-b', 'Graphics Tee B', 7000, 3),   // in stock
      makeProduct('tee-c', 'Graphics Tee C', 6000, 2),   // in stock
      makeProduct('tee-d', 'Graphics Tee D', 8000, 0),   // SOLD OUT
      makeProduct('tee-e', 'Graphics Tee E', 4500, 1),   // in stock
    ]);

    const products = await ProductService.getAllProducts({ sort: 'availability' });

    // Every in-stock product must appear before every sold-out product
    const firstSoldOutIdx = products.findIndex((p) => p.isSoldOut);
    const lastInStockIdxFwd = products.reduce(
      (last, p, idx) => (!p.isSoldOut ? idx : last),
      -1
    );
    expect(firstSoldOutIdx).toBeGreaterThan(lastInStockIdxFwd);
  });

  it('sorts the in-stock group price-asc and the sold-out group price-asc (spec example)', async () => {
    // The DB query uses ORDER BY priceNGN ASC first so rows arrive price-sorted;
    // the partition simply splits them into two groups.
    mockFindMany.mockResolvedValue([
      makeProduct('tee-e', 'Graphics Tee E', 4500, 1),   // cheapest in-stock
      makeProduct('tee-a', 'Graphics Tee A', 5000, 0),   // cheapest sold-out
      makeProduct('tee-c', 'Graphics Tee C', 6000, 2),
      makeProduct('tee-b', 'Graphics Tee B', 7000, 3),
      makeProduct('tee-d', 'Graphics Tee D', 8000, 0),
    ]);

    const products = await ProductService.getAllProducts({ sort: 'availability' });

    const inStock = products.filter((p) => !p.isSoldOut);
    const soldOut  = products.filter((p) =>  p.isSoldOut);

    // In-stock group: ₦4,500 → ₦6,000 → ₦7,000
    expect(inStock.map((p) => p.priceNGN)).toEqual([4500, 6000, 7000]);
    // Sold-out group: ₦5,000 → ₦8,000
    expect(soldOut.map((p) => p.priceNGN)).toEqual([5000, 8000]);

    // Full expected order per spec: E, C, B, A, D
    expect(products.map((p) => p.id)).toEqual(['tee-e', 'tee-c', 'tee-b', 'tee-a', 'tee-d']);
  });

  it('applies the same availability-first rule for the default (no sort param) mode', async () => {
    mockFindMany.mockResolvedValue([
      makeProduct('a', 'A', 5000, 0),  // sold-out but cheapest
      makeProduct('b', 'B', 10000, 5), // in-stock
    ]);

    const products = await ProductService.getAllProducts();

    expect(products[0].id).toBe('b'); // in-stock comes first
    expect(products[1].id).toBe('a'); // sold-out goes last
  });

  it('price-asc sort does NOT apply the availability partition', async () => {
    // With sort=price-asc the partition is skipped; raw DB order is returned.
    mockFindMany.mockResolvedValue([
      makeProduct('a', 'A', 10000, 0), // sold-out but first in price-asc order
      makeProduct('b', 'B', 50000, 5),
    ]);

    const products = await ProductService.getAllProducts({ sort: 'price-asc' });

    // Returned as-is from the DB (no partition for price-asc)
    expect(products.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('sold-out products remain visible — they are not filtered out', async () => {
    mockFindMany.mockResolvedValue([
      makeProduct('x', 'X', 1000, 0),
      makeProduct('y', 'Y', 2000, 0),
    ]);

    const products = await ProductService.getAllProducts({ sort: 'availability' });
    expect(products).toHaveLength(2);
    expect(products.every((p) => p.isSoldOut)).toBe(true);
  });

  it('equal prices within a group are ordered stably', async () => {
    // Both in-stock items have the same price — DB order is preserved
    mockFindMany.mockResolvedValue([
      makeProduct('a', 'A', 5000, 3),
      makeProduct('b', 'B', 5000, 2),
      makeProduct('c', 'C', 5000, 0), // sold-out
    ]);

    const products = await ProductService.getAllProducts({ sort: 'availability' });

    expect(products.filter((p) => !p.isSoldOut).map((p) => p.id)).toEqual(['a', 'b']);
    expect(products.filter((p) =>  p.isSoldOut).map((p) => p.id)).toEqual(['c']);
  });
});

// ─── isSoldOut flag derivation via mapPrismaProduct ─────────────────────────

describe('ProductService.mapPrismaProduct isSoldOut derivation', () => {
  it('a product with ALL variants at zero available stock is isSoldOut', () => {
    const raw = makeProduct('p1', 'P1', 10000, 0);
    const mapped = ProductService.mapPrismaProduct(raw);
    expect(mapped.isSoldOut).toBe(true);
    expect(mapped.totalAvailableStock).toBe(0);
  });

  it('a product with at least one available variant is NOT isSoldOut', () => {
    const raw = {
      ...makeProduct('p2', 'P2', 10000, 0),
      variants: [
        makeVariant(0),    // sold-out variant
        makeVariant(5, 1), // available variant (5 - 1 = 4 available)
      ],
    };
    const mapped = ProductService.mapPrismaProduct(raw);
    expect(mapped.isSoldOut).toBe(false);
    expect(mapped.totalAvailableStock).toBe(4);
  });

  it('fully-reserved stock = sold out (reservation accuracy)', () => {
    const raw = makeProduct('p', 'P', 5000, 3, 3); // stock=3 reserved=3 → available=0
    const mapped = ProductService.mapPrismaProduct(raw);
    expect(mapped.isSoldOut).toBe(true);
    expect(mapped.totalAvailableStock).toBe(0);
  });

  it('partially-reserved product is NOT sold out', () => {
    const raw = makeProduct('p', 'P', 5000, 5, 3); // stock=5 reserved=3 → available=2
    const mapped = ProductService.mapPrismaProduct(raw);
    expect(mapped.isSoldOut).toBe(false);
    expect(mapped.totalAvailableStock).toBe(2);
  });

  it('stale isSoldOut DB flag is overridden by live inventory (restocked product)', () => {
    // DB flag says sold-out but live stock is positive → NOT sold out
    const raw = { ...makeProduct('p3', 'P3', 8000, 5), isSoldOut: true };
    const mapped = ProductService.mapPrismaProduct(raw);
    expect(mapped.isSoldOut).toBe(false);
  });

  it('inactive variant with stock is excluded from sellable stock (isSoldOut=true)', () => {
    // mapPrismaProduct counts totalAvailableStock from all variants regardless of isActive
    // but determines isSoldOut via hasSellableStock which only counts active variants.
    // An inactive variant with stock means isSoldOut=true even though totalAvailableStock>0.
    const raw = {
      ...makeProduct('p', 'P', 5000, 0),
      variants: [{ ...makeVariant(10, 0), isActive: false }],
    };
    const mapped = ProductService.mapPrismaProduct(raw);
    // isSoldOut = true because no ACTIVE variant has available stock
    expect(mapped.isSoldOut).toBe(true);
    // The variant's isAvailable flag is correctly false
    expect(mapped.variants[0].isAvailable).toBe(false);
  });
});

// ─── Frontend sort: ShopPage useMemo availability-first ─────────────────────

describe('Front-end availability-first sort (ShopPage useMemo logic)', () => {
  /**
   * This replicates exactly the sort comparator implemented in ShopPage.tsx
   * so we can unit-test it without mounting the React component.
   */
  function frontendSort(
    products: Array<{ id: string; priceNGN: number; isSoldOut: boolean; createdAt?: string }>,
    sortBy: 'availability' | 'newest' | 'price-low' | 'price-high' = 'availability'
  ) {
    return [...products].sort((a, b) => {
      // Availability partition — always applied first regardless of sortBy
      const aAvail = a.isSoldOut ? 1 : 0;
      const bAvail = b.isSoldOut ? 1 : 0;
      if (aAvail !== bAvail) return aAvail - bAvail;

      // Secondary sort within each group
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'price-low')  return a.priceNGN - b.priceNGN;
      if (sortBy === 'price-high') return b.priceNGN - a.priceNGN;
      return a.priceNGN - b.priceNGN; // 'availability' default: price-asc
    });
  }

  const products = [
    { id: 'tee-a', priceNGN: 5000, isSoldOut: true,  createdAt: '2026-01-01' },
    { id: 'tee-b', priceNGN: 7000, isSoldOut: false, createdAt: '2026-01-03' },
    { id: 'tee-c', priceNGN: 6000, isSoldOut: false, createdAt: '2026-01-02' },
    { id: 'tee-d', priceNGN: 8000, isSoldOut: true,  createdAt: '2026-01-04' },
    { id: 'tee-e', priceNGN: 4500, isSoldOut: false, createdAt: '2026-01-05' },
  ];

  it('availability sort: in-stock first, price-asc within each group (spec example)', () => {
    const sorted = frontendSort(products, 'availability');
    expect(sorted.map((p) => p.id)).toEqual(['tee-e', 'tee-c', 'tee-b', 'tee-a', 'tee-d']);
  });

  it('price-low sort: availability partition is applied, then price-asc within groups', () => {
    const sorted = frontendSort(products, 'price-low');
    // In-stock (4500, 6000, 7000) before sold-out (5000, 8000)
    expect(sorted.map((p) => p.id)).toEqual(['tee-e', 'tee-c', 'tee-b', 'tee-a', 'tee-d']);
  });

  it('price-high sort: availability partition is applied, then price-desc within groups', () => {
    const sorted = frontendSort(products, 'price-high');
    // In-stock desc (7000, 6000, 4500) before sold-out desc (8000, 5000)
    expect(sorted.map((p) => p.id)).toEqual(['tee-b', 'tee-c', 'tee-e', 'tee-d', 'tee-a']);
  });

  it('newest sort: availability partition is applied, then newest-first within groups', () => {
    const sorted = frontendSort(products, 'newest');
    // In-stock newest-first: tee-e (Jan 5), tee-b (Jan 3), tee-c (Jan 2)
    // Sold-out newest-first: tee-d (Jan 4), tee-a (Jan 1)
    expect(sorted.map((p) => p.id)).toEqual(['tee-e', 'tee-b', 'tee-c', 'tee-d', 'tee-a']);
  });

  it('sold-out products are always at the bottom, never filtered away', () => {
    const sorted = frontendSort(products, 'availability');
    expect(sorted.filter((p) => p.isSoldOut)).toHaveLength(2);
    expect(sorted.slice(-2).every((p) => p.isSoldOut)).toBe(true);
  });

  it('a restocked product moves back to the in-stock group automatically', () => {
    // Before restock: tee-d is at the bottom
    const before = frontendSort(products, 'availability');
    expect(before[before.length - 1].id).toBe('tee-d');

    // Simulate restock: tee-d (₦8,000) now has stock
    const restocked = products.map((p) => p.id === 'tee-d' ? { ...p, isSoldOut: false } : p);
    const after = frontendSort(restocked, 'availability');

    const afterSoldOut = after.filter((p) => p.isSoldOut);
    expect(afterSoldOut).toHaveLength(1);
    expect(afterSoldOut[0].id).toBe('tee-a'); // only tee-a remains sold-out

    // tee-d (₦8,000) now appears in the in-stock section, after tee-b (₦7,000)
    const afterInStock = after.filter((p) => !p.isSoldOut);
    expect(afterInStock.map((p) => p.id)).toEqual(['tee-e', 'tee-c', 'tee-b', 'tee-d']);
  });

  it('a purchase that sells the last unit moves the product to sold-out section', () => {
    // tee-e (₦4,500) sells out
    const afterSale = products.map((p) => p.id === 'tee-e' ? { ...p, isSoldOut: true } : p);
    const sorted = frontendSort(afterSale, 'availability');

    // tee-e should now be in the sold-out tail
    const soldOutIds = sorted.filter((p) => p.isSoldOut).map((p) => p.id);
    expect(soldOutIds).toContain('tee-e');

    // The remaining in-stock products should still come first
    const inStockIds = sorted.filter((p) => !p.isSoldOut).map((p) => p.id);
    expect(inStockIds).toEqual(['tee-c', 'tee-b']); // ₦6,000 then ₦7,000
  });
});

// ─── syncProductSoldOutFlag unit tests (mocked transaction) ─────────────────

describe('InventoryService.syncProductSoldOutFlag', () => {
  it('is a callable static method on InventoryService', async () => {
    const { InventoryService } = await import('../apps/api/src/modules/inventory/inventoryService');
    expect(typeof InventoryService.syncProductSoldOutFlag).toBe('function');
  });

  it('marks product sold out when available stock query returns 0', async () => {
    const updateMock = vi.fn().mockResolvedValue({});
    const tx = {
      productVariant: { findUnique: vi.fn().mockResolvedValue({ productId: 'prod-1' }) },
      $queryRaw: vi.fn().mockResolvedValue([{ available: 0 }]),
      product: { update: updateMock },
    };

    const { InventoryService } = await import('../apps/api/src/modules/inventory/inventoryService');
    await InventoryService.syncProductSoldOutFlag('variant-1', tx);

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { isSoldOut: true },
    });
  });

  it('marks product NOT sold out when available stock is positive', async () => {
    const updateMock = vi.fn().mockResolvedValue({});
    const tx = {
      productVariant: { findUnique: vi.fn().mockResolvedValue({ productId: 'prod-1' }) },
      $queryRaw: vi.fn().mockResolvedValue([{ available: 4 }]),
      product: { update: updateMock },
    };

    const { InventoryService } = await import('../apps/api/src/modules/inventory/inventoryService');
    await InventoryService.syncProductSoldOutFlag('variant-1', tx);

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { isSoldOut: false },
    });
  });

  it('does nothing when variantId does not resolve to a product', async () => {
    const updateMock = vi.fn();
    const tx = {
      productVariant: { findUnique: vi.fn().mockResolvedValue(null) },
      $queryRaw: vi.fn(),
      product: { update: updateMock },
    };

    const { InventoryService } = await import('../apps/api/src/modules/inventory/inventoryService');
    await InventoryService.syncProductSoldOutFlag('nonexistent', tx);

    expect(updateMock).not.toHaveBeenCalled();
  });
});
