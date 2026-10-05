import React from 'react';
import { Product } from '../../types';
import { MenProductCard } from './MenProductCard';
import { MenEditorialBreak } from './MenEditorialBreak';
import { Sparkles, RefreshCw } from 'lucide-react';

interface MenProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onViewProduct: (product: Product) => void;
  onClearFilters: () => void;
  onShopEveryday: () => void;
}

export const MenProductGrid: React.FC<MenProductGridProps> = ({
  products,
  isLoading = false,
  onViewProduct,
  onClearFilters,
  onShopEveryday
}) => {

  // Loading skeleton placeholder state
  if (isLoading) {
    return (
      <section className="w-full py-8 sm:py-12">
        <div className="piercyn-container">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="flex flex-col space-y-3 animate-pulse">
                <div className="w-full aspect-[4/5] rounded-[10px] bg-[#E5DFD1]" />
                <div className="h-4 bg-[#E5DFD1] rounded w-3/4" />
                <div className="h-3 bg-[#E5DFD1] rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Empty state when filters produce no products
  if (products.length === 0) {
    return (
      <section 
        id="men-empty-state"
        className="w-full py-20 sm:py-28 text-center bg-[#F2F0EB]"
      >
        <div className="piercyn-container max-w-md mx-auto space-y-6">
          <div className="w-12 h-12 rounded-full border border-[#141414]/20 flex items-center justify-center mx-auto text-[#141414]">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="space-y-2">
            <h3 className="font-editorial text-3xl sm:text-4xl uppercase tracking-[-0.02em] text-[#141414]">
              NOTHING HERE <br />
              <span className="italic font-light">YET.</span>
            </h3>
            <p className="text-xs sm:text-sm font-sans text-[#6E6B65] leading-relaxed">
              Try another filter combination or explore the complete PIERCYN men's collection.
            </p>
          </div>

          <div>
            <button
              onClick={onClearFilters}
              className="h-12 min-h-[48px] px-8 rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] uppercase font-sans font-bold tracking-[0.18em] hover:bg-black transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>VIEW ALL MEN</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Split into first batch and second batch if we have more than 8 products
  const hasEditorialBreak = products.length >= 8;
  const firstBatch = hasEditorialBreak ? products.slice(0, 8) : products;
  const secondBatch = hasEditorialBreak ? products.slice(8) : [];

  return (
    <div id="men-product-catalog-grid" className="w-full pt-6 pb-12 sm:pb-16 md:pb-20">
      
      {/* First Product Batch (4 columns desktop, 3 tablet, 2 mobile) */}
      <section className="w-full">
        <div className="piercyn-container">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
            {firstBatch.map((product) => (
              <MenProductCard
                key={product.id}
                product={product}
                onViewProduct={onViewProduct}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Break after approx 8 products */}
      {hasEditorialBreak && (
        <>
          <MenEditorialBreak onShopEveryday={onShopEveryday} />

          {/* Second Product Section Header */}
          {secondBatch.length > 0 && (
            <section className="w-full pt-4 sm:pt-8 pb-6 sm:pb-8">
              <div className="piercyn-container">
                <div className="border-b border-[#DAD8D1] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono tracking-[0.25em] text-[#6E6B65] uppercase font-semibold block mb-1">
                      02 / THE COLLECTION
                    </span>
                    <h3 className="font-editorial text-2xl sm:text-3xl lg:text-4xl uppercase tracking-[-0.02em] text-[#141414]">
                      BUILT FOR <span className="italic font-light">EVERY DAY.</span>
                    </h3>
                  </div>
                  <span className="text-[11px] font-sans tracking-[0.14em] uppercase text-[#6E6B65] font-medium">
                    HEAVYWEIGHT BASICS & TAILORED DENIM
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Second Product Batch Grid */}
          {secondBatch.length > 0 && (
            <section className="w-full">
              <div className="piercyn-container">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
                  {secondBatch.map((product) => (
                    <MenProductCard
                      key={product.id}
                      product={product}
                      onViewProduct={onViewProduct}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

    </div>
  );
};
