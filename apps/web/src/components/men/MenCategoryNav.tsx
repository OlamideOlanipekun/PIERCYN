import React from 'react';
import { MenCategory } from '../../types';

interface MenCategoryNavProps {
  activeCategory: MenCategory;
  onSelectCategory: (category: MenCategory) => void;
}

const CATEGORIES: MenCategory[] = [
  'ALL',
  'HOODIES',
  'SWEATSHIRTS',
  'T-SHIRTS',
  'POLOS',
  'JACKETS',
  'TROUSERS',
  'JEANS',
  'ACCESSORIES'
];

export const MenCategoryNav: React.FC<MenCategoryNavProps> = ({
  activeCategory,
  onSelectCategory
}) => {
  return (
    <nav 
      id="men-category-navigation"
      aria-label="Men Category Navigation"
      className="w-full border-b border-[#DAD8D1] bg-[#F2F0EB] transition-colors"
    >
      <div className="piercyn-container">
        {/* Horizontally scrollable on mobile with hidden scrollbar, horizontal on desktop */}
        <div 
          className="flex items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 overflow-x-auto no-scrollbar py-2 sm:py-3 scroll-smooth -mx-4 sm:mx-0 px-4 sm:px-0"
          tabIndex={0}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`relative min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2 text-[12px] sm:text-[13px] uppercase font-sans tracking-[0.14em] whitespace-nowrap cursor-pointer transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? 'text-[#141414] font-bold'
                    : 'text-[#6E6B65] hover:text-[#141414] font-medium opacity-80 hover:opacity-100'
                }`}
              >
                <span>{cat}</span>

                {/* Subtle active underline indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#141414] rounded-full transition-all duration-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
