import { parseCsv, serializeCsv, slugify } from '@piercyn/utils';
import { prisma } from '../../db/prisma';
import { ProductService } from '../products/productService';

export const MAX_IMPORT_ROWS = 200;
export const PRODUCT_CSV_HEADERS = [
  'name', 'slug', 'description', 'category', 'priceNGN', 'costPriceNGN', 'sku',
  'stockQuantity', 'size', 'colour', 'status', 'images', 'collection', 'tag',
];

export type ImportMode = 'CREATE' | 'UPDATE';

export interface CsvImportRow {
  row: number;
  values: Record<string, string>;
  errors: string[];
  action?: 'CREATE' | 'UPDATE';
  productId?: string;
}

function normalizeHeader(value: string): string {
  return value.trim().replace(/[ _-]+(.)?/g, (_match, character) => character ? character.toUpperCase() : '').replace(/^./, (character) => character.toLowerCase());
}

function optionalInteger(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseImages(value: string): string[] | undefined {
  if (!value.trim()) return undefined;
  return value.split('|').map((image) => image.trim()).filter(Boolean);
}

export async function validateProductCsv(csvText: string, mode: ImportMode): Promise<CsvImportRow[]> {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [{ row: 1, values: {}, errors: ['The CSV must include a header and at least one product row.'] }];
  if (rows.length - 1 > MAX_IMPORT_ROWS) return [{ row: 1, values: {}, errors: [`Imports are limited to ${MAX_IMPORT_ROWS} rows per request.`] }];

  const headers = rows[0].map(normalizeHeader);
  const requiredHeaders = ['name', 'description', 'category', 'priceNGN'];
  const headerErrors = requiredHeaders.filter((header) => !headers.includes(header));
  if (headerErrors.length) return [{ row: 1, values: {}, errors: [`Missing required column(s): ${headerErrors.join(', ')}.`] }];
  if (mode === 'UPDATE' && !headers.includes('sku')) return [{ row: 1, values: {}, errors: ['Update imports require a SKU column.'] }];

  const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  const categoryLookup = new Map(categories.flatMap((category) => [
    [category.id.toLowerCase(), category.id],
    [category.name.toLowerCase(), category.id],
    [category.slug.toLowerCase(), category.id],
  ]));
  const inputSkus = rows.slice(1).map((row) => row[headers.indexOf('sku')]?.trim()).filter(Boolean) as string[];
  const variants = inputSkus.length
    ? await prisma.productVariant.findMany({ where: { sku: { in: inputSkus } }, select: { sku: true, productId: true } })
    : [];
  const productsBySku = new Map(variants.map((variant) => [variant.sku, variant.productId]));
  const seenSlugs = new Set<string>();
  const seenSkus = new Set<string>();

  return rows.slice(1).map((row, index) => {
    const values = Object.fromEntries(headers.map((header, column) => [header, (row[column] || '').trim()]));
    const errors: string[] = [];
    const name = values.name;
    const sku = values.sku;
    const price = optionalInteger(values.priceNGN || '');
    const stock = optionalInteger(values.stockQuantity || '');
    const categoryId = categoryLookup.get((values.category || '').toLowerCase());
    const slug = values.slug || (name ? slugify(name) : '');

    if (!name) errors.push('Name is required.');
    if (!values.description) errors.push('Description is required.');
    if (!categoryId) errors.push('Category must match an existing category ID, name, or slug.');
    if (price === undefined || price <= 0) errors.push('priceNGN must be a positive whole number.');
    if (values.stockQuantity && stock === undefined) errors.push('stockQuantity must be a non-negative whole number.');
    if (values.status && !['ACTIVE', 'DRAFT', 'ARCHIVED'].includes(values.status.toUpperCase())) errors.push('Status must be ACTIVE, DRAFT, or ARCHIVED.');
    if (parseImages(values.images || '')?.some((image) => !/^https?:\/\//i.test(image))) errors.push('Image references must be authorized absolute URLs, separated with |.');
    if (slug && seenSlugs.has(slug)) errors.push('Duplicate slug in this file.');
    if (slug) seenSlugs.add(slug);
    if (sku && seenSkus.has(sku)) errors.push('Duplicate SKU in this file.');
    if (sku) seenSkus.add(sku);

    const productId = sku ? productsBySku.get(sku) : undefined;
    if (mode === 'CREATE' && productId) errors.push('SKU already belongs to an existing product; use update mode to modify it.');
    if (mode === 'UPDATE' && !sku) errors.push('SKU is required for update mode.');
    if (mode === 'UPDATE' && sku && !productId) errors.push('SKU does not match an existing product.');

    return { row: index + 2, values, errors, action: productId ? 'UPDATE' : 'CREATE', productId };
  });
}

export async function commitProductCsv(rows: CsvImportRow[], mode: ImportMode, allowPublish: boolean) {
  const validRows = rows.filter((row) => row.errors.length === 0);
  const results: Array<{ row: number; action: string; productId?: string; error?: string }> = [];

  for (const row of validRows) {
    try {
      const value = row.values;
      const category = await prisma.category.findFirst({
        where: { OR: [{ id: value.category }, { name: { equals: value.category, mode: 'insensitive' } }, { slug: value.category.toLowerCase() }] },
        select: { id: true },
      });
      if (!category) throw new Error('Category no longer exists.');
      const status = allowPublish && value.status === 'ACTIVE' ? 'ACTIVE' : (value.status === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT');
      const images = parseImages(value.images || '');
      const priceNGN = Number(value.priceNGN);

      if (mode === 'UPDATE' && row.productId) {
        const data: Record<string, unknown> = {
          name: value.name,
          slug: value.slug || slugify(value.name),
          description: value.description,
          categoryId: category.id,
          priceNGN,
          status,
        };
        const costPrice = optionalInteger(value.costPriceNGN || '');
        if (costPrice !== undefined) data.costPriceNGN = costPrice;
        if (images !== undefined) data.images = images;
        if (value.collection) data.collection = value.collection;
        if (value.tag) data.tag = value.tag;
        await ProductService.updateProduct(row.productId, data as any);
        results.push({ row: row.row, action: 'UPDATED', productId: row.productId });
      } else {
        const created = await ProductService.createProduct({
          name: value.name,
          slug: value.slug || undefined,
          description: value.description,
          categoryId: category.id,
          priceNGN,
          costPriceNGN: optionalInteger(value.costPriceNGN || ''),
          status: status as 'ACTIVE' | 'DRAFT' | 'ARCHIVED',
          images: images || [],
          collection: value.collection || undefined,
          tag: value.tag || undefined,
          variants: [{
            sku: value.sku || undefined,
            size: value.size || 'ONE_SIZE',
            colour: value.colour || 'Default',
            initialStock: optionalInteger(value.stockQuantity || '') ?? 0,
          }],
        });
        results.push({ row: row.row, action: 'CREATED', productId: created.id });
      }
    } catch (error: any) {
      results.push({ row: row.row, action: 'FAILED', error: error?.message || 'Could not import this row.' });
    }
  }
  return results;
}

export function createProductCsvTemplate() {
  return serializeCsv([
    PRODUCT_CSV_HEADERS,
    ['Essential Tee', 'essential-tee', 'Heavyweight cotton tee.', 'tees', 35000, 14000, 'PCY-TEE-BLK-M', 20, 'M', 'Black', 'DRAFT', 'https://cdn.example.com/essential-tee-front.jpg|https://cdn.example.com/essential-tee-back.jpg', 'essentials', 'CORE'],
  ]);
}

export function productRowsToCsv(products: Array<any>) {
  return serializeCsv([
    PRODUCT_CSV_HEADERS,
    ...products.map((product) => [
      product.name, product.slug, product.description, product.categoryName || product.categoryId,
      product.priceNGN, product.costPriceNGN, product.variants?.[0]?.sku || '', product.totalAvailableStock,
      product.variants?.[0]?.size || '', product.variants?.[0]?.colour || '', product.status,
      (product.images || []).join('|'), product.collection, product.tag || '',
    ]),
  ]);
}
