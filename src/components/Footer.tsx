import React, { useState } from 'react';
import { ArrowUp, ChevronDown, Instagram, MessageCircle } from 'lucide-react';
import { PiercynMonogram } from './PiercynLogo';
import { ActivePageView } from '../types';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
  onSelectPage?: (page: ActivePageView) => void;
}

type FooterGroup = 'shop' | 'help' | 'follow' | 'legal';

export const Footer: React.FC<FooterProps> = ({ onNavigateSection: _onNavigateSection, onSelectPage }) => {
  const [openGroups, setOpenGroups] = useState<Record<FooterGroup, boolean>>({
    shop: false, help: false, follow: false, legal: false,
  });

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const toggleGroup = (group: FooterGroup) => setOpenGroups((current) => ({ ...current, [group]: !current[group] }));
  const selectPage = (page: ActivePageView) => onSelectPage?.(page);
  const footerLinkClass = 'flex min-h-10 items-center text-left text-[12px] font-medium tracking-[0.08em] text-[#141414]/70 transition-colors hover:text-[#141414] editorial-link';
  const groupHeader = (group: FooterGroup, label: string) => (
    <button type="button" onClick={() => toggleGroup(group)}
      className="flex min-h-12 w-full items-center justify-between border-b border-[#DAD8D1] py-3 text-left text-[11px] font-bold tracking-[0.22em] text-[#141414]"
      aria-expanded={openGroups[group]} aria-controls={`footer-mobile-${group}`}>
      <span>{label}</span>
      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openGroups[group] ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <footer id="main-footer" className="relative w-full overflow-hidden bg-[#E8E6E1] text-[#141414] select-none">
      <div className="piercyn-container">
        <div className="flex flex-col gap-5 border-b border-[#DAD8D1] py-10 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:py-14 lg:py-16">
          <div className="flex max-w-xl items-start gap-4">
            <PiercynMonogram size={36} className="mt-1 shrink-0 text-[#141414]" />
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#77736C]">FROM LAGOS, NIGERIA</p>
              <p className="font-editorial text-[clamp(26px,4vw,42px)] italic leading-[1.05] tracking-[-0.025em]">Style that feels like you.</p>
              <p className="mt-3 max-w-md text-[13px] leading-6 text-[#4A4844]">Modern pieces. Considered prices. Made for standing out.</p>
            </div>
          </div>
          <button type="button" onClick={() => selectPage('contact')} className="inline-flex min-h-11 w-fit items-center gap-2 border-b border-[#141414]/30 pb-1 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors hover:border-[#141414] cursor-pointer">GET IN TOUCH <span aria-hidden="true">↗</span></button>
        </div>

        <div className="hidden grid-cols-4 gap-8 py-12 md:grid lg:gap-12 lg:py-16">
          <div className="min-w-0">
            <h2 className="mb-5 text-[10px] font-bold tracking-[0.22em] text-[#77736C]">SHOP</h2>
            <nav className="flex flex-col items-start gap-1">
              <button id="footer-shop-all" onClick={() => selectPage('shop')} className={footerLinkClass}>ALL PIECES</button>
              <button id="footer-shop-men" onClick={() => selectPage('men')} className={footerLinkClass}>MEN</button>
              <button id="footer-new-arrivals" onClick={() => selectPage('new')} className={footerLinkClass}>NEW ARRIVALS</button>
              <button type="button" id="footer-available-to-order" onClick={() => { window.history.pushState({}, '', '/available-to-order'); window.dispatchEvent(new PopStateEvent('popstate')); }} className={footerLinkClass}>AVAILABLE TO ORDER</button>
            </nav>
          </div>

          {/* Col 2: HELP & OPERATIONS */}
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <span className="text-[#141414]/60 font-bold text-[11px] tracking-[0.22em]">
              CUSTOMER CARE
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
                onClick={() => onSelectPage && onSelectPage('sizeGuide')}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                SIZE GUIDE
              </button>
              <button
                id="footer-shipping"
                onClick={() => onSelectPage && onSelectPage('shipping')}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                SHIPPING & DELIVERY
              </button>
              <button
                id="footer-returns"
                onClick={() => onSelectPage && onSelectPage('returns')}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                RETURNS & EXCHANGES
              </button>
              <button
                id="footer-track-order"
                onClick={() => onSelectPage && onSelectPage('trackOrder')}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                TRACK ORDER
              </button>
              <button
                id="footer-faq"
                onClick={() => onSelectPage && onSelectPage('faq')}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                FAQ
              </button>
              <button
                id="footer-contact"
                onClick={() => onSelectPage && onSelectPage('contact')}
                className="min-h-[36px] flex items-center text-left text-[#141414]/80 hover:text-[#141414] transition-colors editorial-link cursor-pointer"
              >
                CONTACT US
              </button>
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="mb-5 text-[10px] font-bold tracking-[0.22em] text-[#77736C]">FOLLOW PIERCYN</h2>
            <nav className="flex flex-col items-start gap-1">
              <a id="footer-instagram" href="https://instagram.com/piercyn" target="_blank" rel="noopener noreferrer" className={`${footerLinkClass} gap-2`}><Instagram className="h-3.5 w-3.5 shrink-0" /> INSTAGRAM <span className="text-[10px]">↗</span></a>
              <a id="footer-tiktok" href="https://tiktok.com/@piercyn" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>TIKTOK <span className="ml-2 text-[10px]">↗</span></a>
              <a id="footer-whatsapp" href="https://wa.me/2348076431059?text=Hello%20PIERCYN%2C%20I%20need%20help." target="_blank" rel="noopener noreferrer" className={`${footerLinkClass} gap-2`}><MessageCircle className="h-3.5 w-3.5 shrink-0" /> WHATSAPP <span className="text-[10px]">↗</span></a>
            </nav>
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
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3">
            <span>© 2026 PIERCYN. ALL RIGHTS RESERVED.</span>
            <span>•</span>
            <button
              id="footer-privacy-policy"
              onClick={() => onSelectPage && onSelectPage('privacy')}
              className="hover:text-[#141414] underline cursor-pointer"
            >
              PRIVACY POLICY
            </button>
            <span>•</span>
            <button
              id="footer-terms-conditions"
              onClick={() => onSelectPage && onSelectPage('terms')}
              className="hover:text-[#141414] underline cursor-pointer"
            >
              TERMS & CONDITIONS
            </button>
          </div>

          <div className="font-editorial italic text-[#141414] text-[15px] sm:text-[16px] tracking-normal font-normal">
            LOOK GOOD. SPEND LESS.
          </div>

          <div className="flex items-center gap-4">
            <span>LAGOS • NIGERIA</span>
            <span>•</span>
          </div>
        </div>

        <div className="py-5 md:hidden">
          <section>
            {groupHeader('shop', 'SHOP')}
            <div id="footer-mobile-shop" hidden={!openGroups.shop} className="py-2"><nav className="flex flex-col">
              <button onClick={() => selectPage('shop')} className={footerLinkClass}>ALL PIECES</button>
              <button onClick={() => selectPage('men')} className={footerLinkClass}>MEN</button>
              <button onClick={() => selectPage('new')} className={footerLinkClass}>NEW ARRIVALS</button>
            </nav></div>
          </section>
          <section>
            {groupHeader('help', 'HELP')}
            <div id="footer-mobile-help" hidden={!openGroups.help} className="py-2"><nav className="flex flex-col">
              <button onClick={() => selectPage('about')} className={footerLinkClass}>ABOUT PIERCYN</button>
              <button onClick={() => selectPage('sizeGuide')} className={footerLinkClass}>SIZE GUIDE</button>
              <button onClick={() => selectPage('shipping')} className={footerLinkClass}>SHIPPING & DELIVERY</button>
              <button onClick={() => selectPage('returns')} className={footerLinkClass}>RETURNS & EXCHANGES</button>
              <button onClick={() => selectPage('contact')} className={footerLinkClass}>CONTACT US</button>
            </nav></div>
          </section>
          <section>
            {groupHeader('follow', 'FOLLOW')}
            <div id="footer-mobile-follow" hidden={!openGroups.follow} className="py-2"><nav className="flex flex-col">
              <a href="https://instagram.com/piercyn" target="_blank" rel="noopener noreferrer" className={`${footerLinkClass} gap-2`}><Instagram className="h-3.5 w-3.5" /> INSTAGRAM ↗</a>
              <a href="https://tiktok.com/@piercyn" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>TIKTOK ↗</a>
              <a href="https://wa.me/2348076431059?text=Hello%20PIERCYN%2C%20I%20need%20help." target="_blank" rel="noopener noreferrer" className={`${footerLinkClass} gap-2`}><MessageCircle className="h-3.5 w-3.5" /> WHATSAPP ↗</a>
            </nav></div>
          </section>
          <section>
            {groupHeader('legal', 'LEGAL & SUPPORT')}
            <div id="footer-mobile-legal" hidden={!openGroups.legal} className="py-2"><nav className="flex flex-col">
              <button onClick={() => selectPage('shipping')} className={footerLinkClass}>SHIPPING & DELIVERY</button>
              <button onClick={() => selectPage('returns')} className={footerLinkClass}>RETURNS & EXCHANGES</button>
              <button onClick={() => selectPage('contact')} className={footerLinkClass}>CONTACT SUPPORT</button>
            </nav></div>
          </section>
        </div>
      </div>

      <div className="bg-[#141414] text-[#F2F0EB]">
        <div className="piercyn-container pb-7 pt-8 sm:pb-9 sm:pt-10 lg:pt-12">
          <div className="mb-5 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
            <p className="font-editorial text-[clamp(23px,4vw,40px)] italic leading-none tracking-[-0.02em]">MADE TO STAND OUT.</p>
            <button onClick={scrollToTop} className="inline-flex min-h-10 w-fit items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-[#F2F0EB]/65 transition-colors hover:text-[#F2F0EB] md:hidden">BACK TO TOP <ArrowUp className="h-3.5 w-3.5" /></button>
          </div>
          <div className="overflow-hidden border-b border-white/15 pb-4 sm:pb-6">
            <button onClick={scrollToTop} aria-label="PIERCYN — back to top" className="block w-full cursor-pointer text-left font-editorial text-[clamp(64px,19.5vw,260px)] font-normal italic leading-[0.72] tracking-[-0.065em] text-[#F2F0EB] transition-opacity hover:opacity-80">PIERCYN</button>
          </div>
          <div className="flex flex-col gap-4 pt-5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#F2F0EB]/55 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:pt-6 sm:text-[10px]">
            <p>© 2026 PIERCYN. ALL RIGHTS RESERVED.</p>
            <p className="text-[#F2F0EB]/75">LAGOS · NIGERIA</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
