import React, { useState } from 'react';
import { MenCategory, SortOption } from '../../types';
import { SlidersHorizontal, ChevronDown, Check, X, ArrowUpDown } from 'lucide-react';

export interface FilterState {
  category: MenCategory;
  sizes: string[];
  colors: string[];
  priceRange: 'ALL' | 'UNDER_40K' | '40K_60K' | 'OVER_60K';
  inStockOnly: boolean;
}

interface MenFilterSortBarProps {
  totalCount: number;
  activeCategory: MenCategory;
  sortBy: SortOption;
  filters: FilterState;
  onSelectCategory: (category: MenCategory) => void;
  onSortChange: (sort: SortOption) => void;
  onFiltersChange: (newFilters: FilterState) => void;
  onClearFilters: () => void;
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const AVAILABLE_COLORS = [
  { name: 'Charcoal / Black', hex: '#232323' },
  { name: 'Raw Bone / Ivory', hex: '#E8E4DA' },
  { name: 'Earth Ochre / Camel', hex: '#8C6239' },
  { name: 'Concrete Grey', hex: '#8C8C88' },
  { name: 'Indigo Blue', hex: '#2B394A' },
  { name: 'Sun-Dusted Olive', hex: '#5A5F4B' }
];

const SORT_OPTIONS: SortOption[] = [
  'FEATURED',
  'NEWEST',
  'PRICE — LOW TO HIGH',
  'PRICE — HIGH TO LOW',
  'BEST SELLING'
];

export const MenFilterSortBar: React.FC<MenFilterSortBarProps> = ({
  totalCount,
  activeCategory,
  sortBy,
  filters,
  onSelectCategory,
  onSortChange,
  onFiltersChange,
  onClearFilters
}) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false);
  const [isDesktopSortOpen, setIsDesktopSortOpen] = useState(false);

  // Temporary state inside mobile bottom sheet
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);

  const openMobileFilter = () => {
    setTempFilters(filters);
    setIsMobileFilterOpen(true);
  };

  const handleApplyMobileFilters = () => {
    onFiltersChange(tempFilters);
    onSelectCategory(tempFilters.category);
    setIsMobileFilterOpen(false);
  };

  const handleToggleSize = (size: string) => {
    setTempFilters((prev) => {
      const exists = prev.sizes.includes(size);
      return {
        ...prev,
        sizes: exists ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size]
      };
    });
  };

  const handleToggleColor = (colorName: string) => {
    setTempFilters((prev) => {
      const exists = prev.colors.includes(colorName);
      return {
        ...prev,
        colors: exists ? prev.colors.filter((c) => c !== colorName) : [...prev.colors, colorName]
      };
    });
  };

  const activeFilterCount = 
    (filters.category !== 'ALL' ? 1 : 0) +
    filters.sizes.length +
    filters.colors.length +
    (filters.priceRange !== 'ALL' ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  return (
    <>
      <div 
        id="men-filter-sort-bar"
        className="sticky top-14 sm:top-16 z-30 w-full bg-[#F2F0EB]/95 backdrop-blur-md border-b border-[#DAD8D1]/80 py-3 transition-all"
      >
        <div className="piercyn-container">
          
          {/* Desktop Filter & Sort Bar (One Horizontal Baseline) */}
          <div className="hidden md:flex items-center justify-between font-sans text-[12px] tracking-[0.1em] uppercase">
            
            {/* Left: Filter Toggle & Quick Criteria */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsDesktopFilterOpen(!isDesktopFilterOpen)}
                className="min-h-[44px] flex items-center gap-2 font-semibold text-[#141414] hover:opacity-70 transition-opacity cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>FILTER</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#141414] text-[#F2F0EB] text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isDesktopFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Quick Filter Info Pills */}
              <div className="flex items-center gap-3 text-[11px] text-[#6E6B65]">
                {activeCategory !== 'ALL' && (
                  <span className="bg-[#E5DFD1] text-[#141414] px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
                    CATEGORY: {activeCategory}
                    <button 
                      onClick={() => onSelectCategory('ALL')} 
                      className="cursor-pointer hover:text-black ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.sizes.length > 0 && (
                  <span className="bg-[#E5DFD1] text-[#141414] px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
                    SIZE: {filters.sizes.join(', ')}
                    <button 
                      onClick={() => onFiltersChange({ ...filters, sizes: [] })} 
                      className="cursor-pointer hover:text-black ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.priceRange !== 'ALL' && (
                  <span className="bg-[#E5DFD1] text-[#141414] px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
                    PRICE: {filters.priceRange.replace('_', ' ')}
                    <button 
                      onClick={() => onFiltersChange({ ...filters, priceRange: 'ALL' })} 
                      className="cursor-pointer hover:text-black ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Right: Product Count & Sort Dropdown */}
            <div className="flex items-center gap-6">
              {/* Subtle Product Count */}
              <span className="text-[#6E6B65] text-[11px] font-sans font-medium tracking-[0.14em]">
                {totalCount} {totalCount === 1 ? 'PIECE' : 'PIECES'}
              </span>

              {/* Sort Popover Trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsDesktopSortOpen(!isDesktopSortOpen)}
                  className="min-h-[44px] flex items-center gap-2 font-semibold text-[#141414] hover:opacity-70 transition-opacity cursor-pointer"
                >
                  <span className="text-[#6E6B65] font-normal">SORT:</span>
                  <span>{sortBy}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isDesktopSortOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Desktop Sort Dropdown Menu */}
                {isDesktopSortOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#F2F0EB] border border-[#DAD8D1] rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          onSortChange(option);
                          setIsDesktopSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-[11px] tracking-[0.12em] font-sans uppercase flex items-center justify-between transition-colors ${
                          sortBy === option
                            ? 'bg-[#141414] text-[#F2F0EB] font-bold'
                            : 'hover:bg-[#E5DFD1] text-[#141414]'
                        }`}
                      >
                        <span>{option}</span>
                        {sortBy === option && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Mobile Filter & Sort Bar (Two Equal Width Controls 48–52px) */}
          <div className="flex md:hidden items-center justify-between gap-3">
            
            {/* Mobile Filter Button */}
            <button
              onClick={openMobileFilter}
              className="flex-1 h-12 min-h-[48px] px-4 rounded-full border border-[#141414] bg-transparent text-[#141414] text-[12px] uppercase font-sans font-semibold tracking-[0.14em] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
              <span>FILTER</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#141414] text-[#F2F0EB] text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Mobile Sort Button */}
            <button
              onClick={() => setIsMobileSortOpen(true)}
              className="flex-1 h-12 min-h-[48px] px-4 rounded-full border border-[#141414] bg-transparent text-[#141414] text-[12px] uppercase font-sans font-semibold tracking-[0.14em] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all truncate"
            >
              <ArrowUpDown className="w-4 h-4 shrink-0" />
              <span className="truncate">{sortBy.replace('PRICE — ', '')}</span>
            </button>

          </div>

          {/* Mobile Subtle Product Count Bar */}
          <div className="flex md:hidden items-center justify-between pt-2 px-1 text-[10.5px] font-sans uppercase tracking-[0.14em] text-[#6E6B65]">
            <span>CATEGORY: <strong className="text-[#141414]">{activeCategory}</strong></span>
            <span>{totalCount} {totalCount === 1 ? 'PIECE' : 'PIECES'}</span>
          </div>

        </div>

        {/* Desktop Expandable Filter Drawer Panel */}
        {isDesktopFilterOpen && (
          <div className="hidden md:block border-t border-[#DAD8D1] mt-3 pt-6 pb-6 bg-[#EBE7DF]/80 animate-in fade-in duration-200">
            <div className="piercyn-container space-y-6">
              
              <div className="grid grid-cols-4 gap-8 font-sans">
                
                {/* 1. Size Filter */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#141414] mb-3">
                    SIZE
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SIZES.map((sz) => {
                      const isSelected = filters.sizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          onClick={() => {
                            const newSizes = isSelected
                              ? filters.sizes.filter((s) => s !== sz)
                              : [...filters.sizes, sz];
                            onFiltersChange({ ...filters, sizes: newSizes });
                          }}
                          className={`w-10 h-10 rounded-full border text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? 'border-[#141414] bg-[#141414] text-[#F2F0EB]'
                              : 'border-[#DAD8D1] bg-[#F2F0EB] text-[#141414] hover:border-[#141414]'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Color Filter */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#141414] mb-3">
                    COLORWAY
                  </h4>
                  <div className="space-y-1.5">
                    {AVAILABLE_COLORS.map((c) => {
                      const isSelected = filters.colors.includes(c.name);
                      return (
                        <button
                          key={c.name}
                          onClick={() => {
                            const newColors = isSelected
                              ? filters.colors.filter((cn) => cn !== c.name)
                              : [...filters.colors, c.name];
                            onFiltersChange({ ...filters, colors: newColors });
                          }}
                          className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.08em] hover:text-black cursor-pointer py-1"
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full border ${isSelected ? 'ring-2 ring-[#141414]' : 'border-black/20'}`}
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className={isSelected ? 'font-bold text-[#141414]' : 'text-[#6E6B65]'}>
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Price Filter */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#141414] mb-3">
                    PRICE (NGN)
                  </h4>
                  <div className="space-y-2 text-[11px] uppercase tracking-[0.1em]">
                    {[
                      { id: 'ALL', label: 'All Prices' },
                      { id: 'UNDER_40K', label: 'Under ₦40,000' },
                      { id: '40K_60K', label: '₦40,000 — ₦60,000' },
                      { id: 'OVER_60K', label: 'Over ₦60,000' }
                    ].map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="desktop-price"
                          checked={filters.priceRange === p.id}
                          onChange={() => onFiltersChange({ ...filters, priceRange: p.id as any })}
                          className="accent-[#141414] cursor-pointer"
                        />
                        <span className={filters.priceRange === p.id ? 'font-bold text-[#141414]' : 'text-[#6E6B65]'}>
                          {p.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 4. Availability & Clear */}
                <div className="flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#141414] mb-3">
                      AVAILABILITY
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] uppercase tracking-[0.1em]">
                      <input
                        type="checkbox"
                        checked={filters.inStockOnly}
                        onChange={(e) => onFiltersChange({ ...filters, inStockOnly: e.target.checked })}
                        className="accent-[#141414] cursor-pointer w-4 h-4"
                      />
                      <span className={filters.inStockOnly ? 'font-bold text-[#141414]' : 'text-[#6E6B65]'}>
                        IN STOCK ONLY
                      </span>
                    </label>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      onClick={onClearFilters}
                      className="px-4 py-2 rounded-full border border-[#141414]/30 text-[11px] uppercase tracking-[0.14em] font-semibold hover:border-[#141414] cursor-pointer"
                    >
                      CLEAR ALL
                    </button>
                    <button
                      onClick={() => setIsDesktopFilterOpen(false)}
                      className="px-5 py-2 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] uppercase tracking-[0.14em] font-semibold hover:bg-black cursor-pointer"
                    >
                      DONE
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

      {/* Mobile Filter Bottom Sheet (20-24px Top Radius) */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-300">
          <div 
            className="w-full max-h-[85vh] bg-[#F2F0EB] rounded-t-[24px] shadow-2xl flex flex-col justify-between font-sans border-t border-[#DAD8D1] overflow-hidden animate-in slide-in-from-bottom duration-300"
          >
            {/* Sheet Header */}
            <div className="h-16 px-6 border-b border-[#DAD8D1] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-editorial text-2xl uppercase tracking-[-0.02em]">FILTER MEN</span>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-sans font-bold tracking-wider bg-[#141414] text-[#F2F0EB] px-2.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-10 h-10 rounded-full border border-[#141414]/20 flex items-center justify-center cursor-pointer"
                aria-label="Close Filter"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Category */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#141414] mb-2.5">
                  CATEGORY
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'HOODIES', 'SWEATSHIRTS', 'T-SHIRTS', 'POLOS', 'JACKETS', 'TROUSERS', 'JEANS', 'ACCESSORIES'] as MenCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTempFilters((prev) => ({ ...prev, category: cat }))}
                      className={`min-h-[44px] px-4 rounded-full border text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center ${
                        tempFilters.category === cat
                          ? 'border-[#141414] bg-[#141414] text-[#F2F0EB]'
                          : 'border-[#DAD8D1] bg-[#FAF8F5] text-[#141414]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#141414] mb-2.5">
                  SIZE
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABLE_SIZES.map((sz) => {
                    const isSelected = tempFilters.sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        onClick={() => handleToggleSize(sz)}
                        className={`min-h-[44px] rounded-full border text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'border-[#141414] bg-[#141414] text-[#F2F0EB]'
                            : 'border-[#DAD8D1] bg-[#FAF8F5] text-[#141414]'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colorways */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#141414] mb-2.5">
                  COLORWAY
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_COLORS.map((c) => {
                    const isSelected = tempFilters.colors.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        onClick={() => handleToggleColor(c.name)}
                        className={`min-h-[44px] px-3 rounded-full border text-[11px] font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'border-[#141414] bg-[#141414] text-[#F2F0EB] font-bold'
                            : 'border-[#DAD8D1] bg-[#FAF8F5] text-[#141414]'
                        }`}
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0" 
                          style={{ backgroundColor: c.hex }} 
                        />
                        <span className="truncate">{c.name.split('/')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#141414] mb-2.5">
                  PRICE (NGN)
                </h4>
                <div className="space-y-2">
                  {[
                    { id: 'ALL', label: 'All Prices' },
                    { id: 'UNDER_40K', label: 'Under ₦40,000' },
                    { id: '40K_60K', label: '₦40,000 — ₦60,000' },
                    { id: 'OVER_60K', label: 'Over ₦60,000' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setTempFilters((prev) => ({ ...prev, priceRange: p.id as any }))}
                      className={`w-full min-h-[44px] px-4 rounded-xl border text-[12px] uppercase font-semibold tracking-wider flex items-center justify-between cursor-pointer ${
                        tempFilters.priceRange === p.id
                          ? 'border-[#141414] bg-[#141414] text-[#F2F0EB]'
                          : 'border-[#DAD8D1] bg-[#FAF8F5] text-[#141414]'
                      }`}
                    >
                      <span>{p.label}</span>
                      {tempFilters.priceRange === p.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#141414] mb-2.5">
                  AVAILABILITY
                </h4>
                <button
                  onClick={() => setTempFilters((prev) => ({ ...prev, inStockOnly: !prev.inStockOnly }))}
                  className={`w-full min-h-[44px] px-4 rounded-xl border text-[12px] uppercase font-semibold tracking-wider flex items-center justify-between cursor-pointer ${
                    tempFilters.inStockOnly
                      ? 'border-[#141414] bg-[#141414] text-[#F2F0EB]'
                      : 'border-[#DAD8D1] bg-[#FAF8F5] text-[#141414]'
                  }`}
                >
                  <span>IN STOCK ONLY</span>
                  {tempFilters.inStockOnly && <Check className="w-4 h-4" />}
                </button>
              </div>

            </div>

            {/* Bottom Actions with Safe Area Inset */}
            <div className="p-4 sm:p-6 bg-[#EBE7DF] border-t border-[#DAD8D1] flex items-center gap-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shrink-0">
              <button
                onClick={() => {
                  const cleared: FilterState = {
                    category: 'ALL',
                    sizes: [],
                    colors: [],
                    priceRange: 'ALL',
                    inStockOnly: false
                  };
                  setTempFilters(cleared);
                  onFiltersChange(cleared);
                  onSelectCategory('ALL');
                }}
                className="flex-1 h-12 min-h-[48px] rounded-full border border-[#141414] text-[#141414] text-[12px] uppercase font-bold tracking-[0.16em] cursor-pointer flex items-center justify-center"
              >
                CLEAR ALL
              </button>
              <button
                onClick={handleApplyMobileFilters}
                className="flex-1 h-12 min-h-[48px] rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] uppercase font-bold tracking-[0.16em] hover:bg-black cursor-pointer flex items-center justify-center shadow-xs"
              >
                APPLY FILTERS
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Mobile Sort Bottom Sheet (20-24px Top Radius) */}
      {isMobileSortOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-300">
          <div 
            className="w-full bg-[#F2F0EB] rounded-t-[24px] shadow-2xl p-6 font-sans border-t border-[#DAD8D1] space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300"
          >
            <div className="flex items-center justify-between border-b border-[#DAD8D1] pb-4">
              <span className="font-editorial text-2xl uppercase tracking-[-0.02em]">SORT MEN</span>
              <button
                onClick={() => setIsMobileSortOpen(false)}
                className="w-10 h-10 rounded-full border border-[#141414]/20 flex items-center justify-center cursor-pointer"
                aria-label="Close Sort"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onSortChange(option);
                    setIsMobileSortOpen(false);
                  }}
                  className={`w-full min-h-[48px] px-4 rounded-xl text-[12px] tracking-[0.14em] font-sans uppercase flex items-center justify-between cursor-pointer transition-colors ${
                    sortBy === option
                      ? 'bg-[#141414] text-[#F2F0EB] font-bold'
                      : 'bg-[#FAF8F5] border border-[#DAD8D1] text-[#141414]'
                  }`}
                >
                  <span>{option}</span>
                  {sortBy === option && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
