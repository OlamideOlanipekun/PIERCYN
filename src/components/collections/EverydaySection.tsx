import React from 'react';
import { Collection } from '../../types';
import { formatPrice } from '../../utils/currency';
import { ArrowRight } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

interface EverydaySectionProps {
  collection: Collection;
  onOpenDetail: (collection: Collection) => void;
}

export const EverydaySection: React.FC<EverydaySectionProps> = ({ collection, onOpenDetail }) => {
  const { products, setQuickViewProduct, currency } = useShop();

  const previewProducts = products.filter((p) =>
    collection.featuredProductIds.includes(p.id) || p.collection === 'everyday'
  ).slice(0, 4);

  return (
    <section 
      id="col-everyday"
      className="relative w-full bg-[#F2F0EB] py-20 sm:py-28 lg:py-36 border-b border-[#E3DEC3]/70 overflow-hidden"
    >
      <div className="piercyn-container space-y-12 sm:space-y-16 lg:space-y-20">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E3DEC3] pb-6">
          <div>
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-sans font-semibold block mb-2">
              01 / COLLECTION
            </span>
            <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl uppercase tracking-[-0.03em] text-[#141414]">
              {collection.name}
            </h2>
          </div>

          <p className="font-sans text-[14px] sm:text-[16px] text-[#4A4844] font-normal tracking-[0.02em] max-w-sm">
            {collection.tagline}
          </p>
        </div>

        {/* Desktop Asymmetric Editorial Composition (60-70% Width Main Image) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Main Campaign Image (65% width equivalent on 12-col grid = col-span-7 or 8) */}
          <div className="lg:col-span-8 relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-[4/3] bg-[#E7E2D6] rounded-2xl overflow-hidden shadow-lg group">
            <img
              src={collection.heroImage}
              alt={collection.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-[#F2F0EB]">
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#E3DEC3] block mb-1">
                DAYTIME LAGOS ARCHITECTURE
              </span>
              <h3 className="font-editorial text-2xl sm:text-4xl uppercase tracking-[-0.02em] leading-tight">
                {collection.editorialSubhead}
              </h3>
            </div>
          </div>

          {/* Secondary Supporting Image & Editorial Text */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6 sm:space-y-8">
            <div className="relative aspect-[4/5] w-full bg-[#E7E2D6] rounded-xl overflow-hidden shadow-sm group">
              <img
                src={collection.secondaryImages[0] || collection.heroImage}
                alt="Everyday Detail"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                loading="lazy"
              />
            </div>

            <div className="space-y-4 font-sans">
              <p className="text-[14px] sm:text-[15px] text-[#4A4844] font-normal leading-relaxed">
                {collection.description}
              </p>

              <button
                onClick={() => onOpenDetail(collection)}
                className="group h-12 min-h-[48px] px-7 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black transition-all duration-300 inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <span>EXPLORE COLLECTION</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

        </div>

        {/* Product Preview Strip: FROM THE COLLECTION */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-[#E3DEC3] pb-3 text-[11px] sm:text-[12px] font-sans font-semibold uppercase tracking-[0.2em] text-[#141414]">
            <span>FROM THE COLLECTION ({previewProducts.length} PIECES)</span>
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
                    <span className="text-[8px] font-mono tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-[#141414]/90 text-[#F2F0EB]">
                      {prod.gsm || '450 GSM'}
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

          <div className="pt-2 text-center">
            <button
              onClick={() => onOpenDetail(collection)}
              className="min-h-[48px] px-8 py-3 rounded-full border border-[#141414] text-[#141414] text-[11px] sm:text-[12px] font-sans uppercase font-bold tracking-[0.2em] hover:bg-[#141414] hover:text-[#F2F0EB] transition-all duration-300 cursor-pointer shadow-xs active:scale-95"
            >
              SHOP THE EVERYDAY →
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
