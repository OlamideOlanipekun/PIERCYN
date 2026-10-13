import React from 'react';
import { Product, ActivePageView } from '../types';
import { ProductCard } from './ProductCard';
import { ArrowRight, Truck, Clock, ShieldCheck } from 'lucide-react';

interface AvailabilitySectionsProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onSelectPage: (page: ActivePageView) => void;
  onFilterAvailability?: (type: 'in_stock' | 'available_to_order') => void;
}

export const InStockShowcaseSection: React.FC<AvailabilitySectionsProps> = ({
  products,
  onViewProduct,
  onSelectPage,
  onFilterAvailability,
}) => {
  const inStockPieces = products
    .filter((p) => !p.isSoldOut && p.availabilityType !== 'available_to_order')
    .slice(0, 4);

  if (inStockPieces.length === 0) return null;

  const handleExploreInStock = () => {
    if (onFilterAvailability) onFilterAvailability('in_stock');
    onSelectPage('shop');
  };

  return (
    <section
      id="in-stock-section"
      className="w-full bg-[#F2F0EB] text-[#141414] py-14 sm:py-20 border-t border-[#DAD8D1]"
    >
      <div className="piercyn-container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 pb-4 border-b border-[#DAD8D1]/80 gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#4E8C5E] animate-pulse" />
              <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#3F6E4D] font-bold">
                PHYSICAL ATELIER INVENTORY · DISPATCH 24–48H
              </span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#141414] leading-[0.98]">
              IN-STOCK PIECES
            </h2>
            <p className="mt-3 text-[13px] sm:text-[14px] text-[#55524D] leading-relaxed">
              Finished garments currently held in our Lagos studio. Inspected, tagged, and ready for immediate courier dispatch across Nigeria.
            </p>
          </div>

          <button
            onClick={handleExploreInStock}
            className="group min-h-[44px] flex items-center gap-2 text-xs font-sans font-bold tracking-[0.14em] uppercase text-[#141414] hover:opacity-75 transition-opacity cursor-pointer self-start md:self-end whitespace-nowrap"
          >
            <span>VIEW ALL IN-STOCK</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {inStockPieces.map((product, idx) => (
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

export const AvailableToOrderShowcaseSection: React.FC<AvailabilitySectionsProps> = ({
  products,
  onViewProduct,
  onSelectPage,
  onFilterAvailability,
}) => {
  const availableToOrderPieces = products
    .filter((p) => !p.isSoldOut && p.availabilityType === 'available_to_order')
    .slice(0, 4);

  if (availableToOrderPieces.length === 0) return null;

  const handleExploreAvailableToOrder = () => {
    if (onFilterAvailability) onFilterAvailability('available_to_order');
    onSelectPage('shop');
  };

  return (
    <section
      id="available-to-order-section"
      className="w-full bg-[#141414] text-[#F2F0EB] py-14 sm:py-20 border-t border-[#2A2A2A]"
    >
      <div className="piercyn-container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 pb-4 border-b border-[#2A2A2A] gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#B89355]" />
              <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#C8A870] font-bold">
                CRAFT SOURCING · DISPATCH 5–7 BUSINESS DAYS
              </span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#F2F0EB] leading-[0.98]">
              AVAILABLE TO ORDER
            </h2>
            <p className="mt-3 text-[13px] sm:text-[14px] text-[#A09D95] leading-relaxed">
              Curated outer garments and custom runs produced on demand with verified craft partners. We confirm supplier availability before reserving and disclose transparent fulfilment timelines.
            </p>
          </div>

          <button
            onClick={handleExploreAvailableToOrder}
            className="group min-h-[44px] flex items-center gap-2 text-xs font-sans font-bold tracking-[0.14em] uppercase text-[#F2F0EB] hover:opacity-75 transition-opacity cursor-pointer self-start md:self-end whitespace-nowrap"
          >
            <span>EXPLORE SOURCED DROPS</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {availableToOrderPieces.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewProduct={onViewProduct}
              priority={idx < 2}
            />
          ))}
        </div>

        {/* Transparency Reassurance Strip */}
        <div className="mt-10 sm:mt-12 pt-6 border-t border-[#262626] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans text-[#8A8780]">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-[#C8A870] shrink-0 mt-0.5" />
            <span>5–7 business days sourcing and production before dispatch.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#C8A870] shrink-0 mt-0.5" />
            <span>Verified craft partners with strict quality assurance review.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-[#C8A870] shrink-0 mt-0.5" />
            <span>Tracked delivery via Lagos dispatch hub to your doorstep.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
