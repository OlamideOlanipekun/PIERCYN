import React from 'react';
import { Product } from '../../types';
import { WomenProductCard } from './WomenProductCard';
import { WomenEditorialBreak } from './WomenEditorialBreak';
import { RotateCcw } from 'lucide-react';

interface WomenProductGridProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onClearFilters: () => void;
  onExploreEditorial: () => void;
}

export const WomenProductGrid: React.FC<WomenProductGridProps> = ({
  products,
  onViewProduct,
  onClearFilters,
  onExploreEditorial
}) => {
  // If no products match the current filters
  if (products.length === 0) {
    return (
      <div 
        id="women-no-products" 
        className="piercyn-container py-24 sm:py-32 text-center space-y-6"
      >
        <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#8C887B]">
          0 PIECES FOUND
        </span>
        <h3 className="font-editorial text-2xl sm:text-3xl uppercase tracking-tight text-[#141414]">
          NO PIECES MATCH YOUR CURRENT SELECTION
        </h3>
        <p className="text-sm font-sans text-[#706E6B] max-w-md mx-auto">
          Try expanding your size or color criteria to view available pieces in our current womenswear drop.
        </p>
        <div>
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-sans uppercase tracking-[0.18em] font-semibold hover:bg-black transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET ALL FILTERS</span>
          </button>
        </div>
      </div>
    );
  }

  // Split into batches to cleanly insert the editorial break around product 8 if there are enough items
  const firstBatch = products.slice(0, 8);
  const secondBatch = products.slice(8);

  return (
    <div id="women-collection-grid" className="w-full pb-16 sm:pb-24">
      {/* First Grid Batch */}
      <div className="piercyn-container">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-8 sm:gap-y-12">
          {firstBatch.map((product) => (
            <WomenProductCard
              key={product.id}
              product={product}
              onViewProduct={onViewProduct}
            />
          ))}
        </div>
      </div>

      {/* Mid-Grid Asymmetrical Editorial Break */}
      <WomenEditorialBreak onExploreCollection={onExploreEditorial} />

      {/* Second Grid Batch (if any) */}
      {secondBatch.length > 0 && (
        <div className="piercyn-container">
          <div className="mb-6 flex items-center justify-between border-b border-[#E2DDD3] pb-3">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#706E6B]">
              02 / THE EDIT: ATELIER PIECES
            </span>
            <span className="text-[11px] font-mono tracking-widest text-[#141414] font-semibold">
              {secondBatch.length} ADDITIONAL {secondBatch.length === 1 ? 'PIECE' : 'PIECES'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-8 sm:gap-y-12">
            {secondBatch.map((product) => (
              <WomenProductCard
                key={product.id}
                product={product}
                onViewProduct={onViewProduct}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
