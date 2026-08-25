import React from 'react';
import { ArrowRight } from 'lucide-react';
import { MenCategory } from '../../types';

interface MenCategoryDiscoveryProps {
  onSelectCategory: (category: MenCategory) => void;
}

const CATEGORY_TILES = [
  {
    category: 'HOODIES' as MenCategory,
    title: '450 GSM HOODIES',
    subtitle: 'ARCHITECTURAL HEAVYWEIGHT FLEECE',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=85&w=1200&auto=format&fit=crop',
    piecesCount: '4 SILHOUETTES'
  },
  {
    category: 'JEANS' as MenCategory,
    title: 'RAW & PLEATED DENIM',
    subtitle: '14OZ & 15OZ ARTICULATED SELVEDGE',
    image: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=85&w=1200&auto=format&fit=crop',
    piecesCount: '3 FITS'
  },
  {
    category: 'SWEATSHIRTS' as MenCategory,
    title: 'BRUTALIST SWEATSHIRTS',
    subtitle: 'UNBRUSHED LOOPBACK COTTON',
    image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=85&w=1200&auto=format&fit=crop',
    piecesCount: '2 EDITIONS'
  },
  {
    category: 'POLOS' as MenCategory,
    title: 'MESH & KNIT POLOS',
    subtitle: 'OPEN-WEAVE SUMMER RELAXED CAMP',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=85&w=1200&auto=format&fit=crop',
    piecesCount: '2 KNITS'
  }
];

export const MenCategoryDiscovery: React.FC<MenCategoryDiscoveryProps> = ({ onSelectCategory }) => {
  return (
    <section 
      id="men-category-discovery"
      className="w-full py-12 sm:py-16 md:py-24 bg-[#EBE7DF]/60 border-t border-[#DAD8D1]"
    >
      <div className="piercyn-container">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-12">
          <div>
            <span className="text-[11px] font-mono tracking-[0.25em] text-[#6E6B65] uppercase font-semibold block mb-1">
              CATEGORY DISCOVERY
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl uppercase tracking-[-0.03em] text-[#141414]">
              EXPLORE <span className="italic font-light">MEN</span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-sans text-[#6E6B65] max-w-sm">
            Curated categories engineered for distinct silhouettes, textures, and daily utility.
          </p>
        </div>

        {/* Category Tiles Grid: 2-column on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {CATEGORY_TILES.map((tile) => (
            <div
              key={tile.category}
              onClick={() => {
                onSelectCategory(tile.category);
                document.getElementById('men-category-navigation')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group relative aspect-[16/10] sm:aspect-[16/9] rounded-[12px] overflow-hidden bg-[#141414] cursor-pointer select-none"
            >
              {/* Tile Background Image */}
              <img
                src={tile.image}
                alt={tile.title}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-90 will-change-transform"
                loading="lazy"
              />

              {/* Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Top Badge: Item Count */}
              <div className="absolute top-4 left-4 z-10">
                <span className="text-[9.5px] font-mono tracking-[0.2em] uppercase text-[#E3DEC3] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                  {tile.piecesCount}
                </span>
              </div>

              {/* Bottom Content & CTA Arrow */}
              <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 z-10 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#D8D4CA] block mb-1">
                    {tile.subtitle}
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-3xl uppercase tracking-[-0.02em] text-[#F2F0EB]">
                    {tile.title}
                  </h3>
                </div>

                {/* Animated Arrow Pill */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F2F0EB] text-[#141414] flex items-center justify-center group-hover:bg-[#E3DEC3] group-hover:scale-110 group-hover:translate-x-1 transition-all duration-300 shadow-md shrink-0">
                  <ArrowRight className="w-4 h-4 text-[#141414]" />
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
