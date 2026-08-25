import React from 'react';
import { COLLECTIONS } from '../data/products';
import { ArrowUpRight } from 'lucide-react';

interface CollectionsGridProps {
  onSelectCollection: (collectionId: string) => void;
}

export const CollectionsGrid: React.FC<CollectionsGridProps> = ({ onSelectCollection }) => {
  return (
    <section 
      id="collections-section" 
      className="relative w-full bg-[#F2F0EB] py-20 sm:py-28 lg:py-32 overflow-hidden border-b border-[#E3DEC3]/70"
    >
      <div className="piercyn-container">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-14 lg:mb-16 gap-3">
          <div>
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-sans font-semibold block mb-2 sm:mb-3">
              03 / ARCHIVES & RELEASES
            </span>
            <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl uppercase tracking-[-0.03em] text-[#141414] leading-[0.9] select-none">
              SHOP BY COLLECTION
            </h2>
          </div>
          <p className="font-sans text-[12px] sm:text-[13px] uppercase tracking-[0.15em] text-[#6E6B65] max-w-xs sm:text-right font-medium">
            Four visual chapters exploring Nigerian contemporary form.
          </p>
        </div>

        {/* Mobile: 1 or 2-Col | Desktop: 4-Column Magazine Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {COLLECTIONS.map((col, index) => (
            <div
              key={col.id}
              id={`collection-panel-${col.id}`}
              onClick={() => onSelectCollection(col.id)}
              className="group relative aspect-[3/4.2] sm:aspect-[3/4.5] w-full overflow-hidden bg-[#181818] rounded-xl cursor-pointer flex flex-col justify-between p-5 sm:p-6 lg:p-7 select-none shadow-xs transition-all duration-300 active:scale-[0.99]"
            >
              {/* Magazine Background Photograph with smooth zoom on hover */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                  src={col.image}
                  alt={col.title}
                  className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.06] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 transition-opacity duration-500 group-hover:opacity-95" />
              </div>

              {/* Top Magazine Header Details */}
              <div className="relative z-10 flex items-center justify-between text-[#F2F0EB]/90 text-[11px] tracking-[0.18em] uppercase font-sans font-semibold">
                <span className="px-3 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-white/20">
                  VOL. 0{index + 1}
                </span>
                <span className="text-white/90 font-medium">{col.itemCount}</span>
              </div>

              {/* Center & Bottom Overlay Typography */}
              <div className="relative z-10 transition-transform duration-500 ease-out sm:group-hover:-translate-y-2">
                {/* Subtitle */}
                <p className="text-[11px] tracking-[0.2em] uppercase text-[#E3DEC3] mb-1 sm:mb-2 font-sans font-medium">
                  {col.subtitle}
                </p>

                {/* Large Serif Title placed directly over photography */}
                <h3 className="font-editorial text-3xl sm:text-4xl xl:text-5xl text-[#F2F0EB] uppercase leading-[0.92] tracking-[-0.03em] mb-2 sm:mb-3">
                  {col.title}
                </h3>

                <p className="font-sans text-[12px] sm:text-[13px] text-[#F2F0EB]/80 leading-[1.5] line-clamp-2 font-normal mb-3 sm:mb-4 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {col.description}
                </p>

                {/* Bottom Corner: EXPLORE → */}
                <div className="flex items-center justify-between border-t border-white/20 pt-3">
                  <span className="font-sans text-[12px] tracking-[0.18em] uppercase text-[#F2F0EB] font-semibold editorial-link">
                    EXPLORE →
                  </span>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/30 group-hover:border-white group-hover:bg-white group-hover:text-black text-white flex items-center justify-center transition-all duration-300">
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
