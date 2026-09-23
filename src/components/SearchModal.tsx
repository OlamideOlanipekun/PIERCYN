import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { ALL_PRODUCTS } from '../data/allProducts';
import { formatNGN } from '../utils/currency';
import { X, Search, ArrowRight, Tag, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface SearchModalProps {
  onViewProduct?: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ onViewProduct }) => {
  const { isSearchOpen, setIsSearchOpen, addToCart, showToast } = useShop();
  const [searchTerm, setSearchTerm] = useState('');

  const quickSearchSuggestions = [
    'Black hoodie',
    'Cargo pants',
    'Oversized tee',
    'Utility jacket',
    'Denim shirt',
    'Heavyweight tee',
  ];

  const relatedCategories = [
    { name: 'HOODIES', count: 6 },
    { name: 'TEES', count: 8 },
    { name: 'TROUSERS', count: 5 },
    { name: 'JACKETS', count: 4 },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const normalizeQuery = (text: string) => text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const cleanQuery = normalizeQuery(searchTerm);

  const results: Product[] = cleanQuery
    ? ALL_PRODUCTS.filter((p) => {
        const pName = p.name.toLowerCase();
        const pDesc = p.description.toLowerCase();
        const pCat = p.category.toLowerCase();
        const tags = (p.tag || '').toLowerCase();
        return (
          pName.includes(cleanQuery) ||
          pDesc.includes(cleanQuery) ||
          pCat.includes(cleanQuery) ||
          tags.includes(cleanQuery)
        );
      })
    : ALL_PRODUCTS.slice(0, 4); // Default preview items matching mockup

  const handleSelectProduct = (product: Product) => {
    setIsSearchOpen(false);
    if (onViewProduct) {
      onViewProduct(product);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Modern Search Experience">
      {/* Backdrop */}
      <div
        onClick={() => setIsSearchOpen(false)}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="min-h-full flex items-start justify-center p-3 sm:p-6 lg:p-10 pt-12 sm:pt-16">
        <div className="relative w-full max-w-3xl bg-[#F5F3EE] text-[#111111] shadow-2xl border border-[#E2DFD7] rounded-3xl p-5 sm:p-8 animate-in zoom-in-95 duration-200">
          
          {/* Header Row */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E2DFD7]">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#737069]">
                MODERN SEARCH EXPERIENCE
              </span>
            </div>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="w-9 h-9 rounded-full text-[#111111] hover:bg-[#ECE8E1] transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Close Search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="my-5 relative">
            <div className="flex items-center gap-3 bg-[#FFFFFF] rounded-2xl px-4 py-3.5 border border-[#E2DFD7] focus-within:border-[#111111] transition-colors shadow-xs">
              <Search className="w-5 h-5 text-[#737069] shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="[ Black hoodie, Cargo pant, Oversized tee... ]"
                className="w-full bg-transparent text-sm sm:text-base font-sans font-medium text-[#111111] placeholder-[#8C8A84] focus:outline-hidden"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-[#737069] hover:text-[#111111] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="mb-6">
            <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-[#737069] block mb-2">
              POPULAR SUGGESTIONS
            </span>
            <div className="flex flex-wrap gap-2">
              {quickSearchSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSearchTerm(suggestion)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-sans bg-[#ECE8E1] text-[#111111] hover:bg-[#111111] hover:text-[#F5F3EE] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-[#737069]" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-[#737069]">
                {cleanQuery ? `RESULTS (${results.length} PIECES)` : 'FEATURED PIECES'}
              </span>
            </div>

            {results.length === 0 ? (
              <div className="py-8 text-center bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7]">
                <p className="font-sans text-sm font-bold text-[#111111]">
                  No exact pieces found for "{searchTerm}"
                </p>
                <p className="text-xs text-[#737069] mt-1">
                  Try searching for keywords like "hoodie", "tee", or "cargo".
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {results.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="flex items-center justify-between p-2.5 sm:p-3 bg-[#FFFFFF] rounded-xl border border-[#E2DFD7] hover:border-[#111111] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-14 rounded-lg overflow-hidden bg-[#ECE8E1] shrink-0">
                        <img
                          src={product.colors[0]?.image || product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-sans text-xs sm:text-sm font-bold text-[#111111] truncate group-hover:underline">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#ECE8E1] text-[#737069]">
                            {product.category}
                          </span>
                          <span className="text-[10px] font-mono text-[#737069]">
                            {product.colors.length} {product.colors.length === 1 ? 'Color' : 'Colors'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs sm:text-sm font-bold text-[#111111]">
                        {formatNGN(product.priceNGN)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#737069] group-hover:translate-x-1 group-hover:text-[#111111] transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Categories Footer */}
          <div className="mt-6 pt-4 border-t border-[#E2DFD7]">
            <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-[#737069] block mb-2.5">
              RELATED CATEGORIES
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {relatedCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSearchTerm(cat.name.toLowerCase())}
                  className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2DFD7] hover:border-[#111111] text-left transition-colors cursor-pointer"
                >
                  <span className="font-sans text-xs font-bold text-[#111111] block">
                    {cat.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#737069]">
                    {cat.count} items
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
