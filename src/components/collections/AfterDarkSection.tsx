import React from 'react';
import { Collection } from '../../types';
import { ALL_PRODUCTS } from '../../data/allProducts';
import { formatPrice } from '../../utils/currency';
import { ArrowRight } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

interface AfterDarkSectionProps {
  collection: Collection;
  onOpenDetail: (collection: Collection) => void;
}

export const AfterDarkSection: React.FC<AfterDarkSectionProps> = ({ collection, onOpenDetail }) => {
  const { setQuickViewProduct, currency } = useShop();

  const previewProducts = ALL_PRODUCTS.filter((p) =>
    collection.featuredProductIds.includes(p.id) || p.collection === 'after-dark'
  ).slice(0, 4);

  return (
    <section 
      id="col-after-dark"
      className="relative w-full bg-[#141414] text-[#F2F0EB] py-20 sm:py-28 lg:py-36 overflow-hidden select-none"
    >
      <div className="piercyn-container space-y-12 sm:space-y-16 lg:space-y-20">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/15 pb-6">
          <div>
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#A48B71] font-mono font-semibold block mb-2">
              02 / COLLECTION
            </span>
            <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl uppercase tracking-[-0.03em] text-[#F2F0EB]">
              {collection.name}
            </h2>
          </div>

          <p className="font-sans text-[14px] sm:text-[16px] text-[#E3DEC3]/80 font-normal tracking-[0.02em] max-w-sm">
            {collection.tagline}
          </p>
        </div>

        {/* Cinematic Cinematic Night Composition */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] bg-[#1E1E1E] rounded-2xl overflow-hidden shadow-2xl group border border-white/10">
          <img
            src={collection.heroImage}
            alt={collection.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Overlapping Typography & Asymmetric Details */}
          <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 lg:bottom-12 lg:left-12 max-w-2xl space-y-3 font-sans">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#A48B71] block">
              NIGHTFALL IN VICTORIA ISLAND & SURULERE
            </span>
            <h3 className="font-editorial text-3xl sm:text-5xl lg:text-6xl uppercase tracking-[-0.025em] text-[#F2F0EB] leading-none">
              AFTER DARK.
            </h3>
            <p className="text-[13px] sm:text-[15px] text-[#E3DEC3]/90 font-light leading-relaxed max-w-md">
              {collection.description}
            </p>
            <div className="pt-2">
              <button
                onClick={() => onOpenDetail(collection)}
                className="group h-11 px-7 rounded-full bg-[#F2F0EB] text-[#141414] text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-white transition-all duration-300 inline-flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                <span>EXPLORE THE NIGHT EDIT</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Night Edit Products Strip */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-white/15 pb-3 text-[11px] sm:text-[12px] font-sans font-semibold uppercase tracking-[0.2em] text-[#E3DEC3]">
            <span>THE NIGHT EDIT ({previewProducts.length} PIECES)</span>
            <button
              onClick={() => onOpenDetail(collection)}
              className="text-[#A48B71] hover:text-[#F2F0EB] underline transition-colors cursor-pointer"
            >
              VIEW ALL →
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {previewProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => setQuickViewProduct(prod)}
                className="group flex flex-col cursor-pointer select-none"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#1E1E1E] mb-2.5 rounded-xl border border-white/10 shadow-2xs">
                  <img
                    src={prod.colors[0]?.image || prod.images[0]}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[8px] font-mono tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-black/90 text-[#F2F0EB] border border-white/20">
                      AFTER DARK
                    </span>
                  </div>
                </div>

                <div className="flex flex-col space-y-0.5">
                  <h4 className="text-[12px] sm:text-[13px] uppercase tracking-[0.05em] font-semibold text-[#F2F0EB] line-clamp-1 group-hover:underline">
                    {prod.name}
                  </h4>
                  <span className="text-[11px] font-sans text-[#A48B71] font-semibold">
                    {formatPrice(prod, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => onOpenDetail(collection)}
              className="min-h-[48px] px-8 py-3 rounded-full border border-white/40 text-[#F2F0EB] text-[11px] sm:text-[12px] font-sans uppercase font-bold tracking-[0.2em] hover:bg-[#F2F0EB] hover:text-[#141414] transition-all duration-300 cursor-pointer shadow-xs active:scale-95"
            >
              SHOP AFTER DARK →
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
