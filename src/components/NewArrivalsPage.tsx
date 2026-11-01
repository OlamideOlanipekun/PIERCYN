import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, SlidersHorizontal, ArrowUpDown, X, Heart, Zap } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { useShop } from '../context/ShopContext';
import type { Product } from '../types';
import {
  filterNewArrivals,
  getAvailableNewArrivalSizes,
  getNewArrivalProducts,
  isNewArrival,
  NEW_ARRIVAL_CATEGORIES,
  sortNewArrivals,
  type NewCategory,
  type SortKey,
} from '../utils/newArrivals';

const CATEGORIES = NEW_ARRIVAL_CATEGORIES;
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'FEATURED', label: 'FEATURED' },
  { key: 'NEWEST', label: 'NEWEST FIRST' },
  { key: 'PRICE_ASC', label: 'PRICE: LOW TO HIGH' },
  { key: 'PRICE_DESC', label: 'PRICE: HIGH TO LOW' },
];

interface NewArrivalsPageProps {
  onSelectPage: (page: 'men' | 'women' | 'new' | 'collections' | 'lookbook' | 'home') => void;
}

// ---------- PRODUCT SKELETON ----------
const ProductSkeleton: React.FC = () => (
  <div className="flex flex-col animate-pulse">
    <div className="aspect-[4/5] w-full bg-[#E3DEC3] rounded-xl mb-3" />
    <div className="h-3.5 bg-[#E3DEC3] rounded-full w-3/4 mb-2" />
    <div className="h-3 bg-[#E3DEC3] rounded-full w-1/3" />
  </div>
);

// ---------- PRODUCT CARD ----------
const NewProductCard: React.FC<{ product: Product; index: number }> = ({ product, index }) => {
  const { setQuickViewProduct, toggleWishlist, isWishlisted, currency } = useShop();
  const [isHovered, setIsHovered] = useState(false);
  const isNew = isNewArrival(product);
  const isFeatured = product.isBestSeller;
  const displayImage = isHovered && product.colors[0]?.altImage
    ? product.colors[0].altImage
    : product.colors[0]?.image || product.images[0];

  return (
    <article className="group flex flex-col select-none">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E7E2D6] rounded-xl mb-3 shadow-2xs">
        <button
          type="button"
          onClick={() => setQuickViewProduct(product)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group/image relative block h-full w-full cursor-pointer text-left focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#A48B71]"
          aria-label={`Quick view ${product.name}`}
        >
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/image:scale-[1.025]"
            loading={index < 4 ? 'eager' : 'lazy'}
            width={600}
            height={750}
          />

          <span className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {isNew && (
              <span className="inline-flex items-center gap-1 text-[8px] font-mono tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-[#141414] text-[#F2F0EB]">
                <Zap className="w-2.5 h-2.5" />
                NEW
              </span>
            )}
            {isFeatured && (
              <span className="text-[8px] font-mono tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-[#A48B71] text-[#F2F0EB]">
                {product.tag || 'FEATURED'}
              </span>
            )}
          </span>

          <span className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover/image:translate-y-0 group-focus-visible/image:translate-y-0 transition-transform duration-300 ease-out">
            <span className="w-full h-9 rounded-full bg-[#F2F0EB]/95 backdrop-blur-md text-[#141414] text-[10px] font-sans font-bold uppercase tracking-[0.2em] flex items-center justify-center shadow-sm">
              QUICK VIEW
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className="absolute top-2.5 right-2.5 z-10 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-200 cursor-pointer"
          aria-label={isWishlisted(product.id) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isWishlisted(product.id)}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted(product.id) ? 'fill-[#141414] text-[#141414]' : 'text-[#141414]'}`} />
        </button>
      </div>

      <div className="font-sans space-y-0.5">
        <h3 className="text-[12px] sm:text-[13px] uppercase tracking-[0.04em] font-semibold text-[#141414] line-clamp-1">
          <button type="button" onClick={() => setQuickViewProduct(product)} className="text-left hover:underline focus-visible:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A48B71]">
            {product.name}
          </button>
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-[12px] sm:text-[13px] font-semibold text-[#141414]">
            {formatPrice(product, currency)}
          </span>
          {product.colors.length > 1 && (
            <div className="flex gap-1" role="img" aria-label={`${product.colors.length} colour options`}>
              {product.colors.slice(0, 3).map((color) => (
                <span key={color.name} className="w-3 h-3 rounded-full border border-[#D5CFBF]" style={{ backgroundColor: color.hex }} title={color.name} aria-hidden="true" />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

// ---------- MAIN PAGE ----------
export const NewArrivalsPage: React.FC<NewArrivalsPageProps> = ({ onSelectPage }) => {
  const { products, isLoadingProducts, catalogError, refreshProducts } = useShop();
  const [activeCategory, setActiveCategory] = useState<NewCategory>('ALL');
  const [activeSizes, setActiveSizes] = useState<string[]>([]);
  const [draftCategory, setDraftCategory] = useState<NewCategory>('ALL');
  const [draftSizes, setDraftSizes] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('FEATURED');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterDialogRef = useRef<HTMLDivElement>(null);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFilterOpen && !isSortOpen) return;
    const previousOverflow = document.body.style.overflow;
    if (isFilterOpen) document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterOpen(false);
        setIsSortOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !isFilterOpen || !filterDialogRef.current) return;
      const focusable = Array.from(filterDialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === filterDialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    if (isFilterOpen) requestAnimationFrame(() => filterDialogRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      if (isFilterOpen) filterTriggerRef.current?.focus();
    };
  }, [isFilterOpen, isSortOpen]);

  const isLoading = isLoadingProducts && products.length === 0;
  const allNewProducts = getNewArrivalProducts(products);
  const categoryFiltered = filterNewArrivals(allNewProducts, activeCategory, activeSizes);
  const sorted = sortNewArrivals(categoryFiltered, sortKey);
  const availableSizes = getAvailableNewArrivalSizes(allNewProducts);

  // Split into first 8 and rest (editorial break after row 2 on desktop)
  const firstGrid = sorted.slice(0, 8);
  const secondGrid = sorted.slice(8);

  const handleScrollToGrid = () => {
    if (allNewProducts.length > 0 || isLoading) {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onSelectPage('collections');
    }
  };

  const handleCategoryClick = (cat: NewCategory) => {
    setActiveCategory(cat);
  };

  const handleOpenFilter = () => {
    setDraftCategory(activeCategory);
    setDraftSizes(activeSizes);
    setIsFilterOpen(true);
  };

  const handleToggleDraftSize = (size: string) => {
    setDraftSizes((current) => current.includes(size)
      ? current.filter((selected) => selected !== size)
      : [...current, size]);
  };

  const handleApplyFilters = () => {
    setActiveCategory(draftCategory);
    setActiveSizes(draftSizes);
    setIsFilterOpen(false);
  };
  const sortButtonLabel = sortKey === 'PRICE_ASC'
    ? 'PRICE ↑'
    : sortKey === 'PRICE_DESC'
      ? 'PRICE ↓'
      : sortKey === 'NEWEST'
        ? 'NEWEST'
        : 'FEATURED';

  return (
    <main id="piercyn-new-arrivals-page" className="w-full bg-[#F2F0EB] text-[#141414] font-sans">

      {/* =========================================================
          01 — NEW ARRIVALS HERO
      ========================================================= */}
      <section
        id="new-arrivals-hero"
        className="relative w-full h-[65svh] sm:h-[78vh] lg:h-[84vh] overflow-hidden bg-[#141414] text-[#F2F0EB] select-none"
      >
        {/* Hero Image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=88&w=2000&auto=format&fit=crop"
            alt="Model wearing contemporary streetwear"
            className="w-full h-full object-cover object-top scale-[1.03] animate-[heroScale_1.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            loading="eager"
            width={2000}
            height={1333}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/45" />
        </div>

        {/* Content */}
        <div className="relative z-20 h-full piercyn-container flex flex-col justify-between pt-24 sm:pt-28 pb-8 sm:pb-14">
          {/* Label */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[#E3DEC3]">
            <Zap className="w-3 h-3 text-[#A48B71]" />
            <span>PIERCYN / NEW ARRIVALS</span>
            <span className="w-px h-3 bg-[#E3DEC3]/40" />
            <span className="text-[#A48B71]">LATEST EDIT</span>
          </div>

          {/* Headline */}
          <div className="max-w-4xl space-y-3 sm:space-y-4">
            <h1 className="font-editorial text-[13vw] sm:text-[9vw] lg:text-[7.5vw] xl:text-[96px] leading-[0.87] tracking-[-0.035em] uppercase text-[#F2F0EB]">
              {allNewProducts.length > 0 || isLoading ? (
                <>
                  <span className="block">JUST</span>
                  <span className="block italic font-light text-[#E3DEC3]">DROPPED<span className="not-italic text-[#A48B71]">.</span></span>
                </>
              ) : (
                <>
                  <span className="block">MORE TO</span>
                  <span className="block italic font-light text-[#E3DEC3]">DISCOVER<span className="not-italic text-[#A48B71]">.</span></span>
                </>
              )}
            </h1>

            <p className="font-sans text-[13px] sm:text-[16px] text-[#E3DEC3]/90 font-normal tracking-[0.03em] max-w-sm leading-relaxed">
              {allNewProducts.length > 0 || isLoading
                ? 'The latest PIERCYN pieces have arrived.'
                : 'Explore the full PIERCYN collection while the next edit takes shape.'}
            </p>

            <div className="pt-2">
              <button
                onClick={handleScrollToGrid}
                className="group h-12 min-h-[48px] px-8 rounded-full bg-[#F2F0EB] text-[#141414] text-[11px] sm:text-[12px] uppercase font-bold tracking-[0.2em] hover:bg-white transition-all duration-300 inline-flex items-center gap-2.5 cursor-pointer shadow-md active:scale-95"
              >
                <span>{allNewProducts.length > 0 || isLoading ? 'SHOP THE DROP' : 'EXPLORE COLLECTIONS'}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="hidden sm:flex justify-end items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-[#E3DEC3]/60">
            <span>SCROLL TO DISCOVER</span>
            <span className="w-8 h-px bg-[#E3DEC3]/40" />
          </div>
        </div>
      </section>

      {/* =========================================================
          02 — LATEST DROP INTRO
      ========================================================= */}
      <section className="w-full bg-[#F2F0EB] py-16 sm:py-24 border-b border-[#E3DEC3]/70">
        <div className="piercyn-container flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-semibold block">
              01 / LATEST
            </span>
            <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl uppercase tracking-[-0.03em] leading-[0.9]">
              NEW PIECES<span className="text-[#A48B71]">.</span><br />
              <span className="italic font-light text-[#4A4844]">SAME ENERGY.</span>
            </h2>
            <p className="font-sans text-[15px] sm:text-[17px] text-[#4A4844] leading-relaxed max-w-[560px]">
              The newest PIERCYN pieces, designed to change the way you show up. Every piece built in Lagos for the world.
            </p>
          </div>

          {/* Live catalog metadata */}
          <div className="flex flex-row lg:flex-col gap-6 lg:gap-3 shrink-0 text-right">
            <div className="font-sans space-y-0.5">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#6E6B65]">Release</div>
              <div className="text-[14px] font-semibold text-[#141414] uppercase tracking-[0.08em]">Latest Drop</div>
            </div>
            <div className="font-sans space-y-0.5">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#6E6B65]">New Pieces</div>
              <div className="text-[14px] font-semibold text-[#141414] uppercase tracking-[0.08em]">{allNewProducts.length} Pieces</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          03 — CATEGORY QUICK NAVIGATION
      ========================================================= */}
      <div
        className="sticky top-14 sm:top-16 z-30 bg-[#F2F0EB]/95 backdrop-blur-md border-b border-[#E3DEC3]"
      >
        <div
          className="piercyn-container overflow-x-auto scrollbar-none py-3"
        >
          <div className="flex items-center gap-2 min-w-max">
            {CATEGORIES.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  id={`cat-btn-${cat.toLowerCase()}`}
                  onClick={() => handleCategoryClick(cat)}
                  aria-pressed={isActive}
                  className={`h-10 min-h-[44px] sm:min-h-0 px-4 sm:px-5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] shrink-0 cursor-pointer transition-all duration-250 ${
                    isActive
                      ? 'bg-[#141414] text-[#F2F0EB] shadow-xs'
                      : 'bg-[#E8E6E1] text-[#6E6B65] hover:text-[#141414] hover:bg-[#E0DDD6]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================
          04 — FILTER + SORT + PRODUCT COUNT
      ========================================================= */}
      <div className="w-full bg-[#F2F0EB] border-b border-[#E3DEC3] py-3">
        <div className="piercyn-container flex items-center justify-between gap-3">

          {/* Filter + Sort Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="new-filter-btn"
              ref={filterTriggerRef}
              onClick={handleOpenFilter}
              aria-expanded={isFilterOpen}
              aria-controls="new-arrivals-filter-panel"
              className="h-11 min-h-[44px] px-5 rounded-full border border-[#D5CFBF] text-[11px] font-bold uppercase tracking-[0.16em] text-[#141414] hover:bg-[#E8E6E1] transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              FILTER{activeSizes.length > 0 ? ` · ${activeSizes.length}` : ''}
            </button>

            <div className="relative">
              <button
                id="new-sort-btn"
                onClick={() => setIsSortOpen(!isSortOpen)}
                aria-expanded={isSortOpen}
                aria-controls="new-arrivals-sort-options"
                className="h-11 min-h-[44px] px-5 rounded-full border border-[#D5CFBF] text-[11px] font-bold uppercase tracking-[0.16em] text-[#141414] hover:bg-[#E8E6E1] transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SORT:</span> {sortButtonLabel}
              </button>

              {isSortOpen && (
                <div id="new-arrivals-sort-options" role="group" aria-label="Sort new arrivals" className="absolute left-0 top-full mt-2 z-50 bg-[#F2F0EB] border border-[#E3DEC3] rounded-xl shadow-lg overflow-hidden min-w-[220px]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setSortKey(opt.key); setIsSortOpen(false); }}
                      aria-pressed={sortKey === opt.key}
                      className={`w-full text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] cursor-pointer transition-colors ${
                        sortKey === opt.key ? 'bg-[#141414] text-[#F2F0EB]' : 'text-[#141414] hover:bg-[#E8E6E1]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Count */}
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#6E6B65] hidden sm:block">
            {sorted.length} NEW PIECES
          </span>
        </div>
      </div>

      {/* =========================================================
          05 — PRODUCT GRID: FIRST 8
      ========================================================= */}
      <section ref={gridRef} className="w-full bg-[#F2F0EB] py-10 sm:py-14 scroll-mt-28 sm:scroll-mt-32">
        <div className="piercyn-container">
          {/* Mobile count */}
          <p className="sm:hidden text-[11px] font-mono uppercase tracking-[0.2em] text-[#6E6B65] mb-6">
            {sorted.length} NEW PIECES
          </p>

          {catalogError && products.length === 0 && !isLoading ? (
            <div className="py-24 text-center space-y-5" role="alert">
              <h2 className="font-editorial text-4xl sm:text-5xl uppercase tracking-[-0.02em] text-[#141414]">
                WE COULDN'T<br />
                <span className="italic font-light text-[#6E6B65]">LOAD THE DROP.</span>
              </h2>
              <p className="font-sans text-[15px] text-[#4A4844]">{catalogError}</p>
              <button
                onClick={() => void refreshProducts()}
                className="h-12 px-8 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all cursor-pointer"
              >
                TRY AGAIN
              </button>
            </div>
          ) : sorted.length === 0 && !isLoading ? (
            /* Empty State */
            <div className="py-28 text-center space-y-5">
              <h2 className="font-editorial text-4xl sm:text-5xl uppercase tracking-[-0.02em] text-[#141414]">
                {activeCategory !== 'ALL' || activeSizes.length > 0 ? 'NO MATCHES' : 'NOTHING NEW'}<br />
                <span className="italic font-light text-[#6E6B65]">RIGHT NOW.</span>
              </h2>
              <p className="font-sans text-[15px] text-[#4A4844]">
                {activeCategory !== 'ALL' || activeSizes.length > 0 ? 'Try another category or clear your filters.' : 'Explore the latest PIERCYN collection.'}
              </p>
              {activeCategory !== 'ALL' || activeSizes.length > 0 ? (
                <button
                  onClick={() => { setActiveCategory('ALL'); setActiveSizes([]); }}
                  className="h-12 px-8 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all cursor-pointer shadow-xs"
                >
                  CLEAR FILTERS
                </button>
              ) : (
                <button
                  onClick={() => onSelectPage('collections')}
                  className="h-12 px-8 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  SHOP COLLECTIONS →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-2.5 sm:gap-x-5 gap-y-8 sm:gap-y-10">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
                : firstGrid.map((p, i) => <NewProductCard key={p.id} product={p} index={i} />)
              }
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          06 — EDITORIAL DROP FEATURE (between grid rows)
      ========================================================= */}
      <section className="w-full bg-[#141414] text-[#F2F0EB] py-20 sm:py-28 overflow-hidden select-none">
        <div className="piercyn-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

            {/* Large Campaign Image (~65% width) */}
            <div className="lg:col-span-8 relative aspect-[4/5] sm:aspect-[16/10] bg-[#1E1E1E] rounded-2xl overflow-hidden group border border-white/10 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=88&w=1600&auto=format&fit=crop"
                alt="Model wearing contemporary streetwear in an editorial setting"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                loading="lazy"
                width={1600}
                height={1000}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-[10px] font-mono tracking-[0.25em] uppercase text-[#E3DEC3]">
                PIERCYN ATELIER — LAGOS
              </div>
            </div>

            {/* Editorial Text */}
            <div className="lg:col-span-4 space-y-6">
              <div>
                <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#A48B71] block mb-3">THE LATEST EDIT</span>
                <h2 className="font-editorial text-4xl sm:text-5xl lg:text-5xl xl:text-6xl uppercase tracking-[-0.03em] leading-[0.9] text-[#F2F0EB]">
                  THE PIECES<br />
                  <span className="italic font-light text-[#E3DEC3]">YOU'LL NOTICE.</span>
                </h2>
              </div>

              <p className="font-sans text-[14px] sm:text-[15px] text-[#E3DEC3]/80 leading-relaxed">
                Designed to stand out without asking for attention. Explore the newest pieces from PIERCYN, born in Lagos and made for everywhere.
              </p>

              <button
                onClick={() => onSelectPage('collections')}
                className="group h-12 min-h-[48px] px-7 rounded-full bg-[#F2F0EB] text-[#141414] text-[11px] uppercase font-bold tracking-[0.2em] hover:bg-white transition-all duration-300 inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <span>EXPLORE THE DROP</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          07 — SECOND PRODUCT SECTION: STILL FRESH
      ========================================================= */}
      {secondGrid.length > 0 && (
        <section className="w-full bg-[#F2F0EB] py-14 sm:py-20 border-b border-[#E3DEC3]/70">
          <div className="piercyn-container space-y-8 sm:space-y-10">
            <div className="border-b border-[#E3DEC3] pb-5">
              <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-semibold block mb-1">02 / MORE NEW</span>
              <h2 className="font-editorial text-4xl sm:text-5xl uppercase tracking-[-0.025em]">
                STILL<br /><span className="italic font-light text-[#6E6B65]">FRESH.</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-2.5 sm:gap-x-5 gap-y-8 sm:gap-y-10">
              {secondGrid.map((p, i) => <NewProductCard key={p.id} product={p} index={i + 8} />)}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          08 — MORE TO EXPLORE
      ========================================================= */}
      <section className="w-full bg-[#E8E6E1] py-20 sm:py-28 border-b border-[#DAD8D1] overflow-hidden">
        <div className="piercyn-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Editorial collection image */}
            <div className="relative aspect-[4/5] sm:aspect-[16/11] bg-[#D5CFBF] rounded-2xl overflow-hidden shadow-sm order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1400&auto=format&fit=crop"
                alt="Contemporary streetwear lookbook image"
                className="w-full h-full object-cover"
                loading="lazy"
                width={1400}
                height={875}
              />
              <div className="absolute inset-0 bg-[#141414]/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-mono tracking-[0.35em] uppercase text-[#F2F0EB] bg-black/60 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/20">
                  MORE TO EXPLORE
                </span>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-6 order-1 lg:order-2">
              <div>
                <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#6E6B65] font-semibold font-sans block mb-3">THE FULL COLLECTION</span>
                <h2 className="font-editorial text-5xl sm:text-6xl lg:text-7xl uppercase tracking-[-0.03em] leading-[0.9] text-[#141414]">
                  MORE TO<br />
                  <span className="italic font-light text-[#4A4844]">DISCOVER.</span>
                </h2>
              </div>

              <p className="font-sans text-[15px] sm:text-[17px] text-[#4A4844] leading-relaxed max-w-md">
                The newest edit is only one part of PIERCYN. Explore the collections and find the pieces that fit your everyday.
              </p>

              <button
                onClick={() => onSelectPage('collections')}
                className="group h-12 min-h-[48px] px-8 rounded-full border border-[#141414] text-[#141414] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#141414] hover:text-[#F2F0EB] transition-all duration-300 inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>EXPLORE COLLECTIONS</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          09 — FINAL CTA
      ========================================================= */}
      <section className="w-full bg-[#F2F0EB] py-24 sm:py-32 lg:py-44 text-center border-b border-[#E3DEC3]/70">
        <div className="piercyn-container max-w-2xl mx-auto space-y-7 sm:space-y-8">
          <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.3em] text-[#141414]/70 font-semibold font-sans">
            PIERCYN ATELIER / LAGOS • WORLDWIDE
          </span>

          <h2 className="font-editorial text-[12vw] sm:text-[9vw] lg:text-[6.5vw] xl:text-[88px] leading-[0.88] tracking-[-0.035em] uppercase text-[#141414]">
            <span className="block">MISSED</span>
            <span className="block">THE<span className="italic font-light text-[#4A4844]"> DROP</span><span className="text-[#A48B71]">?</span></span>
          </h2>

          <p className="font-sans text-[15px] sm:text-[17px] text-[#4A4844] leading-relaxed">
            Explore the full PIERCYN collection.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => onSelectPage('men')}
              className="w-full sm:w-auto h-12 min-h-[48px] px-9 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              SHOP MEN →
            </button>
            <button
              onClick={() => onSelectPage('collections')}
              className="w-full sm:w-auto h-12 min-h-[48px] px-9 rounded-full border border-[#141414] text-[#141414] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#141414] hover:text-[#F2F0EB] transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              EXPLORE COLLECTIONS →
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          FILTER BOTTOM SHEET
      ========================================================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}>
          <div
            ref={filterDialogRef}
            id="new-arrivals-filter-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-arrivals-filter-title"
            tabIndex={-1}
            className="relative w-full bg-[#F2F0EB] rounded-t-2xl shadow-2xl border-t border-[#E3DEC3] max-h-[80svh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="sticky top-0 bg-[#F2F0EB] flex items-center justify-between px-6 py-4 border-b border-[#E3DEC3]">
              <h3 id="new-arrivals-filter-title" className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#141414]">FILTER NEW ARRIVALS</h3>
              <button type="button" onClick={() => setIsFilterOpen(false)} aria-label="Close filters" className="w-11 h-11 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4 text-[#141414]" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-8">
              {/* Category */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#6E6B65] mb-4">CATEGORY</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setDraftCategory(cat)}
                      aria-pressed={draftCategory === cat}
                      className={`h-10 min-h-[44px] px-4 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] cursor-pointer transition-all ${
                        draftCategory === cat ? 'bg-[#141414] text-[#F2F0EB]' : 'bg-[#E8E6E1] text-[#6E6B65] hover:text-[#141414]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <p id="new-arrivals-size-label" className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#6E6B65] mb-4">SIZE</p>
                <div className="flex flex-wrap gap-2" aria-labelledby="new-arrivals-size-label">
                  {availableSizes.length > 0 ? availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleToggleDraftSize(size)}
                      aria-pressed={draftSizes.includes(size)}
                      className={`h-11 min-w-11 px-3 rounded-lg text-[12px] font-bold uppercase cursor-pointer transition-colors ${
                        draftSizes.includes(size) ? 'bg-[#141414] text-[#F2F0EB]' : 'bg-[#E8E6E1] text-[#141414] hover:bg-[#141414] hover:text-[#F2F0EB]'
                      }`}
                    >
                      {size}
                    </button>
                  )) : <p className="text-sm text-[#6E6B65]">No sizes are currently available.</p>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-[#F2F0EB] border-t border-[#E3DEC3] px-6 py-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('ALL');
                  setActiveSizes([]);
                  setDraftCategory('ALL');
                  setDraftSizes([]);
                  setIsFilterOpen(false);
                }}
                className="flex-1 h-12 rounded-full border border-[#141414] text-[11px] font-bold uppercase tracking-[0.2em] text-[#141414] cursor-pointer hover:bg-[#E8E6E1] transition-colors"
              >
                CLEAR ALL
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="flex-1 h-12 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] font-bold uppercase tracking-[0.2em] cursor-pointer hover:bg-black transition-colors"
              >
                APPLY FILTERS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort Close on outside click */}
      {isSortOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
      )}

    </main>
  );
};
