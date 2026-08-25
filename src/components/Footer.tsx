import React from 'react';
import { useShop } from '../context/ShopContext';
import { ArrowUp } from 'lucide-react';
import { PiercynMonogram } from './PiercynLogo';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
  onSelectPage?: (page: 'men' | 'women' | 'new' | 'collections' | 'lookbook' | 'home') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateSection, onSelectPage }) => {
  const { setIsSizeGuideOpen, setIsStoryOpen } = useShop();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="main-footer" className="relative w-full bg-[#E8E6E1] text-[#1A1A1A] pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16 overflow-hidden select-none">
      <div className="piercyn-container">
        
        {/* Massive PIERCYN Wordmark Spanning Nearly the Entire Width */}
        <div className="border-b border-[#DAD8D1] pb-8 sm:pb-12 lg:pb-16 mb-10 sm:mb-14 lg:mb-16 overflow-hidden flex flex-col items-center sm:items-start gap-4">
          <PiercynMonogram size={56} className="text-[#141414]" />
          <p 
            onClick={scrollToTop}
            className="font-editorial text-[21vw] leading-[0.75] tracking-[-0.04em] uppercase text-[#141414] cursor-pointer hover:opacity-80 transition-opacity select-none text-center sm:text-left font-normal italic"
          >
            PIERCYN
          </p>
        </div>

        {/* Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-12 mb-12 sm:mb-16 lg:mb-20 text-[12px] sm:text-[13px] tracking-[0.15em] uppercase font-sans">
          
          {/* Col 1: SHOP */}
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <span className="text-[#141414]/60 font-bold text-[11px] tracking-[0.22em]">
              01 / SHOP
            </span>
            <div className="flex flex-col space-y-2 font-medium">
              <button
                onClick={() => {
                  if (onSelectPage) onSelectPage('men');
                }}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                MEN
              </button>
              <button
                onClick={() => {
                  if (onSelectPage) onSelectPage('women');
                }}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                WOMEN
              </button>
              <button
                onClick={() => {
                  if (onSelectPage) onSelectPage('new');
                }}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                NEW ARRIVALS
              </button>
              <button
                onClick={() => {
                  if (onSelectPage) onSelectPage('home');
                  onNavigateSection('lookbook-section');
                }}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                LOOKBOOK 2026
              </button>
              <button
                onClick={() => {
                  if (onSelectPage) onSelectPage('home');
                  onNavigateSection('the-piece-section');
                }}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                THE 450 GSM PIECE
              </button>
            </div>
          </div>

          {/* Col 2: HELP & CLIENT CARE */}
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <span className="text-[#141414]/60 font-bold text-[11px] tracking-[0.22em]">
              02 / HELP
            </span>
            <div className="flex flex-col space-y-2 font-medium">
              <button
                onClick={() => setIsStoryOpen(true)}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                OUR LAGOS STORY
              </button>
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                SIZE & FIT GUIDE
              </button>
              <span className="min-h-[36px] flex items-center text-[#141414]/80 hover:text-[#141414] transition-colors cursor-pointer">
                DELIVERY & SHIPPING
              </span>
              <span className="min-h-[36px] flex items-center text-[#141414]/80 hover:text-[#141414] transition-colors cursor-pointer">
                RETURNS & EXCHANGES
              </span>
              <span className="min-h-[36px] flex items-center text-[#141414]/80 hover:text-[#141414] transition-colors cursor-pointer">
                CONTACT ATELIER
              </span>
            </div>
          </div>

          {/* Col 3: FOLLOW */}
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <span className="text-[#141414]/60 font-bold text-[11px] tracking-[0.22em]">
              03 / FOLLOW
            </span>
            <div className="flex flex-col space-y-2 font-medium">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer"
                className="min-h-[36px] flex items-center text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link"
              >
                INSTAGRAM
              </a>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noreferrer"
                className="min-h-[36px] flex items-center text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link"
              >
                TIKTOK
              </a>
              <a 
                href="https://pinterest.com" 
                target="_blank" 
                rel="noreferrer"
                className="min-h-[36px] flex items-center text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link"
              >
                PINTEREST
              </a>
              <a 
                href="https://spotify.com" 
                target="_blank" 
                rel="noreferrer"
                className="min-h-[36px] flex items-center text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link"
              >
                SPOTIFY PLAYLIST
              </a>
            </div>
          </div>

          {/* Col 4: LOCATIONS */}
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <span className="text-[#141414]/60 font-bold text-[11px] tracking-[0.22em]">
              04 / ATELIER
            </span>
            <div className="space-y-1 text-[#141414]/80 normal-case text-[13px] leading-relaxed font-sans">
              <p className="font-semibold text-[#141414] uppercase text-[12px] tracking-[0.1em]">
                VICTORIA ISLAND & SURULERE
              </p>
              <p>Lagos State, Nigeria</p>
              <p className="text-[12px] font-sans font-medium tracking-wider pt-2">atelier@piercyn.com</p>
            </div>
          </div>

          {/* Col 5: BACK TO TOP */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 flex flex-col justify-between items-start lg:items-end pt-2 sm:pt-0 font-sans">
            <button
              onClick={scrollToTop}
              className="min-h-[48px] flex items-center gap-2 text-[12px] tracking-[0.18em] uppercase font-semibold px-6 py-3 rounded-full border border-[#DAD8D1] hover:border-[#141414] hover:bg-[#141414] hover:text-[#F2F0EB] transition-all cursor-pointer active:scale-95"
            >
              <span>BACK TO TOP</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Bottom Line */}
        <div className="pt-6 sm:pt-8 border-t border-[#DAD8D1] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[11px] sm:text-[12px] tracking-[0.15em] uppercase font-sans text-[#141414]/70 text-center sm:text-left font-medium">
          <div>
            © 2026 PIERCYN. ALL RIGHTS RESERVED.
          </div>

          <div className="font-editorial italic text-[#141414] text-[16px] sm:text-[17px] tracking-normal font-normal">
            MADE TO STAND OUT.
          </div>

          <div>
            LAGOS • WORLDWIDE
          </div>
        </div>

      </div>
    </footer>
  );
};

