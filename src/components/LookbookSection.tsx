import React from 'react';
import { LOOKBOOK_LOOKS } from '../data/lookbook';
import { LookbookLook } from '../types';
import { ProductImage } from './ProductImage';
import { ArrowUpRight } from 'lucide-react';

interface LookbookSectionProps {
  onSelectLook: (look: LookbookLook) => void;
}

export const LookbookSection: React.FC<LookbookSectionProps> = ({ onSelectLook }) => {
  return (
    <section 
      id="lookbook-section" 
      className="relative w-full bg-[#F2F0EB] py-16 sm:py-24 lg:py-28 overflow-hidden border-b border-[#E3DEC3]/70"
    >
      <div className="piercyn-container">
        
        {/* Top Editorial Headline */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 sm:mb-14 lg:mb-16 gap-4 sm:gap-8">
          <div>
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-sans font-semibold block mb-2 sm:mb-3">
              06 / VISUAL ARCHIVE
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl uppercase tracking-tight text-[#141414] select-none">
              LAGOS LOOKBOOK 2026
            </h2>
          </div>

          <div className="max-w-sm font-sans">
            <p className="text-[14px] text-[#4A4844] font-normal leading-relaxed mb-2">
              Captured across brutalist spaces in Lagos. Each look represents an engineered stance of pure silhouette and heavyweight drape.
            </p>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#6E6B65] font-sans font-semibold block">
              TAP ANY LOOK TO SHOP PIECES
            </span>
          </div>
        </div>

        {/* Fashion Editorial Collage */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LOOK 01: Hero Stance */}
          <div 
            className="md:col-span-7 group cursor-pointer active:scale-[0.99] transition-transform"
            onClick={() => onSelectLook(LOOKBOOK_LOOKS[0])}
          >
            <div className="relative w-full overflow-hidden bg-[#E7E2D6] mb-3 sm:mb-4 rounded-xl shadow-xs">
              <ProductImage
                src={LOOKBOOK_LOOKS[0].image}
                alt={LOOKBOOK_LOOKS[0].title}
                aspectRatio="4/5"
                objectPosition="center 15%"
                imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              
              {/* Overlay Identifier Pill */}
              <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10">
                <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.25em] uppercase bg-[#141414]/90 text-[#F2F0EB] px-3 py-1 rounded-full backdrop-blur-xs">
                  {LOOKBOOK_LOOKS[0].number}
                </span>
              </div>

              {/* Bottom Mobile Action Pill */}
              <div className="absolute inset-x-3.5 bottom-3.5 z-10 sm:hidden">
                <div className="w-full min-h-[48px] rounded-full bg-[#141414]/85 backdrop-blur-md text-white text-[10px] uppercase tracking-[0.22em] font-medium flex items-center justify-center gap-2 px-4 shadow-md">
                  <span>SHOP COMPLETE LOOK</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-xl sm:text-2xl uppercase tracking-tight text-[#141414]">
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

          {/* LOOK 02 & LOOK 03 */}
          <div className="md:col-span-5 flex flex-col space-y-6 sm:space-y-8">
            
            {/* LOOK 02 */}
            <div 
              className="group cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => onSelectLook(LOOKBOOK_LOOKS[1])}
            >
              <div className="relative w-full overflow-hidden bg-[#E7E2D6] mb-3 sm:mb-4 rounded-xl shadow-xs">
                <ProductImage
                  src={LOOKBOOK_LOOKS[1].image}
                  alt={LOOKBOOK_LOOKS[1].title}
                  aspectRatio="4/5"
                  objectPosition="center 15%"
                  imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
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
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-editorial text-lg sm:text-xl uppercase tracking-tight text-[#141414]">
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
              <div className="relative w-full overflow-hidden bg-[#E7E2D6] mb-3 sm:mb-4 rounded-xl shadow-xs">
                <ProductImage
                  src={LOOKBOOK_LOOKS[2].image}
                  alt={LOOKBOOK_LOOKS[2].title}
                  aspectRatio="4/5"
                  objectPosition="center 15%"
                  imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
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
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-editorial text-lg sm:text-xl uppercase tracking-tight text-[#141414]">
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

      </div>
    </section>
  );
};
