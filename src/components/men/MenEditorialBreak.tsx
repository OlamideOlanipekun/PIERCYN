import React from 'react';
import { ArrowRight } from 'lucide-react';

interface MenEditorialBreakProps {
  onShopEveryday: () => void;
}

export const MenEditorialBreak: React.FC<MenEditorialBreakProps> = ({ onShopEveryday }) => {
  return (
    <section 
      id="men-editorial-break"
      className="w-full my-12 sm:my-16 md:my-24 overflow-hidden"
    >
      <div className="piercyn-container">
        
        {/* Desktop Asymmetrical Composition (~65% width image with intentional overlapping typography) */}
        <div className="hidden lg:grid grid-cols-12 gap-8 items-center bg-[#141414] rounded-[16px] p-8 xl:p-12 text-[#F2F0EB] relative overflow-hidden">
          
          {/* Left / Center: Large Editorial Campaign Photography */}
          <div className="col-span-7 xl:col-span-8 relative aspect-[16/10] overflow-hidden rounded-[12px] group">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1600&auto=format&fit=crop"
              alt="PIERCYN Lagos Campaign — Modern Menswear in Transit"
              className="w-full h-full object-cover object-[center_35%] transition-transform duration-1000 ease-out group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#E3DEC3] bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
                LAGOS ISLAND • 17:40 WAT
              </span>
            </div>
          </div>

          {/* Right: Editorial Typography Overlapping & Supporting Details */}
          <div className="col-span-5 xl:col-span-4 flex flex-col justify-center pl-2 xl:pl-6 space-y-6">
            
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#E3DEC3] font-semibold block">
                CAMPAIGN NOTE / 02
              </span>
              <h2 className="font-editorial text-4xl xl:text-5xl uppercase tracking-[-0.03em] leading-[0.95] text-[#F2F0EB]">
                THE EVERYDAY <br />
                <span className="italic font-light text-[#E3DEC3]">IS NEVER</span> <br />
                ORDINARY.
              </h2>
            </div>

            <p className="text-sm font-sans text-[#D8D4CA] leading-relaxed tracking-[0.02em]">
              Pieces built for the way you actually move. Heavyweight loopback weaves, articulated pleats, and zero-compromise comfort engineered for the climate of Lagos and the pace of the world.
            </p>

            <div className="pt-2">
              <button
                onClick={onShopEveryday}
                className="group inline-flex items-center gap-3 text-xs uppercase font-sans font-bold tracking-[0.2em] text-[#F2F0EB] hover:text-[#E3DEC3] transition-all cursor-pointer"
              >
                <span className="border-b border-[#F2F0EB] pb-0.5 group-hover:border-[#E3DEC3]">
                  SHOP THE EVERYDAY
                </span>
                <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#E3DEC3] group-hover:translate-x-1.5 transition-all bg-white/5">
                  <ArrowRight className="w-4 h-4 text-[#F2F0EB] group-hover:text-[#E3DEC3]" />
                </span>
              </button>
            </div>

          </div>

        </div>

        {/* Mobile / Tablet Stacked Composition (Dedicated portrait/landscape crop & large typography) */}
        <div className="lg:hidden bg-[#141414] rounded-[16px] overflow-hidden text-[#F2F0EB] p-5 sm:p-8 space-y-6">
          
          {/* Full-width Image with 75-85vw visual presence */}
          <div className="w-full aspect-[4/3] sm:aspect-[16/9] rounded-[10px] overflow-hidden relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop"
              alt="PIERCYN Lagos Campaign"
              className="w-full h-full object-cover object-[center_35%]"
              loading="lazy"
            />
            <div className="absolute bottom-3 left-3">
              <span className="text-[9.5px] font-mono tracking-[0.2em] uppercase text-[#E3DEC3] bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                LAGOS ISLAND
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <span className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-[#E3DEC3] font-semibold block">
              CAMPAIGN / 02
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl uppercase tracking-[-0.03em] leading-[0.95]">
              THE EVERYDAY <br />
              <span className="italic font-light text-[#E3DEC3]">IS NEVER</span> ORDINARY.
            </h2>
          </div>

          {/* Supporting text */}
          <p className="text-[13.5px] font-sans text-[#D8D4CA] leading-relaxed">
            Pieces built for the way you actually move. Heavyweight loopback weaves and articulated pleats engineered for daily presence.
          </p>

          {/* CTA */}
          <div className="pt-1">
            <button
              onClick={onShopEveryday}
              className="w-full h-12 min-h-[48px] rounded-full bg-[#F2F0EB] text-[#141414] text-[12px] uppercase font-sans font-bold tracking-[0.16em] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all shadow-xs"
            >
              <span>SHOP THE EVERYDAY</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
