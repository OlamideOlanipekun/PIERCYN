import React from 'react';
import { Home, Grid3X3, Search, ShoppingBag } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { ActivePageView } from '../types';

interface MobileBottomNavProps {
  activePage: ActivePageView;
  onSelectPage: (page: ActivePageView) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePage,
  onSelectPage,
}) => {
  const { cartCount, setIsCartOpen, setIsSearchOpen } = useShop();

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E2DFD7] md:hidden px-2 py-2 flex items-center justify-around pb-safe text-[#111111] shadow-lg">
      
      {/* Home */}
      <button
        id="mobile-nav-home"
        onClick={() => onSelectPage('home')}
        className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors min-w-[56px] py-1 ${
          activePage === 'home' ? 'text-[#111111]' : 'text-[#888680] hover:text-[#111111]'
        }`}
        aria-label="Home"
      >
        <Home className={`w-5 h-5 ${activePage === 'home' ? 'fill-[#111111]' : ''}`} />
        <span className="text-[9px] font-sans font-semibold tracking-wider uppercase">Home</span>
      </button>

      {/* Shop */}
      <button
        id="mobile-nav-shop"
        onClick={() => onSelectPage('shop')}
        className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors min-w-[56px] py-1 ${
          activePage === 'shop' || activePage === 'new' || activePage === 'men'
            ? 'text-[#111111]'
            : 'text-[#888680] hover:text-[#111111]'
        }`}
        aria-label="Shop All"
      >
        <Grid3X3 className="w-5 h-5" />
        <span className="text-[9px] font-sans font-semibold tracking-wider uppercase">Shop</span>
      </button>

      {/* Search */}
      <button
        id="mobile-nav-search"
        onClick={() => setIsSearchOpen(true)}
        className="flex flex-col items-center gap-0.5 cursor-pointer text-[#888680] hover:text-[#111111] transition-colors min-w-[56px] py-1"
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
        <span className="text-[9px] font-sans font-semibold tracking-wider uppercase">Search</span>
      </button>

      {/* Cart */}
      <button
        id="mobile-nav-cart"
        onClick={() => setIsCartOpen(true)}
        className="flex flex-col items-center gap-0.5 cursor-pointer text-[#888680] hover:text-[#111111] transition-colors relative min-w-[56px] py-1"
        aria-label="Shopping Bag"
      >
        <div className="relative">
          <ShoppingBag className={`w-5 h-5 ${cartCount > 0 ? 'text-[#111111]' : ''}`} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#111111] text-[#F5F3EE] text-[9px] font-mono font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[9px] font-sans font-semibold tracking-wider uppercase">Bag</span>
      </button>
    </div>
  );
};
