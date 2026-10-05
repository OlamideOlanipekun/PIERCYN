import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FinalCtaSectionProps {
  onShopAll: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onShopAll }) => {
  return (
    <section 
      id="collections-final-cta"
      className="relative w-full bg-[#F2F0EB] py-24 sm:py-32 lg:py-44 border-b border-[#E3DEC3]/70 overflow-hidden text-center"
    >
      <div className="piercyn-container max-w-3xl mx-auto flex flex-col items-center space-y-6 sm:space-y-8">
        
        <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.3em] text-[#141414]/70 font-sans font-semibold block">
          PIERCYN ATELIER / LAGOS • WORLDWIDE
        </span>

        <h2 className="font-editorial text-[13vw] sm:text-[9vw] lg:text-[7vw] xl:text-[96px] leading-[0.88] tracking-[-0.035em] uppercase text-[#141414]">
          <div>FIND</div>
          <div>YOUR</div>
          <div className="italic font-light text-[#4A4844]">WORLD<span className="not-italic text-[#A48B71]">.</span></div>
        </h2>

        <p className="font-sans text-[15px] sm:text-[18px] text-[#4A4844] font-normal leading-[1.6] max-w-md">
          Discover the collection that feels like you. Made in Lagos for people who carry their own presence.
        </p>

        <div className="pt-4">
          <button
            onClick={onShopAll}
            className="group h-13 min-h-[52px] px-9 rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] sm:text-[13px] uppercase font-sans font-bold tracking-[0.2em] hover:bg-black transition-all duration-300 inline-flex items-center gap-3 cursor-pointer shadow-md active:scale-95"
          >
            <span>SHOP PIERCYN</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    </section>
  );
};
