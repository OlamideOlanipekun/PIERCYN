import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, SlidersHorizontal, ArrowUpDown, X, Heart, Zap } from 'lucide-react';
import { ALL_PRODUCTS } from '../data/allProducts';
import { formatPrice } from '../utils/currency';
import { useShop } from '../context/ShopContext';
import { Product, ProductCategory } from '../types';

// ---------- CONFIGURABLE LOGIC ----------
const NEW_PRODUCT_WINDOW_DAYS = 30; // Any product with isNewDrop OR released within 30d is "new"

type NewCategory = 'ALL' | 'MEN' | 'WOMEN' | 'HOODIES' | 'SWEATSHIRTS' | 'T-SHIRTS' | 'TOPS' | 'POLOS' | 'JACKETS' | 'TROUSERS' | 'DENIM' | 'ACCESSORIES';

const CATEGORIES: NewCategory[] = ['ALL', 'MEN', 'WOMEN', 'HOODIES', 'SWEATSHIRTS', 'T-SHIRTS', 'TOPS', 'POLOS', 'JACKETS', 'TROUSERS', 'DENIM', 'ACCESSORIES'];

type SortKey = 'FEATURED' | 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'FEATURED', label: 'FEATURED' },
  { key: 'NEWEST', label: 'NEWEST FIRST' },
  { key: 'PRICE_ASC', label: 'PRICE: LOW TO HIGH' },
  { key: 'PRICE_DESC', label: 'PRICE: HIGH TO LOW' },
];

// Maps NewCategory → ProductCategory array for filtering
const CATEGORY_MAP: Record<NewCategory, ProductCategory[]> = {
  ALL: [],
  MEN: ['hoodies', 'sweatshirts', 't-shirts', 'polos', 'jackets', 'trousers', 'jeans', 'accessories'],
  WOMEN: ['hoodies', 'sweatshirts', 'tees', 'outerwear', 'accessories'],
  HOODIES: ['hoodies'],
  SWEATSHIRTS: ['sweatshirts'],
  'T-SHIRTS': ['t-shirts', 'tees'],
  TOPS: ['tees', 't-shirts'],
  POLOS: ['polos'],
  JACKETS: ['jackets', 'outerwear'],
  TROUSERS: ['trousers'],
  DENIM: ['jeans'],
  ACCESSORIES: ['accessories'],
};

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
  const isNew = product.isNewDrop;
  const isFeatured = product.isBestSeller;
  const displayImage = isHovered && product.colors[0]?.altImage
    ? product.colors[0].altImage
    : product.colors[0]?.image || product.images[0];

  return (
    <div
      className="group flex flex-col cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setQuickViewProduct(product)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E7E2D6] rounded-xl mb-3 shadow-2xs">
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
          loading={index < 4 ? 'eager' : 'lazy'}
          width={600}
          height={750}
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
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
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted(product.id) ? 'fill-[#141414] text-[#141414]' : 'text-[#141414]'}`} />
        </button>

        {/* Quick View */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <div className="w-full h-9 rounded-full bg-[#F2F0EB]/95 backdrop-blur-md text-[#141414] text-[10px] font-sans font-bold uppercase tracking-[0.2em] flex items-center justify-center shadow-sm">
            QUICK VIEW
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="font-sans space-y-0.5">
        <h3 className="text-[12px] sm:text-[13px] uppercase tracking-[0.04em] font-semibold text-[#141414] line-clamp-1 group-hover:underline">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-[12px] sm:text-[13px] font-semibold text-[#141414]">
            {formatPrice(product, currency)}
          </span>
          {product.colors.length > 1 && (
            <div className="flex gap-1">
              {product.colors.slice(0, 3).map((c) => (
                <span key={c.name} className="w-3 h-3 rounded-full border border-[#D5CFBF]" style={{ backgroundColor: c.hex }} title={c.name} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- MAIN PAGE ----------
export const NewArrivalsPage: React.FC<NewArrivalsPageProps> = ({ onSelectPage }) => {
  const { showToast } = useShop();
  const [activeCategory, setActiveCategory] = useState<NewCategory>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('FEATURED');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Filter products to "new" — products with isNewDrop flag (configurable window logic placeholder)
  const allNewProducts = ALL_PRODUCTS.filter((p) => p.isNewDrop === true);

  // Category filter
  const categoryFiltered = activeCategory === 'ALL'
    ? allNewProducts
    : allNewProducts.filter((p) => CATEGORY_MAP[activeCategory].includes(p.category));

  // Sort
  const sorted = [...categoryFiltered].sort((a, b) => {
    if (sortKey === 'PRICE_ASC') return a.priceNGN - b.priceNGN;
    if (sortKey === 'PRICE_DESC') return b.priceNGN - a.priceNGN;
    // FEATURED/NEWEST: bestseller first, then featured tag
    if (a.isBestSeller && !b.isBestSeller) return -1;
    if (!a.isBestSeller && b.isBestSeller) return 1;
    return 0;
  });

  // Split into first 8 and rest (editorial break after row 2 on desktop)
  const firstGrid = sorted.slice(0, 8);
  const secondGrid = sorted.slice(8);

  const handleScrollToGrid = () => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoryClick = (cat: NewCategory) => {
    setActiveCategory(cat);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 400);
  };

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
            alt="PIERCYN New Arrivals Drop 04 Campaign"
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
            <span className="text-[#A48B71]">DROP 04</span>
          </div>

          {/* Headline */}
          <div className="max-w-4xl space-y-3 sm:space-y-4">
            <h1 className="font-editorial text-[13vw] sm:text-[9vw] lg:text-[7.5vw] xl:text-[96px] leading-[0.87] tracking-[-0.035em] uppercase text-[#F2F0EB]">
              <div>JUST</div>
              <div className="italic font-light text-[#E3DEC3]">DROPPED<span className="not-italic text-[#A48B71]">.</span></div>
            </h1>

            <p className="font-sans text-[13px] sm:text-[16px] text-[#E3DEC3]/90 font-normal tracking-[0.03em] max-w-sm leading-relaxed">
              The latest PIERCYN pieces have arrived.
            </p>

            <div className="pt-2">
              <button
                onClick={handleScrollToGrid}
                className="group h-12 min-h-[48px] px-8 rounded-full bg-[#F2F0EB] text-[#141414] text-[11px] sm:text-[12px] uppercase font-bold tracking-[0.2em] hover:bg-white transition-all duration-300 inline-flex items-center gap-2.5 cursor-pointer shadow-md active:scale-95"
              >
                <span>SHOP THE DROP</span>
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

          {/* Drop metadata */}
          <div className="flex flex-row lg:flex-col gap-6 lg:gap-3 shrink-0 text-right">
            <div className="font-sans space-y-0.5">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#6E6B65]">Release</div>
              <div className="text-[14px] font-semibold text-[#141414] uppercase tracking-[0.08em]">Drop 04</div>
            </div>
            <div className="font-sans space-y-0.5">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#6E6B65]">Month</div>
              <div className="text-[14px] font-semibold text-[#141414] uppercase tracking-[0.08em]">August 2026</div>
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
        ref={gridRef}
        className="sticky top-14 sm:top-16 z-30 bg-[#F2F0EB]/95 backdrop-blur-md border-b border-[#E3DEC3]"
      >
        <div
          ref={categoryScrollRef}
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
              onClick={() => setIsFilterOpen(true)}
              className="h-11 min-h-[44px] px-5 rounded-full border border-[#D5CFBF] text-[11px] font-bold uppercase tracking-[0.16em] text-[#141414] hover:bg-[#E8E6E1] transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              FILTER
            </button>

            <div className="relative">
              <button
                id="new-sort-btn"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="h-11 min-h-[44px] px-5 rounded-full border border-[#D5CFBF] text-[11px] font-bold uppercase tracking-[0.16em] text-[#141414] hover:bg-[#E8E6E1] transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SORT:</span> {sortKey === 'PRICE_ASC' ? 'PRICE ↑' : sortKey === 'PRICE_DESC' ? 'PRICE ↓' : sortKey}
              </button>

              {isSortOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 bg-[#F2F0EB] border border-[#E3DEC3] rounded-xl shadow-lg overflow-hidden min-w-[220px]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setSortKey(opt.key); setIsSortOpen(false); }}
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
      <section className="w-full bg-[#F2F0EB] py-10 sm:py-14">
        <div className="piercyn-container">
          {/* Mobile count */}
          <p className="sm:hidden text-[11px] font-mono uppercase tracking-[0.2em] text-[#6E6B65] mb-6">
            {sorted.length} NEW PIECES
          </p>

          {sorted.length === 0 && !isLoading ? (
            /* Empty State */
            <div className="py-28 text-center space-y-5">
              <h2 className="font-editorial text-4xl sm:text-5xl uppercase tracking-[-0.02em] text-[#141414]">
                NOTHING NEW<br />
                <span className="italic font-light text-[#6E6B65]">RIGHT NOW.</span>
              </h2>
              <p className="font-sans text-[15px] text-[#4A4844]">Explore the latest PIERCYN collection.</p>
              <button
                onClick={() => onSelectPage('collections')}
                className="h-12 px-8 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
              >
                SHOP COLLECTIONS →
              </button>
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
                alt="PIERCYN Drop 04 Editorial Campaign"
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
                <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#A48B71] block mb-3">DROP 04 / AUGUST 2026</span>
                <h2 className="font-editorial text-4xl sm:text-5xl lg:text-5xl xl:text-6xl uppercase tracking-[-0.03em] leading-[0.9] text-[#F2F0EB]">
                  THE PIECES<br />
                  <span className="italic font-light text-[#E3DEC3]">YOU'LL NOTICE.</span>
                </h2>
              </div>

              <p className="font-sans text-[14px] sm:text-[15px] text-[#E3DEC3]/80 leading-relaxed">
                Designed to stand out without asking for attention. Drop 04 is built from heavyweight Lagos-sourced materials for people who lead without announcing it.
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
          08 — COMING SOON / NEXT DROP
      ========================================================= */}
      <section className="w-full bg-[#E8E6E1] py-20 sm:py-28 border-b border-[#DAD8D1] overflow-hidden">
        <div className="piercyn-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Preview Image — blurred/mysterious */}
            <div className="relative aspect-[4/5] sm:aspect-[16/11] bg-[#D5CFBF] rounded-2xl overflow-hidden shadow-sm order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1400&auto=format&fit=crop"
                alt="Next PIERCYN drop preview"
                className="w-full h-full object-cover filter blur-md scale-[1.05]"
                loading="lazy"
                width={1400}
                height={875}
              />
              <div className="absolute inset-0 bg-[#141414]/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-mono tracking-[0.35em] uppercase text-[#F2F0EB] bg-black/60 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/20">
                  COMING SOON
                </span>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-6 order-1 lg:order-2">
              <div>
                <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#6E6B65] font-semibold font-sans block mb-3">NEXT UP</span>
                <h2 className="font-editorial text-5xl sm:text-6xl lg:text-7xl uppercase tracking-[-0.03em] leading-[0.9] text-[#141414]">
                  SOMETHING<br />
                  <span className="italic font-light text-[#4A4844]">IS COMING.</span>
                </h2>
              </div>

              <p className="font-sans text-[15px] sm:text-[17px] text-[#4A4844] leading-relaxed max-w-md">
                Stay close for the next PIERCYN release. New materials. New directions. Same uncompromising Lagos standard.
              </p>

              <button
                onClick={() => showToast('Subscribed to PIERCYN drop notifications.')}
                className="group h-12 min-h-[48px] px-8 rounded-full border border-[#141414] text-[#141414] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#141414] hover:text-[#F2F0EB] transition-all duration-300 inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>STAY CLOSE →</span>
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
            <div>MISSED</div>
            <div>THE<span className="italic font-light text-[#4A4844]"> DROP</span><span className="text-[#A48B71]">?</span></div>
          </h2>

          <p className="font-sans text-[15px] sm:text-[17px] text-[#4A4844] leading-relaxed">
            Explore the full PIERCYN collection.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => onSelectPage('men')}
              className="w-full sm:w-auto h-12 min-h-[48px] px-9 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              SHOP ALL →
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
            className="relative w-full bg-[#F2F0EB] rounded-t-2xl shadow-2xl border-t border-[#E3DEC3] max-h-[80svh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="sticky top-0 bg-[#F2F0EB] flex items-center justify-between px-6 py-4 border-b border-[#E3DEC3]">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#141414]">FILTER</h3>
              <button onClick={() => setIsFilterOpen(false)} className="w-10 h-10 flex items-center justify-center cursor-pointer">
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
                      onClick={() => { setActiveCategory(cat); setIsFilterOpen(false); }}
                      className={`h-10 min-h-[44px] px-4 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] cursor-pointer transition-all ${
                        activeCategory === cat ? 'bg-[#141414] text-[#F2F0EB]' : 'bg-[#E8E6E1] text-[#6E6B65] hover:text-[#141414]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#6E6B65] mb-4">SIZE</p>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                    <button key={s} className="h-10 min-h-[44px] w-14 rounded-lg text-[12px] font-bold uppercase bg-[#E8E6E1] text-[#141414] cursor-pointer hover:bg-[#141414] hover:text-[#F2F0EB] transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-[#F2F0EB] border-t border-[#E3DEC3] px-6 py-4 flex items-center gap-3">
              <button
                onClick={() => { setActiveCategory('ALL'); setIsFilterOpen(false); }}
                className="flex-1 h-12 rounded-full border border-[#141414] text-[11px] font-bold uppercase tracking-[0.2em] text-[#141414] cursor-pointer hover:bg-[#E8E6E1] transition-colors"
              >
                CLEAR ALL
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
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
