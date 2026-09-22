import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { ALL_PRODUCTS } from '../data/allProducts';
import { formatPrice } from '../utils/currency';
import { X, Search, ArrowRight } from 'lucide-react';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, setQuickViewProduct, currency } = useShop();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isSearchOpen) return null;

  const popularSearches = ['450 GSM HOODIE', 'CARGO TROUSERS', 'ARCHITECTURAL', 'PLEATED DENIM', 'LEKKI BOMBER', 'MESH POLO'];

  const results = searchTerm.trim()
    ? ALL_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.gsm && p.gsm.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={() => setIsSearchOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="min-h-full flex items-start justify-center p-3 sm:p-6 lg:p-12 pt-16 sm:pt-20">
        <div className="relative w-full max-w-4xl bg-[#F2F0EB] text-[#141414] shadow-2xl border border-[#E3DEC3] rounded-2xl p-5 sm:p-10 animate-in zoom-in-95 duration-200">
          
          {/* Close */}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 min-w-[44px] min-h-[44px] rounded-full text-[#141414] hover:bg-[#141414]/10 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Close Search"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Search Input */}
          <div className="border-b-2 border-[#141414] pb-2 sm:pb-3 flex items-center gap-3 sm:gap-4 pr-10 sm:pr-0">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-[#141414] shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH HOODIES, TEES, DENIM..."
              className="w-full h-11 min-h-[44px] bg-transparent text-base sm:text-2xl font-editorial uppercase tracking-wider text-[#141414] placeholder-[#8C8A84] focus:outline-none"
            />
          </div>

          {/* Curated Tags / Suggestions */}
          {!searchTerm && (
            <div className="mt-6 sm:mt-8">
              <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.25em] uppercase text-[#7A7771] block mb-2.5 sm:mb-3">
                POPULAR SEARCHES:
              </span>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearchTerm(term)}
                    className="h-11 min-h-[44px] px-4 border border-[#D5CFBF] bg-[#EAE5D9] rounded-full text-[10px] uppercase font-mono tracking-wider hover:border-[#141414] hover:bg-[#141414] hover:text-[#F2F0EB] transition-all cursor-pointer inline-flex items-center justify-center active:scale-95"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchTerm && (
            <div className="mt-6 sm:mt-8">
              <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.25em] uppercase text-[#7A7771] block mb-3 sm:mb-4">
                RESULTS ({results.length} {results.length === 1 ? 'PIECE' : 'PIECES'})
              </span>

              {results.length === 0 ? (
                <div className="py-10 text-center text-[#7A7771] font-sans text-sm uppercase font-medium">
                  Nothing here yet for "{searchTerm}". Try another search or explore what's new.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 max-h-[450px] overflow-y-auto pr-1">
                  {results.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setQuickViewProduct(prod);
                        setIsSearchOpen(false);
                      }}
                      className="group cursor-pointer flex flex-col p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                    >
                      <div className="aspect-[4/5] bg-[#E7E2D6] rounded-lg overflow-hidden mb-2 shadow-2xs">
                        <img
                          src={prod.colors[0]?.image || prod.images[0]}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h4 className="text-[11px] sm:text-[12px] uppercase tracking-[0.06em] font-semibold text-[#141414] line-clamp-1">
                        {prod.name}
                      </h4>
                      <span className="text-[10px] sm:text-[11px] font-mono text-[#7A7771] mt-0.5">
                        {formatPrice(prod, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
