import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, RefreshCw, SlidersHorizontal, Tag } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { catalogService, StorefrontCategory } from '../services/catalogService';
import { formatCategorySeoTitle } from '../utils/seo';

interface CategoryPageProps {
  slug: string;
  onViewProduct: (product: Product) => void;
  onBackToShop: () => void;
  onNotFound: () => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  slug,
  onViewProduct,
  onBackToShop,
  onNotFound,
}) => {
  const [category, setCategory] = useState<StorefrontCategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-low' | 'price-high'>('featured');

  const loadCategoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch categories to find matching metadata
      const categories = await catalogService.getCategories();
      const matched = categories.find(
        (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.id === slug
      );

      // If category not found in active list, we can still attempt to query products by slug
      if (matched) {
        setCategory(matched);
        document.title = formatCategorySeoTitle(matched.name);
      } else {
        // Fallback title based on slug
        const formattedSlug = slug.replace(/-/g, ' ').toUpperCase();
        setCategory({
          id: slug,
          name: formattedSlug,
          slug: slug,
          sortOrder: 99,
        });
        document.title = formatCategorySeoTitle(formattedSlug);
      }

      // 2. Query products for this category
      const catalogResult = await catalogService.getCatalog({
        category: slug,
        page: 1,
        limit: 100,
      });

      setProducts(catalogResult.products);
    } catch (err: any) {
      setError(err?.message || 'Unable to load category pieces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoryData();
  }, [slug]);

  // Sort products locally if user toggles sort
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'newest') {
      return list.reverse();
    }
    if (sortBy === 'price-low') {
      return list.sort((a, b) => a.priceNGN - b.priceNGN);
    }
    if (sortBy === 'price-high') {
      return list.sort((a, b) => b.priceNGN - a.priceNGN);
    }
    return list;
  }, [products, sortBy]);

  return (
    <main className="min-h-screen bg-[#F2F0EB] pt-20 sm:pt-24 pb-20 text-[#141414]">
      <div className="piercyn-container">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBackToShop}
            className="inline-flex min-h-11 items-center gap-2 text-xs font-mono font-semibold tracking-wider hover:opacity-60 transition-opacity cursor-pointer text-[#141414]"
          >
            <ArrowLeft className="h-4 w-4" /> SHOP ALL PIECES
          </button>
        </div>

        {/* Category Header Banner */}
        <header className="mb-10 rounded-2xl border border-[#DAD8D1] bg-white p-6 sm:p-10 shadow-2xs overflow-hidden relative">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7A7771] flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#A48B71]" /> PIERCYN CATEGORY
              </span>
              {category && (
                <span className="rounded-full bg-[#EFECE6] px-2.5 py-0.5 text-[10px] font-mono text-[#524F4A]">
                  {products.length} {products.length === 1 ? 'PIECE' : 'PIECES'}
                </span>
              )}
            </div>

            <h1 className="font-editorial text-4xl sm:text-6xl italic tracking-tight text-[#141414]">
              {category?.name || slug.replace(/-/g, ' ').toUpperCase()}
            </h1>

            {category?.description && (
              <p className="mt-3 text-sm leading-6 text-[#6E6B65] max-w-xl">
                {category.description}
              </p>
            )}
          </div>

          {/* Optional Category Image Accent */}
          {category?.imageUrl && (
            <div className="mt-6 sm:mt-0 sm:absolute sm:right-6 sm:top-1/2 sm:-translate-y-1/2 sm:w-48 sm:h-48 rounded-xl overflow-hidden border border-[#E5E3DC]">
              <img
                src={category.imageUrl}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </header>

        {/* Sorting Bar */}
        {products.length > 0 && !loading && (
          <div className="mb-8 flex items-center justify-between border-b border-[#DAD8D1] pb-4">
            <span className="text-xs font-mono text-[#6E6B65]">
              SHOWING {sortedProducts.length} {sortedProducts.length === 1 ? 'PIECE' : 'PIECES'}
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#7A7771] hidden sm:inline">SORT BY:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products by"
                className="rounded-lg border border-[#DAD8D1] bg-white px-3 py-1.5 text-xs font-mono text-[#141414] focus:outline-none cursor-pointer"
              >
                <option value="featured">FEATURED</option>
                <option value="newest">NEWEST</option>
                <option value="price-low">PRICE: LOW TO HIGH</option>
                <option value="price-high">PRICE: HIGH TO LOW</option>
              </select>
            </div>
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#141414] border-t-transparent" />
            <p className="mt-4 text-xs font-mono tracking-widest text-[#6E6B65]">
              LOADING CATEGORY PIECES...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#DAD8D1] bg-white p-12 text-center shadow-2xs">
            <p className="text-sm font-medium text-[#141414]">{error}</p>
            <button
              onClick={loadCategoryData}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#141414] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-black transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> RETRY
            </button>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DAD8D1] bg-[#ECEAE3]/50 p-16 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#DAD8D1]/60 text-[#7A7771]">
              <Tag className="h-6 w-6" />
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl italic text-[#141414]">
              NO PIECES IN THIS CATEGORY YET
            </h2>
            <p className="mt-2 text-xs font-sans text-[#6E6B65] max-w-md mx-auto">
              We are currently designing and producing drops for this category. Check back soon or explore our active collections.
            </p>
            <button
              onClick={onBackToShop}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#141414] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-black transition-colors cursor-pointer"
            >
              EXPLORE ALL PIECES
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-6 lg:grid-cols-4">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewProduct={onViewProduct}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
