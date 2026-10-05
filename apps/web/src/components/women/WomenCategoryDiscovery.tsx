import React from 'react';
import { WomenCategory } from '../../types';
import { ArrowUpRight } from 'lucide-react';

interface WomenCategoryDiscoveryProps {
  onSelectCategory: (category: WomenCategory) => void;
}

interface DiscoveryTile {
  title: string;
  subtitle: string;
  category: WomenCategory;
  image: string;
  count: string;
}

const TILES: DiscoveryTile[] = [
  {
    title: 'CROPPED HEAVYWEIGHTS',
    subtitle: '450 GSM Unbrushed French Terry',
    category: 'HOODIES & FLEECE',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1000&auto=format&fit=crop',
    count: '04 STYLES'
  },
  {
    title: 'FLUID & TAILORED TROUSERS',
    subtitle: 'Deep Pleats & Selvedge Cuts',
    category: 'TROUSERS & SKIRTS',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1000&auto=format&fit=crop',
    count: '03 STYLES'
  },
  {
    title: 'SCULPTED TOPS & BODYSUITS',
    subtitle: 'Form-Defining 2x2 Dense Rib',
    category: 'CROPPED & TOPS',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1000&auto=format&fit=crop',
    count: '03 STYLES'
  },
  {
    title: 'ATELIER COLUMN DRESSES',
    subtitle: '340 GSM Mercerized Interlock',
    category: 'DRESSES & SETS',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=85&w=1000&auto=format&fit=crop',
    count: '02 STYLES'
  }
];

export const WomenCategoryDiscovery: React.FC<WomenCategoryDiscoveryProps> = ({
  onSelectCategory
}) => {
  return (
    <section 
      id="women-category-discovery"
      className="w-full bg-[#F2F0EB] py-16 sm:py-24 border-t border-[#E2DDD3]"
    >
      <div className="piercyn-container space-y-10 sm:space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2DDD3] pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono tracking-[0.25em] text-[#706E6B] uppercase font-semibold">
              03 / EXPLORE BY SILHOUETTE
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight text-[#141414]">
              WOMEN’S PIERCYN ARCHIVES
            </h2>
          </div>
          <span className="text-xs font-mono text-[#8C887B] uppercase tracking-widest hidden sm:inline-block">
            DROP 26.1 / LAGOS
          </span>
        </div>

        {/* 4-Tile Discovery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {TILES.map((tile) => (
            <div
              key={tile.title}
              onClick={() => onSelectCategory(tile.category)}
              className="group relative aspect-[3/4] overflow-hidden bg-[#222] rounded-xs cursor-pointer select-none"
            >
              {/* Image */}
              <img
                src={tile.image}
                alt={tile.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out opacity-85 group-hover:opacity-95"
                loading="lazy"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Top Meta */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <span className="text-[10px] font-mono tracking-[0.2em] text-[#D8D4CA] uppercase bg-black/50 px-2 py-0.5 backdrop-blur-xs">
                  {tile.count}
                </span>
                <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Bottom Details */}
              <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#E3DEC3]">
                  {tile.subtitle}
                </span>
                <h3 className="font-editorial text-xl sm:text-2xl uppercase tracking-tight text-[#F2F0EB] leading-none group-hover:text-[#E3DEC3] transition-colors">
                  {tile.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
