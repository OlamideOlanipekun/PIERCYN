import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Currency, ActivePageView } from '../types';
import { Search, ShoppingBag, Menu, X, Heart, Sparkles, MapPin } from 'lucide-react';
import { PiercynMonogram, PiercynLogo } from './PiercynLogo';


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

  const handleNavClick = (sectionId: string, pageKey?: ActivePageView) => {
    setIsMobileMenuOpen(false);
    if (pageKey && onSelectPage) {
      onSelectPage(pageKey);
    }
    onNavigateSection(sectionId);
  };

  const isDarkHero = !isScrolled && (activePage === 'home' || activePage === 'men' || activePage === 'women');

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
        <div className="piercyn-container px-2.5 sm:px-6 flex justify-between items-center text-[12px] sm:text-[13px] font-medium tracking-[0.08em] font-sans h-full w-full">
          {/* Left: PIERCYN Brand Logo */}
          <button
            id="brand-logo-btn"
            onClick={() => {
              if (onSelectPage) onSelectPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`cursor-pointer text-left hover:opacity-70 transition-opacity duration-300 min-h-[44px] flex items-center justify-start shrink-0 pr-1 ${
              isDarkHero ? 'text-[#F2F0EB]' : 'text-[#141414]'
            }`}
            aria-label="Piercyn Home"
          >
            <PiercynLogo size={22} />
          </button>

            {/* Center: Desktop Navigation Links (SHOP, MEN, WOMEN, NEW, COLLECTIONS, LOOKBOOK) */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-[12px] sm:text-[13px] font-medium tracking-[0.08em]">
            <button
              id="nav-shop"
              onClick={() => handleNavClick('products-section', 'shop')}
              className={`relative py-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'shop'
                  ? 'font-bold text-[#F2F0EB]'
                  : 'text-[#F2F0EB]/60 hover:text-[#F2F0EB]'
              }`}
            >
              <span>SHOP</span>
              {activePage === 'shop' && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-[#F2F0EB]" />
              )}
            </button>

            <button
              id="nav-men"
              onClick={() => handleNavClick('piercyn-men-collection-page', 'men')}
              className={`relative py-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'men'
                  ? 'font-bold text-[#F2F0EB]'
                  : 'text-[#F2F0EB]/60 hover:text-[#F2F0EB]'
              }`}
            >
              <span>MEN</span>
              {activePage === 'men' && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-[#F2F0EB]" />
              )}
            </button>

            <button
              id="nav-women"
              onClick={() => handleNavClick('piercyn-women-collection-page', 'women')}
              className={`relative py-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'women'
                  ? 'font-bold text-[#F2F0EB]'
                  : 'text-[#F2F0EB]/60 hover:text-[#F2F0EB]'
              }`}
            >
              <span>WOMEN</span>
              {activePage === 'women' && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-[#F2F0EB]" />
              )}
            </button>

            <button
              id="nav-new"
              onClick={() => handleNavClick('piercyn-new-arrivals-page', 'new')}
              className={`relative py-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'new'
                  ? 'font-bold text-[#F2F0EB]'
                  : 'text-[#F2F0EB]/60 hover:text-[#F2F0EB]'
              }`}
            >
              <span>NEW ARRIVALS</span>
              {activePage === 'new' && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-[#F2F0EB]" />
              )}
            </button>

            <button
              id="nav-accessories"
              onClick={() => handleNavClick('accessories-section', 'accessories')}
              className={`relative py-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'accessories'
                  ? 'font-bold text-[#F2F0EB]'
                  : 'text-[#F2F0EB]/60 hover:text-[#F2F0EB]'
              }`}
            >
              <span>ACCESSORIES</span>
              {activePage === 'accessories' && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-[#F2F0EB]" />
              )}
            </button>

            <button
              id="nav-collections"
              onClick={() => handleNavClick('men-category-discovery', 'collections')}
              className={`relative py-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer uppercase font-sans ${
                activePage === 'collections'
                  ? 'font-bold text-[#F2F0EB]'
                  : 'text-[#F2F0EB]/60 hover:text-[#F2F0EB]'
              }`}
            >
              <span>COLLECTIONS</span>
              {activePage === 'collections' && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-[#F2F0EB]" />
              )}
            </button>
          </nav>

          {/* Right: Actions in Order (SEARCH -> WISHLIST -> BAG -> MENU) */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 text-[12px] sm:text-[13px] font-medium tracking-[0.08em] shrink-0">
            {/* Currency Selector (Desktop) */}
            <div className="relative group hidden lg:block">
              <button 
                id="currency-selector-btn"
                className={`flex items-center gap-1 uppercase hover:opacity-70 transition-opacity duration-300 cursor-pointer py-2 text-[11px] font-semibold font-sans text-[#F2F0EB]`}
              >
                <span>{currency}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-[#111111] text-[#F2F0EB] border border-[#2A2A2A] p-1.5 shadow-lg min-w-[84px] z-50 rounded-lg">
                {(['NGN', 'USD', 'GBP', 'EUR'] as Currency[]).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`text-left px-2.5 py-1.5 rounded-md text-[11px] tracking-[0.1em] font-sans uppercase transition-colors hover:bg-[#222222] ${
                      currency === curr ? 'font-bold bg-[#222222]' : 'opacity-60'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. SEARCH ICON */}
            <button
              id="search-trigger-btn"
              onClick={() => setIsSearchOpen(true)}
              className={`w-9 h-9 sm:w-10 sm:h-10 min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] flex items-center justify-center hover:opacity-75 transition-opacity duration-300 cursor-pointer ${
                isDarkHero ? 'text-[#F2F0EB]' : 'text-[#141414]'
              }`}
              aria-label="Search Collection"
            >
              <Search className="w-5 h-5 stroke-[1.75]" />
            </button>

            {/* ACCOUNT (Desktop) */}
            <button
              id="nav-account-btn"
              onClick={() => {
                if (onSelectPage) onSelectPage('account');
                else setIsAuthOpen(true);
              }}
              className={`hidden lg:inline-flex items-center hover:opacity-75 transition-opacity duration-300 uppercase cursor-pointer text-[12px] font-semibold ${
                isDarkHero ? 'text-[#F2F0EB]' : 'text-[#141414]'
              }`}
            >
              {user ? `ACCOUNT (${user.firstName})` : 'ACCOUNT'}
            </button>

            {/* 2. WISHLIST ICON (Desktop & Tablet) */}
            <button
              id="wishlist-drawer-trigger-btn"
              onClick={() => setIsWishlistOpen(true)}
              className={`hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] relative items-center justify-center hover:opacity-75 transition-opacity duration-300 cursor-pointer ${
                isDarkHero ? 'text-[#F2F0EB]' : 'text-[#141414]'
              }`}
              aria-label="Saved Pieces"
            >
              <Heart className={`w-5 h-5 stroke-[1.75] ${wishlist.length > 0 ? (isDarkHero ? 'fill-[#F2F0EB] text-[#F2F0EB]' : 'fill-[#141414] text-[#141414]') : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#141414] text-[#F2F0EB] text-[9px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* 3. BAG BUTTON */}
            <button
              id="cart-drawer-trigger-btn"
              onClick={() => setIsCartOpen(true)}
              className={`h-[38px] sm:h-[42px] min-h-[38px] sm:min-h-[42px] flex items-center justify-center transition-all duration-300 uppercase cursor-pointer px-3 sm:px-5 rounded-full shadow-xs active:scale-95 text-[11px] sm:text-[12px] font-semibold tracking-[0.08em] gap-1.5 ${
                isDarkHero
                  ? 'text-[#141414] bg-[#F2F0EB] hover:bg-white'
                  : 'text-[#F2F0EB] bg-[#141414] hover:bg-black'
              }`}
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.75]" />
              <span className="font-sans font-semibold">
                BAG ({cartCount})
              </span>
            </button>

            {/* 4. MENU ICON */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              className={`md:hidden w-9 h-9 sm:w-10 sm:h-10 min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] flex items-center justify-center hover:opacity-75 transition-opacity cursor-pointer active:scale-95 ${
                isDarkHero ? 'text-[#F2F0EB]' : 'text-[#141414]'
              }`}
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5 stroke-[1.75]" />
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Editorial Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          id="mobile-editorial-menu"
          className="fixed inset-0 z-[100] bg-[#0A0A0A] text-[#F2F0EB] flex flex-col justify-between p-6 sm:p-10 lg:p-12 animate-in fade-in duration-300 overflow-y-auto"
        >
          {/* Top Bar: PIERCYN and Close icon × */}
          <div className="flex items-center justify-between border-b border-[#282828]/80 pb-5 pt-1">
            <PiercynLogo size={24} />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-11 h-11 rounded-full border border-[#F2F0EB]/20 hover:bg-[#1A1A1A] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Mobile Menu"
            >
              <X className="w-5 h-5 text-[#F2F0EB]" />
            </button>
          </div>

          {/* Large Editorial Menu Navigation Links */}
          <div className="flex flex-col space-y-3 sm:space-y-5 my-auto py-6 font-serif text-[6.8vw] sm:text-3xl lg:text-4xl italic">
            {[
              { label: 'NEW IN', id: 'piercyn-new-arrivals-page', pageKey: 'new' as const, badge: 'HOT' },
              { label: 'SHOP ALL', id: 'products-section', pageKey: 'shop' as const },
              { label: 'MEN', id: 'piercyn-men-collection-page', pageKey: 'men' as const },
              { label: 'WOMEN', id: 'piercyn-women-collection-page', pageKey: 'women' as const },
              { label: 'ACCESSORIES', id: 'accessories-page', pageKey: 'accessories' as const, badge: 'SOON' },
              { label: 'COLLECTIONS', id: 'collections-hero', pageKey: 'collections' as const },
              { label: 'LOOKBOOK', id: 'lookbook-section' },
              { label: 'SAVED PIECES', id: 'wishlist-drawer' },
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
                  } else {
                    handleNavClick(link.id, link.pageKey);
                  }
                }}
                className="text-left uppercase hover:translate-x-2 transition-transform duration-300 text-[#F2F0EB] flex items-center justify-between group py-1 min-h-[44px]"
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

          {/* Secondary Links & Footer Controls */}
          <div className="border-t border-[#282828]/80 pt-6 flex flex-col gap-5 text-[11px] tracking-[0.22em] uppercase font-sans">
            {/* Secondary Action Row: SEARCH, ACCOUNT, HELP */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                className="hover:underline py-2 min-h-[44px] flex items-center font-semibold text-[#F2F0EB]"
              >
                SEARCH
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onSelectPage) onSelectPage('account');
                  else setIsAuthOpen(true);
                }}
                className="hover:underline py-2 min-h-[44px] flex items-center font-semibold text-[#F2F0EB]"
              >
                {user ? `ACCOUNT (${user.firstName})` : 'ACCOUNT'}
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  document.getElementById('main-footer')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:underline py-2 min-h-[44px] flex items-center font-semibold text-[#F2F0EB]"
              >
                HELP
              </button>
            </div>

            {/* Currency and Location */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#282828]/40">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#F2F0EB]/40 font-mono">CURRENCY:</span>
                {(['NGN', 'USD', 'GBP', 'EUR'] as Currency[]).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`px-3 py-1 rounded-full border text-[10px] font-mono transition-colors min-h-[32px] ${
                      currency === curr ? 'border-[#F2F0EB] bg-[#F2F0EB] text-[#0A0A0A] font-bold' : 'border-[#F2F0EB]/20 text-[#F2F0EB]/50'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-mono text-[#F2F0EB]/40">
                LAGOS • {lagosTime}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



