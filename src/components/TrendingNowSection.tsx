import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import { formatPrice } from '../utils/currency';
import { Plus, Heart, ArrowRight } from 'lucide-react';

interface TrendingNowSectionProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
}

export const TrendingNowSection: React.FC<TrendingNowSectionProps> = ({
  products,
  onViewProduct,
}) => {
  const { currency, addToCart, toggleWishlist, isWishlisted } = useShop();
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

  // Filter trending pieces (best sellers or iconic)
  const trendingProducts = products
    .filter((p) => p.isBestSeller || p.tag === 'ICONIC' || p.tag === 'BESTSELLER')
    .slice(0, 4);

  // Fallback if none flagged
  const displayProducts = trendingProducts.length >= 2 ? trendingProducts : products.slice(0, 4);

  return (
    <section
      id="trending-now-section"
      className="w-full bg-[#F2F0EB] text-[#141414] py-16 sm:py-24 lg:py-28 overflow-hidden border-b border-[#DAD8D1]/70"
    >
      <div className="piercyn-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <span className="section-eyebrow text-[#A48B71] block mb-2">
              COMMUNITY PICKS
            </span>
            <h2 className="font-editorial text-[10vw] sm:text-[6vw] lg:text-[52px] leading-[0.92] tracking-[-0.03em] uppercase">
              TRENDING NOW<span className="text-[#A48B71]">.</span>
            </h2>
          </div>
          <p className="font-sans text-[12px] sm:text-[13px] uppercase tracking-[0.14em] text-[#6E6B65] font-medium max-w-xs">
            Most-wanted pieces right now across Lagos.
          </p>
        </div>

        {/* Product Cards Rail */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          {displayProducts.map((product) => {
            const isHovered = hoveredProductId === product.id;
            const currentImg = isHovered && product.colors[0]?.altImage 
              ? product.colors[0].altImage 
              : product.colors[0]?.image || product.images[0];

            return (
              <div
                key={product.id}
                id={`trending-item-${product.id}`}
                className="group relative flex flex-col cursor-pointer w-[76vw] max-w-[300px] sm:w-auto shrink-0 snap-start select-none"
                onMouseEnter={() => setHoveredProductId(product.id)}
                onMouseLeave={() => setHoveredProductId(null)}
                onClick={() => onViewProduct(product)}
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#E8E4DA] mb-3 sm:mb-4 rounded-xl shadow-2xs">
                  <img
                    src={currentImg}
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                  />

                  {/* Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="text-[9px] font-sans font-bold tracking-[0.16em] uppercase px-2.5 py-1 rounded-full bg-[#141414] text-[#F2F0EB]">
                      TRENDING
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className="absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105 flex items-center justify-center cursor-pointer shadow-xs"
                    aria-label="Save to Wishlist"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isWishlisted(product.id) ? 'fill-[#141414] text-[#141414]' : 'text-[#141414]'
                      }`}
                    />
                  </button>

                  {/* Desktop Quick View Overlay */}
                  <div className="hidden sm:flex absolute inset-x-3 bottom-3 z-10 p-1 items-center justify-between gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProduct(product);
                      }}
                      className="flex-1 py-2 px-3 rounded-full bg-[#F2F0EB]/95 backdrop-blur-md text-[#141414] text-[11px] tracking-[0.16em] uppercase font-semibold hover:bg-[#141414] hover:text-[#F2F0EB] transition-colors shadow-sm text-center"
                    >
                      QUICK VIEW
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-9 h-9 rounded-full bg-[#141414] text-[#F2F0EB] hover:bg-black transition-colors shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
                      title="Add to Bag"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col space-y-1 font-sans">
                  <h3 className="text-[13px] sm:text-[14px] uppercase tracking-[0.04em] font-semibold text-[#141414] leading-snug line-clamp-1">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between text-[13px] sm:text-[14px] tracking-[0.02em]">
                    <span className="font-sans text-[#141414] font-semibold">
                      {formatPrice(product, currency)}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      {product.colors.map((c) => (
                        <span 
                          key={c.name}
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
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

        {/* Footer Jump Action */}
        <div className="mt-6 sm:mt-12 flex items-center justify-between gap-4">
          <div className="sm:hidden flex items-center gap-1.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#141414]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#141414]/30" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#141414]/30" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#141414]/30" />
          </div>

          <div className="w-full sm:w-auto text-right">
            <button
              onClick={() => {
                document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto h-12 min-h-[48px] px-7 rounded-full border border-[#141414]/80 text-[12px] sm:text-[13px] uppercase tracking-[0.16em] text-[#141414] font-semibold hover:bg-[#141414] hover:text-[#F2F0EB] transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>EXPLORE ALL PIECES</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
