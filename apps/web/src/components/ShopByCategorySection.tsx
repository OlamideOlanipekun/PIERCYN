import React from 'react';
import { ActivePageView } from '../types';
import { CATEGORY_TILES, CategoryTileConfig } from '../config/homepage';
import { ProductImage } from './ProductImage';
import { ArrowUpRight } from 'lucide-react';

interface ShopByCategorySectionProps {
  onSelectPage: (page: ActivePageView) => void;
  onSelectCategoryFilter?: (category: string) => void;
}

export const ShopByCategorySection: React.FC<ShopByCategorySectionProps> = ({
  onSelectPage,
  onSelectCategoryFilter,
}) => {
  const handleCategoryClick = (cat: CategoryTileConfig) => {
    if (onSelectCategoryFilter) {
      onSelectCategoryFilter(cat.slug);
    }
    onSelectPage('shop');
  };

  return (
    <section
      id="shop-by-category-section"
      className="w-full bg-white text-[#141414] py-12 sm:py-16 lg:py-20 border-b border-[#F0F0F0]"
    >
      <div className="piercyn-container">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-10 pb-3 border-b border-[#DAD8D1]/60">
          <div>
            <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] block mb-1">
              CURATED CATEGORIES
            </span>
            <h2 className="font-editorial text-2xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#141414]">
              SHOP BY CATEGORY
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#6E6B65] mt-1">
              Engineered menswear silhouettes.
            </p>
          </div>

          <button
            onClick={() => onSelectPage('shop')}
            className="group min-h-[44px] flex items-center gap-1.5 text-xs font-sans font-bold tracking-[0.12em] uppercase text-[#141414] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <span>VIEW ALL ({CATEGORY_TILES.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* Visual Category Grid: 4-col on desktop, 2-col on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {CATEGORY_TILES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className="group relative rounded-xl overflow-hidden bg-[#141414] text-[#F2F0EB] cursor-pointer shadow-2xs select-none"
            >
              {/* Category Garment Image at 3:4 Aspect Ratio */}
              <ProductImage
                src={cat.image}
                alt={cat.altText}
                aspectRatio="3/4"
                objectPosition="center center"
                imgClassName="filter brightness-[0.80] contrast-[1.05] transition-transform duration-700 ease-out group-hover:scale-105 group-hover:brightness-[0.70]"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

              {/* Top Tag if any */}
              {cat.tag && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#ECE8E1] text-[#141414] font-bold">
                    {cat.tag}
                  </span>
                </div>
              )}

              {/* Bottom Content */}
              <div className="absolute inset-x-3.5 bottom-3.5 sm:inset-x-4 sm:bottom-4 z-10 flex flex-col justify-end pointer-events-none">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-editorial text-base sm:text-xl lg:text-2xl uppercase tracking-tight leading-tight text-[#F2F0EB]">
                      {cat.name}
                    </h3>
                    <span className="text-[10px] sm:text-[11px] font-sans text-[#EAE5D9]/80 block mt-0.5 font-medium">
                      {cat.itemCountText}
                    </span>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#141414] transition-colors shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
