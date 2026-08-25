import React from 'react';
import { SOCIAL_TILES } from '../data/community';
import { ArrowUpRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const SocialSection: React.FC = () => {
  const { showToast } = useShop();

  const handleSocialClick = (platform: string) => {
    showToast(`Redirecting to PIERCYN Official ${platform} channel...`);
  };

  return (
    <section 
      id="social-section" 
      className="relative w-full bg-[#141414] text-[#F2F0EB] py-20 sm:py-28 lg:py-32 overflow-hidden select-none"
    >
      <div className="piercyn-container">
        
        {/* Top Typography Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-16 lg:mb-20 gap-6 sm:gap-8">
          <div>
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#E3DEC3]/80 font-sans font-semibold block mb-2 sm:mb-3">
              09 / DIGITAL DISPATCH
            </span>
            <h2 className="font-editorial text-[14vw] sm:text-[11vw] lg:text-[7vw] xl:text-[110px] leading-[0.86] tracking-[-0.03em] uppercase text-[#F2F0EB] select-none">
              <div>FOLLOW</div>
              <div className="italic font-light pl-4 sm:pl-16 lg:pl-24 text-[#E3DEC3]">PIERCYN<span className="not-italic text-white">.</span></div>
            </h2>
          </div>

          <div className="flex flex-col space-y-3 sm:space-y-4 font-sans">
            <span className="text-[11px] sm:text-[12px] font-sans font-semibold tracking-[0.2em] uppercase text-[#A48B71]">
              @PIERCYN OFFICIAL
            </span>
            
            {/* Text Links with Touch Targets */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-[12px] sm:text-[13px] tracking-[0.18em] uppercase font-semibold">
              {[
                { name: 'INSTAGRAM', url: 'https://instagram.com' },
                { name: 'TIKTOK', url: 'https://tiktok.com' },
                { name: 'PINTEREST', url: 'https://pinterest.com' },
                { name: 'SPOTIFY', url: 'https://spotify.com' }
              ].map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleSocialClick(link.name)}
                  className="editorial-link min-h-[44px] flex items-center gap-1.5 hover:text-white text-[#F2F0EB]/90 cursor-pointer font-sans"
                >
                  <span>{link.name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Six Immersive Connected Images */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {SOCIAL_TILES.map((tile) => (
            <div
              key={tile.id}
              onClick={() => handleSocialClick('Instagram')}
              className="group relative aspect-[3/3.8] sm:aspect-[3/4.2] overflow-hidden bg-[#222222] rounded-lg cursor-pointer active:scale-[0.99] transition-transform"
            >
              <img
                src={tile.image}
                alt={tile.caption}
                className="w-full h-full object-cover object-center filter contrast-[1.1] transition-all duration-700 ease-out group-hover:scale-108 group-hover:brightness-110"
                loading="lazy"
              />

              {/* Seamless dark overlay with caption */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 sm:p-4 flex flex-col justify-between">
                <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.25em] uppercase text-[#E3DEC3]">
                  {tile.tag}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.1em] text-white leading-tight font-sans">
                  {tile.caption}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
