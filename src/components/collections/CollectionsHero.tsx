import React from 'react';
import { ArrowDownRight, Sparkles } from 'lucide-react';

interface CollectionsHeroProps {
  onExplore: () => void;
}

export const CollectionsHero: React.FC<CollectionsHeroProps> = ({ onExplore }) => {
  return (
    <section 
      id="collections-hero"
      className="relative w-full h-[70svh] sm:h-[82vh] lg:h-[88vh] overflow-hidden bg-[#141414] text-[#F2F0EB] select-none"
    >
      {/* Background Campaign Image with gentle 1.03 -> 1 scale */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=88&w=2000&auto=format&fit=crop"
          alt="PIERCYN Collections Campaign"
          className="w-full h-full object-cover object-center scale-[1.03] animate-[heroScale_1.4s_cubic-bezier(0.16,1,0.3,1)_forwards] filter contrast-[1.05]"
        />
        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/40" />
      </div>

      {/* Main Content Overlay */}
      <div className="relative z-20 h-full piercyn-container flex flex-col justify-between pt-24 sm:pt-28 pb-8 sm:pb-14">
        
        {/* Top Micro Label */}
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[#E3DEC3]">
          <Sparkles className="w-3 h-3 text-[#A48B71]" />
          <span>PIERCYN / COLLECTIONS</span>
        </div>

        {/* Large Editorial Headline sitting directly over image */}
        <div className="max-w-4xl space-y-3 sm:space-y-4">
          <h1 className="font-editorial text-[13vw] sm:text-[9vw] lg:text-[7vw] xl:text-[95px] leading-[0.88] tracking-[-0.035em] uppercase text-[#F2F0EB]">
            <div>ENTER</div>
            <div>THE WORLD</div>
            <div className="italic font-light text-[#E3DEC3]">OF PIERCYN<span className="not-italic text-[#A48B71]">.</span></div>
          </h1>

          <p className="font-sans text-[13px] sm:text-[16px] text-[#E3DEC3]/90 font-normal tracking-[0.04em] max-w-md leading-relaxed">
            Curated worlds. Different moods. One identity.
          </p>

          <div className="pt-2 sm:pt-4">
            <button
              onClick={onExplore}
              className="group h-12 min-h-[48px] px-8 rounded-full bg-[#F2F0EB] text-[#141414] text-[11px] sm:text-[12px] uppercase font-sans font-bold tracking-[0.2em] hover:bg-white transition-all duration-300 inline-flex items-center gap-2.5 cursor-pointer shadow-md active:scale-95"
            >
              <span>EXPLORE COLLECTIONS</span>
              <ArrowDownRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </button>
          </div>
        </div>

        {/* Bottom Scroll Indicator */}
        <div className="hidden sm:flex justify-end items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-[#E3DEC3]/70">
          <span>SCROLL TO DISCOVER</span>
          <span className="w-8 h-px bg-[#E3DEC3]/40 block" />
        </div>

      </div>
    </section>
  );
};
