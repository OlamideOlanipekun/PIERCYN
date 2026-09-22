import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import { formatPrice } from '../utils/currency';
import { Heart, Eye, Plus, ArrowUpDown, SlidersHorizontal } from 'lucide-react';

interface ProductCatalogSectionProps {
  products: Product[];
  selectedCategoryFilter?: string | null;
  onViewProduct: (product: Product) => void;
}

export const ProductCatalogSection: React.FC<ProductCatalogSectionProps> = ({
  products,
  selectedCategoryFilter,
  onViewProduct
}) => {
  const { currency, addToCart, toggleWishlist, isWishlisted } = useShop();
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategoryFilter || 'all');
  const [sortBy, setSortBy] = useState<'featured' | 'gsm' | 'price-asc' | 'price-desc'>('featured');
  const [hoveredColorIndex, setHoveredColorIndex] = useState<{ [productId: string]: number }>({});

  const categories = [
    { id: 'all', label: 'ALL PIECES' },
    { id: 'hoodies', label: 'HOODIES & SWEATS' },
    { id: 'trousers', label: 'TROUSERS & DENIM' },
    { id: 'tees', label: 'TEES' },
    { id: 'outerwear', label: 'OUTERWEAR' },
    { id: 'polos', label: 'KNITS & POLOS' }
  ];

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return products.length;
    return products.filter((p) => p.category === catId).length;
  };

  const filteredProducts = products.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'gsm') {
      const gsmA = parseInt(a.gsm || '0', 10);
      const gsmB = parseInt(b.gsm || '0', 10);
      return gsmB - gsmA;
    }
    if (sortBy === 'price-asc') {
      return a.priceNGN - b.priceNGN;
    }
    if (sortBy === 'price-desc') {
      return b.priceNGN - a.priceNGN;
    }
    return 0;
  });

  return (
    <section 
      id="products-section" 
      className="relative w-full bg-[#F2F0EB] py-20 sm:py-28 lg:py-32 overflow-hidden border-b border-[#E3DEC3]/70"
    >
      <div className="piercyn-container">
        
        {/* Large Centered Serif Title Overlapping Product Area */}
        <div className="relative text-center mb-10 sm:mb-14 lg:mb-16">
          <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-sans font-semibold block mb-2 sm:mb-3">
            POPULAR PIECES
          </span>
          <h2 className="font-editorial text-[13vw] sm:text-[9vw] lg:text-[7vw] xl:text-[110px] leading-[0.88] tracking-[-0.03em] uppercase text-[#141414] select-none">
            <div>CURRENTLY</div>
            <div className="italic font-light">IN PIERCYN<span className="not-italic text-[#A48B71]">.</span></div>
          </h2>

          {/* Controls Bar: Category Pills + Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-10 border-b border-[#E3DEC3] pb-4 font-sans">
            {/* Filter Navigation with Horizontally Scrollable Pill Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-full pb-1 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 text-[11px] sm:text-[12px] tracking-[0.12em] uppercase font-semibold">
              {categories.map((cat) => {
                const count = getCategoryCount(cat.id);
                return (
                  <button
                    key={cat.id}
                    id={`catalog-filter-${cat.id}`}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`h-11 min-h-[44px] px-4.5 rounded-full transition-all duration-300 cursor-pointer shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                      activeCategory === cat.id
                        ? 'bg-[#141414] text-[#F2F0EB] font-bold shadow-xs'
                        : 'bg-[#E8E6E1]/90 text-[#6E6B65] hover:text-[#141414] hover:bg-[#E8E6E1]'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Sort Selector with matching 44px height */}
            <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] font-sans font-semibold uppercase tracking-wider text-[#141414] shrink-0 pt-1 sm:pt-0">
              <div className="flex items-center gap-1.5 text-[#6E6B65]">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>SORT BY:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-11 min-h-[44px] bg-[#EAE5DA] border border-[#D5CFBF] rounded-full px-4 text-[11px] font-sans font-semibold uppercase tracking-wider focus:outline-none focus:border-[#141414] cursor-pointer"
              >
                <option value="featured">EDITORIAL ORDER</option>
                <option value="gsm">HEAVIEST GSM FIRST</option>
                <option value="price-asc">PRICE: LOW TO HIGH</option>
                <option value="price-desc">PRICE: HIGH TO LOW</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2-Column Mobile Product Layout with strict 8-12px horizontal gap & 24px vertical gap */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-2.5 sm:gap-x-6 gap-y-6 sm:gap-y-8">
          {sortedProducts.map((product) => {
            const activeColorIdx = hoveredColorIndex[product.id] ?? 0;
            const currentSelectedColor = product.colors[activeColorIdx] || product.colors[0];
            const displayImage = currentSelectedColor?.image || product.images[0];

            return (
              <div
                key={product.id}
                id={`catalog-product-${product.id}`}
                onClick={() => onViewProduct(product)}
                className="group flex flex-col cursor-pointer select-none"
              >
                {/* 4:5 Ratio Image matching strict editorial mobile grid */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E7E2D6] mb-2.5 sm:mb-3.5 rounded-lg shadow-2xs">
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-[1.025]"
                    loading="lazy"
                  />

                  {/* Top Left: Tag or GSM Pill */}
                  <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10">
                    <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-[#141414]/90 text-[#F2F0EB] backdrop-blur-xs border border-white/10">
                      {product.gsm || product.tag || 'LAGOS'}
                    </span>
                  </div>

                  {/* Top Right: Wishlist Heart Icon with min 44px hit target */}
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer group/btn"
                      aria-label="Wishlist"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover/btn:scale-110 flex items-center justify-center shadow-xs">
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isWishlisted(product.id) ? 'fill-[#141414] text-[#141414]' : 'text-[#141414]'
                          }`}
                        />
                      </div>
                    </button>
                  </div>

                  {/* Hover Quick Action Strip with Pill Controls */}
                  <div className="hidden sm:flex absolute inset-x-3 bottom-3 z-10 p-1 items-center justify-between gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProduct(product);
                      }}
                      className="flex-1 py-2 px-3 rounded-full bg-[#F2F0EB]/95 backdrop-blur-md text-[#141414] text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-[#141414] hover:text-[#F2F0EB] transition-colors shadow-sm text-center"
                    >
                      QUICK VIEW
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product, currentSelectedColor?.name);
                      }}
                      className="w-8 h-8 rounded-full bg-[#141414] text-[#F2F0EB] hover:bg-black transition-colors shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
                      title="Add to Bag"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Minimal Metadata Beneath with consistent baseline heights */}
                <div className="flex flex-col space-y-1 font-sans">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[12.5px] sm:text-[14px] uppercase tracking-[0.05em] font-semibold text-[#141414] leading-snug line-clamp-1 min-h-[1.4rem] group-hover:underline">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="font-sans text-[12.5px] sm:text-[14px] text-[#141414] font-semibold">
                      {formatPrice(product, currency)}
                    </span>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {product.colors.map((c, i) => (
                        <button
                          key={c.name}
                          onClick={() => setHoveredColorIndex((prev) => ({ ...prev, [product.id]: i }))}
                          className={`w-3 h-3 rounded-full border transition-all cursor-pointer ${
                            activeColorIdx === i ? 'border-[#141414] scale-110 ring-1 ring-[#141414]' : 'border-black/20 opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
