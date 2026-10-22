import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ShopAllEditorialPageProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
}

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const categoryLabel = (value: string) =>
  value.split(/[-_\s]+/).filter(Boolean).map((part) => part.toUpperCase()).join(' ');

const formatCount = (count: number) => String(count).padStart(2, '0');

export const ShopAllEditorialPage: React.FC<ShopAllEditorialPageProps> = ({ products, onViewProduct }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(() => {
    const requested = new URLSearchParams(window.location.search).get('category');
    return requested ? slugify(requested) : null;
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    const syncCategoryFromUrl = () => {
      const requested = new URLSearchParams(window.location.search).get('category');
      setActiveCategory(requested ? slugify(requested) : null);
    };
    window.addEventListener('popstate', syncCategoryFromUrl);
    return () => window.removeEventListener('popstate', syncCategoryFromUrl);
  }, []);

  const publishedProducts = useMemo(
    () => products.filter((product) => product.status !== 'draft' && product.status !== 'archived'),
    [products],
  );

  const categories = useMemo(() => {
    const map = new Map<string, { title: string; products: Product[] }>();
    publishedProducts.forEach((product) => {
      const rawCategory = String(product.category || '').trim();
      const slug = slugify(rawCategory);
      if (!slug) return;
      const existing = map.get(slug) || { title: categoryLabel(rawCategory), products: [] };
      existing.products.push(product);
      map.set(slug, existing);
    });
    return Array.from(map.entries())
      .map(([slug, value]) => ({
        slug,
        title: value.title,
        products: value.products,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [publishedProducts]);

  const searchedProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return publishedProducts;
    return publishedProducts.filter((product) =>
      [product.name, product.description, product.category, product.collection]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [publishedProducts, search]);

  const visibleCategories = useMemo(() => categories
    .map((category) => ({
      ...category,
      products: category.products.filter((product) => searchedProducts.some((match) => match.id === product.id)),
    }))
    .filter((category) => activeCategory ? category.slug === activeCategory : category.products.length > 0),
  [categories, searchedProducts, activeCategory]);

  const selectedCategory = activeCategory ? categories.find((category) => category.slug === activeCategory) : null;

  const openCategory = (slug: string | null) => {
    setActiveCategory(slug);
    const url = slug ? `/shop?category=${encodeURIComponent(slug)}` : '/shop';
    window.history.pushState({ page: 'shop', category: slug }, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main id="piercyn-shop-all" className="min-h-screen bg-[#F2F0EB] pb-20 pt-[56px] text-[#141414] sm:pt-[60px]">
      <section className="relative overflow-hidden bg-[#141414] text-[#F2F0EB]">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10 sm:h-[30rem] sm:w-[30rem]" />
        <div className="pointer-events-none absolute -right-4 -top-12 h-56 w-56 rounded-full border border-white/10 sm:right-8 sm:top-0 sm:h-[22rem] sm:w-[22rem]" />
        <div className="piercyn-container relative py-12 sm:py-20 lg:py-24">
          <div className="mb-5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#C6C0B4] sm:text-[11px]">
            <span className="h-px w-7 bg-[#C6C0B4]" /> PIERCYN / THE STORE
          </div>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-editorial text-[clamp(3.25rem,10vw,8rem)] leading-[0.84] tracking-[-0.055em]">
                {selectedCategory ? <>{selectedCategory.title}<br /></> : <>SHOP<br /><span className="italic text-[#C6C0B4]">ALL.</span></>}
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-6 text-[#F2F0EB]/70 sm:text-base sm:leading-7">
                {selectedCategory
                  ? `Explore every available piece in ${selectedCategory.title.toLowerCase()}.`
                  : 'Find your next everyday favourite. Explore every published piece in the PIERCYN store — style that makes sense for your budget.'}
              </p>
            </div>
            <div className="flex shrink-0 items-end gap-5 border-t border-white/20 pt-4 md:border-t-0 md:pt-0">
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">AVAILABLE PIECES</span>
                <span className="mt-1 block font-editorial text-4xl">{formatCount(selectedCategory ? selectedCategory.products.filter((p) => searchedProducts.some((match) => match.id === p.id)).length : searchedProducts.length)}</span>
              </div>
              {selectedCategory && (
                <button onClick={() => openCategory(null)} className="mb-1 inline-flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 transition-colors hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> SHOP ALL
                </button>
              )}
            </div>
          </div>
          <div className="mt-9 flex flex-col gap-3 border-t border-white/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search designs, categories..."
                aria-label="Search products"
                className="min-h-12 w-full rounded-full border border-white/20 bg-white/[0.06] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/60"
              />
            </label>
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/50">CURATED FOR YOUR ROTATION <span className="mx-2">/</span> LAGOS, NIGERIA</p>
          </div>
        </div>
      </section>

      <div className="piercyn-container">
        {!activeCategory && (
          <div className="flex items-center justify-between border-b border-[#DAD8D1] py-5">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#77736B]">SHOP BY CATEGORY</span>
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#77736B]">{visibleCategories.length} CATEGORIES</span>
          </div>
        )}

        {visibleCategories.length === 0 ? (
          <div className="py-20 text-center">
            <h2 className="font-editorial text-3xl">NO PIECES FOUND</h2>
            <p className="mt-3 text-sm text-[#77736B]">{activeCategory && !selectedCategory ? 'This category has no published products yet.' : 'Try another search or clear the search field.'}</p>
            <button onClick={() => { setSearch(''); if (activeCategory && !selectedCategory) openCategory(null); }} className="mt-5 min-h-11 rounded-full bg-[#141414] px-6 text-xs font-bold uppercase tracking-widest text-[#F2F0EB]">Clear search</button>
          </div>
        ) : visibleCategories.map((category, groupIndex) => (
          <section key={category.slug} className="border-b border-[#DAD8D1] py-9 sm:py-14">
            <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
              <div>
                <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#77736B]">{String(groupIndex + 1).padStart(2, '0')} / CATEGORY</p>
                <h2 className="font-editorial text-3xl leading-none tracking-[-0.03em] sm:text-5xl">{category.title}</h2>
                {!activeCategory && <p className="mt-3 text-xs leading-5 text-[#625F58] sm:text-sm">{category.products.length} published {category.products.length === 1 ? 'piece' : 'pieces'}</p>}
              </div>
              {!activeCategory && (
                <button onClick={() => openCategory(category.slug)} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#141414]/25 px-4 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-[#141414] hover:text-[#F2F0EB] sm:px-5">
                  VIEW ALL
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
              {(activeCategory ? category.products : category.products.slice(0, 4)).map((product, index) => (
                <ProductCard key={product.id} product={product} onViewProduct={onViewProduct} priority={groupIndex === 0 && index < 4} />
              ))}
            </div>
            {!activeCategory && category.products.length > 4 && (
              <div className="mt-6 flex justify-center sm:mt-8">
                <button onClick={() => openCategory(category.slug)} className="inline-flex min-h-11 items-center gap-2 border-b border-[#141414] px-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                  VIEW ALL
                </button>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
};
