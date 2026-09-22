import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import { formatPrice } from '../utils/currency';
import { Eye, Plus, Heart, ArrowRight } from 'lucide-react';

interface NewDropSectionProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
}

export const NewDropSection: React.FC<NewDropSectionProps> = ({ products, onViewProduct }) => {
  const { currency, addToCart, toggleWishlist, isWishlisted } = useShop();
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

  const newDropProducts = products.filter((p) => p.isNewDrop).slice(0, 4);

  return (
    <section id="new-drop-section" className="relative w-full bg-[#F2F0EB] py-20 sm:py-28 lg:py-32 overflow-hidden border-b border-[#E3DEC3]/70">
      <div className="piercyn-container">
        {/* Top Editorial Header & Overlapping Typography */}
        <div className="relative mb-10 sm:mb-14 lg:mb-16">
          {/* Eyebrow Label */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-sans font-semibold">
              JUST DROPPED
            </span>
            <span className="hidden sm:inline-block text-[11px] uppercase tracking-[0.2em] text-[#141414]/60 font-sans font-medium">
              Fresh pieces, ready for you.
            </span>
          </div>

          {/* Large Serif Text */}
          <div className="font-editorial text-[14vw] sm:text-[11vw] lg:text-[8.5vw] xl:text-[125px] leading-[0.86] tracking-[-0.03em] uppercase text-[#141414] select-none">
            <div>THE NEW</div>
            <div className="italic font-light sm:pl-16 lg:pl-32">STANDARD<span className="not-italic text-[#141414]/40">.</span></div>
          </div>
        </div>

        {/* Mobile: Horizontal Product Carousel (72vw peek) | Desktop: 4-Column Grid */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          {newDropProducts.map((product, idx) => {
            const isHovered = hoveredProductId === product.id;
            const currentImg = isHovered && product.colors[0]?.altImage 
              ? product.colors[0].altImage 
              : product.colors[0]?.image || product.images[0];

            return (
              <div
                key={product.id}
                id={`new-drop-item-${product.id}`}
                className="group relative flex flex-col cursor-pointer w-[72vw] max-w-[280px] sm:w-auto shrink-0 snap-start select-none"
                onMouseEnter={() => setHoveredProductId(product.id)}
                onMouseLeave={() => setHoveredProductId(null)}
                onClick={() => onViewProduct(product)}
              >
                {/* Product Image Container with strict 4:5 aspect ratio */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E7E2D6] mb-3 sm:mb-4 rounded-lg shadow-2xs">
                  <img
                    src={currentImg}
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-[1.025]"
                    loading="lazy"
                  />

                  {/* Micro Index Tag Pill */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-[9px] font-mono tracking-[0.25em] uppercase px-2.5 py-0.5 rounded-full bg-[#141414]/85 text-[#F2F0EB] backdrop-blur-xs">
                      {product.gsm || `0${idx + 1}`}
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
                      className={`w-3.5 h-3.5 ${
                        isWishlisted(product.id) ? 'fill-[#141414] text-[#141414]' : 'text-[#141414]'
                      }`}
                    />
                  </button>

                  {/* Desktop Hover Overlay: Quick View and Add Action Pills */}
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
                        addToCart(product);
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
                  <h3 className="text-[13px] sm:text-[14px] uppercase tracking-[0.06em] font-semibold text-[#141414] leading-snug line-clamp-1 min-h-[1.4rem]">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between text-[13px] sm:text-[14px] tracking-[0.02em] text-[#6E6B65]">
                    <span className="font-sans text-[#141414] font-semibold">
                      {formatPrice(product, currency)}
                    </span>
                    
                    {/* Color Swatch Dots */}
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

        {/* Mobile Swipe Hint and View All Button */}
        <div className="mt-8 sm:mt-14 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="sm:hidden text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C8A84] flex items-center gap-1.5">
            <span>← SWIPE DROP</span>
          </div>

          <div className="w-full sm:w-auto text-center sm:text-right">
            <button
              onClick={() => {
                document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto h-12 min-h-[48px] px-7 rounded-full border border-[#141414]/80 text-[12px] sm:text-[13px] uppercase tracking-[0.16em] text-[#141414] font-semibold hover:bg-[#141414] hover:text-[#F2F0EB] transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>VIEW ALL NEW PIECES</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
