import React from 'react';
import { ArrowRight } from 'lucide-react';

interface MenNewArrivalsCtaProps {
  onExploreNewArrivals: () => void;
}

export const MenNewArrivalsCta: React.FC<MenNewArrivalsCtaProps> = ({ onExploreNewArrivals }) => {
  return (
    <section 
      id="men-new-arrivals-cta"
      className="w-full bg-[#141414] text-[#F2F0EB] py-16 sm:py-20 md:py-28 select-none relative overflow-hidden"
    >
      {/* Subtle Background Lighting Accent */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#E3DEC3]/5 blur-3xl pointer-events-none" />

      <div className="piercyn-container relative z-10 text-center max-w-2xl mx-auto space-y-6">
        
        {/* Subtle Label */}
        <span className="text-[11px] font-mono tracking-[0.25em] text-[#E3DEC3] uppercase font-semibold block">
          CURATED RUNWAY & ATELIER
        </span>

        {/* Large Cormorant Garamond Heading */}
        <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl uppercase tracking-[-0.03em] leading-[0.95] text-[#F2F0EB]">
          FIND YOUR <br />
          <span className="italic font-light text-[#E3DEC3]">NEXT PIECE.</span>
        </h2>

        {/* Supporting Copy */}
        <p className="text-xs sm:text-sm md:text-base font-sans text-[#D8D4CA] max-w-md mx-auto leading-relaxed tracking-[0.02em]">
          Explore the latest PIERCYN men's arrivals. Hand-crafted heavyweight staples, architectural denim, and limited seasonal drops.
        </p>

        {/* Primary Action Button */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={onExploreNewArrivals}
            className="h-12 min-h-[48px] px-8 rounded-full bg-[#F2F0EB] text-[#141414] text-[12px] uppercase font-sans font-bold tracking-[0.18em] hover:bg-[#E3DEC3] transition-all duration-300 cursor-pointer shadow-md active:scale-[0.98] inline-flex items-center justify-center gap-2.5"
          >
            <span>NEW ARRIVALS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
