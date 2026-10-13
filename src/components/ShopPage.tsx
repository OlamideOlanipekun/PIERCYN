import React, { useState, useMemo } from 'react';
import { Product, ProductCategory } from '../types';
import { useShop } from '../context/ShopContext';
import { Filter, SlidersHorizontal, X, Check, Search, ArrowUpDown } from 'lucide-react';
import { eventTracker } from '../services/eventTracker';
import { ProductCard } from './ProductCard';

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

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'in_stock' | 'available_to_order'>('all');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [availability, setAvailability] = useState<'all' | 'in-stock' | 'unavailable'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-low' | 'price-high'>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categories: { label: string; value: string }[] = [
    { label: 'ALL PIECES', value: 'all' },
    { label: 'HOODIES & FLEECE', value: 'hoodies' },
    { label: 'TEES & TOPS', value: 'tees' },
    { label: 'POLOS', value: 'polos' },
    { label: 'TROUSERS & CARGOS', value: 'trousers' },
    { label: 'OUTERWEAR & BOMBERS', value: 'outerwear' },
  ];

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Availability Filter
      if (selectedAvailability === 'in_stock' && p.availabilityType !== 'in_stock') {
        return false;
      }
      if (selectedAvailability === 'available_to_order' && p.availabilityType !== 'available_to_order') {
        return false;
      }

      // Category Filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'tees' && p.category !== 'tees' && p.category !== 't-shirts') return false;
        if (selectedCategory === 'hoodies' && p.category !== 'hoodies' && p.category !== 'sweatshirts') return false;
        if (selectedCategory !== 'tees' && selectedCategory !== 'hoodies' && p.category !== selectedCategory) return false;
      }

      // Size Filter
      if (selectedSize && !p.sizes.includes(selectedSize as any)) {
        return false;
      }

      // Availability Filter: unknown inventory is never treated as in stock.
      if (availability === 'in-stock' && !(typeof p.stock === 'number' && p.stock > 0 && !p.isSoldOut)) return false;
      if (availability === 'unavailable' && !(typeof p.stock === 'number' && (p.stock <= 0 || p.isSoldOut))) return false;

      // Price Filter
      if (p.priceNGN > maxPrice) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCategory) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'price-low') {
        return a.priceNGN - b.priceNGN;
      }
      if (sortBy === 'price-high') {
        return b.priceNGN - a.priceNGN;
      }
      return 0; // featured default
    });
  }, [products, selectedCategory, selectedSize, maxPrice, availability, sortBy, searchQuery]);

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
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#141414]/70">
              SHOWING {filteredProducts.length} OF {products.length} PIECES
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
            {(selectedCategory !== 'all' || selectedAvailability !== 'all' || selectedSize || maxPrice < 100000 || searchQuery) && (
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
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 bg-[#141414] text-[#F2F0EB] text-xs font-semibold uppercase rounded-full"
            >
              VIEW {filteredProducts.length} PIECES
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
