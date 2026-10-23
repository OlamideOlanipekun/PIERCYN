/**
 * HomepageCategoryPreviews
 *
 * Dynamic homepage section that:
 * 1. Fetches all active categories from the backend (with resilient defaults)
 * 2. Groups products by category (with alias matching e.g. t-shirts -> tees)
 * 3. Renders an editorial preview row (up to 4 cards) per category with products
 * 4. Includes a prominent "VIEW ALL →" button linking to /shop?category=<slug>
 *
 * Fully dynamic: adding categories in the admin automatically surfaces them here.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { catalogService, StorefrontCategory } from '../services/catalogService';
import { ProductCard } from './ProductCard';
import { ScrollReveal } from './ScrollReveal';

interface HomepageCategoryPreviewsProps {
  products: Product[];
  isLoadingProducts: boolean;
  catalogError: string | null;
  onViewProduct: (product: Product) => void;
  onViewAllCategory: (categorySlug: string) => void;
}

const DEFAULT_PREVIEW_CATEGORIES: StorefrontCategory[] = [
  { id: 'cat-tees', name: 'Tees & Tops', slug: 'tees', sortOrder: 1, description: 'Heavyweight organic cotton, relaxed silhouettes, and signature cuts.' },
  { id: 'cat-hoodies', name: 'Hoodies & Sweatshirts', slug: 'hoodies', sortOrder: 2, description: 'Dense-knit fleece engineered for structure, warmth, and year-round wear.' },
  { id: 'cat-trousers', name: 'Trousers & Cargos', slug: 'trousers', sortOrder: 3, description: 'Precision-tailored streetwear silhouettes crafted from structured twill and ripstop.' },
  { id: 'cat-outerwear', name: 'Outerwear & Jackets', slug: 'outerwear', sortOrder: 4, description: 'Statement outer layers with utilitarian hardware and premium technical fabrics.' },
  { id: 'cat-polos', name: 'Polos', slug: 'polos', sortOrder: 5, description: 'Refined modern essentials with clean collars and subtle tailoring.' },
  { id: 'cat-accessories', name: 'Accessories', slug: 'accessories', sortOrder: 6, description: 'Minimalist statement accents designed to complete the fit.' },
];

const CATEGORY_ALIASES: Record<string, string> = {
  't-shirts': 'tees',
  'tshirt': 'tees',
  't-shirt': 'tees',
  'tops': 'tees',
  'sweatshirts': 'hoodies',
  'fleece': 'hoodies',
  'sweatshirt': 'hoodies',
  'hoodie': 'hoodies',
  'jeans': 'trousers',
  'cargos': 'trousers',
  'cargo': 'trousers',
  'pants': 'trousers',
  'jackets': 'outerwear',
  'bombers': 'outerwear',
};

// ─── Single Category Row ──────────────────────────────────────────────────────

interface CategoryRowProps {
  category: StorefrontCategory;
  products: Product[];
  onViewProduct: (product: Product) => void;
  onViewAll: () => void;
  index: number;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  products,
  onViewProduct,
  onViewAll,
  index,
}) => {
  const preview = products.slice(0, 4);
  if (preview.length === 0) return null;

  // Alternate background for visual rhythm
  const bg = index % 2 === 0 ? 'bg-white' : 'bg-[#F2F0EB]';

  return (
    <ScrollReveal delay={index * 0.04}>
      <section
        id={`homepage-category-${category.slug}`}
        className={`w-full ${bg} text-[#141414] py-12 sm:py-16 lg:py-20 border-b border-[#F0F0F0]`}
      >
        <div className="piercyn-container">
          {/* Section header */}
          <div className="flex items-end justify-between mb-6 sm:mb-10 pb-3 border-b border-[#DAD8D1]/60">
            <div>
              <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] block mb-1">
                PIERCYN COLLECTION
              </span>
              <h2 className="font-editorial text-2xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#141414]">
                {category.name}
              </h2>
              {category.description && (
                <p className="font-sans text-xs sm:text-sm text-[#6E6B65] mt-1 max-w-md">
                  {category.description}
                </p>
              )}
            </div>

            <button
              id={`view-all-${category.slug}-btn`}
              onClick={onViewAll}
              className="group hidden sm:flex min-h-[44px] items-center gap-1.5 text-xs font-sans font-bold tracking-[0.12em] uppercase text-[#141414] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap"
              aria-label={`View all ${category.name} products`}
            >
              <span>VIEW ALL</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Product cards — 4-col desktop, 2-col mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {preview.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewProduct={onViewProduct}
                priority={idx < 2}
              />
            ))}
          </div>

          {/* VIEW ALL button — visible on mobile below the cards */}
          <div className="mt-6 flex justify-center sm:hidden">
            <button
              onClick={onViewAll}
              className="group inline-flex items-center gap-2 py-3 px-6 border border-[#DAD8D1] rounded-full text-xs font-bold tracking-[0.12em] uppercase text-[#141414] hover:bg-[#141414] hover:text-[#F2F0EB] hover:border-[#141414] transition-all duration-200 cursor-pointer"
            >
              <span>VIEW ALL {category.name}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────

export const HomepageCategoryPreviews: React.FC<HomepageCategoryPreviewsProps> = ({
  products,
  isLoadingProducts,
  catalogError,
  onViewProduct,
  onViewAllCategory,
}) => {
  const [categories, setCategories] = useState<StorefrontCategory[]>(DEFAULT_PREVIEW_CATEGORIES);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsFetchingCategories(true);
    catalogService
      .getCategories()
      .then((cats) => {
        if (!cancelled && cats && cats.length > 0) {
          // Merge API categories with defaults (API categories take precedence)
          const apiSlugs = new Set(cats.map((c) => c.slug.toLowerCase()));
          const combined = [
            ...cats,
            ...DEFAULT_PREVIEW_CATEGORIES.filter((d) => !apiSlugs.has(d.slug.toLowerCase())),
          ];
          setCategories(combined);
        }
      })
      .catch(() => {
        // Silently retain defaults on network error
      })
      .finally(() => {
        if (!cancelled) setIsFetchingCategories(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Group products by category slug with alias support.
   */
  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const product of products) {
      const rawSlug = (product.category || (product as any).categorySlug || '').toLowerCase();
      if (!rawSlug) continue;

      const canonicalSlug = CATEGORY_ALIASES[rawSlug] || rawSlug;

      if (!map.has(canonicalSlug)) {
        map.set(canonicalSlug, []);
      }
      const existing = map.get(canonicalSlug)!;
      if (existing.length < 4) {
        existing.push(product);
      }
    }
    return map;
  }, [products]);

  // Loading skeleton while initial products or categories load
  if (isLoadingProducts && products.length === 0) {
    return (
      <section className="w-full bg-white py-12 sm:py-16">
        <div className="piercyn-container">
          <div className="flex items-center gap-3 mb-8">
            <Loader2 className="w-4 h-4 animate-spin text-[#7A7771]" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#7A7771]">
              Loading catalogue…
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-[#EAE6DD] rounded-xl overflow-hidden aspect-[3/4]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Hide gracefully if catalog errored with 0 products
  if (catalogError && products.length === 0) return null;

  // Build rows: one per category with at least 1 product
  const rows = categories
    .map((cat) => ({
      category: cat,
      products: productsByCategory.get(cat.slug.toLowerCase()) || [],
    }))
    .filter(({ products: prods }) => prods.length > 0);

  if (rows.length === 0) return null;

  return (
    <>
      {rows.map(({ category, products: catProducts }, index) => (
        <CategoryRow
          key={category.id || category.slug}
          category={category}
          products={catProducts}
          onViewProduct={onViewProduct}
          onViewAll={() => onViewAllCategory(category.slug)}
          index={index}
        />
      ))}
    </>
  );
};

