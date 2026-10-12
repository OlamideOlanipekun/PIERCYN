import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { ArrowUp, ChevronDown, Instagram, MessageCircle } from 'lucide-react';
import { PiercynMonogram } from './PiercynLogo';
import { ActivePageView } from '../types';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
  onSelectPage?: (page: ActivePageView) => void;
}

type FooterGroup = 'shop' | 'help' | 'follow' | 'legal';

export const Footer: React.FC<FooterProps> = ({ onNavigateSection: _onNavigateSection, onSelectPage }) => {
  const { setIsSizeGuideOpen } = useShop();
  const [openGroups, setOpenGroups] = useState<Record<FooterGroup, boolean>>({
    shop: false, help: false, follow: false, legal: false,
  });

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const toggleGroup = (group: FooterGroup) => setOpenGroups((current) => ({ ...current, [group]: !current[group] }));
  const goToAffiliate = () => {
    window.history.pushState({}, '', '/affiliate');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
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
          <a href="/contact" className="inline-flex min-h-11 w-fit items-center gap-2 border-b border-[#141414]/30 pb-1 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors hover:border-[#141414]">GET IN TOUCH <span aria-hidden="true">↗</span></a>
        </div>

        <div className="hidden grid-cols-4 gap-8 py-12 md:grid lg:gap-12 lg:py-16">
          <div className="min-w-0">
            <h2 className="mb-5 text-[10px] font-bold tracking-[0.22em] text-[#77736C]">SHOP</h2>
            <nav className="flex flex-col items-start gap-1">
              <button id="footer-shop-all" onClick={() => selectPage('shop')} className={footerLinkClass}>ALL PIECES</button>
              <button id="footer-shop-men" onClick={() => selectPage('men')} className={footerLinkClass}>MEN</button>
              <button id="footer-new-arrivals" onClick={() => selectPage('new')} className={footerLinkClass}>NEW ARRIVALS</button>
            </nav>
          </div>
          <div className="min-w-0">
            <h2 className="mb-5 text-[10px] font-bold tracking-[0.22em] text-[#77736C]">HELP & INFORMATION</h2>
            <nav className="flex flex-col items-start gap-1">
              <button id="footer-about" onClick={() => selectPage('about')} className={footerLinkClass}>ABOUT PIERCYN</button>
              <button id="footer-size-guide" onClick={() => setIsSizeGuideOpen(true)} className={footerLinkClass}>SIZE GUIDE</button>
              <a href="/shipping" className={footerLinkClass}>SHIPPING & DELIVERY</a>
              <a href="/returns" className={footerLinkClass}>RETURNS & EXCHANGES</a>
              <a id="footer-contact" href="/contact" className={footerLinkClass}>CONTACT US</a>
              <a href="/faq" className={footerLinkClass}>FAQ</a>
              <a href="/privacy" className={footerLinkClass}>PRIVACY POLICY</a>
              <a href="/terms" className={footerLinkClass}>TERMS & CONDITIONS</a>
              <button id="footer-affiliate-program" onClick={goToAffiliate} className={footerLinkClass}>AFFILIATE PROGRAM</button>
            </nav>
          </div>
          <div className="min-w-0">
            <h2 className="mb-5 text-[10px] font-bold tracking-[0.22em] text-[#77736C]">FOLLOW PIERCYN</h2>
            <nav className="flex flex-col items-start gap-1">
              <a id="footer-instagram" href="https://instagram.com/piercyn" target="_blank" rel="noopener noreferrer" className={`${footerLinkClass} gap-2`}><Instagram className="h-3.5 w-3.5 shrink-0" /> INSTAGRAM <span className="text-[10px]">↗</span></a>
              <a id="footer-tiktok" href="https://tiktok.com/@piercyn" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>TIKTOK <span className="ml-2 text-[10px]">↗</span></a>
              <a id="footer-whatsapp" href="https://wa.me/2349129997137?text=Hello%20PIERCYN%2C%20I%20need%20help." target="_blank" rel="noopener noreferrer" className={`${footerLinkClass} gap-2`}><MessageCircle className="h-3.5 w-3.5 shrink-0" /> WHATSAPP <span className="text-[10px]">↗</span></a>
            </nav>
          </div>
          <div className="flex min-w-0 flex-col items-start">
            <h2 className="mb-5 text-[10px] font-bold tracking-[0.22em] text-[#77736C]">THE DETAILS</h2>
            <p className="text-[13px] font-semibold">PIERCYN</p>
            <p className="mt-2 text-[12px] text-[#4A4844]">Lagos, Nigeria</p>
            <a href="/contact" className="mt-2 break-words text-[12px] text-[#4A4844] transition-colors hover:text-[#141414]">Contact PIERCYN support</a>
            <button onClick={scrollToTop} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D0CEC7] px-4 py-2 text-[10px] font-bold tracking-[0.15em] transition-colors hover:border-[#141414] hover:bg-[#141414] hover:text-[#F2F0EB]">BACK TO TOP <ArrowUp className="h-3.5 w-3.5" /></button>
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
              <button onClick={() => setIsSizeGuideOpen(true)} className={footerLinkClass}>SIZE GUIDE</button>
              <a href="mailto:hello@piercyn.com?subject=Shipping%20and%20delivery" className={footerLinkClass}>SHIPPING & DELIVERY</a>
              <a href="mailto:hello@piercyn.com?subject=Returns%20and%20exchanges" className={footerLinkClass}>RETURNS & EXCHANGES</a>
              <a href="mailto:hello@piercyn.com" className={footerLinkClass}>CONTACT US</a>
              <button onClick={goToAffiliate} className={footerLinkClass}>AFFILIATE PROGRAM</button>
            </nav></div>
          </section>
          <section>
            {groupHeader('follow', 'FOLLOW')}
            <div id="footer-mobile-follow" hidden={!openGroups.follow} className="py-2"><nav className="flex flex-col">
              <a href="https://instagram.com/piercyn" target="_blank" rel="noopener noreferrer" className={`${footerLinkClass} gap-2`}><Instagram className="h-3.5 w-3.5" /> INSTAGRAM ↗</a>
              <a href="https://tiktok.com/@piercyn" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>TIKTOK ↗</a>
              <a href="https://wa.me/2349129997137?text=Hello%20PIERCYN%2C%20I%20need%20help." target="_blank" rel="noopener noreferrer" className={`${footerLinkClass} gap-2`}><MessageCircle className="h-3.5 w-3.5" /> WHATSAPP ↗</a>
            </nav></div>
          </section>
          <section>
            {groupHeader('legal', 'LEGAL & SUPPORT')}
            <div id="footer-mobile-legal" hidden={!openGroups.legal} className="py-2"><nav className="flex flex-col">
              <a href="mailto:hello@piercyn.com?subject=Shipping%20and%20delivery" className={footerLinkClass}>SHIPPING & DELIVERY</a>
              <a href="mailto:hello@piercyn.com?subject=Returns%20and%20exchanges" className={footerLinkClass}>RETURNS & EXCHANGES</a>
              <a href="mailto:hello@piercyn.com" className={footerLinkClass}>CONTACT SUPPORT</a>
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
            <button id="footer-admin-trigger" onClick={goToAdmin} className="min-h-8 w-fit underline underline-offset-4 transition-colors hover:text-[#F2F0EB]">ADMIN</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
