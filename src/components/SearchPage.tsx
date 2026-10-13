import React, { useState, useMemo, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Product, ActivePageView } from '../types';
import { ProductCard } from './ProductCard';
import { Search, X, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react';

interface SearchPageProps {
  onSelectPage: (page: ActivePageView) => void;
  onViewProduct: (product: Product) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ onSelectPage, onViewProduct }) => {
  const { products } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'in_stock' | 'available_to_order'>('all');

  // Sync initial query from URL search parameters ?q=...
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    const newUrl = val ? `/search?q=${encodeURIComponent(val)}` : '/search';
    window.history.replaceState({}, '', newUrl);
  };

  const categories = [
    { label: 'ALL CATEGORIES', value: 'all' },
    { label: 'TEES & TOPS', value: 'tees' },
    { label: 'HOODIES & FLEECE', value: 'hoodies' },
    { label: 'POLOS', value: 'polos' },
    { label: 'TROUSERS & CARGOS', value: 'trousers' },
    { label: 'OUTERWEAR', value: 'outerwear' },
  ];

  // Filtered Results
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products.filter((p) => {
      // Query search
      if (q) {
        const nameMatch = p.name.toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        const tagMatch = (p.tag || '').toLowerCase().includes(q);
        const colMatch = (p.collection || '').toLowerCase().includes(q);
        if (!nameMatch && !descMatch && !catMatch && !tagMatch && !colMatch) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'tees' && p.category !== 'tees' && p.category !== 't-shirts') return false;
        if (selectedCategory === 'hoodies' && p.category !== 'hoodies' && p.category !== 'sweatshirts') return false;
        if (selectedCategory !== 'tees' && selectedCategory !== 'hoodies' && p.category !== selectedCategory) return false;
      }

      // Availability filter
      if (selectedAvailability === 'in_stock' && p.availabilityType === 'available_to_order') return false;
      if (selectedAvailability === 'available_to_order' && p.availabilityType !== 'available_to_order') return false;

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedAvailability]);

  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-24 sm:pt-28 pb-24 font-sans">
      <div className="piercyn-container max-w-6xl mx-auto">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-6">
          <button onClick={() => onSelectPage('home')} className="hover:text-[#141414] cursor-pointer">
            HOME
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <span className="text-[#141414] font-semibold">SEARCH CATALOGUE</span>
        </nav>

        {/* Page Header */}
        <header className="mb-8">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#7A7771] block mb-2 font-semibold">
            CATALOGUE DISCOVERY
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#141414] italic font-normal tracking-tight">
            Search PIERCYN
          </h1>
        </header>

        {/* Search Bar Input */}
        <div className="relative mb-8">
          <div className="relative flex items-center bg-[#EAE6DD] border border-[#DAD6CC] rounded-full overflow-hidden focus-within:border-[#141414] transition-colors shadow-xs">
            <Search className="w-5 h-5 text-[#7A7771] ml-5 shrink-0" />
            <input
              id="catalogue-search-input"
              type="text"
              autoFocus
              value={searchQuery}
              onChange={handleQueryChange}
              placeholder="Search by piece name, fabric (e.g. 280 GSM), category, or color..."
              className="w-full bg-transparent px-4 py-4 text-sm sm:text-base text-[#141414] placeholder-[#7A7771] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  window.history.replaceState({}, '', '/search');
                }}
                className="mr-4 p-1.5 rounded-full hover:bg-black/10 text-[#7A7771] hover:text-[#141414] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DAD8D1] pb-6 mb-8 text-xs">
          
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat.value
                    ? 'bg-[#141414] text-[#F2F0EB] font-bold'
                    : 'bg-[#EAE6DD] border border-[#DAD6CC] text-[#55524D] hover:border-[#141414]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Availability Filter Chips */}
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-mono text-[#7A7771] uppercase font-semibold">
              Availability:
            </span>
            {(['all', 'in_stock', 'available_to_order'] as const).map((avail) => (
              <button
                key={avail}
                onClick={() => setSelectedAvailability(avail)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  selectedAvailability === avail
                    ? 'bg-[#141414] text-[#F2F0EB] font-bold'
                    : 'bg-[#EAE6DD] border border-[#DAD6CC] text-[#55524D] hover:border-[#141414]'
                }`}
              >
                {avail === 'all' ? 'ALL' : avail === 'in_stock' ? 'IN STOCK' : 'AVAILABLE TO ORDER'}
              </button>
            ))}
          </div>

        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6 text-xs text-[#6E6B65] font-mono">
          <span>
            SHOWING <strong>{searchResults.length}</strong> {searchResults.length === 1 ? 'PIECE' : 'PIECES'}
            {searchQuery && <> FOR &ldquo;<strong>{searchQuery}</strong>&rdquo;</>}
          </span>
          {(searchQuery || selectedCategory !== 'all' || selectedAvailability !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedAvailability('all');
                window.history.replaceState({}, '', '/search');
              }}
              className="text-[#141414] underline hover:text-[#555] cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Product Grid */}
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
            {searchResults.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewProduct={onViewProduct}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl max-w-lg mx-auto p-8">
            <Search className="w-10 h-10 text-[#7A7771] mx-auto mb-4" />
            <h3 className="font-editorial text-2xl italic text-[#141414] mb-2">
              No Pieces Match Your Search
            </h3>
            <p className="text-xs text-[#55524D] leading-relaxed mb-6">
              Try searching with broader terms like &ldquo;tee&rdquo;, &ldquo;hoodie&rdquo;, &ldquo;black&rdquo;, or &ldquo;oversized&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedAvailability('all');
                window.history.replaceState({}, '', '/search');
              }}
              className="px-6 py-2.5 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
            >
              Clear Search & Show All
            </button>
          </div>
        )}

      </div>
    </main>
  );
};
