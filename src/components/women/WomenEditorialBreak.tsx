import React from 'react';
import { ArrowRight } from 'lucide-react';

interface WomenEditorialBreakProps {
  onExploreCollection: () => void;
}

export const WomenEditorialBreak: React.FC<WomenEditorialBreakProps> = ({
  onExploreCollection
}) => {
  return (
    <section 
      id="women-editorial-break"
      className="my-12 sm:my-16 md:my-24 w-full bg-[#141414] text-[#F2F0EB] overflow-hidden"
    >
      <div className="piercyn-container py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* Left Column: Asymmetrical Editorial Photography Pair */}
          <div className="lg:col-span-6 grid grid-cols-12 gap-3 sm:gap-4 relative">
            
            {/* Primary Large Look */}
            <div className="col-span-8 aspect-[3/4] bg-[#232323] overflow-hidden rounded-xs relative">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop"
                alt="PIERCYN Women's Campaign Look — Lagos Modernist Architecture"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-xs text-[10px] font-mono tracking-[0.2em] text-[#F2F0EB] uppercase">
                LOOK 04 / IKOYI
              </div>
            </div>

            {/* Secondary Overlapping Detail Look */}
            <div className="col-span-4 aspect-[2/3] self-end -mb-4 sm:-mb-6 bg-[#232323] overflow-hidden rounded-xs border-2 border-[#141414] shadow-2xl relative">
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=800&auto=format&fit=crop"
                alt="PIERCYN Women's Heavyweight Draped Texture"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute top-2 right-2 text-[9px] font-mono text-white/80 uppercase tracking-widest bg-black/60 px-1.5 py-0.5">
                DETAIL
              </div>
            </div>

          </div>

          {/* Right Column: Editorial Copy & Narrative */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 lg:pl-4">
            
            {/* Section Tag */}
            <div className="space-y-1">
              <span className="text-[11px] font-mono tracking-[0.28em] text-[#C5BDB0] uppercase font-semibold block">
                CAMPAIGN 26.1 / THE LAGOS WOMAN
              </span>
              <div className="w-12 h-px bg-[#8C887B]" />
            </div>

            {/* Editorial Quote / Headline */}
            <h3 className="font-editorial text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-[-0.02em] leading-[0.96] text-[#F2F0EB]">
              SCULPTED IN CLOTH.
              <br />
              <span className="italic text-[#E3DEC3]">REFINED IN MOTION.</span>
            </h3>

            {/* Narrative Paragraph */}
            <div className="space-y-4 text-sm sm:text-base md:text-lg font-sans text-[#D8D4CA] font-normal leading-relaxed">
              <p>
                The PIERCYN woman moves through Lagos with purpose and quiet sovereignty. We design garments that reject flimsy trend cycles, opting instead for architectural volume, substantial tactile drape, and timeless minimalist ease.
              </p>
              <p className="text-xs sm:text-sm font-mono text-[#A8A499] uppercase tracking-wider">
                Heavyweight 450 GSM Cottons • Selvedge Denim • Fluid Tailoring
              </p>
            </div>

            {/* Action Link */}
            <div className="pt-2">
              <button
                onClick={onExploreCollection}
                className="group inline-flex items-center gap-3 text-xs sm:text-sm font-sans uppercase tracking-[0.2em] font-semibold text-[#F2F0EB] hover:text-[#E3DEC3] transition-colors cursor-pointer min-h-[44px]"
              >
                <span className="border-b border-[#F2F0EB] pb-0.5 group-hover:border-[#E3DEC3] transition-colors">
                  DISCOVER THE RUNWAY LOOKS
                </span>
                <ArrowRight className="w-4 h-4 text-[#F2F0EB] group-hover:text-[#E3DEC3] group-hover:translate-x-1 transition-all" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
