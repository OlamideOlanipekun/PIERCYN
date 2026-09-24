import React from 'react';
import { Product, ActivePageView } from '../types';
import { ProductCard } from './ProductCard';
import { ArrowRight } from 'lucide-react';

interface AffordableDiscoverySectionProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onSelectPage?: (page: ActivePageView) => void;
  priceThresholdNGN?: number;
}

export const AffordableDiscoverySection: React.FC<AffordableDiscoverySectionProps> = ({
  products,
  onViewProduct,
  onSelectPage,
  priceThresholdNGN = 15000,
}) => {
  const affordableProducts = products.every((p) => (p.priceNGN || 0) <= priceThresholdNGN)
    ? products
    : products
        .filter((p) => (p.priceNGN || 0) <= priceThresholdNGN)
        .map((p) => ({
          ...p,
          tag: 'UNDER ₦15K',
        }));

  // Never render if fewer than 3 qualify
  if (affordableProducts.length < 3) return null;

  return (
    <section
      id="affordable-discovery-section"
      className="w-full bg-[#EAE5D9]/50 text-[#141414] py-12 sm:py-16 lg:py-20 border-b border-[#DAD8D1]/70"
    >
      <div className="piercyn-container">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-10 pb-3 border-b border-[#DAD8D1]/60">
          <div>
            <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] font-bold block mb-1">
              ACCESSIBLE ESSENTIALS
            </span>
            <h2 className="font-editorial text-2xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#141414]">
              GOOD LOOKS UNDER ₦15K
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#6E6B65] mt-1">
              Everyday staples and clean cuts that respect your budget.
            </p>
          </div>

          <button
            onClick={() => onSelectPage && onSelectPage('shop')}
            className="group min-h-[44px] flex items-center gap-1.5 text-xs font-sans font-bold tracking-[0.12em] uppercase text-[#141414] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <span>EXPLORE DEALS</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Mobile: Horizontal scroll-snap carousel with peek | Desktop: 4-col grid */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {affordableProducts.slice(0, 4).map((product, idx) => (
            <div
              key={product.id}
              className="w-[72vw] sm:w-auto shrink-0 sm:shrink snap-start"
            >
              <ProductCard
                product={product}
                onViewProduct={onViewProduct}
                priority={idx < 2}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
