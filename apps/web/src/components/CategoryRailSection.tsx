import React from 'react';
import { ActivePageView } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface CategoryRailSectionProps {
  onSelectPage?: (page: ActivePageView) => void;
  onNavigateSection?: (sectionId: string) => void;
}

interface CategoryPill {
  label: string;
  sublabel: string;
  pageKey?: ActivePageView;
  sectionId?: string;
  badge?: string;
}

const CATEGORIES: CategoryPill[] = [
  { label: 'MEN', sublabel: 'Streetwear & Essentials', pageKey: 'men', sectionId: 'piercyn-men-collection-page' },
  { label: 'WOMEN', sublabel: 'Contemporary & Tops', pageKey: 'women', sectionId: 'piercyn-women-collection-page' },
  { label: 'NEW IN', sublabel: 'Latest Lagos Drops', pageKey: 'new', sectionId: 'piercyn-new-arrivals-page' },
  { label: 'ACCESSORIES', sublabel: 'Coming Soon', pageKey: 'accessories', sectionId: 'accessories-page', badge: 'SOON' },
  { label: 'COLLECTIONS', sublabel: 'Curated Lookbooks', pageKey: 'collections', sectionId: 'collections-hero' },
];

export const CategoryRailSection: React.FC<CategoryRailSectionProps> = ({
  onSelectPage,
  onNavigateSection,
}) => {
  const handleSelect = (cat: CategoryPill) => {
    if (cat.pageKey && onSelectPage) {
      onSelectPage(cat.pageKey);
    }
    if (cat.sectionId && onNavigateSection) {
      onNavigateSection(cat.sectionId);
    }
  };

  return (
    <section
      id="category-rail-section"
      className="w-full bg-[#F2F0EB] text-[#141414] py-5 sm:py-7 border-b border-[#DAD8D1]/70"
    >
      <div className="piercyn-container">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleSelect(cat)}
              className="group flex-1 min-w-[155px] sm:min-w-[190px] p-4 sm:p-5 rounded-2xl bg-[#E8E4DA]/70 hover:bg-[#141414] text-[#141414] hover:text-[#F2F0EB] border border-[#DAD8D1] hover:border-[#141414] transition-all duration-300 text-left cursor-pointer flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-xs active:scale-[0.98] shrink-0"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <span className="font-sans text-[13px] sm:text-[15px] font-bold tracking-[0.06em] uppercase">
                    {cat.label}
                  </span>
                  {cat.badge && (
                    <span className="text-[8px] font-sans font-bold px-1.5 py-0.5 rounded-full bg-[#141414] text-[#F2F0EB] group-hover:bg-[#A48B71] group-hover:text-[#141414] transition-colors">
                      {cat.badge}
                    </span>
                  )}
                </div>
                <ArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 shrink-0" />
              </div>
              <span className="font-sans text-[11px] sm:text-[12px] opacity-70 group-hover:opacity-90 font-medium transition-opacity">
                {cat.sublabel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
