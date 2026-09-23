import React from 'react';
import { Home, Compass, Search, User, ShoppingBag } from 'lucide-react';
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
  const { cartCount, setIsCartOpen, setIsSearchOpen, setIsAuthOpen, user } = useShop();

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E2DFD7] md:hidden px-4 py-2 flex items-center justify-around pb-safe text-[#111111] shadow-lg">
      {/* Home */}
      <button
        onClick={() => onSelectPage('home')}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
          activePage === 'home' ? 'text-[#111111]' : 'text-[#888680] hover:text-[#111111]'
        }`}
        aria-label="Home"
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-sans font-medium tracking-tight">Home</span>
      </button>

      {/* Shop */}
      <button
        onClick={() => onSelectPage('shop')}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
          activePage === 'shop' ? 'text-[#111111]' : 'text-[#888680] hover:text-[#111111]'
        }`}
        aria-label="Shop All"
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px] font-sans font-medium tracking-tight">Shop</span>
      </button>

      {/* Search */}
      <button
        onClick={() => setIsSearchOpen(true)}
        className="flex flex-col items-center gap-1 cursor-pointer text-[#888680] hover:text-[#111111] transition-colors"
        aria-label="Search Catalog"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-sans font-medium tracking-tight">Search</span>
      </button>

      {/* Account */}
      <button
        onClick={() => onSelectPage('account')}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
          activePage === 'account' ? 'text-[#111111]' : 'text-[#888680] hover:text-[#111111]'
        }`}
        aria-label="My Account"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-sans font-medium tracking-tight">
          {user ? user.firstName : 'Account'}
        </span>
      </button>

      {/* Cart */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="flex flex-col items-center gap-1 cursor-pointer text-[#888680] hover:text-[#111111] transition-colors relative"
        aria-label="Shopping Cart"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#111111] text-[#F5F3EE] text-[9px] font-mono font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-sans font-medium tracking-tight">Bag</span>
      </button>
    </div>
  );
};
