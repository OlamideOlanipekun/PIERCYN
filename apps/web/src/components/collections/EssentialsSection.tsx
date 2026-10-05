import React from 'react';
import { Collection } from '../../types';
import { formatPrice } from '../../utils/currency';
import { ArrowRight, Layers } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

interface EssentialsSectionProps {
  collection: Collection;
  onOpenDetail: (collection: Collection) => void;
}

export const EssentialsSection: React.FC<EssentialsSectionProps> = ({ collection, onOpenDetail }) => {
  const { products, setQuickViewProduct, currency } = useShop();

  const previewProducts = products.filter((p) =>
    collection.featuredProductIds.includes(p.id) || p.collection === 'essentials'
  ).slice(0, 4);

  return (
    <section 
      id="col-essentials"
      className="relative w-full bg-[#EAE5DA] text-[#141414] py-20 sm:py-28 lg:py-36 border-b border-[#D5CFBF] overflow-hidden"
    >
      <div className="piercyn-container space-y-12 sm:space-y-16 lg:space-y-20">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D5CFBF] pb-6">
          <div>
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#6E6B65] font-sans font-semibold block mb-2">
              03 / COLLECTION
            </span>
            <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl uppercase tracking-[-0.03em] text-[#141414]">
              {collection.name}
            </h2>
          </div>

          <p className="font-sans text-[14px] sm:text-[16px] text-[#4A4844] font-normal tracking-[0.02em] max-w-sm">
            {collection.tagline}
          </p>
        </div>

        {/* Minimal Studio Composition: Main Garment Image + Close-up Fabric Detail Tiles */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          <div className="lg:col-span-7 relative aspect-[4/5] sm:aspect-[16/11] bg-[#DED9CE] rounded-2xl overflow-hidden shadow-sm group">
            <img
              src={collection.heroImage}
              alt={collection.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute top-4 left-4 z-10">
              <span className="text-[9px] font-mono tracking-[0.25em] uppercase px-3 py-1 rounded-full bg-[#141414] text-[#F2F0EB]">
                450 GSM UNBRUSHED FRENCH TERRY
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6 sm:space-y-8 font-sans">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="aspect-square bg-[#DED9CE] rounded-xl overflow-hidden shadow-2xs group">
                <img
                  src={collection.secondaryImages[0] || collection.heroImage}
                  alt="Stitching Detail"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="aspect-square bg-[#DED9CE] rounded-xl overflow-hidden shadow-2xs group">
                <img
                  src={collection.secondaryImages[1] || collection.heroImage}
                  alt="Fabric Texture"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#6E6B65]">
                <Layers className="w-3.5 h-3.5 text-[#A48B71]" />
                <span>SPECIFICATION & CRAFTSMANSHIP</span>
              </div>
              
              <p className="text-[14px] sm:text-[15px] text-[#4A4844] font-normal leading-relaxed">
                {collection.description}
              </p>

              <button
                onClick={() => onOpenDetail(collection)}
                className="group h-12 min-h-[48px] px-7 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black transition-all duration-300 inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <span>EXPLORE ESSENTIALS</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

        </div>

        {/* Product Preview */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-[#D5CFBF] pb-3 text-[11px] sm:text-[12px] font-sans font-semibold uppercase tracking-[0.2em] text-[#141414]">
            <span>THE UNIFORM EDIT ({previewProducts.length} PIECES)</span>
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
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#DED9CE] mb-2.5 rounded-xl shadow-2xs">
                  <img
                    src={prod.colors[0]?.image || prod.images[0]}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[8px] font-mono tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-[#141414]/90 text-[#F2F0EB]">
                      ESSENTIAL
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
