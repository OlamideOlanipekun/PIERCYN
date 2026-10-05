import React from 'react';
import { Collection } from '../../types';
import { formatPrice } from '../../utils/currency';
import { ArrowRight, Compass } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

interface FeaturedCollectionSectionProps {
  collection: Collection;
  onOpenDetail: (collection: Collection) => void;
}

export const FeaturedCollectionSection: React.FC<FeaturedCollectionSectionProps> = ({ collection, onOpenDetail }) => {
  const { products, setQuickViewProduct, currency } = useShop();

  const previewProducts = products.slice(0, 4);

  return (
    <section 
      id="col-featured"
      className="relative w-full bg-[#E8E6E1] text-[#141414] py-20 sm:py-28 lg:py-36 border-b border-[#DAD8D1] overflow-hidden"
    >
      <div className="piercyn-container space-y-12 sm:space-y-16 lg:space-y-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DAD8D1] pb-6">
          <div>
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#6E6B65] font-sans font-semibold block mb-2">
              05 / FEATURED CMS CURATION
            </span>
            <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl uppercase tracking-[-0.03em] text-[#141414]">
              {collection.name}
            </h2>
          </div>

          <p className="font-sans text-[14px] sm:text-[16px] text-[#4A4844] font-normal tracking-[0.02em] max-w-sm">
            {collection.tagline}
          </p>
        </div>

        {/* Dynamic Configurable Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          <div className="lg:col-span-8 relative aspect-[4/5] sm:aspect-[16/10] bg-[#DED9CE] rounded-2xl overflow-hidden shadow-md group">
            <img
              src={collection.heroImage}
              alt={collection.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 text-[#F2F0EB]">
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#E3DEC3] block mb-1">
                FUTURE WEST AFRICAN LUXURY
              </span>
              <h3 className="font-editorial text-2xl sm:text-4xl uppercase tracking-[-0.02em] leading-tight">
                {collection.editorialSubhead}
              </h3>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6 font-sans">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#6E6B65]">
                <Compass className="w-3.5 h-3.5 text-[#A48B71]" />
                <span>ATELIER ROADMAP</span>
              </div>
              <p className="text-[14px] sm:text-[15px] text-[#4A4844] font-normal leading-relaxed">
                {collection.description}
              </p>
            </div>

            <button
              onClick={() => onOpenDetail(collection)}
              className="group h-12 min-h-[48px] px-8 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black transition-all duration-300 inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <span>{collection.ctaLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
