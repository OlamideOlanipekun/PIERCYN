import React, { useEffect, useState } from 'react';
import { Product, ProductCategory } from '../types';
import { useShop } from '../context/ShopContext';
import { Filter, SlidersHorizontal, X, Check, Search, ArrowUpDown } from 'lucide-react';
import { eventTracker } from '../services/eventTracker';
import { ProductCard } from './ProductCard';
import { catalogService } from '../services/catalogService';

interface ShopPageProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  initialCategory?: string | null;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  onViewProduct,
  initialCategory = 'all',
}) => {
  const { addToCart, toggleWishlist, isWishlisted, isLoadingProducts, catalogError, refreshProducts } = useShop();

  // Resolve the initial category from the prop, falling back to the URL query param
  const urlCategoryParam = new URLSearchParams(window.location.search).get('category');
  const resolvedInitialCategory = initialCategory || urlCategoryParam || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(resolvedInitialCategory);

  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'in_stock' | 'available_to_order'>('all');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [availability, setAvailability] = useState<'all' | 'in-stock' | 'unavailable'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-low' | 'price-high'>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [resultTotal, setResultTotal] = useState(products.length);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogLoadError, setCatalogLoadError] = useState<string | null>(null);

  const [categories, setCategories] = useState<{ label: string; value: string }[]>([
    { label: 'ALL PIECES', value: 'all' },
    { label: 'HOODIES & FLEECE', value: 'hoodies' },
    { label: 'TEES & TOPS', value: 'tees' },
    { label: 'POLOS', value: 'polos' },
    { label: 'TROUSERS & CARGOS', value: 'trousers' },
    { label: 'OUTERWEAR & BOMBERS', value: 'outerwear' },
  ]);

  useEffect(() => {
    let cancelled = false;
    catalogService
      .getCategories()
      .then((cats) => {
        if (!cancelled && cats && cats.length > 0) {
          setCategories([
            { label: 'ALL PIECES', value: 'all' },
            ...cats.map((c) => ({
              label: c.name.toUpperCase(),
              value: c.slug,
            })),
          ]);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'XXL'];

  useEffect(() => { setSelectedCategory(initialCategory || 'all'); }, [initialCategory]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      let cancelled = false;
      const request = {
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        sizes: selectedSize ? [selectedSize] : undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice < 100000 ? maxPrice : undefined,
        search: searchQuery.trim() || undefined,
        inStock: availability === 'in-stock' || selectedAvailability === 'in_stock'
          ? true
          : availability === 'unavailable' || selectedAvailability === 'available_to_order'
            ? false
            : undefined,
        sort: sortBy === 'price-low' ? 'price-asc' as const : sortBy === 'price-high' ? 'price-desc' as const : sortBy,
        page: 1,
        limit: 48,
      };
      const url = new URL(window.location.href);
      Object.entries({ category: request.category, size: selectedSize || undefined, minPrice: request.minPrice, maxPrice: request.maxPrice, search: request.search, availability: availability === 'all' ? undefined : availability, orderability: selectedAvailability === 'all' ? undefined : selectedAvailability, sort: sortBy === 'featured' ? undefined : sortBy }).forEach(([key, value]) => {
        if (value === undefined || value === '') url.searchParams.delete(key);
        else url.searchParams.set(key, String(value));
      });
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      setIsLoadingCatalog(true);
      setCatalogLoadError(null);
      catalogService.getCatalog(request).then((result) => {
        if (!cancelled) { setFilteredProducts(result.products); setResultTotal(result.total); }
      }).catch((error) => {
        if (!cancelled) {
          if (products && products.length > 0) {
            let matched = products;
            if (request.category && request.category !== 'all') {
              const catLower = request.category.toLowerCase();
              matched = matched.filter((p) => {
                const pCat = (p.category || (p as any).categorySlug || '').toLowerCase();
                return pCat === catLower;
              });
            }
            if (request.search) {
              const s = request.search.toLowerCase();
              matched = matched.filter(
                (p) => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s)
              );
            }
            setFilteredProducts(matched);
            setResultTotal(matched.length);
          } else {
            setFilteredProducts([]);
            setResultTotal(0);
            setCatalogLoadError(error instanceof Error ? error.message : 'Unable to load products.');
          }
        }
      }).finally(() => { if (!cancelled) setIsLoadingCatalog(false); });
      return () => { cancelled = true; };
    }, searchQuery ? 250 : 0);
    return () => window.clearTimeout(timeout);
  }, [selectedCategory, selectedAvailability, selectedSize, minPrice, maxPrice, availability, sortBy, searchQuery, products]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    eventTracker.track('filter_used', { filterType: 'category', value: cat });
  };

  const handleSizeSelect = (sz: string) => {
    const next = selectedSize === sz ? null : sz;
    setSelectedSize(next);
    if (next) {
      eventTracker.track('filter_used', { filterType: 'size', value: next });
    }
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedAvailability('all');
    setSelectedSize(null);
    setMinPrice(0);
    setMaxPrice(100000);
    setAvailability('all');
    setSearchQuery('');
    setSortBy('featured');
  };

  return (
    <div id="shop-page-root" className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-24 pb-20 font-sans">
      <div className="piercyn-container">
        {/* SHOP HEADER & BREADCRUMB */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#DAD8D1] pb-6 mb-8 gap-4">
          <div>
            <span className="text-[11px] font-mono font-semibold tracking-widest text-[#141414]/60 uppercase block mb-1">
              LAGOS ATELIER STOREFRONT
            </span>
            <h1 className="font-editorial italic text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#141414]">
              THE STOREFRONT
            </h1>
            {selectedCategory !== 'all' && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-[11px] font-mono tracking-widest text-[#7A7771] uppercase">Category:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-mono uppercase tracking-wider">
                  <span>
                    {categories.find((c) => c.value.toLowerCase() === selectedCategory.toLowerCase())?.label ||
                      selectedCategory.toUpperCase()}
                  </span>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="hover:opacity-70 transition-opacity ml-1 cursor-pointer"
                    aria-label="Clear category filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs font-mono text-[#7A7771] hover:text-[#141414] underline ml-2 cursor-pointer transition-colors"
                >
                  View all pieces
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#141414]/70">
              {isLoadingCatalog ? 'UPDATING PIECES...' : `SHOWING ${filteredProducts.length} OF ${resultTotal} PIECES`}
            </span>
          </div>
        </div>

        {/* MOBILE STICKY FILTER BAR */}
        <div className="md:hidden sticky top-[56px] z-30 bg-[#F2F0EB]/95 backdrop-blur-md py-3 mb-6 border-b border-[#DAD8D1] flex items-center justify-between gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1 py-2.5 px-4 bg-[#141414] text-[#F2F0EB] rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>FILTERS & SORT {selectedSize || selectedCategory !== 'all' ? '(ACTIVE)' : ''}</span>
          </button>
        </div>

        {/* MAIN LAYOUT: DESKTOP SIDEBAR + PRODUCT GRID */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          {/* DESKTOP FILTER SIDEBAR */}
          <aside className="hidden md:block w-64 shrink-0 sticky top-28 space-y-8 text-left">
            {/* Search Input */}
            <div>
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#141414]/70 block mb-2">
                SEARCH COLLECTION
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Keywords e.g. Hoodie, Cargo..."
                  className="w-full bg-[#E8E6E1] border border-[#DAD8D1] rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-[#141414] font-sans"
                />
                <Search className="w-4 h-4 text-[#141414]/50 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Availability Filter */}
            <div>
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#141414]/70 mb-3 pb-1 border-b border-[#DAD8D1]">
                AVAILABILITY
              </h3>
              <div className="space-y-1">
                {[
                  { label: 'ALL AVAILABILITY', value: 'all' as const },
                  { label: 'IN STOCK (24–48H)', value: 'in_stock' as const },
                  { label: 'AVAILABLE TO ORDER (5–7D)', value: 'available_to_order' as const },
                ].map((avail) => (
                  <button
                    key={avail.value}
                    onClick={() => setSelectedAvailability(avail.value)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      selectedAvailability === avail.value
                        ? 'bg-[#141414] text-[#F2F0EB]'
                        : 'text-[#141414]/80 hover:bg-[#E8E6E1]'
                    }`}
                  >
                    <span>{avail.label}</span>
                    {selectedAvailability === avail.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#141414]/70 mb-3 pb-1 border-b border-[#DAD8D1]">
                CATEGORIES
              </h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => handleCategorySelect(cat.value)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-between ${
                      selectedCategory === cat.value
                        ? 'bg-[#141414] text-[#F2F0EB]'
                        : 'text-[#141414]/80 hover:bg-[#E8E6E1]'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {selectedCategory === cat.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#141414]/70 mb-3 pb-1 border-b border-[#DAD8D1]">
                SIZING
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                {availableSizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => handleSizeSelect(sz)}
                    className={`py-1.5 text-xs font-mono font-semibold rounded border transition-all ${
                      selectedSize === sz
                        ? 'bg-[#141414] text-[#F2F0EB] border-[#141414]'
                        : 'bg-[#E8E6E1]/60 text-[#141414] border-[#DAD8D1] hover:border-[#141414]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#141414]/70">
                  MAX PRICE
                </h3>
                <span className="text-xs font-mono font-bold text-[#141414]">
                  ₦{maxPrice.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="2500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#141414] cursor-pointer"
              />
              <label className="mt-3 mb-1 block text-[10px] font-mono text-[#141414]/60">MINIMUM PRICE</label>
              <input
                type="number"
                min="0"
                max={maxPrice}
                step="2500"
                value={minPrice || ''}
                onChange={(e) => setMinPrice(Math.min(maxPrice, Math.max(0, Number(e.target.value) || 0)))}
                placeholder="No minimum"
                className="w-full rounded-lg border border-[#DAD8D1] bg-[#E8E6E1] p-2 text-xs font-mono focus:outline-none"
              />
            </div>

            {/* Sort Options */}
            <div>
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#141414]/70 mb-3 pb-1 border-b border-[#DAD8D1]">
                SORT BY
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-[#E8E6E1] border border-[#DAD8D1] rounded-lg p-2 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="featured">FEATURED CURATION</option>
                <option value="newest">NEWEST ARRIVALS</option>
                <option value="price-low">PRICE: LOW TO HIGH</option>
                <option value="price-high">PRICE: HIGH TO LOW</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div>
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#141414]/70 mb-3 pb-1 border-b border-[#DAD8D1]">AVAILABILITY</h3>
              <select value={availability} onChange={(e) => setAvailability(e.target.value as 'all' | 'in-stock' | 'unavailable')} className="w-full bg-[#E8E6E1] border border-[#DAD8D1] rounded-lg p-2 text-xs font-semibold focus:outline-none cursor-pointer">
                <option value="all">ALL LISTINGS</option>
                <option value="in-stock">IN STOCK ONLY</option>
                <option value="unavailable">SOLD OUT / UNAVAILABLE</option>
              </select>
            </div>

            {/* Reset Button */}
            {(selectedCategory !== 'all' || selectedAvailability !== 'all' || selectedSize || minPrice || maxPrice < 100000 || searchQuery || availability !== 'all' || sortBy !== 'featured') && (
              <button
                onClick={resetFilters}
                className="w-full py-2 text-xs font-mono underline text-[#141414]/70 hover:text-[#141414] text-center cursor-pointer"
              >
                CLEAR ALL FILTERS
              </button>
            )}
          </aside>

          {/* PRODUCTS GRID AREA */}
          <main className="flex-1 w-full">
            {catalogLoadError && <div className="mb-5 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">{catalogLoadError}</div>}
            {isLoadingCatalog && <div className="mb-5 text-xs font-mono text-[#141414]/60">UPDATING CATALOG...</div>}
            {isLoadingProducts ? (
              /* SKELETON LOADING STATE */
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-[#EAE6DD] rounded-xl overflow-hidden aspect-[3/4] flex flex-col justify-end p-4">
                    <div className="h-4 bg-[#DAD8D1] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-[#DAD8D1] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : catalogError ? (
              /* CATALOG ERROR STATE */
              <div className="py-16 text-center bg-red-50 rounded-2xl border border-red-200 p-8">
                <h3 className="font-editorial italic text-2xl text-red-900 mb-2">
                  Unable to Load Catalog
                </h3>
                <p className="text-xs text-red-700 mb-6 font-sans max-w-md mx-auto">
                  {catalogError || 'A network error occurred while retrieving PIERCYN pieces. Please retry.'}
                </p>
                <button
                  onClick={refreshProducts}
                  className="px-6 py-2.5 bg-[#141414] text-[#F2F0EB] text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-black transition-colors cursor-pointer"
                >
                  RETRY DISPATCH
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              /* EMPTY FILTER STATE */
              <div className="py-20 text-center bg-[#E8E6E1]/40 rounded-2xl border border-dashed border-[#DAD8D1] p-8">
                <h3 className="font-editorial italic text-2xl text-[#141414] mb-2">
                  NOTHING HERE YET
                </h3>
                <p className="text-xs text-[#141414]/70 mb-6 font-sans">
                  Try another search or explore what's new.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 bg-[#141414] text-[#F2F0EB] text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-black transition-colors cursor-pointer"
                >
                  SEE ALL PIECES
                </button>
              </div>
            ) : (
              /* DYNAMIC PRODUCT GRID */
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewProduct={onViewProduct}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE SLIDE-OVER FILTER SHEET */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-[#F2F0EB] h-full p-6 overflow-y-auto flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#DAD8D1] mb-6">
                <h3 className="font-editorial italic text-xl text-[#141414]">FILTERS & SORT</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-[#141414] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Availability Select */}
              <div className="mb-6">
                <h4 className="text-xs font-mono font-bold uppercase mb-3">AVAILABILITY</h4>
                <div className="space-y-1">
                  {[
                    { label: 'ALL AVAILABILITY', value: 'all' as const },
                    { label: 'IN STOCK (24–48H)', value: 'in_stock' as const },
                    { label: 'AVAILABLE TO ORDER (5–7D)', value: 'available_to_order' as const },
                  ].map((avail) => (
                    <button
                      key={avail.value}
                      onClick={() => setSelectedAvailability(avail.value)}
                      className={`w-full text-left py-2 px-3 rounded text-xs font-medium flex items-center justify-between cursor-pointer ${
                        selectedAvailability === avail.value ? 'bg-[#141414] text-[#F2F0EB]' : 'bg-[#E8E6E1]'
                      }`}
                    >
                      <span>{avail.label}</span>
                      {selectedAvailability === avail.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Category Select */}
              <div className="mb-6">
                <h4 className="text-xs font-mono font-bold uppercase mb-3">CATEGORY</h4>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => handleCategorySelect(cat.value)}
                      className={`w-full text-left py-2 px-3 rounded text-xs font-medium flex items-center justify-between ${
                        selectedCategory === cat.value ? 'bg-[#141414] text-[#F2F0EB]' : 'bg-[#E8E6E1]'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {selectedCategory === cat.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Availability Select */}
              <div className="mb-6">
                <h4 className="text-xs font-mono font-bold uppercase mb-3">AVAILABILITY</h4>
                <select value={availability} onChange={(e) => setAvailability(e.target.value as 'all' | 'in-stock' | 'unavailable')} className="w-full rounded-lg border border-[#DAD8D1] bg-[#E8E6E1] p-3 text-xs font-semibold">
                  <option value="all">ALL LISTINGS</option>
                  <option value="in-stock">IN STOCK ONLY</option>
                  <option value="unavailable">SOLD OUT / UNAVAILABLE</option>
                </select>
              </div>

              {/* Mobile Size Select */}
              <div className="mb-6">
                <h4 className="text-xs font-mono font-bold uppercase mb-3">SIZE</h4>
                <div className="grid grid-cols-3 gap-2">
                  {availableSizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => handleSizeSelect(sz)}
                      className={`py-2 text-xs font-mono rounded border ${
                        selectedSize === sz ? 'bg-[#141414] text-[#F2F0EB]' : 'bg-[#E8E6E1]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-mono font-bold uppercase mb-3">SEARCH, PRICE & SORT</h4>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search collection" className="mb-2 w-full rounded bg-[#E8E6E1] p-2 text-xs" />
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <input type="number" min="0" max={maxPrice} value={minPrice || ''} onChange={(e) => setMinPrice(Math.min(maxPrice, Math.max(0, Number(e.target.value) || 0)))} placeholder="Min price" className="rounded bg-[#E8E6E1] p-2 text-xs" />
                  <input type="number" min={minPrice} max="100000" value={maxPrice} onChange={(e) => setMaxPrice(Math.max(minPrice, Number(e.target.value) || 100000))} placeholder="Max price" className="rounded bg-[#E8E6E1] p-2 text-xs" />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="w-full rounded bg-[#E8E6E1] p-2 text-xs">
                  <option value="featured">FEATURED CURATION</option>
                  <option value="newest">NEWEST ARRIVALS</option>
                  <option value="price-low">PRICE: LOW TO HIGH</option>
                  <option value="price-high">PRICE: HIGH TO LOW</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 bg-[#141414] text-[#F2F0EB] text-xs font-semibold uppercase rounded-full"
            >
              VIEW {resultTotal} PIECES
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
