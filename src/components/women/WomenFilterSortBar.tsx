import React, { useState } from 'react';
import { WomenCategory, SortOption } from '../../types';
import { SlidersHorizontal, ChevronDown, Check, X, ArrowUpDown } from 'lucide-react';

export interface WomenFilterState {
  category: WomenCategory;
  sizes: string[];
  colors: string[];
  priceRange: 'ALL' | 'UNDER_40K' | '40K_60K' | 'OVER_60K';
  inStockOnly: boolean;
}

interface WomenFilterSortBarProps {
  totalCount: number;
  activeCategory: WomenCategory;
  sortBy: SortOption;
  filters: WomenFilterState;
  onSelectCategory: (category: WomenCategory) => void;
  onSortChange: (sort: SortOption) => void;
  onFiltersChange: (newFilters: WomenFilterState) => void;
  onClearFilters: () => void;
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const AVAILABLE_COLORS = [
  { name: 'Bone / Raw Ecru', hex: '#E8E4DA' },
  { name: 'Obsidian Noir', hex: '#181818' },
  { name: 'Sun-Baked Terracotta', hex: '#9E5B42' },
  { name: 'Dusk Charcoal', hex: '#282828' },
  { name: 'Raw Canvas Dune', hex: '#C8BAA0' },
  { name: 'Olive Sage', hex: '#5E6351' }
];

const SORT_OPTIONS: SortOption[] = [
  'FEATURED',
  'NEWEST',
  'PRICE: LOW TO HIGH',
  'PRICE: HIGH TO LOW',
  'BEST SELLING'
];

export const WomenFilterSortBar: React.FC<WomenFilterSortBarProps> = ({
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
  const [tempFilters, setTempFilters] = useState<WomenFilterState>(filters);

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
        id="women-filter-sort-bar" 
        className="w-full bg-[#F2F0EB] border-b border-[#E2DDD3] py-4 transition-all"
      >
        <div className="piercyn-container">
          
          {/* Desktop & Tablet Top Bar */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            
            {/* Left: Product Count */}
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-mono tracking-[0.2em] text-[#141414] uppercase font-semibold">
                {totalCount} {totalCount === 1 ? 'PIECE' : 'PIECES'}
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={onClearFilters}
                  className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#8C887B] hover:text-[#141414] underline underline-offset-4 cursor-pointer"
                >
                  RESET FILTERS ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Right: Filters & Sort Controls */}
            <div className="flex items-center gap-3">
              {/* Filter Toggle */}
              <button
                onClick={() => setIsDesktopFilterOpen(!isDesktopFilterOpen)}
                className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[12px] font-sans uppercase tracking-[0.15em] font-medium border transition-all cursor-pointer ${
                  isDesktopFilterOpen || activeFilterCount > 0
                    ? 'bg-[#141414] text-[#F2F0EB] border-[#141414]'
                    : 'bg-transparent text-[#141414] border-[#D0CBC0] hover:border-[#141414]'
                }`}
                aria-expanded={isDesktopFilterOpen}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>FILTERS</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#F2F0EB] text-[#141414] text-[10px] font-mono flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDesktopFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDesktopSortOpen(!isDesktopSortOpen)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-sans uppercase tracking-[0.15em] font-medium border border-[#D0CBC0] text-[#141414] hover:border-[#141414] transition-all cursor-pointer bg-transparent"
                  aria-expanded={isDesktopSortOpen}
                >
                  <span className="text-[#8C887B]">SORT:</span>
                  <span>{sortBy}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#141414] transition-transform duration-200 ${isDesktopSortOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDesktopSortOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDesktopSortOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-60 bg-[#F2F0EB] border border-[#D0CBC0] shadow-md rounded-2xl p-2 z-50 animate-fadeIn">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            onSortChange(option);
                            setIsDesktopSortOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[12px] font-sans tracking-[0.12em] uppercase font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            sortBy === option
                              ? 'bg-[#141414] text-[#F2F0EB]'
                              : 'text-[#141414] hover:bg-[#E5E0D5]'
                          }`}
                        >
                          <span>{option}</span>
                          {sortBy === option && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Desktop Filter Expandable Drawer */}
          {isDesktopFilterOpen && (
            <div className="mt-4 pt-6 pb-2 border-t border-[#E2DDD3] animate-fadeIn grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Sizes Filter */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#706E6B] font-semibold block">
                  SIZE
                </span>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map((size) => {
                    const isSelected = filters.sizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => {
                          const newSizes = isSelected 
                            ? filters.sizes.filter(s => s !== size)
                            : [...filters.sizes, size];
                          onFiltersChange({ ...filters, sizes: newSizes });
                        }}
                        className={`w-9 h-9 rounded-lg text-xs font-mono font-medium border flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#141414] text-[#F2F0EB] border-[#141414]'
                            : 'bg-transparent text-[#141414] border-[#D0CBC0] hover:border-[#141414]'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colorway Filter */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#706E6B] font-semibold block">
                  COLORWAY
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {AVAILABLE_COLORS.map((col) => {
                    const isSelected = filters.colors.includes(col.name);
                    return (
                      <button
                        key={col.name}
                        onClick={() => {
                          const newColors = isSelected 
                            ? filters.colors.filter(c => c !== col.name)
                            : [...filters.colors, col.name];
                          onFiltersChange({ ...filters, colors: newColors });
                        }}
                        className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-[11px] font-sans transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-[#141414] bg-[#E2DDD3] text-[#141414] font-medium' 
                            : 'border-[#D0CBC0] text-[#706E6B] hover:text-[#141414]'
                        }`}
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" 
                          style={{ backgroundColor: col.hex }} 
                        />
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Filter */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#706E6B] font-semibold block">
                  PRICE (NGN)
                </span>
                <div className="flex flex-col gap-1.5">
                  {[
                    { id: 'ALL', label: 'All Prices' },
                    { id: 'UNDER_40K', label: 'Under ₦40,000' },
                    { id: '40K_60K', label: '₦40,000 – ₦60,000' },
                    { id: 'OVER_60K', label: 'Above ₦60,000' }
                  ].map((range) => (
                    <button
                      key={range.id}
                      onClick={() => onFiltersChange({ ...filters, priceRange: range.id as any })}
                      className={`text-left text-xs font-sans py-1 transition-colors cursor-pointer flex items-center justify-between ${
                        filters.priceRange === range.id
                          ? 'text-[#141414] font-bold'
                          : 'text-[#706E6B] hover:text-[#141414]'
                      }`}
                    >
                      <span>{range.label}</span>
                      {filters.priceRange === range.id && <Check className="w-3 h-3 text-[#141414]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Toggle & Actions */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#706E6B] font-semibold block">
                    AVAILABILITY
                  </span>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filters.inStockOnly}
                      onChange={(e) => onFiltersChange({ ...filters, inStockOnly: e.target.checked })}
                      className="w-4 h-4 rounded border-[#D0CBC0] text-[#141414] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#141414]"
                    />
                    <span className="text-xs font-sans text-[#141414] font-medium">In Stock Pieces Only</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsDesktopFilterOpen(false)}
                    className="w-full py-2 bg-[#141414] text-[#F2F0EB] text-xs font-sans uppercase tracking-[0.16em] font-semibold rounded-lg hover:bg-black transition-colors cursor-pointer"
                  >
                    CLOSE FILTERS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Bottom Fixed Bar / Dual Buttons */}
          <div className="sm:hidden grid grid-cols-2 gap-2">
            <button
              onClick={openMobileFilter}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-sans uppercase tracking-[0.14em] font-semibold transition-all cursor-pointer min-h-[48px] ${
                activeFilterCount > 0
                  ? 'bg-[#141414] text-[#F2F0EB] border-[#141414]'
                  : 'bg-[#EAE5D9] text-[#141414] border-[#D0CBC0]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>FILTER</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#F2F0EB] text-[#141414] text-[10px] font-mono flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileSortOpen(true)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#D0CBC0] bg-[#EAE5D9] text-[#141414] text-xs font-sans uppercase tracking-[0.14em] font-semibold cursor-pointer min-h-[48px]"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>SORT</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Filter Bottom Sheet Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fadeIn"
            onClick={() => setIsMobileFilterOpen(false)} 
          />

          {/* Bottom Sheet Container */}
          <div className="relative bg-[#F2F0EB] w-full rounded-t-[24px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl z-10 animate-slideUp">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD3]">
              <div>
                <h3 className="font-editorial text-xl uppercase tracking-tight text-[#141414]">
                  FILTERS
                </h3>
                <span className="text-[11px] font-mono text-[#706E6B] uppercase tracking-wider">
                  {totalCount} PIECES AVAILABLE
                </span>
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-10 h-10 rounded-full bg-[#E2DDD3] flex items-center justify-center text-[#141414] hover:bg-[#D4CEBF] cursor-pointer"
                aria-label="Close Filter Sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filters Content */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Category selector in mobile sheet */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#706E6B] font-semibold block">
                  CATEGORY
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'ALL',
                    'HOODIES & FLEECE',
                    'CROPPED & TOPS',
                    'TEES',
                    'DRESSES & SETS',
                    'TROUSERS & SKIRTS',
                    'OUTERWEAR',
                    'ACCESSORIES'
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTempFilters((prev) => ({ ...prev, category: cat as WomenCategory }))}
                      className={`px-3 py-2 rounded-lg text-xs font-sans uppercase tracking-[0.1em] border transition-all cursor-pointer ${
                        tempFilters.category === cat
                          ? 'bg-[#141414] text-[#F2F0EB] border-[#141414] font-semibold'
                          : 'bg-white/60 text-[#706E6B] border-[#D0CBC0]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#706E6B] font-semibold block">
                  SIZES
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {AVAILABLE_SIZES.map((size) => {
                    const isSelected = tempFilters.sizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => handleToggleSize(size)}
                        className={`w-11 h-11 rounded-xl text-sm font-mono font-medium border flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#141414] text-[#F2F0EB] border-[#141414]'
                            : 'bg-white/60 text-[#141414] border-[#D0CBC0]'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#706E6B] font-semibold block">
                  COLORWAY
                </span>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((col) => {
                    const isSelected = tempFilters.colors.includes(col.name);
                    return (
                      <button
                        key={col.name}
                        onClick={() => handleToggleColor(col.name)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-sans transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-[#141414] bg-[#141414] text-[#F2F0EB]' 
                            : 'border-[#D0CBC0] bg-white/60 text-[#141414]'
                        }`}
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0" 
                          style={{ backgroundColor: col.hex }} 
                        />
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#706E6B] font-semibold block">
                  PRICE (NGN)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ALL', label: 'All Prices' },
                    { id: 'UNDER_40K', label: 'Under ₦40,000' },
                    { id: '40K_60K', label: '₦40,000 – ₦60,000' },
                    { id: 'OVER_60K', label: 'Above ₦60,000' }
                  ].map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setTempFilters((prev) => ({ ...prev, priceRange: range.id as any }))}
                      className={`p-2.5 rounded-xl border text-xs font-sans text-left transition-all cursor-pointer ${
                        tempFilters.priceRange === range.id
                          ? 'bg-[#141414] text-[#F2F0EB] border-[#141414] font-semibold'
                          : 'bg-white/60 text-[#706E6B] border-[#D0CBC0]'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Stock */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={tempFilters.inStockOnly}
                    onChange={(e) => setTempFilters((prev) => ({ ...prev, inStockOnly: e.target.checked }))}
                    className="w-5 h-5 rounded border-[#D0CBC0] text-[#141414] accent-[#141414]"
                  />
                  <span className="text-sm font-sans text-[#141414] font-medium">In Stock Pieces Only</span>
                </label>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 border-t border-[#E2DDD3] bg-[#EAE5D9] grid grid-cols-2 gap-3 pb-8">
              <button
                onClick={() => {
                  setTempFilters({
                    category: 'ALL',
                    sizes: [],
                    colors: [],
                    priceRange: 'ALL',
                    inStockOnly: false
                  });
                }}
                className="py-3 px-4 rounded-xl border border-[#D0CBC0] text-[#141414] text-xs font-sans uppercase tracking-[0.14em] font-semibold hover:bg-[#E2DDD3] transition-colors cursor-pointer min-h-[48px]"
              >
                RESET
              </button>
              <button
                onClick={handleApplyMobileFilters}
                className="py-3 px-4 rounded-xl bg-[#141414] text-[#F2F0EB] text-xs font-sans uppercase tracking-[0.14em] font-semibold hover:bg-black transition-colors cursor-pointer min-h-[48px]"
              >
                APPLY FILTERS
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Mobile Sort Bottom Sheet */}
      {isMobileSortOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fadeIn"
            onClick={() => setIsMobileSortOpen(false)} 
          />
          <div className="relative bg-[#F2F0EB] w-full rounded-t-[24px] p-6 pb-8 shadow-2xl z-10 space-y-4 animate-slideUp">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD3]">
              <h3 className="font-editorial text-xl uppercase tracking-tight text-[#141414]">
                SORT PIECES
              </h3>
              <button
                onClick={() => setIsMobileSortOpen(false)}
                className="w-9 h-9 rounded-full bg-[#E2DDD3] flex items-center justify-center text-[#141414] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onSortChange(opt);
                    setIsMobileSortOpen(false);
                  }}
                  className={`w-full text-left py-3.5 px-4 rounded-xl text-xs font-sans uppercase tracking-[0.12em] font-medium flex items-center justify-between transition-colors min-h-[48px] cursor-pointer ${
                    sortBy === opt
                      ? 'bg-[#141414] text-[#F2F0EB]'
                      : 'text-[#141414] hover:bg-[#E2DDD3]'
                  }`}
                >
                  <span>{opt}</span>
                  {sortBy === opt && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
