import React from 'react';
import { Product, ActivePageView } from '../types';
import { ProductCard } from './ProductCard';
import { ArrowRight } from 'lucide-react';

interface JustDroppedSectionProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onSelectPage?: (page: ActivePageView) => void;
}

export const JustDroppedSection: React.FC<JustDroppedSectionProps> = ({
  products,
  onViewProduct,
  onSelectPage,
}) => {
  const justDropped = products.filter((p) => p.isNewDrop).slice(0, 4);

  return (
    <section
      id="just-dropped-section"
      className="w-full bg-[#F2F0EB] text-[#141414] py-12 sm:py-16 lg:py-20 border-b border-[#DAD8D1]/70"
    >
      <div className="piercyn-container">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-10 pb-3 border-b border-[#DAD8D1]/60">
          <div>
            <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] block mb-1">
              LATEST ARRIVALS
            </span>
            <h2 className="font-editorial text-2xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#141414]">
              JUST DROPPED
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#6E6B65] mt-1">
              New pieces worth seeing.
            </p>
          </div>

          <button
            onClick={() => onSelectPage && onSelectPage('new')}
            className="group min-h-[44px] flex items-center gap-1.5 text-xs font-sans font-bold tracking-[0.12em] uppercase text-[#141414] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <span>SEE ALL</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* 4-col desktop, 2-col mobile product grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {justDropped.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewProduct={onViewProduct}
              priority={idx < 2}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
