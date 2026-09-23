import React from 'react';
import { ActivePageView } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface ShopByCategorySectionProps {
  onSelectPage: (page: ActivePageView) => void;
  onSelectCategoryFilter?: (category: string) => void;
}

interface VisualCategory {
  title: string;
  count: string;
  filter?: string;
  pageKey?: ActivePageView;
  image: string;
  tag?: string;
}

const CATEGORIES: VisualCategory[] = [
  {
    title: 'T-SHIRTS & TEES',
    count: 'Boxy & Heavyweight',
    filter: 't-shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'TROUSERS & CARGOS',
    count: 'Relaxed & Articulated',
    filter: 'trousers',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'HOODIES & SWEATS',
    count: '450 GSM French Terry',
    filter: 'hoodies',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'JACKETS & OUTERWEAR',
    count: 'Lagos Structured Cuts',
    filter: 'jackets',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'POLOS & TOPS',
    count: 'Textured Knits & Meshes',
    filter: 'polos',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=900&auto=format&fit=crop',
  },
  {
    title: 'ACCESSORIES',
    count: 'Headwear & Carry Goods',
    pageKey: 'accessories',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=900&auto=format&fit=crop',
    tag: 'COMING SOON',
  },
];

export const ShopByCategorySection: React.FC<ShopByCategorySectionProps> = ({
  onSelectPage,
  onSelectCategoryFilter,
}) => {
  const handleCategoryClick = (cat: VisualCategory) => {
    if (cat.pageKey) {
      onSelectPage(cat.pageKey);
    } else if (cat.filter) {
      if (onSelectCategoryFilter) {
        onSelectCategoryFilter(cat.filter);
      }
      onSelectPage('shop');
    }
  };

  return (
    <section
      id="shop-by-category-section"
      className="w-full bg-[#F2F0EB] text-[#141414] py-12 sm:py-16 lg:py-20 border-b border-[#DAD8D1]/70"
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
              Find your silhouette.
            </p>
          </div>

          <button
            onClick={() => onSelectPage('shop')}
            className="group min-h-[44px] flex items-center gap-1.5 text-xs font-sans font-bold tracking-[0.12em] uppercase text-[#141414] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <span>VIEW ALL ({CATEGORIES.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* Visual Category Grid: 3-col on desktop, 2-col on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.title}
              onClick={() => handleCategoryClick(cat)}
              className="group relative aspect-[3/4] sm:aspect-[4/5] rounded-xl overflow-hidden bg-[#141414] text-[#F2F0EB] cursor-pointer shadow-2xs select-none"
            >
              {/* Category Image */}
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.05] transition-transform duration-700 ease-out group-hover:scale-105 group-hover:brightness-[0.70]"
                loading="lazy"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              {/* Top Tag if any */}
              {cat.tag && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#A48B71] text-[#141414] font-bold">
                    {cat.tag}
                  </span>
                </div>
              )}

              {/* Bottom Content */}
              <div className="absolute inset-x-3.5 bottom-3.5 sm:inset-x-5 sm:bottom-5 z-10 flex flex-col justify-end">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-editorial text-lg sm:text-2xl lg:text-3xl uppercase tracking-tight leading-tight text-[#F2F0EB]">
                      {cat.title}
                    </h3>
                    <span className="text-[10px] sm:text-[11px] font-sans text-[#EAE5D9]/80 block mt-0.5 font-medium">
                      {cat.count}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#141414] transition-colors shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
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
