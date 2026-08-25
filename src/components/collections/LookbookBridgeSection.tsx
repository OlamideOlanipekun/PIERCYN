import React from 'react';
import { ArrowRight, Play } from 'lucide-react';

interface LookbookBridgeSectionProps {
  onOpenLookbook: () => void;
}

export const LookbookBridgeSection: React.FC<LookbookBridgeSectionProps> = ({ onOpenLookbook }) => {
  return (
    <section 
      id="lookbook-bridge"
      className="relative w-full bg-[#141414] text-[#F2F0EB] py-20 sm:py-28 lg:py-36 overflow-hidden select-none"
    >
      <div className="piercyn-container">
        
        <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] bg-[#1E1E1E] rounded-2xl overflow-hidden shadow-2xl group border border-white/10">
          <img
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=88&w=2000&auto=format&fit=crop"
            alt="PIERCYN Lookbook in Motion"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />

          {/* Centered / Overlaid Editorial Action */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 lg:p-14">
            
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] uppercase text-[#E3DEC3]">
              <Play className="w-3 h-3 text-[#A48B71] fill-[#A48B71]" />
              <span>EDITORIAL MOTION ARCHIVE</span>
            </div>

            <div className="max-w-2xl space-y-3 sm:space-y-4 font-sans">
              <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl uppercase tracking-[-0.03em] leading-tight text-[#F2F0EB]">
                <div>SEE IT</div>
                <div className="italic font-light text-[#E3DEC3]">IN MOTION<span className="not-italic text-[#A48B71]">.</span></div>
              </h2>

              <p className="text-[14px] sm:text-[16px] text-[#E3DEC3]/90 font-light max-w-md">
                Discover how the collections come together in movement across Victoria Island and international runways.
              </p>

              <div className="pt-2">
                <button
                  onClick={onOpenLookbook}
                  className="group h-12 min-h-[48px] px-8 rounded-full bg-[#F2F0EB] text-[#141414] text-[11px] sm:text-[12px] uppercase font-sans font-bold tracking-[0.2em] hover:bg-white transition-all duration-300 inline-flex items-center gap-2.5 cursor-pointer shadow-md active:scale-95"
                >
                  <span>EXPLORE LOOKBOOK</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
