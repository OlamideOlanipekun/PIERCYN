import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const FromLagosSection: React.FC = () => {
  const { setIsStoryOpen } = useShop();

  return (
    <section
      id="from-lagos-section"
      className="relative w-full min-h-[460px] sm:min-h-[600px] max-h-[1000px] h-[65svh] sm:h-[80svh] overflow-hidden bg-[#121212] select-none border-b border-[#E3DEC3]/70"
    >
      {/* Cinematic Portrait Campaign Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=2400&auto=format&fit=crop"
          alt="From Lagos — PIERCYN Contemporary Architectural Fashion"
          className="w-full h-full object-cover object-center filter brightness-[0.75] contrast-[1.12]"
          loading="lazy"
        />
        {/* Editorial Gradients & Shadows */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/50" />
        <div className="absolute inset-0 bg-[#0E0C09]/20 mix-blend-multiply" />
      </div>

      {/* Global Grid Container */}
      <div className="piercyn-container relative z-10 h-full flex flex-col justify-between py-8 sm:py-14 lg:py-16">
        {/* Top Header Tag */}
        <div className="flex items-center justify-between text-[#F2F0EB]">
          <span className="text-[10px] sm:text-[12px] uppercase tracking-[0.25em] font-sans font-semibold opacity-90">
            ORIGIN & SOUL
          </span>
          <span className="hidden sm:inline-block text-[11px] uppercase tracking-[0.2em] font-sans font-medium opacity-70">
            6.5244° N, 3.3792° E • ATLANTIC COAST
          </span>
        </div>

        {/* Serif Typography Overlaid Directly Across Viewport */}
        <div className="my-auto py-2 sm:py-4">
          <div className="font-editorial leading-[0.84] tracking-[-0.03em] uppercase text-[#F2F0EB]">
            {/* FROM */}
            <div className="text-[clamp(32px,12vw,105px)] font-normal tracking-[0.01em] opacity-95">
              FROM
            </div>

            {/* LAGOS. */}
            <div className="text-[clamp(50px,18vw,190px)] font-normal italic -mt-1 sm:-mt-6 lg:-mt-8 drop-shadow-2xl">
              LAGOS<span className="not-italic text-[#E3DEC3]">.</span>
            </div>

            {/* FOR EVERYWHERE. */}
            <div className="text-[clamp(18px,6.8vw,46px)] font-normal tracking-[0.03em] text-[#E3DEC3]/90 mt-1 sm:mt-2">
              FOR EVERYWHERE.
            </div>
          </div>
        </div>

        {/* Bottom Bar: Supporting Copy on Left, Story Link on Right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 pt-4 sm:pt-6 border-t border-white/20 font-sans">
          {/* Bottom Left Microcopy */}
          <div className="max-w-xs sm:max-w-md">
            <p className="text-[14px] sm:text-[16px] text-[#F2F0EB] font-normal tracking-[0.02em] leading-snug">
              Born in Nigeria. Built for everywhere.
            </p>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#F2F0EB]/70 block mt-1 font-sans font-medium">
              ESTABLISHED IN NIGERIA • WORLDWIDE SHIPPING
            </span>
          </div>

          {/* Bottom Right: Pill Button for OUR STORY */}
          <div className="w-full sm:w-auto">
            <button
              id="from-lagos-story-btn"
              onClick={() => setIsStoryOpen(true)}
              className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-full border border-white/50 text-[12px] sm:text-[13px] tracking-[0.18em] uppercase text-[#F2F0EB] font-semibold hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98] backdrop-blur-xs"
            >
              <span>OUR STORY →</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
