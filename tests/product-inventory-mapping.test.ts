import { describe, expect, it, vi } from 'vitest';

vi.mock('../apps/api/src/db/prisma', () => ({
  prisma: {},
  checkDatabaseHealth: vi.fn(async () => ({ ok: true, message: 'mocked' })),
}));

import { ProductService } from '../apps/api/src/modules/products/productService';

const productWithVariant = (overrides: Record<string, unknown> = {}) => ({
  id: 'product-1',
  name: 'Inventory test product',
  priceNGN: 12000,
  isSoldOut: false,
  variants: [
    {
      id: 'variant-1',
      productId: 'product-1',
      size: 'M',
      colour: 'Black',
      isActive: true,
      inventory: {
        stockQuantity: 5,
        reservedQuantity: 2,
        soldQuantity: 0,
        damagedQuantity: 0,
        returnedQuantity: 0,
      },
    },
  ],
  ...overrides,
});

describe('ProductService.mapPrismaProduct inventory status', () => {
  it('does not mark a restocked product sold out because of a stale product flag', () => {
    const mapped = ProductService.mapPrismaProduct(productWithVariant({ isSoldOut: true }), true);

    expect(mapped.totalAvailableStock).toBe(3);
    expect(mapped.variants[0].availableStock).toBe(3);
    expect(mapped.variants[0].stock.stockQuantity).toBe(5);
    expect(mapped.variants[0].stock.reservedStock).toBe(2);
    expect(mapped.isSoldOut).toBe(false);

    const publicMapped = ProductService.mapPrismaProduct(productWithVariant());
    expect(publicMapped.variants[0].stock).not.toHaveProperty('stockQuantity');
  });

  it('marks a product sold out when all variant stock is reserved or depleted', () => {
    const mapped = ProductService.mapPrismaProduct(productWithVariant({
      isSoldOut: false,
      variants: [{
        id: 'variant-1',
        productId: 'product-1',
        size: 'M',
        colour: 'Black',
        isActive: true,
        inventory: { stockQuantity: 2, reservedQuantity: 2 },
      }],
    }));

    expect(mapped.totalAvailableStock).toBe(0);
    expect(mapped.isSoldOut).toBe(true);
  });

  it('does not count inactive variants as sellable stock', () => {
    const mapped = ProductService.mapPrismaProduct(productWithVariant({
      variants: [{
        id: 'variant-1',
        productId: 'product-1',
        size: 'M',
        colour: 'Black',
        isActive: false,
        inventory: { stockQuantity: 5, reservedQuantity: 0 },
      }],
    }));

    expect(mapped.isSoldOut).toBe(true);
  });
});
