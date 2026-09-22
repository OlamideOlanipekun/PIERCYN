import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onExplore: (category?: string) => void;
}

const HERO_VIDEO_BLOB_URL = 'https://pl0borck44uqlgua.public.blob.vercel-storage.com/Model_walking_on_street_20260922160521.mp4';

export const HeroSection: React.FC<HeroSectionProps> = ({ onExplore }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    const { clientX, clientY, currentTarget } = e;
    const { width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX / width - 0.5) * 8;
    const y = (clientY / height - 0.5) * 8;
    setMousePos({ x, y });
  };

  return (
    <section
      id="hero-section"
      onMouseMove={handleMouseMove}
      className="relative w-full h-[85vh] min-h-[600px] max-h-[960px] bg-[#141414] text-[#F2F0EB] font-sans overflow-hidden select-none"
    >
      {/* Layer 1: Vercel Blob Cinematic Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#141414]">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.05] transition-opacity duration-1000"
        >
          <source src={HERO_VIDEO_BLOB_URL} type="video/mp4" />
        </video>
      </div>

      {/* Layer 2: Readability Overlay (Subtle Gradient for Crisp Text Legibility) */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/35 to-black/50 pointer-events-none" />

      {/* Layer 3: Hero Content */}
      <div className="piercyn-container relative z-10 h-full flex flex-col justify-between pt-24 sm:pt-28 pb-12 sm:pb-14 pointer-events-none">
        
        {/* Top Tagline */}
        <div className="hidden sm:flex items-center justify-between pointer-events-auto">
          <span className="text-[11px] font-sans font-semibold tracking-[0.25em] uppercase text-[#F2F0EB]/85">
            RELEASE 26.1 • LAGOS ATELIER
          </span>
          <span className="text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-[#F2F0EB]/60 hidden lg:inline-block">
            LAGOS — NIGERIA — 2026
          </span>
        </div>

        {/* Editorial Campaign Typography: LOOK GOOD. SPEND LESS. */}
        <div className="my-auto py-2 sm:py-4 pointer-events-none">
          <h1 className="font-editorial italic leading-[0.88] text-[#F2F0EB] tracking-[-0.03em] drop-shadow-sm">
            <div className="overflow-hidden py-0.5 sm:py-1">
              <span 
                className={`block text-[clamp(48px,9.5vw,120px)] ml-1 sm:ml-4 transition-transform duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] font-medium ${
                  isLoaded ? 'translate-y-0' : 'translate-y-[115%]'
                }`}
                style={{
                  transform: isLoaded 
                    ? `translate3d(${mousePos.x * -0.2}px, ${mousePos.y * -0.2}px, 0)` 
                    : 'translateY(115%)'
                }}
              >
                LOOK GOOD.
              </span>
            </div>

            <div className="overflow-hidden -mt-1 sm:-mt-4 lg:-mt-6 py-0.5 sm:py-1 relative z-[18]">
              <span 
                className={`block text-[clamp(52px,10.5vw,135px)] ml-4 sm:ml-20 lg:ml-32 font-normal transition-transform duration-[1100ms] delay-[140ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isLoaded ? 'translate-y-0' : 'translate-y-[115%]'
                }`}
                style={{
                  transform: isLoaded 
                    ? `translate3d(${mousePos.x * -0.4}px, ${mousePos.y * -0.4}px, 0)` 
                    : 'translateY(115%)'
                }}
              >
                SPEND LESS.
              </span>
            </div>
          </h1>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-end justify-between w-full pointer-events-auto">
          <div 
            className={`max-w-[440px] transition-all duration-[900ms] delay-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <p className="font-sans text-[13px] sm:text-[14.5px] leading-[1.6] tracking-[0.03em] uppercase text-[#F2F0EB]/95 mb-4 sm:mb-6 font-medium drop-shadow-xs">
              Good-looking fashion at prices that make sense.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto font-sans">
              <button
                id="hero-shop-now-btn"
                onClick={() => onExplore('shop')}
                className="group h-12 px-6 rounded-full bg-[#F2F0EB] text-[#141414] hover:bg-white transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98] text-[12px] sm:text-[13px] font-bold tracking-[0.16em] uppercase whitespace-nowrap"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              
              <button
                id="hero-new-arrivals-btn"
                onClick={() => onExplore('new')}
                className="group h-12 px-6 rounded-full border border-[#F2F0EB]/70 bg-black/40 backdrop-blur-xs text-[#F2F0EB] hover:bg-[#F2F0EB] hover:text-[#141414] transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] text-[12px] sm:text-[13px] font-semibold tracking-[0.16em] uppercase whitespace-nowrap"
              >
                <span>EXPLORE NEW ARRIVALS</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div 
            className={`hidden sm:flex flex-col items-end cursor-pointer transition-all duration-[900ms] delay-[750ms] ease-[cubic-bezier(0.16,1,0.3,1)] group ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            onClick={() => {
              document.getElementById('new-drop-section')?.scrollIntoView({ behavior: 'smooth' });
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
