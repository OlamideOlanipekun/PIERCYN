import React from 'react';
import { LOOKBOOK_LOOKS } from '../data/lookbook';
import { LookbookLook } from '../types';
import { useShop } from '../context/ShopContext';
import { ArrowUpRight, Sparkles } from 'lucide-react';

interface LookbookSectionProps {
  onSelectLook: (look: LookbookLook) => void;
}

export const LookbookSection: React.FC<LookbookSectionProps> = ({ onSelectLook }) => {
  return (
    <section 
      id="lookbook-section" 
      className="relative w-full bg-[#F2F0EB] py-20 sm:py-28 lg:py-32 overflow-hidden border-b border-[#E3DEC3]/70"
    >
      <div className="piercyn-container">
        
        {/* Top Editorial Headline with Overlaid Typography */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 sm:mb-16 lg:mb-20 gap-4 sm:gap-8">
          <div>
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-sans font-semibold block mb-2 sm:mb-3">
              06 / SEASONAL VISUAL RECORD
            </span>
            <h2 className="font-editorial text-[13vw] sm:text-[11vw] lg:text-[8vw] xl:text-[120px] leading-[0.86] tracking-[-0.03em] uppercase text-[#141414] select-none">
              <div>LOOKBOOK</div>
              <div className="italic font-light pl-4 sm:pl-16 lg:pl-28">2026<span className="not-italic text-[#A48B71]">.</span></div>
            </h2>
          </div>

          <div className="max-w-sm font-sans">
            <p className="text-[14px] sm:text-[15px] text-[#4A4844] font-normal leading-[1.6] mb-2 sm:mb-4">
              Captured across brutalist spaces in Lagos. Each look represents a complete sartorial stance engineered for ease and unapologetic volume.
            </p>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#6E6B65] font-sans font-semibold block">
              TAP ANY LOOK TO SHOP COMPLETE OUTFIT
            </span>
          </div>
        </div>

        {/* Fashion Editorial Collage */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LOOK 01: Hero Portrait (Span 7 cols) with 12-16px radius */}
          <div 
            className="md:col-span-7 group cursor-pointer active:scale-[0.99] transition-transform"
            onClick={() => onSelectLook(LOOKBOOK_LOOKS[0])}
          >
            <div className="relative aspect-[3/3.8] sm:aspect-[3/4.2] w-full overflow-hidden bg-[#E7E2D6] mb-3 sm:mb-4 rounded-xl shadow-xs">
              <img
                src={LOOKBOOK_LOOKS[0].image}
                alt={LOOKBOOK_LOOKS[0].title}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                loading="lazy"
              />
              
              {/* Overlay Identifier Pill */}
              <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10">
                <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.25em] uppercase bg-[#141414]/90 text-[#F2F0EB] px-3 py-1 rounded-full backdrop-blur-xs">
                  {LOOKBOOK_LOOKS[0].number}
                </span>
              </div>

              {/* Bottom Mobile Action Pill Overlay */}
              <div className="absolute inset-x-3.5 bottom-3.5 z-10 sm:hidden">
                <div className="w-full min-h-[48px] rounded-full bg-[#141414]/85 backdrop-blur-md text-white text-[10px] uppercase tracking-[0.22em] font-medium flex items-center justify-center gap-2 px-4 shadow-md">
                  <span>SHOP THE COMPLETE LOOK</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Desktop Hover Cue */}
              <div className="hidden sm:flex absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center p-6 text-center">
                <div className="text-white">
                  <span className="inline-block px-5 py-2.5 rounded-full bg-white text-black text-[10px] uppercase tracking-[0.25em] font-medium shadow-md mb-2">
                    SHOP THE COMPLETE LOOK →
                  </span>
                  <span className="text-[9px] font-mono tracking-[0.2em] opacity-80 block">
                    2 CURATED SILHOUETTES
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-2xl uppercase tracking-[-0.02em] text-[#141414]">
                  {LOOKBOOK_LOOKS[0].title}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-[#7A7771] tracking-[0.05em] uppercase mt-0.5 font-mono">
                  {LOOKBOOK_LOOKS[0].location}
                </p>
              </div>
              <span className="hidden sm:inline-block text-[10px] tracking-[0.2em] uppercase text-[#141414] font-medium editorial-link">
                VIEW OUTFIT →
              </span>
            </div>
          </div>

          {/* LOOK 02 & LOOK 03: Stacked Right Column (Span 5 cols) */}
          <div className="md:col-span-5 flex flex-col space-y-6 sm:space-y-8 lg:space-y-10">
            
            {/* LOOK 02 */}
            <div 
              className="group cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => onSelectLook(LOOKBOOK_LOOKS[1])}
            >
              <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-[#E7E2D6] mb-3 sm:mb-4 rounded-xl shadow-xs">
                <img
                  src={LOOKBOOK_LOOKS[1].image}
                  alt={LOOKBOOK_LOOKS[1].title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
                
                <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10">
                  <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.25em] uppercase bg-[#141414]/90 text-[#F2F0EB] px-3 py-1 rounded-full backdrop-blur-xs">
                    {LOOKBOOK_LOOKS[1].number}
                  </span>
                </div>

                <div className="absolute inset-x-3.5 bottom-3.5 z-10 sm:hidden">
                  <div className="w-full min-h-[48px] rounded-full bg-[#141414]/85 backdrop-blur-md text-white text-[10px] uppercase tracking-[0.22em] font-medium flex items-center justify-center gap-2 px-4 shadow-md">
                    <span>SHOP THE LOOK</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="hidden sm:flex absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center p-6 text-center text-white">
                  <span className="inline-block px-4 py-2 rounded-full bg-white text-black text-[10px] uppercase tracking-[0.25em] font-medium shadow-md">
                    SHOP COMPLETE LOOK →
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-editorial text-xl uppercase tracking-[-0.02em] text-[#141414]">
                    {LOOKBOOK_LOOKS[1].title}
                  </h3>
                  <p className="text-[10px] text-[#7A7771] tracking-[0.05em] uppercase mt-0.5 font-mono">
                    {LOOKBOOK_LOOKS[1].location}
                  </p>
                </div>
                <span className="hidden sm:inline-block text-[10px] tracking-[0.2em] uppercase text-[#141414] font-medium editorial-link">
                  VIEW →
                </span>
              </div>
            </div>

            {/* LOOK 03 */}
            <div 
              className="group cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => onSelectLook(LOOKBOOK_LOOKS[2])}
            >
              <div className="relative aspect-[4/3] sm:aspect-[4/4.5] w-full overflow-hidden bg-[#E7E2D6] mb-3 sm:mb-4 rounded-xl shadow-xs">
                <img
                  src={LOOKBOOK_LOOKS[2].image}
                  alt={LOOKBOOK_LOOKS[2].title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
                
                <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10">
                  <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.25em] uppercase bg-[#141414]/90 text-[#F2F0EB] px-3 py-1 rounded-full backdrop-blur-xs">
                    {LOOKBOOK_LOOKS[2].number}
                  </span>
                </div>

                <div className="absolute inset-x-3.5 bottom-3.5 z-10 sm:hidden">
                  <div className="w-full min-h-[48px] rounded-full bg-[#141414]/85 backdrop-blur-md text-white text-[10px] uppercase tracking-[0.22em] font-medium flex items-center justify-center gap-2 px-4 shadow-md">
                    <span>SHOP THE LOOK</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="hidden sm:flex absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center p-6 text-center text-white">
                  <span className="inline-block px-4 py-2 rounded-full bg-white text-black text-[10px] uppercase tracking-[0.25em] font-medium shadow-md">
                    SHOP COMPLETE LOOK →
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-editorial text-xl uppercase tracking-[-0.02em] text-[#141414]">
                    {LOOKBOOK_LOOKS[2].title}
                  </h3>
                  <p className="text-[10px] text-[#7A7771] tracking-[0.05em] uppercase mt-0.5 font-mono">
                    {LOOKBOOK_LOOKS[2].location}
                  </p>
                </div>
                <span className="hidden sm:inline-block text-[10px] tracking-[0.2em] uppercase text-[#141414] font-medium editorial-link">
                  VIEW →
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Row: LOOK 04 & LOOK 05 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-6 sm:mt-10 lg:mt-12">
          {[LOOKBOOK_LOOKS[3], LOOKBOOK_LOOKS[4]].filter(Boolean).map((look) => (
            <div 
              key={look.id}
              className="group cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => onSelectLook(look)}
            >
              <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden bg-[#E7E2D6] mb-3 sm:mb-4 rounded-xl shadow-xs">
                <img
                  src={look.image}
                  alt={look.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10">
                  <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.25em] uppercase bg-[#141414]/90 text-[#F2F0EB] px-3 py-1 rounded-full backdrop-blur-xs">
                    {look.number}
                  </span>
                </div>
                <div className="absolute inset-x-3.5 bottom-3.5 z-10 sm:hidden">
                  <div className="w-full min-h-[48px] rounded-full bg-[#141414]/85 backdrop-blur-md text-white text-[10px] uppercase tracking-[0.22em] font-medium flex items-center justify-center gap-2 px-4 shadow-md">
                    <span>SHOP THE LOOK</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="hidden sm:flex absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center p-6 text-center text-white">
                  <span className="inline-block px-4 py-2 rounded-full bg-white text-black text-[10px] uppercase tracking-[0.25em] font-medium shadow-md">
                    SHOP THE COMPLETE LOOK →
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-editorial text-xl uppercase tracking-[-0.02em] text-[#141414]">
                    {look.title}
                  </h3>
                  <p className="text-[10px] text-[#7A7771] tracking-[0.05em] uppercase mt-0.5 font-mono">
                    {look.subtitle}
                  </p>
                </div>
                <span className="hidden sm:inline-block text-[10px] tracking-[0.2em] uppercase text-[#141414] font-medium editorial-link">
                  VIEW OUTFIT →
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
