import React from 'react';
import { WomenCategory } from '../../types';

interface WomenCategoryNavProps {
  selectedCategory: WomenCategory;
  onSelectCategory: (category: WomenCategory) => void;
  categoryCounts: Record<WomenCategory, number>;
}

const CATEGORIES: WomenCategory[] = [
  'ALL',
  'HOODIES & FLEECE',
  'CROPPED & TOPS',
  'TEES',
  'DRESSES & SETS',
  'TROUSERS & SKIRTS',
  'OUTERWEAR',
  'ACCESSORIES'
];

export const WomenCategoryNav: React.FC<WomenCategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts
}) => {
  return (
    <nav 
      id="women-category-nav" 
      aria-label="Women Categories"
      className="w-full bg-[#F2F0EB] border-b border-[#E2DDD3] sticky top-16 sm:top-20 z-30 transition-all shadow-xs"
    >
      <div className="piercyn-container">
        {/* Horizontal scroll on mobile with hidden scrollbar, clean flex layout on desktop */}
        <div className="flex items-center overflow-x-auto no-scrollbar py-2.5 sm:py-3.5 gap-1.5 sm:gap-2 md:gap-3 scroll-smooth">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            const count = categoryCounts[category] || 0;

            return (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className={`group shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-sans uppercase tracking-[0.14em] font-medium transition-all duration-200 cursor-pointer min-h-[44px] ${
                  isSelected
                    ? 'bg-[#141414] text-[#F2F0EB] shadow-xs'
                    : 'bg-transparent text-[#706E6B] hover:text-[#141414] hover:bg-[#EAE5D9]'
                }`}
                aria-pressed={isSelected}
              >
                <span>{category}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-mono font-normal transition-colors ${
                      isSelected ? 'text-[#D8D4CA]' : 'text-[#8C887B] group-hover:text-[#141414]'
                    }`}
                  >
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
