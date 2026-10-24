import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({ transaction: vi.fn() }));

vi.mock('../apps/api/src/db/prisma', () => ({
  prisma: { $transaction: dbMocks.transaction },
  checkDatabaseHealth: vi.fn(async () => ({ ok: true, message: 'mocked' })),
}));

import { ProductService } from '../apps/api/src/modules/products/productService';

describe('ProductService.updateProduct image removal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes deleted gallery URLs from variant image references in the same transaction', async () => {
    const returnedProduct = {
      id: 'product-1',
      slug: 'image-test',
      name: 'Image test product',
      description: 'A product used by the image removal test.',
      priceNGN: 12000,
      categoryId: 'category-1',
      status: 'ACTIVE',
      images: ['new-primary.jpg', 'keep.jpg'],
      variants: [
        {
          id: 'variant-1', productId: 'product-1', sku: 'SKU-1', size: 'M', colour: 'Black',
          colourHex: '#111111', image: 'new-primary.jpg', altImage: null, isActive: true,
          inventory: { stockQuantity: 2, reservedQuantity: 0, soldQuantity: 0, damagedQuantity: 0, returnedQuantity: 0 },
        },
        {
          id: 'variant-2', productId: 'product-1', sku: 'SKU-2', size: 'L', colour: 'Black',
          colourHex: '#111111', image: 'keep.jpg', altImage: null, isActive: true,
          inventory: { stockQuantity: 1, reservedQuantity: 0, soldQuantity: 0, damagedQuantity: 0, returnedQuantity: 0 },
        },
      ],
    };
    const tx = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          images: ['old-primary.jpg', 'keep.jpg'],
          variants: [
            { id: 'variant-1', image: 'old-primary.jpg', altImage: 'variant-only.jpg' },
            { id: 'variant-2', image: 'keep.jpg', altImage: null },
          ],
        }),
        update: vi.fn().mockResolvedValue({}),
        findUniqueOrThrow: vi.fn().mockResolvedValue(returnedProduct),
      },
      productVariant: { update: vi.fn().mockResolvedValue({}) },
    };
    dbMocks.transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));

    const result = await ProductService.updateProduct('product-1', {
      images: ['new-primary.jpg', 'keep.jpg'],
    });

    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { images: ['new-primary.jpg', 'keep.jpg'] },
    });
    expect(tx.productVariant.update).toHaveBeenCalledTimes(1);
    expect(tx.productVariant.update).toHaveBeenCalledWith({
      where: { id: 'variant-1' },
      data: { image: 'new-primary.jpg', altImage: null },
    });
    expect(result.images).toEqual(['new-primary.jpg', 'keep.jpg']);
    expect(result.variants.map((variant) => [variant.image, variant.altImage])).toEqual([
      ['new-primary.jpg', null],
      ['keep.jpg', null],
    ]);
  });

  it('rejects an empty product gallery before writing', async () => {
    await expect(ProductService.updateProduct('product-1', { images: [] })).rejects.toThrow(
      'A product must retain at least one image.',
    );
    expect(dbMocks.transaction).not.toHaveBeenCalled();
  });
});
