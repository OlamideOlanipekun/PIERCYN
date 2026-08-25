import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Currency } from '../types';
import { Search, ShoppingBag, Menu, X, Heart, Sparkles, MapPin } from 'lucide-react';
import { PiercynMonogram, PiercynLogo } from './PiercynLogo';

interface NavbarProps {
  onNavigateSection: (sectionId: string) => void;
  activePage?: 'men' | 'women' | 'new' | 'collections' | 'lookbook' | 'home';
  onSelectPage?: (page: 'men' | 'women' | 'new' | 'collections' | 'lookbook' | 'home') => void;
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
    currency, 
    setCurrency, 
    setIsStoryOpen,
    wishlist,
    setIsWishlistOpen,
    setIsConciergeOpen,
    setIsCraftsmanshipOpen,
    setIsAuthOpen,
    user
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lagosTime, setLagosTime] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Live Lagos (WAT / UTC+1) Time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Africa/Lagos',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      setLagosTime(`${new Intl.DateTimeFormat([], options).format(now)} WAT`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleNavClick = (sectionId: string, pageKey?: 'men' | 'women' | 'new' | 'collections' | 'lookbook') => {
    setIsMobileMenuOpen(false);
    if (pageKey && onSelectPage) {
      onSelectPage(pageKey);
    }
    onNavigateSection(sectionId);
  };

  const isDarkHero = !isScrolled && (activePage === 'men' || activePage === 'women');

  return (
    <>
      <header
        id="main-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 font-sans ease-[cubic-bezier(0.16,1,0.3,1)] h-14 sm:h-16 flex items-center ${
          isScrolled
            ? 'bg-[#F2F0EB]/95 backdrop-blur-md text-[#141414] border-b border-[#DAD8D1]/80 shadow-xs'
            : isDarkHero
            ? 'bg-gradient-to-b from-black/70 via-black/30 to-transparent text-[#F2F0EB]'
            : 'bg-[#F2F0EB]/85 backdrop-blur-sm text-[#141414] border-b border-[#DAD8D1]/60'
        }`}
      >
        <div className="piercyn-container flex justify-between items-center text-[12px] sm:text-[13px] font-medium tracking-[0.08em] font-sans">
          {/* Left: PIERCYN Brand Logo */}
          <button
            id="brand-logo-btn"
            onClick={() => {
              if (onSelectPage) onSelectPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`cursor-pointer text-left hover:opacity-70 transition-opacity duration-300 min-h-[44px] flex items-center pr-4 ${
              isDarkHero ? 'text-[#F2F0EB]' : 'text-[#141414]'
            }`}
          >
            <PiercynLogo size={24} />
          </button>

          {/* Center: Desktop Navigation Links (MEN, WOMEN, NEW, COLLECTIONS, LOOKBOOK) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[12px] sm:text-[13px] font-medium tracking-[0.08em]">
            <button
              id="nav-men"
              onClick={() => handleNavClick('piercyn-men-collection-page', 'men')}
              className={`relative py-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'men'
                  ? isDarkHero
                    ? 'font-bold text-[#F2F0EB]'
                    : 'font-bold text-[#141414]'
                  : isDarkHero
                  ? 'text-[#F2F0EB]/70 hover:text-[#F2F0EB]'
                  : 'text-[#6E6B65] hover:text-[#141414]'
              }`}
            >
              <span>MEN</span>
              {activePage === 'men' && (
                <span className={`absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full ${isDarkHero ? 'bg-[#F2F0EB]' : 'bg-[#141414]'}`} />
              )}
            </button>

            <button
              id="nav-women"
              onClick={() => handleNavClick('piercyn-women-collection-page', 'women')}
              className={`relative py-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'women'
                  ? isDarkHero
                    ? 'font-bold text-[#F2F0EB]'
                    : 'font-bold text-[#141414]'
                  : isDarkHero
                  ? 'text-[#F2F0EB]/70 hover:text-[#F2F0EB]'
                  : 'text-[#6E6B65] hover:text-[#141414]'
              }`}
            >
              <span>WOMEN</span>
              {activePage === 'women' && (
                <span className={`absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full ${isDarkHero ? 'bg-[#F2F0EB]' : 'bg-[#141414]'}`} />
              )}
            </button>

            <button
              id="nav-new"
              onClick={() => handleNavClick('piercyn-new-arrivals-page', 'new')}
              className={`relative py-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'new'
                  ? isDarkHero
                    ? 'font-bold text-[#F2F0EB]'
                    : 'font-bold text-[#141414]'
                  : isDarkHero
                  ? 'text-[#F2F0EB]/70 hover:text-[#F2F0EB]'
                  : 'text-[#6E6B65] hover:text-[#141414]'
              }`}
            >
              <span>NEW</span>
              {activePage === 'new' && (
                <span className={`absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full ${isDarkHero ? 'bg-[#F2F0EB]' : 'bg-[#141414]'}`} />
              )}
            </button>

            <button
              id="nav-collections"
              onClick={() => handleNavClick('men-category-discovery', 'collections')}
              className={`relative py-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'collections'
                  ? isDarkHero
                    ? 'font-bold text-[#F2F0EB]'
                    : 'font-bold text-[#141414]'
                  : isDarkHero
                  ? 'text-[#F2F0EB]/70 hover:text-[#F2F0EB]'
                  : 'text-[#6E6B65] hover:text-[#141414]'
              }`}
            >
              <span>COLLECTIONS</span>
              {activePage === 'collections' && (
                <span className={`absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full ${isDarkHero ? 'bg-[#F2F0EB]' : 'bg-[#141414]'}`} />
              )}
            </button>

            <button
              id="nav-lookbook"
              onClick={() => handleNavClick('lookbook-section', 'lookbook')}
              className={`relative py-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'lookbook'
                  ? isDarkHero
                    ? 'font-bold text-[#F2F0EB]'
                    : 'font-bold text-[#141414]'
                  : isDarkHero
                  ? 'text-[#F2F0EB]/70 hover:text-[#F2F0EB]'
                  : 'text-[#6E6B65] hover:text-[#141414]'
              }`}
            >
              <span>LOOKBOOK</span>
              {activePage === 'lookbook' && (
                <span className={`absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full ${isDarkHero ? 'bg-[#F2F0EB]' : 'bg-[#141414]'}`} />
              )}
            </button>
          </nav>

          {/* Right: Actions - SEARCH, ACCOUNT, SAVED, BAG, MENU */}
          <div className="flex items-center gap-1 sm:gap-4 lg:gap-6 text-[12px] sm:text-[13px] font-medium tracking-[0.08em]">
            {/* Currency Selector (Desktop) */}
            <div className="relative group hidden lg:block">
              <button 
                id="currency-selector-btn"
                className={`flex items-center gap-1 uppercase hover:opacity-70 transition-opacity duration-300 cursor-pointer py-2 text-[11px] font-semibold font-sans ${
                  isDarkHero ? 'text-[#F2F0EB]' : 'text-[#141414]'
                }`}
              >
                <span>{currency}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-[#F2F0EB] text-[#141414] border border-[#DAD8D1] p-1.5 shadow-lg min-w-[84px] z-50 rounded-lg">
                {(['NGN', 'USD', 'GBP', 'EUR'] as Currency[]).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`text-left px-2.5 py-1.5 rounded-md text-[11px] tracking-[0.1em] font-sans uppercase transition-colors hover:bg-[#E8E6E1] ${
                      currency === curr ? 'font-bold bg-[#E8E6E1]' : 'opacity-70'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* SEARCH */}
            <button
              id="search-trigger-btn"
              onClick={() => setIsSearchOpen(true)}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center hover:opacity-75 transition-opacity duration-300 uppercase cursor-pointer gap-1.5 ${
                isDarkHero ? 'text-[#F2F0EB]' : 'text-[#141414]'
              }`}
              aria-label="Search Collection"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline text-[12px] font-semibold">SEARCH</span>
            </button>

            {/* ACCOUNT / ATELIER */}
            <button
              id="nav-account-btn"
              onClick={() => setIsAuthOpen(true)}
              className={`hidden lg:inline-flex items-center hover:opacity-75 transition-opacity duration-300 uppercase cursor-pointer text-[12px] font-semibold ${
                isDarkHero ? 'text-[#F2F0EB]' : 'text-[#141414]'
              }`}
            >
              {user ? `ACCOUNT (${user.firstName})` : 'ACCOUNT'}
            </button>

            {/* SAVED / WISHLIST */}
            <button
              id="wishlist-drawer-trigger-btn"
              onClick={() => setIsWishlistOpen(true)}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center hover:opacity-75 transition-opacity duration-300 uppercase cursor-pointer gap-1.5 ${
                isDarkHero ? 'text-[#F2F0EB]' : 'text-[#141414]'
              }`}
              aria-label="Saved Pieces"
            >
              <Heart className={`w-4 h-4 ${wishlist.length > 0 ? (isDarkHero ? 'fill-[#F2F0EB] text-[#F2F0EB]' : 'fill-[#141414] text-[#141414]') : ''}`} />
              <span className="hidden sm:inline text-[12px] font-semibold">SAVED</span>
              {wishlist.length > 0 && (
                <span className="font-sans text-[11px] font-semibold">({wishlist.length})</span>
              )}
            </button>

            {/* BAG */}
            <button
              id="cart-drawer-trigger-btn"
              onClick={() => setIsCartOpen(true)}
              className={`h-[44px] min-h-[44px] min-w-[44px] flex items-center justify-center transition-all duration-300 uppercase cursor-pointer px-2.5 sm:px-3.5 rounded-full shadow-xs active:scale-95 text-[11px] sm:text-[12px] font-semibold tracking-[0.08em] gap-1 sm:gap-1.5 ${
                isDarkHero
                  ? 'text-[#141414] bg-[#F2F0EB] hover:bg-white'
                  : 'text-[#F2F0EB] bg-[#141414] hover:bg-black'
              }`}
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="font-sans font-semibold">
                BAG ({cartCount})
              </span>
            </button>

            {/* MENU (Mobile & Tablet) */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              className={`md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center hover:opacity-75 transition-opacity cursor-pointer tracking-wider text-[12px] font-semibold font-sans ${
                isDarkHero ? 'text-[#F2F0EB]' : 'text-[#141414]'
              }`}
              aria-label="Open Mobile Menu"
            >
              <span className="sm:hidden tracking-[0.1em]">MENU</span>
              <Menu className="w-4 h-4 hidden sm:inline" />
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Editorial Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          id="mobile-editorial-menu"
          className="fixed inset-0 z-[100] bg-[#F2F0EB] text-[#141414] flex flex-col justify-between p-6 sm:p-10 lg:p-12 animate-in fade-in duration-500 overflow-y-auto"
        >
          {/* Top Bar: PIERCYN and Close icon × */}
          <div className="flex items-center justify-between border-b border-[#DAD8D1]/80 pb-5 pt-1">
            <PiercynLogo size={24} />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-11 h-11 rounded-full border border-[#141414]/20 hover:bg-[#E8E6E1] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Mobile Menu"
            >
              <X className="w-5 h-5 text-[#141414]" />
            </button>
          </div>

          {/* Large Editorial Menu Navigation Links */}
          <div className="flex flex-col space-y-4 sm:space-y-6 my-auto py-6 font-serif text-[8vw] sm:text-4xl italic">
            {[
              { label: 'MEN', id: 'piercyn-men-collection-page', pageKey: 'men' as const },
              { label: 'WOMEN', id: 'piercyn-women-collection-page', pageKey: 'women' as const },
              { label: 'NEW ARRIVALS', id: 'piercyn-new-arrivals-page', pageKey: 'new' as const },
              { label: '450 GSM HOODIES', id: 'men-category-navigation', pageKey: 'men' as const },
              { label: 'SAVED ARCHIVE', id: 'wishlist-drawer' },
              { label: 'COLLECTIONS', id: 'collections-hero', pageKey: 'collections' as const },
              { label: 'LOOKBOOK', id: 'lookbook-section' },
              { label: 'BOOK ATELIER FITTING', id: 'concierge-modal' },
              { label: 'ABOUT PIERCYN', id: 'story-modal' }
            ].map((link, idx) => (
              <button
                key={link.label}
                onClick={() => {
                  if (link.id === 'story-modal') {
                    setIsMobileMenuOpen(false);
                    setIsStoryOpen(true);
                  } else if (link.id === 'wishlist-drawer') {
                    setIsMobileMenuOpen(false);
                    setIsWishlistOpen(true);
                  } else if (link.id === 'concierge-modal') {
                    setIsMobileMenuOpen(false);
                    setIsConciergeOpen(true);
                  } else {
                    handleNavClick(link.id, link.pageKey);
                  }
                }}
                className="text-left uppercase hover:translate-x-2 transition-transform duration-300 text-[#141414] flex items-center justify-between group py-1 min-h-[44px]"
              >
                <span className="tracking-tight">{link.label}</span>
                <span className="text-[12px] font-mono font-normal not-italic tracking-[0.25em] text-[#8C8A84] group-hover:text-[#141414]">
                  0{idx + 1}
                </span>
              </button>
            ))}
          </div>

          {/* Secondary Links & Footer Controls */}
          <div className="border-t border-[#DAD8D1]/80 pt-6 flex flex-col gap-5 text-[11px] tracking-[0.22em] uppercase font-sans">
            {/* Secondary Action Row: SEARCH, ACCOUNT, HELP */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                className="hover:underline py-2 min-h-[44px] flex items-center font-semibold"
              >
                SEARCH
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAuthOpen(true);
                }}
                className="hover:underline py-2 min-h-[44px] flex items-center font-semibold"
              >
                {user ? `ACCOUNT (${user.firstName})` : 'ACCOUNT'}
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  document.getElementById('main-footer')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:underline py-2 min-h-[44px] flex items-center font-semibold"
              >
                HELP
              </button>
            </div>

            {/* Currency and Location */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#DAD8D1]/40">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8C8A84] font-mono">CURRENCY:</span>
                {(['NGN', 'USD', 'GBP', 'EUR'] as Currency[]).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`px-3 py-1 rounded-full border text-[10px] font-mono transition-colors min-h-[32px] ${
                      currency === curr ? 'border-[#141414] bg-[#141414] text-[#F2F0EB] font-bold' : 'border-[#141414]/30 text-[#141414]/70'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-mono text-[#8C8A84]">
                LAGOS • {lagosTime}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



