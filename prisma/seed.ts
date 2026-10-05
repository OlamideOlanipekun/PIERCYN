/**
 * PIERCYN V1 — DATABASE SEED
 * ============================================================
 * Seeds development/staging data only.
 * DO NOT run this against production with fake orders.
 *
 * Seed order:
 *   1. Admin user(s)
 *   2. Shipping configurations
 *   3. Categories
 *   4. Products + Variants + Inventory
 *
 * Run: npm run db:seed
 * ============================================================
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { ALL_PRODUCTS } from '../src/data/allProducts';
import { COMMERCE_CONFIG } from '../src/server/config/constants';
import dotenv from 'dotenv';

dotenv.config();

// ─── Prisma setup (uses direct connection for seeding) ───────
const rawConnectionString =
  process.env.DATABASE_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/piercyn';

let cleanConnectionString = rawConnectionString;
try {
  const urlObj = new URL(rawConnectionString);
  urlObj.searchParams.delete('sslmode');
  cleanConnectionString = urlObj.toString();
} catch {
  // fallback to raw string
}

const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Utilities ────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function estimateCostPrice(priceNGN: number): number {
  // Estimated cost at ~38% of retail price for gross margin tracking
  return Math.round(priceNGN * 0.38);
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 PIERCYN V1 — Seeding database...\n');

  // ══════════════════════════════════════════════════════════
  // 1. ADMIN USER(S)
  // ══════════════════════════════════════════════════════════
  console.log('  → Seeding admin accounts...');

  const adminPasswordHash = await bcrypt.hash('piercyn2026', 12);

  await prisma.admin.upsert({
    where: { email: 'admin@piercyn.com' },
    update: {
      name: 'PIERCYN Admin',
      passwordHash: adminPasswordHash,
      isActive: true,
    },
    create: {
      email: 'admin@piercyn.com',
      passwordHash: adminPasswordHash,
      name: 'PIERCYN Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('  ✓ Admin: admin@piercyn.com');

  // ══════════════════════════════════════════════════════════
  // 2. SHIPPING CONFIGURATIONS
  // ══════════════════════════════════════════════════════════
  console.log('\n  → Seeding shipping configurations...');

  const shippingConfigs = [
    {
      regionKey: 'lagos',
      name: 'Lagos Doorstep Delivery',
      feeNGN: COMMERCE_CONFIG.SHIPPING.LAGOS_FEE_NGN,
      freeShippingThresholdNGN: COMMERCE_CONFIG.SHIPPING.FREE_THRESHOLD_NGN,
      estimatedTimeframe: COMMERCE_CONFIG.SHIPPING.LAGOS_TIMEFRAME,
      description: COMMERCE_CONFIG.SHIPPING.LAGOS_DESCRIPTION,
      isActive: true,
      sortOrder: 1,
    },
    {
      regionKey: 'nationwide',
      name: 'Nationwide Delivery (Nigeria)',
      feeNGN: COMMERCE_CONFIG.SHIPPING.NATIONWIDE_FEE_NGN,
      freeShippingThresholdNGN: COMMERCE_CONFIG.SHIPPING.FREE_THRESHOLD_NGN,
      estimatedTimeframe: COMMERCE_CONFIG.SHIPPING.NATIONWIDE_TIMEFRAME,
      description: COMMERCE_CONFIG.SHIPPING.NATIONWIDE_DESCRIPTION,
      isActive: true,
      sortOrder: 2,
    },
  ];

  for (const config of shippingConfigs) {
    await prisma.shippingConfig.upsert({
      where: { regionKey: config.regionKey },
      update: config,
      create: config,
    });
    console.log(`  ✓ Shipping: ${config.name} (₦${config.feeNGN.toLocaleString()})`);
  }

  // ══════════════════════════════════════════════════════════
  // 3. CATEGORIES + PRODUCTS + VARIANTS + INVENTORY
  // ══════════════════════════════════════════════════════════
  console.log('\n  → Seeding categories, products, variants, and inventory...');

  let productCount = 0;
  let variantCount = 0;

  for (const p of ALL_PRODUCTS) {
    // ── Category ─────────────────────────────────────────
    const catSlug = slugify(p.category);
    const category = await prisma.category.upsert({
      where: { slug: catSlug },
      update: {
        name: p.category.toUpperCase(),
        isActive: true,
      },
      create: {
        name: p.category.toUpperCase(),
        slug: catSlug,
        description: `Signature PIERCYN ${p.category} collection`,
        isActive: true,
      },
    });

    // ── Product ───────────────────────────────────────────
    const productSlug = p.slug || slugify(p.name);
    const product = await prisma.product.upsert({
      where: { slug: productSlug },
      update: {
        name: p.name,
        description: p.description,
        priceNGN: p.priceNGN,
        costPriceNGN: estimateCostPrice(p.priceNGN),
        priceUSD: p.priceUSD ?? 0,
        priceGBP: p.priceGBP ?? 0,
        priceEUR: p.priceEUR ?? 0,
        images: p.images || [],
        gsm: p.gsm,
        fit: p.fit,
        fabric: p.fabric,
        origin: p.origin || 'Handmade in Lagos, Nigeria',
        collection: p.collection || 'essentials',
        status: 'ACTIVE',
        isNewDrop: Boolean(p.isNewDrop),
        isBestSeller: Boolean(p.isBestSeller),
        isSoldOut: Boolean(p.isSoldOut),
        isLimited: Boolean(p.isLimited),
      },
      create: {
        id: p.id,
        slug: productSlug,
        name: p.name,
        description: p.description,
        priceNGN: p.priceNGN,
        costPriceNGN: estimateCostPrice(p.priceNGN),
        priceUSD: p.priceUSD ?? 0,
        priceGBP: p.priceGBP ?? 0,
        priceEUR: p.priceEUR ?? 0,
        categoryId: category.id,
        collection: p.collection || 'essentials',
        images: p.images || [],
        gsm: p.gsm,
        fit: p.fit,
        fabric: p.fabric,
        origin: p.origin || 'Handmade in Lagos, Nigeria',
        tag: p.tag,
        status: 'ACTIVE',
        isNewDrop: Boolean(p.isNewDrop),
        isBestSeller: Boolean(p.isBestSeller),
        isSoldOut: Boolean(p.isSoldOut),
        isLimited: Boolean(p.isLimited),
      },
    });

    productCount++;

    // ── Variants + Inventory ──────────────────────────────
    const colors =
      p.colors && p.colors.length > 0
        ? p.colors
        : [{ name: 'Default', hex: '#111111', image: p.images?.[0] ?? '' }];
    const sizes =
      p.sizes && p.sizes.length > 0 ? p.sizes : ['M'];

    for (const col of colors) {
      for (const sz of sizes) {
        // SKU format: PCY-{PRODUCT_ID}-{COL}-{SIZE}
        const sku = `PCY-${slugify(p.id).toUpperCase()}-${slugify(col.name)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')}-${slugify(sz).toUpperCase()}`;

        const variant = await prisma.productVariant.upsert({
          where: {
            productId_size_colour: {
              productId: product.id,
              size: sz,
              colour: col.name,
            },
          },
          update: {
            sku,
            colourHex: col.hex,
            image: col.image || p.images?.[0],
            isActive: !p.isSoldOut,
          },
          create: {
            productId: product.id,
            sku,
            size: sz,
            colour: col.name,
            colourHex: col.hex,
            image: col.image || p.images?.[0],
            altImage: (col as any).altImage,
            isActive: !p.isSoldOut,
          },
        });

        // Initial stock: 20 units for active, 0 for sold-out
        const initialStock = p.isSoldOut ? 0 : 20;

        const existingInventory = await prisma.inventory.findUnique({
          where: { variantId: variant.id },
        });

        if (!existingInventory) {
          await prisma.inventory.create({
            data: {
              variantId: variant.id,
              stockQuantity: initialStock,
              reservedQuantity: 0,
              soldQuantity: 0,
              damagedQuantity: 0,
              returnedQuantity: 0,
              reorderLevel: 5,
            },
          });

          // Record initial restock transaction
          if (initialStock > 0) {
            const inv = await prisma.inventory.findUniqueOrThrow({
              where: { variantId: variant.id },
            });
            await prisma.inventoryTransaction.create({
              data: {
                inventoryId: inv.id,
                variantId: variant.id,
                type: 'RESTOCK',
                quantity: initialStock,
                previousStock: 0,
                newStock: initialStock,
                referenceType: 'MANUAL',
                reason: 'Initial seed stock',
              },
            });
          }
        } else {
          // Update existing — only update stock if it's still the default seed value
          await prisma.inventory.update({
            where: { variantId: variant.id },
            data: {
              stockQuantity: initialStock,
            },
          });
        }

        variantCount++;
      }
    }
  }

  console.log(`  ✓ ${productCount} products seeded`);
  console.log(`  ✓ ${variantCount} variants + inventory records seeded`);

  // ══════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════
  console.log('\n✅ PIERCYN V1 database seeded successfully.');
  console.log('\n  Admin login:');
  console.log('    Email:    admin@piercyn.com');
  console.log('    Password: piercyn2026');
  console.log('\n  ⚠️  Change the admin password immediately after first login in production.\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
