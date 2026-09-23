import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onExplore: (category?: string) => void;
}

// Configurable Vercel Blob URLs
const HERO_VIDEO_DESKTOP = 'https://pl0borck44uqlgua.public.blob.vercel-storage.com/Model_walking_on_street_20260922160521.mp4';
const HERO_VIDEO_MOBILE = ''; // Graceful fallback to HERO_VIDEO_DESKTOP when empty
const HERO_POSTER_IMAGE = 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop';

export const HeroSection: React.FC<HeroSectionProps> = ({ onExplore }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 60);
    
    // Check user accessibility preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  return (
    <section
      id="hero-section"
      className="relative w-full h-[80svh] min-h-[520px] max-h-[760px] sm:h-[86vh] sm:min-h-[620px] sm:max-h-[960px] bg-[#141414] text-[#F2F0EB] font-sans overflow-hidden select-none"
    >
      {/* Layer 1: Responsive Background (Video or Static Poster for Reduced Motion) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#141414]">
        {prefersReducedMotion ? (
          <img
            src={HERO_POSTER_IMAGE}
            alt="PIERCYN Campaign"
            className="w-full h-full object-cover object-[center_20%] sm:object-center filter brightness-[0.90] contrast-[1.05]"
          />
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={HERO_POSTER_IMAGE}
            className="w-full h-full object-cover object-[center_20%] sm:object-center filter brightness-[0.88] contrast-[1.05] transition-opacity duration-1000"
          >
            {HERO_VIDEO_MOBILE && (
              <source media="(max-width: 767px)" src={HERO_VIDEO_MOBILE} type="video/mp4" />
            )}
            <source src={HERO_VIDEO_DESKTOP} type="video/mp4" />
          </video>
        )}
      </div>

      {/* Top Navbar Area Gradient Protection */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none z-[2]" />

      {/* Layer 2: Readability Overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/90 via-black/40 to-black/55 sm:from-black/85 sm:via-black/35 sm:to-black/50 pointer-events-none" />

      {/* Layer 3: Hero Content */}
      <div className="piercyn-container relative z-10 h-full flex flex-col justify-between pt-20 sm:pt-28 pb-8 sm:pb-12 pointer-events-none">
        
        {/* Top Tagline */}
        <div className="flex items-center justify-between pointer-events-auto">
          <span className="text-[10px] sm:text-[11px] font-sans font-semibold tracking-[0.25em] uppercase text-[#F2F0EB]/90">
            LAGOS, NIGERIA • 2026
          </span>
          <span className="text-[10px] sm:text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-[#F2F0EB]/60 hidden md:inline-block">
            STREETWEAR & MODERN READY-TO-WEAR
          </span>
        </div>

        {/* Editorial Campaign Typography: LOOK GOOD. SPEND LESS. */}
        <div className="my-auto py-2 sm:py-4 pointer-events-none">
          <h1 className="font-editorial italic leading-[0.88] text-[#F2F0EB] tracking-[-0.03em] drop-shadow-sm">
            <div className="overflow-hidden py-0.5 sm:py-1">
              <span 
                className={`block text-[clamp(42px,10vw,70px)] sm:text-[clamp(54px,9.5vw,120px)] ml-0.5 sm:ml-4 font-medium transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isLoaded ? 'translate-y-0' : 'translate-y-[115%]'
                }`}
              >
                LOOK GOOD.
              </span>
            </div>

            <div className="overflow-hidden -mt-1 sm:-mt-4 lg:-mt-6 py-0.5 sm:py-1 relative z-[18]">
              <span 
                className={`block text-[clamp(46px,11vw,78px)] sm:text-[clamp(58px,10.5vw,135px)] ml-3 sm:ml-20 lg:ml-28 font-normal transition-transform duration-1100 delay-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isLoaded ? 'translate-y-0' : 'translate-y-[115%]'
                }`}
              >
                SPEND LESS.
              </span>
            </div>
          </h1>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-end justify-between w-full pointer-events-auto">
          <div 
            className={`w-full sm:max-w-[480px] transition-all duration-900 delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <p className="font-sans text-[12px] sm:text-[14px] leading-relaxed tracking-[0.02em] text-[#F2F0EB]/95 mb-4 sm:mb-6 font-medium">
              Good-looking fashion at prices that make sense. Crafted in Lagos.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto font-sans">
              <button
                id="hero-shop-now-btn"
                onClick={() => onExplore('shop')}
                className="group h-12 px-7 rounded-full bg-[#F2F0EB] text-[#141414] hover:bg-white transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98] text-[12px] sm:text-[13px] font-bold tracking-[0.16em] uppercase whitespace-nowrap"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              
              <button
                id="hero-new-arrivals-btn"
                onClick={() => onExplore('new')}
                className="group h-12 px-6 rounded-full border border-[#F2F0EB]/70 bg-black/40 backdrop-blur-xs text-[#F2F0EB] hover:bg-[#F2F0EB] hover:text-[#141414] transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] text-[12px] sm:text-[13px] font-semibold tracking-[0.16em] uppercase whitespace-nowrap"
              >
                <span>NEW ARRIVALS</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div 
            className={`hidden sm:flex flex-col items-end cursor-pointer transition-all duration-900 delay-500 ease-[cubic-bezier(0.16,1,0.3,1)] group ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            onClick={() => {
              const target = document.getElementById('category-rail-section') || document.getElementById('new-drop-section');
              target?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase mb-3 text-[#F2F0EB]/70 font-medium group-hover:text-[#F2F0EB] transition-colors">
              SCROLL
            </div>
            <div className="w-[1px] h-12 sm:h-14 bg-[#F2F0EB] opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

      </div>
    </section>
  );
};

