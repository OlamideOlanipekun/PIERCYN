import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface WomenHeroSectionProps {
  onShopNewArrivals: () => void;
}

export const WomenHeroSection: React.FC<WomenHeroSectionProps> = ({ onShopNewArrivals }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section 
      id="women-hero"
      className="relative w-full min-h-[70svh] sm:min-h-[75vh] md:min-h-[85vh] lg:min-h-[90vh] bg-[#141414] overflow-hidden flex flex-col justify-end pt-16 sm:pt-20 select-none"
    >
      {/* Background Editorial Nigerian Model Campaign Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=2000&auto=format&fit=crop"
          alt="PIERCYN Women's Campaign — Lagos Architectural Womenswear"
          className={`w-full h-full object-cover object-[center_24%] sm:object-[center_20%] md:object-[center_18%] transition-transform duration-1000 ease-out will-change-transform ${
            isLoaded ? 'scale-100 opacity-100' : 'scale-[1.03] opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          loading="eager"
          decoding="async"
        />

        {/* Sophisticated Editorial Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/95 via-[#141414]/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/70 via-transparent to-[#141414]/40 pointer-events-none hidden sm:block" />
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />
      </div>

      {/* Hero Typography & Content Overlay */}
      <div className="relative z-10 piercyn-container pb-8 sm:pb-12 md:pb-16 lg:pb-20 text-[#F2F0EB]">
        <div className="max-w-3xl space-y-4 sm:space-y-6">
          
          {/* Step 1: Sub-label */}
          <div 
            className={`transition-all duration-700 delay-200 ease-out flex items-center gap-3 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <span className="text-[11px] sm:text-[12px] font-mono tracking-[0.25em] uppercase text-[#E3DEC3] font-semibold bg-[#141414]/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
              WOMEN / DROP 26.1
            </span>
            <span className="text-[11px] sm:text-[12px] font-sans tracking-[0.16em] uppercase text-[#D8D4CA] font-medium hidden sm:inline">
              FORM & SILHOUETTE. LAGOS ATELIER.
            </span>
          </div>

          {/* Step 2: Large Cormorant Garamond Editorial Headline */}
          <h1 
            className={`font-editorial text-4xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-[-0.03em] leading-[0.92] text-[#F2F0EB] transition-all duration-1000 delay-300 ease-out ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <span className="block">FORM IN</span>
            <span className="block italic text-[#E3DEC3]">UNCOMPROMISED</span>
            <span className="block">MOTION.</span>
          </h1>

          {/* Step 3: Supporting Text */}
          <p 
            className={`text-sm sm:text-base md:text-lg font-sans text-[#D8D4CA] max-w-xl font-normal leading-relaxed tracking-[0.02em] transition-all duration-700 delay-500 ease-out ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Modern womenswear designed with sculptural volume and effortless comfort. Heavyweight 450 GSM crops, fluid tailored pleats, and considered Lagos craftsmanship.
          </p>

          {/* Step 4: CTA */}
          <div 
            className={`pt-2 sm:pt-4 transition-all duration-700 delay-700 ease-out ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <button
              onClick={onShopNewArrivals}
              className="group inline-flex items-center gap-3 text-xs sm:text-sm font-sans uppercase tracking-[0.2em] font-semibold text-[#F2F0EB] hover:text-[#E3DEC3] transition-all duration-300 min-h-[48px] cursor-pointer"
            >
              <span className="border-b border-[#F2F0EB] pb-0.5 group-hover:border-[#E3DEC3] transition-colors">
                SHOP NEW ARRIVALS
              </span>
              <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#E3DEC3] group-hover:translate-x-1.5 transition-all duration-300 bg-white/5">
                <ArrowRight className="w-4 h-4 text-[#F2F0EB] group-hover:text-[#E3DEC3]" />
              </span>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
