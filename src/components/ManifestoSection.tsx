import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ManifestoSection: React.FC = () => {
  const { setIsStoryOpen } = useShop();

  return (
    <section 
      id="manifesto-section" 
      className="relative w-full bg-[#F2F0EB] py-20 sm:py-28 lg:py-32 overflow-hidden border-b border-[#E3DEC3]/70"
    >
      <div className="piercyn-container">
        
        {/* Section Identifier */}
        <div className="mb-2 sm:mb-3">
          <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-sans font-semibold">
            02 / MANIFESTO
          </span>
        </div>

        {/* Top Dominant Typography Statement */}
        <div className="font-editorial text-[13vw] sm:text-[10vw] lg:text-[7.5vw] xl:text-[105px] leading-[0.86] tracking-[-0.03em] uppercase text-[#141414] mb-8 sm:mb-12 lg:mb-14 select-none">
          <div>DON'T DRESS</div>
          <div className="italic font-light pl-4 sm:pl-16 lg:pl-28 text-[#141414]">
            TO BLEND IN<span className="not-italic text-[#A48B71]">.</span>
          </div>
        </div>

        {/* Split Editorial Mobile & Desktop Spread */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-center">
          
          {/* Large Editorial Portrait Fashion Photography */}
          <div className="lg:col-span-8 relative z-10 group">
            <div className="relative aspect-[3/4.2] sm:aspect-[16/11] lg:aspect-[16/10] w-full overflow-hidden bg-[#E7E2D6] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop"
                alt="PIERCYN Lagos Campaign Manifesto"
                className="w-full h-full object-cover object-center filter contrast-[1.04] transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                loading="lazy"
              />
              
              {/* Subtle Film Grain Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Corner Location Tag */}
              <div className="absolute bottom-5 left-5 sm:bottom-6 sm:left-6 text-[#F2F0EB]">
                <span className="text-[10px] uppercase tracking-[0.25em] font-mono block">
                  SURULERE ATELIER, LAGOS
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] opacity-70 block mt-0.5">
                  SERIES 01 • UNCOMPROMISING FORM
                </span>
              </div>
            </div>
          </div>

          {/* Typography Continuation & Narrative Overlapping Side */}
          <div className="lg:col-span-4 lg:-ml-20 relative z-20 flex flex-col justify-center bg-[#F2F0EB]/95 lg:bg-transparent backdrop-blur-xs lg:backdrop-blur-none p-4 sm:p-0">
            
            {/* Secondary Punchline */}
            <div className="font-editorial text-[10vw] sm:text-[7vw] lg:text-[4vw] xl:text-[56px] leading-[0.9] tracking-[-0.03em] uppercase text-[#141414] mb-4 sm:mb-6 select-none">
              <div>DRESS LIKE</div>
              <div className="italic font-light pl-3 sm:pl-6 text-[#141414]">
                YOU MEAN IT<span className="not-italic text-[#A48B71]">.</span>
              </div>
            </div>

            {/* Narrative Paragraph in Small Elegant Manrope */}
            <div className="max-w-md space-y-4 sm:space-y-6 font-sans">
              <p className="text-[14px] sm:text-[16px] leading-[1.65] text-[#3D3A36] font-normal tracking-[0.01em]">
                PIERCYN creates modern clothing for people who refuse to disappear into the crowd.
                Born from the restless creative energy of Lagos, we merge architectural tailoring with unyielding 450 GSM heavyweight cottons.
              </p>

              <p className="text-[13px] sm:text-[14px] leading-[1.6] text-[#6E6B65] font-normal">
                Every stitch is an intentional statement of proportion, posture, and presence. Designed in Nigeria, worn worldwide.
              </p>

              {/* Tactile Pill Button */}
              <div className="pt-2">
                <button
                  id="manifesto-read-philosophy-btn"
                  onClick={() => setIsStoryOpen(true)}
                  className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-full border border-[#141414]/80 text-[12px] sm:text-[13px] uppercase tracking-[0.18em] text-[#141414] font-semibold hover:bg-[#141414] hover:text-[#F2F0EB] transition-all duration-300 inline-flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
                >
                  <span>READ OUR FULL PHILOSOPHY</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
