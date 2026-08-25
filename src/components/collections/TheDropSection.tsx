import React from 'react';
import { Collection } from '../../types';
import { ALL_PRODUCTS } from '../../data/allProducts';
import { formatPrice } from '../../utils/currency';
import { ArrowRight, Flame } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

interface TheDropSectionProps {
  collection: Collection;
  onOpenDetail: (collection: Collection) => void;
}

export const TheDropSection: React.FC<TheDropSectionProps> = ({ collection, onOpenDetail }) => {
  const { setQuickViewProduct, currency } = useShop();

  const previewProducts = ALL_PRODUCTS.filter((p) =>
    collection.featuredProductIds.includes(p.id) || p.isNewDrop
  ).slice(0, 4);

  return (
    <section 
      id="col-the-drop"
      className="relative w-full bg-[#F2F0EB] py-20 sm:py-28 lg:py-36 border-b border-[#E3DEC3]/70 overflow-hidden"
    >
      <div className="piercyn-container space-y-12 sm:space-y-16 lg:space-y-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E3DEC3] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-sans font-semibold">
                04 / COLLECTION
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-mono tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-[#141414] text-[#F2F0EB]">
                <Flame className="w-3 h-3 text-[#A48B71]" />
                LATEST RELEASE
              </span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl uppercase tracking-[-0.03em] text-[#141414]">
              {collection.name}
            </h2>
          </div>

          <p className="font-sans text-[14px] sm:text-[16px] text-[#4A4844] font-normal tracking-[0.02em] max-w-sm">
            {collection.tagline}
          </p>
        </div>

        {/* High-Energy Full-Bleed Campaign Showcase */}
        <div className="relative aspect-[4/5] sm:aspect-[16/9] bg-[#E7E2D6] rounded-2xl overflow-hidden shadow-lg group">
          <img
            src={collection.heroImage}
            alt={collection.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 lg:bottom-12 lg:left-12 max-w-xl space-y-3 text-[#F2F0EB] font-sans">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#E3DEC3] block">
              RELEASE 26.1 • LIMITED RUN ATELIER CAPSULE
            </span>
            <h3 className="font-editorial text-3xl sm:text-5xl uppercase tracking-[-0.02em]">
              THE DROP.
            </h3>
            <p className="text-[13px] sm:text-[15px] text-[#E3DEC3]/90 font-light leading-relaxed">
              {collection.description}
            </p>
            <div className="pt-2">
              <button
                onClick={() => onOpenDetail(collection)}
                className="group h-11 px-7 rounded-full bg-[#F2F0EB] text-[#141414] text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-white transition-all duration-300 inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                <span>SHOP THE DROP</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-[#E3DEC3] pb-3 text-[11px] sm:text-[12px] font-sans font-semibold uppercase tracking-[0.2em] text-[#141414]">
            <span>CAPSULE SELECTION ({previewProducts.length} PIECES)</span>
            <button
              onClick={() => onOpenDetail(collection)}
              className="text-[#6E6B65] hover:text-[#141414] underline transition-colors cursor-pointer"
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
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E7E2D6] mb-2.5 rounded-xl shadow-2xs">
                  <img
                    src={prod.colors[0]?.image || prod.images[0]}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[8px] font-mono tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-[#141414] text-[#F2F0EB]">
                      RELEASE 26.1
                    </span>
                  </div>
                </div>

                <div className="flex flex-col space-y-0.5">
                  <h4 className="text-[12px] sm:text-[13px] uppercase tracking-[0.05em] font-semibold text-[#141414] line-clamp-1 group-hover:underline">
                    {prod.name}
                  </h4>
                  <span className="text-[11px] font-sans text-[#6E6B65] font-semibold">
                    {formatPrice(prod, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
