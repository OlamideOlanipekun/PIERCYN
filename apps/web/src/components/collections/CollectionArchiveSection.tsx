import React from 'react';
import { ARCHIVE_COLLECTIONS } from '../../data/collections';
import { ArrowUpRight } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export const CollectionArchiveSection: React.FC = () => {
  const { showToast } = useShop();

  return (
    <section 
      id="collection-archive"
      className="relative w-full bg-[#F2F0EB] py-20 sm:py-28 lg:py-32 border-b border-[#E3DEC3]/70 overflow-hidden"
    >
      <div className="piercyn-container space-y-10 sm:space-y-14">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E3DEC3] pb-6">
          <div>
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-sans font-semibold block mb-2">
              06 / HISTORICAL VAULT
            </span>
            <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl uppercase tracking-[-0.03em] text-[#141414]">
              THE ARCHIVE<span className="text-[#A48B71]">.</span>
            </h2>
          </div>

          <p className="font-sans text-[13px] sm:text-[15px] text-[#4A4844] font-normal tracking-[0.02em] max-w-sm">
            Previous releases, archived runway looks, and historical capsules from the Lagos atelier.
          </p>
        </div>

        {/* 2-Column Mobile Grid, 4-Column Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {ARCHIVE_COLLECTIONS.map((arch) => (
            <div
              key={arch.id}
              onClick={() => showToast(`Accessing ${arch.name} historical archive...`)}
              className="group relative flex flex-col cursor-pointer select-none"
            >
              {/* Tile Image with 4:5 ratio */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E7E2D6] rounded-xl mb-3 shadow-2xs">
                <img
                  src={arch.image}
                  alt={arch.name}
                  className="w-full h-full object-cover filter contrast-[1.05] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors duration-300" />
                
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-black/80 text-[#F2F0EB] backdrop-blur-xs">
                    {arch.year}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-[#F2F0EB] text-[#141414] flex items-center justify-center shadow-md">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Minimal Text Details */}
              <div className="font-sans space-y-0.5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em] text-[#6E6B65]">
                  <span>{arch.season}</span>
                  <span>{arch.pieceCount} PIECES</span>
                </div>
                <h4 className="text-[12px] sm:text-[13px] font-sans uppercase tracking-[0.06em] font-semibold text-[#141414] leading-tight line-clamp-1 group-hover:underline">
                  {arch.name}
                </h4>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
