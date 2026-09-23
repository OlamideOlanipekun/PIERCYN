import React from 'react';
import { ActivePageView } from '../types';
import { Sparkles, ArrowRight } from 'lucide-react';

interface QuickCategoryNavProps {
  onSelectPage: (page: ActivePageView) => void;
  onSelectCategoryFilter?: (category: string) => void;
}

interface QuickCategoryItem {
  id: string;
  name: string;
  page?: ActivePageView;
  filter?: string;
  isBadge?: boolean;
}

const CATEGORY_ITEMS: QuickCategoryItem[] = [
  { id: 'new-in', name: 'NEW IN', page: 'new', isBadge: true },
  { id: 'men', name: 'MEN', page: 'men' },
  { id: 'women', name: 'WOMEN', page: 'women' },
  { id: 't-shirts', name: 'T-SHIRTS', filter: 't-shirts' },
  { id: 'hoodies', name: 'HOODIES', filter: 'hoodies' },
  { id: 'trousers', name: 'TROUSERS', filter: 'trousers' },
  { id: 'polos', name: 'POLOS', filter: 'polos' },
  { id: 'jackets', name: 'JACKETS', filter: 'jackets' },
  { id: 'accessories', name: 'ACCESSORIES', page: 'accessories' },
];

export const QuickCategoryNav: React.FC<QuickCategoryNavProps> = ({
  onSelectPage,
  onSelectCategoryFilter,
}) => {
  const handleClick = (item: QuickCategoryItem) => {
    if (item.page) {
      onSelectPage(item.page);
    } else if (item.filter) {
      if (onSelectCategoryFilter) {
        onSelectCategoryFilter(item.filter);
      }
      onSelectPage('shop');
    }
  };

  return (
    <nav
      id="quick-category-nav"
      aria-label="Quick Category Navigation"
      className="w-full bg-[#F2F0EB] text-[#141414] py-4 border-b border-[#DAD8D1]/70 sticky top-[56px] sm:top-[60px] z-30 backdrop-blur-md bg-[#F2F0EB]/95"
    >
      <div className="piercyn-container">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
          <span className="hidden lg:inline-block text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7771] pr-2 shrink-0">
            BROWSE:
          </span>

          {CATEGORY_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className="h-9 px-4 sm:px-5 rounded-full border border-[#DAD8D1] bg-[#EAE5D9]/70 hover:bg-[#141414] hover:text-[#F2F0EB] hover:border-[#141414] text-[11px] sm:text-[12px] font-sans font-semibold tracking-[0.08em] uppercase transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 active:scale-95 flex items-center gap-1.5 shadow-2xs"
            >
              <span>{item.name}</span>
              {item.isBadge && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#A48B71]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
