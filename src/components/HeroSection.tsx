import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

interface HeroSectionProps {
  onExplore: (category?: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExplore }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Cinematic reveal initiation
    const timer = setTimeout(() => setIsLoaded(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return; // disable mouse parallax calculation on mobile for performance
    const { clientX, clientY, currentTarget } = e;
    const { width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX / width - 0.5) * 12;
    const y = (clientY / height - 0.5) * 12;
    setMousePos({ x, y });
  };

  return (
    <section
      id="hero-section"
      onMouseMove={handleMouseMove}
      className="relative w-full h-[100svh] min-h-[580px] max-h-[1100px] bg-[#F2F0EB] text-[#141414] font-sans overflow-hidden select-none"
    >
      {/* Background Tonal Panels Architecture & Smooth Settle of Campaign Image */}
      <div className="absolute inset-0 z-0 bg-[#E8E6E1] overflow-hidden">
        {/* Right Tonal Slab (65% on desktop, subtle full gradient on mobile) */}
        <div className="absolute right-0 top-0 w-full sm:w-[65%] lg:w-[60%] h-full bg-[#DAD8D1]" />

        {/* Feature Portrait Visual Layer (Mobile & Desktop Art-Directed) */}
        <div 
          className={`absolute right-[0%] sm:right-[6%] lg:right-[14%] bottom-0 w-[86vw] sm:w-[380px] lg:w-[460px] h-[78svh] sm:h-[88%] lg:h-[90%] bg-cover bg-center z-10 rounded-t-[8px] overflow-hidden transition-all duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'
          }`}
          style={{ 
            backgroundImage: `linear-gradient(to top, rgba(20, 20, 20, 0.45) 0%, rgba(20, 20, 20, 0.05) 50%, transparent 100%), url('https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop')`,
            filter: 'grayscale(15%) contrast(1.06)',
            transform: `translate3d(${mousePos.x * 0.35}px, ${mousePos.y * 0.35}px, 0) scale(${isLoaded ? 1 : 1.04})`
          }}
        >
          {/* Subtle vignette gradient so headline remains razor-sharp and model stays illuminated */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F2F0EB]/60 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Subtle Concrete Grain Texture */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none concrete-pattern" />

      {/* Foreground Container aligned to Global Grid */}
      <div className="piercyn-container relative z-10 h-full flex flex-col justify-between pt-20 sm:pt-24 pb-8 sm:pb-12 pointer-events-none">
        
        {/* Top Spacer / Tag alignment */}
        <div className="hidden sm:flex items-center justify-between pointer-events-auto">
          <span className="text-[11px] font-sans font-semibold tracking-[0.25em] uppercase text-[#141414]/70">
            RELEASE 26.1 • LAGOS ATELIER
          </span>
          <span className="text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-[#141414]/50 hidden lg:inline-block">
            LAGOS — NIGERIA — 2026
          </span>
        </div>

        {/* Interlocking Editorial Serif Typography with Line-by-Line Masked Clipping Reveal */}
        <div className="my-auto py-2 sm:py-4 pointer-events-none">
          <h1 className="font-editorial italic leading-[0.86] text-[#141414] tracking-[-0.03em]">
            {/* Line 1: MADE */}
            <div className="overflow-hidden py-0.5 sm:py-1">
              <span 
                className={`block text-[clamp(58px,11vw,135px)] ml-1 sm:ml-10 opacity-95 transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] font-medium ${
                  isLoaded ? 'translate-y-0' : 'translate-y-[115%]'
                }`}
                style={{
                  transform: isLoaded 
                    ? `translate3d(${mousePos.x * -0.25}px, ${mousePos.y * -0.25}px, 0)` 
                    : 'translateY(115%)'
                }}
              >
                MADE
              </span>
            </div>

            {/* Line 2: TO STAND */}
            <div className="overflow-hidden -mt-2 sm:-mt-6 lg:-mt-8 py-0.5 sm:py-1 relative z-[18]">
              <span 
                className={`block text-[clamp(62px,12.5vw,155px)] font-normal transition-transform duration-[1200ms] delay-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isLoaded ? 'translate-y-0' : 'translate-y-[115%]'
                }`}
                style={{
                  transform: isLoaded 
                    ? `translate3d(${mousePos.x * -0.45}px, ${mousePos.y * -0.45}px, 0)` 
                    : 'translateY(115%)'
                }}
              >
                TO STAND
              </span>
            </div>

            {/* Line 3: OUT. */}
            <div className="overflow-hidden -mt-2 sm:-mt-6 lg:-mt-8 py-0.5 sm:py-1 relative z-[15]">
              <span 
                className={`block text-[clamp(58px,11.5vw,140px)] ml-10 sm:ml-28 lg:ml-40 opacity-95 transition-transform duration-[1300ms] delay-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] font-medium ${
                  isLoaded ? 'translate-y-0' : 'translate-y-[115%]'
                }`}
                style={{
                  transform: isLoaded 
                    ? `translate3d(${mousePos.x * -0.65}px, ${mousePos.y * -0.65}px, 0)` 
                    : 'translateY(115%)'
                }}
              >
                OUT.
              </span>
            </div>
          </h1>
        </div>

        {/* Bottom Bar: Supporting Narrative & Action Buttons on Left, Scroll Indicator on Right */}
        <div className="flex items-end justify-between w-full pointer-events-auto">
          {/* Narrative & Buttons */}
          <div 
            className={`max-w-[420px] transition-all duration-[1000ms] delay-[550ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <p className="font-sans text-[13.5px] sm:text-[15px] leading-[1.6] tracking-[0.03em] uppercase text-[#141414]/90 mb-4 sm:mb-6 font-medium">
              Modern fashion for people who carry their own presence.
            </p>

            {/* Tactile Pill Buttons with standard 48px mobile button system */}
            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3 w-full sm:w-auto font-sans">
              <button
                id="hero-shop-men-btn"
                onClick={() => onExplore('men')}
                className="group h-12 min-h-[48px] px-4 sm:px-6 rounded-full bg-[#141414] text-[#F2F0EB] hover:bg-black transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] text-[12px] sm:text-[13px] font-semibold tracking-[0.12em] sm:tracking-[0.16em] uppercase whitespace-nowrap"
              >
                <span>SHOP MEN</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              
              <button
                id="hero-shop-women-btn"
                onClick={() => onExplore('women')}
                className="group h-12 min-h-[48px] px-4 sm:px-6 rounded-full border border-[#141414]/80 bg-[#F2F0EB]/80 backdrop-blur-xs text-[#141414] hover:bg-[#141414] hover:text-[#F2F0EB] transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] text-[12px] sm:text-[13px] font-semibold tracking-[0.12em] sm:tracking-[0.16em] uppercase whitespace-nowrap"
              >
                <span>SHOP WOMEN</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Bottom Right Minimal Scroll Indicator */}
          <div 
            className={`hidden sm:flex flex-col items-end cursor-pointer transition-all duration-[1000ms] delay-[850ms] ease-[cubic-bezier(0.16,1,0.3,1)] group ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            onClick={() => {
              document.getElementById('new-drop-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase mb-3 text-[#141414]/50 font-medium group-hover:text-[#141414] transition-colors">
              SCROLL
            </div>
            <div className="w-[1px] h-12 sm:h-14 bg-[#141414] opacity-25 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

      </div>
    </section>
  );
};


