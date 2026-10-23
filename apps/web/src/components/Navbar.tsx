import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { ActivePageView } from '../types';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import { PiercynLogo } from './PiercynLogo';


interface NavbarProps {
  onNavigateSection: (sectionId: string) => void;
  activePage?: ActivePageView;
  onSelectPage?: (page: ActivePageView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onNavigateSection,
  activePage = 'home',
  onSelectPage
}) => {
  const { 
    cartCount, 
    setIsCartOpen, 
    setIsSearchOpen,
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (pageKey?: ActivePageView) => {
    setIsMobileMenuOpen(false);
    if (pageKey && onSelectPage) {
      onSelectPage(pageKey);
    }
  };

  const isDarkHero = !isScrolled && (activePage === 'home' || activePage === 'men');

  return (
    <>
      <header
        id="main-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 font-sans ease-[cubic-bezier(0.16,1,0.3,1)] h-[56px] sm:h-[60px] flex items-center ${
          isScrolled
            ? 'bg-[#0A0A0A]/95 backdrop-blur-md text-[#F2F0EB] border-b border-[#282828]/80 shadow-xs'
            : isDarkHero
            ? 'bg-gradient-to-b from-black/70 via-black/30 to-transparent text-[#F2F0EB]'
            : 'bg-[#0A0A0A]/90 backdrop-blur-sm text-[#F2F0EB] border-b border-[#282828]/60'
        }`}
      >
        <div className="piercyn-container px-2.5 sm:px-6 flex justify-between items-center h-full w-full">

          {/* Left: Mobile Menu Button */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden w-9 h-9 min-h-[36px] min-w-[36px] flex items-center justify-center text-[#F2F0EB] hover:opacity-75 transition-opacity cursor-pointer active:scale-95"
            aria-label="Open Menu"
          >
            <Menu className="w-5 h-5 stroke-[1.75]" />
          </button>

          {/* Center-Left (Mobile) / Left (Desktop): PIERCYN Logo */}
          <button
            id="brand-logo-btn"
            onClick={() => {
              if (onSelectPage) onSelectPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="cursor-pointer text-[#F2F0EB] hover:opacity-75 transition-opacity duration-300 min-h-[44px] flex items-center justify-center md:justify-start shrink-0"
            aria-label="PIERCYN Home"
          >
            <PiercynLogo size={22} />
          </button>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[12px] font-medium tracking-[0.1em] absolute left-1/2 -translate-x-1/2">
            <button
              id="nav-shop"
              onClick={() => handleNavClick('shop')}
              className={`relative py-2 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'shop'
                  ? 'font-bold text-[#F2F0EB]'
                  : 'text-[#F2F0EB]/65 hover:text-[#F2F0EB] hover:opacity-100'
              }`}
            >
              <span>SHOP</span>
              {activePage === 'shop' && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-[#F2F0EB]" />
              )}
            </button>

            <button
              id="nav-new"
              onClick={() => handleNavClick('new')}
              className={`relative py-2 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'new'
                  ? 'font-bold text-[#F2F0EB]'
                  : 'text-[#F2F0EB]/65 hover:text-[#F2F0EB] hover:opacity-100'
              }`}
            >
              <span>NEW ARRIVALS</span>
              {activePage === 'new' && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-[#F2F0EB]" />
              )}
            </button>

            <button
              id="nav-about"
              onClick={() => handleNavClick('about')}
              className={`relative py-2 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'about'
                  ? 'font-bold text-[#F2F0EB]'
                  : 'text-[#F2F0EB]/65 hover:text-[#F2F0EB] hover:opacity-100'
              }`}
            >
              <span>ABOUT</span>
              {activePage === 'about' && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-[#F2F0EB]" />
              )}
            </button>
          </nav>

          {/* Right: Search + Cart */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* SEARCH ICON */}
            <button
              id="search-trigger-btn"
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] flex items-center justify-center text-[#F2F0EB] hover:opacity-75 transition-opacity duration-300 cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5 stroke-[1.75]" />
            </button>

            {/* BAG BUTTON */}
            <button
              id="cart-drawer-trigger-btn"
              onClick={() => setIsCartOpen(true)}
              className="h-[38px] sm:h-[42px] min-h-[38px] sm:min-h-[42px] flex items-center justify-center transition-all duration-300 uppercase cursor-pointer px-3.5 sm:px-5 rounded-full shadow-xs active:scale-95 text-[11px] sm:text-[12px] font-semibold tracking-[0.08em] gap-1.5 text-[#141414] bg-[#F2F0EB] hover:bg-white"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.75]" />
              <span className="font-sans font-semibold">
                BAG ({cartCount})
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          id="mobile-menu"
          className="fixed inset-0 z-[100] bg-[#0A0A0A] text-[#F2F0EB] flex flex-col justify-between p-6 sm:p-10 animate-in fade-in duration-300 overflow-y-auto"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-[#282828]/80 pb-5 pt-1">
            <PiercynLogo size={24} />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-11 h-11 rounded-full border border-[#F2F0EB]/20 hover:bg-[#1A1A1A] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5 text-[#F2F0EB]" />
            </button>
          </div>

          {/* Main Navigation Links */}
          <div className="flex flex-col space-y-1 my-auto py-6 font-serif text-[6.8vw] sm:text-3xl lg:text-4xl italic">
            {[
              { label: 'SHOP', pageKey: 'shop' as const },
              { label: 'NEW ARRIVALS', pageKey: 'new' as const, badge: 'NEW' },
              { label: 'MEN', pageKey: 'men' as const },
              { label: 'ABOUT', pageKey: 'about' as const },
            ].map((link, idx) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.pageKey)}
                className="text-left uppercase hover:translate-x-2 transition-transform duration-300 text-[#F2F0EB] flex items-center justify-between group py-2 min-h-[52px]"
              >
                <span className="tracking-tight flex items-center gap-2.5">
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="not-italic text-[9px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#F2F0EB] text-[#0A0A0A] tracking-widest">
                      {link.badge}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-mono font-normal not-italic tracking-[0.25em] text-[#F2F0EB]/30 group-hover:text-[#F2F0EB]">
                  0{idx + 1}
                </span>
              </button>
            ))}
          </div>

          {/* Bottom: Search + Contact */}
          <div className="border-t border-[#282828]/80 pt-6 flex items-center justify-between gap-4 text-[11px] tracking-[0.22em] uppercase font-sans">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsSearchOpen(true);
              }}
              className="hover:underline py-2 min-h-[44px] flex items-center font-semibold text-[#F2F0EB]"
            >
              SEARCH
            </button>

            <a
              href="https://wa.me/2348076431059?text=Hello%20PIERCYN%2C%20I%20need%20help."
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline py-2 min-h-[44px] flex items-center font-semibold text-[#F2F0EB]"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              WHATSAPP
            </a>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                document.getElementById('main-footer')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:underline py-2 min-h-[44px] flex items-center font-semibold text-[#F2F0EB]"
            >
              CONTACT
            </button>
          </div>
        </div>
      )}
    </>
  );
};
