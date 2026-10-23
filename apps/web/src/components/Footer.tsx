import React from 'react';
import { useShop } from '../context/ShopContext';
import { ArrowUp, Instagram, MessageCircle } from 'lucide-react';
import { PiercynMonogram } from './PiercynLogo';
import { ActivePageView } from '../types';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
  onSelectPage?: (page: ActivePageView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateSection, onSelectPage }) => {
  const { setIsSizeGuideOpen } = useShop();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="main-footer" className="relative w-full bg-[#E8E6E1] text-[#1A1A1A] pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16 overflow-hidden select-none">
      <div className="piercyn-container">
        
        {/* Massive PIERCYN Wordmark */}
        <div className="border-b border-[#DAD8D1] pb-8 sm:pb-12 lg:pb-16 mb-10 sm:mb-14 lg:mb-16 overflow-hidden flex flex-col items-center sm:items-start gap-4">
          <PiercynMonogram size={52} className="text-[#141414]" />
          <p 
            onClick={scrollToTop}
            className="font-editorial text-[clamp(60px,18vw,200px)] leading-[0.75] tracking-[-0.04em] uppercase text-[#141414] cursor-pointer hover:opacity-80 transition-opacity select-none text-center sm:text-left font-normal italic"
          >
            PIERCYN
          </p>
        </div>

        {/* Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16 text-[12px] sm:text-[13px] tracking-[0.15em] uppercase font-sans">
          
          {/* Col 1: SHOP */}
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <span className="text-[#141414]/60 font-bold text-[11px] tracking-[0.22em]">
              SHOP
            </span>
            <div className="flex flex-col space-y-2 font-medium">
              <button
                id="footer-shop-all"
                onClick={() => onSelectPage && onSelectPage('shop')}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                ALL PIECES
              </button>
              <button
                id="footer-shop-men"
                onClick={() => onSelectPage && onSelectPage('men')}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                MEN
              </button>
              <button
                id="footer-new-arrivals"
                onClick={() => onSelectPage && onSelectPage('new')}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                NEW ARRIVALS
              </button>
            </div>
          </div>

          {/* Col 2: HELP */}
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <span className="text-[#141414]/60 font-bold text-[11px] tracking-[0.22em]">
              HELP
            </span>
            <div className="flex flex-col space-y-2 font-medium">
              <button
                id="footer-about"
                onClick={() => onSelectPage && onSelectPage('about')}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                ABOUT PIERCYN
              </button>
              <button
                id="footer-size-guide"
                onClick={() => setIsSizeGuideOpen(true)}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                SIZE GUIDE
              </button>
              <span className="min-h-[36px] flex items-center text-[#141414]/80">
                SHIPPING & DELIVERY
              </span>
              <span className="min-h-[36px] flex items-center text-[#141414]/80">
                RETURNS & EXCHANGES
              </span>
              <a
                id="footer-contact"
                href="mailto:hello@piercyn.com"
                className="min-h-[36px] flex items-center text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link"
              >
                CONTACT US
              </a>
            </div>
          </div>

          {/* Col 3: FOLLOW */}
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <span className="text-[#141414]/60 font-bold text-[11px] tracking-[0.22em]">
              FOLLOW
            </span>
            <div className="flex flex-col space-y-2 font-medium">
              <a 
                id="footer-instagram"
                href="https://instagram.com/piercyn" 
                target="_blank" 
                rel="noreferrer"
                className="min-h-[36px] flex items-center gap-2 text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link"
              >
                <Instagram className="w-3.5 h-3.5 shrink-0" />
                INSTAGRAM
              </a>
              <a 
                id="footer-tiktok"
                href="https://tiktok.com/@piercyn" 
                target="_blank" 
                rel="noreferrer"
                className="min-h-[36px] flex items-center text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link"
              >
                TIKTOK
              </a>
              <a 
                id="footer-whatsapp"
                href="https://wa.me/2348076431059?text=Hello%20PIERCYN%2C%20I%20need%20help." 
                target="_blank" 
                rel="noreferrer"
                className="min-h-[36px] flex items-center gap-2 text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                WHATSAPP
              </a>
            </div>
          </div>

          {/* Col 4: BACK TO TOP + Legal */}
          <div className="flex flex-col justify-between items-start">
            <div className="space-y-2 text-[#141414]/80 text-[13px] leading-relaxed font-sans">
              <p className="font-semibold text-[#141414] uppercase text-[11px] tracking-[0.15em] mb-2">PIERCYN</p>
              <p>Lagos, Nigeria</p>
              <a href="mailto:hello@piercyn.com" className="block hover:text-[#141414] transition-colors">
                hello@piercyn.com
              </a>
            </div>
            <button
              onClick={scrollToTop}
              className="mt-6 min-h-[44px] flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase font-semibold px-5 py-2.5 rounded-full border border-[#DAD8D1] hover:border-[#141414] hover:bg-[#141414] hover:text-[#F2F0EB] transition-all cursor-pointer active:scale-95"
            >
              <span>BACK TO TOP</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Bottom Line */}
        <div className="pt-6 sm:pt-8 border-t border-[#DAD8D1] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[11px] sm:text-[12px] tracking-[0.15em] uppercase font-sans text-[#141414]/60 text-center sm:text-left">
          <div>
            © 2026 PIERCYN. ALL RIGHTS RESERVED.
          </div>

          <div className="font-editorial italic text-[#141414] text-[15px] sm:text-[16px] tracking-normal font-normal">
            LOOK GOOD. SPEND LESS.
          </div>

          <div className="flex items-center gap-4">
            <span>LAGOS • NIGERIA</span>
            <span>•</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
