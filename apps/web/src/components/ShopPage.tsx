import React, { useState, useMemo } from 'react';
import { Product, ProductCategory } from '../types';
import { useShop } from '../context/ShopContext';
import { Filter, SlidersHorizontal, X, Check, Search, ArrowUpDown } from 'lucide-react';
import { eventTracker } from '../services/eventTracker';

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
  const { addToCart, toggleWishlist, isWishlisted } = useShop();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
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
  }, [products, selectedCategory, selectedSize, maxPrice, sortBy, searchQuery]);

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
    setSelectedSize(null);
    setMaxPrice(100000);
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

            {/* Reset Button */}
            {(selectedCategory !== 'all' || selectedSize || maxPrice < 100000 || searchQuery) && (
              <button
                onClick={resetFilters}
                className="w-full py-2 text-xs font-mono underline text-[#141414]/70 hover:text-[#141414] text-center"
              >
                CLEAR ALL FILTERS
              </button>
            )}
          </aside>

          {/* PRODUCTS GRID AREA */}
          <main className="flex-1 w-full">
            {filteredProducts.length === 0 ? (
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
                  className="px-6 py-2.5 bg-[#141414] text-[#F2F0EB] text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-black transition-colors"
                >
                  SEE ALL PIECES
                </button>
              </div>
            ) : (
              /* DYNAMIC PRODUCT GRID WITH EDITORIAL BREAKS */
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((product, index) => {
                  const isFeaturedBreak = index === 2 && filteredProducts.length >= 4;

                  return (
                    <div
                      key={product.id}
                      className={`group bg-[#E8E6E1]/40 p-3 sm:p-4 rounded-xl border border-[#DAD8D1]/60 flex flex-col justify-between hover:shadow-xs transition-all ${
                        isFeaturedBreak ? 'col-span-2 lg:col-span-2 flex-col sm:flex-row gap-4' : ''
                      }`}
                    >
                      {/* Product Image Component with 2nd Image Swap */}
                      <div
                        onClick={() => onViewProduct(product)}
                        className={`cursor-pointer overflow-hidden rounded-lg bg-neutral-200 relative ${
                          isFeaturedBreak ? 'sm:w-1/2 aspect-[4/5]' : 'aspect-[3/4] w-full mb-3'
                        }`}
                      >
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                        />
                        {product.images[1] ? (
                          <img
                            src={product.images[1]}
                            alt={`${product.name} alternate view`}
                            className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          />
                        ) : (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                          />
                        )}

                        {/* Price Badge Overlay */}
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-[#141414]/90 text-[#F2F0EB] text-[10px] font-mono font-bold rounded">
                          ₦{product.priceNGN.toLocaleString()}
                        </div>
                      </div>

                      {/* Details & Quick Action */}
                      <div className={`flex flex-col justify-between ${isFeaturedBreak ? 'sm:w-1/2 justify-center' : ''}`}>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#141414]/50 block mb-1">
                            {product.category}
                          </span>
                          <h3
                            onClick={() => onViewProduct(product)}
                            className="font-sans text-xs sm:text-sm font-bold text-[#141414] hover:underline cursor-pointer truncate mb-1"
                          >
                            {product.name}
                          </h3>
                          {isFeaturedBreak && (
                            <p className="text-xs text-[#141414]/70 line-clamp-3 mb-4 font-sans leading-relaxed">
                              {product.description}
                            </p>
                          )}

                          {/* Color Swatch Preview */}
                          <div className="flex items-center gap-1.5 my-2">
                            {product.colors.slice(0, 3).map((col) => (
                              <span
                                key={col.name}
                                className="w-3 h-3 rounded-full border border-black/20"
                                style={{ backgroundColor: col.hex }}
                                title={col.name}
                              />
                            ))}
                            {product.colors.length > 3 && (
                              <span className="text-[10px] font-mono text-[#141414]/50">
                                +{product.colors.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Add To Bag & Quick View */}
                        <div className="flex items-center gap-2 pt-2 border-t border-[#DAD8D1]/60">
                          <button
                            onClick={() => addToCart(product)}
                            className="flex-1 py-2 bg-[#141414] text-[#F2F0EB] text-[11px] font-semibold uppercase tracking-wider rounded-full hover:bg-black transition-colors"
                          >
                            QUICK ADD
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-[#141414]">
                  <X className="w-5 h-5" />
                </button>
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
