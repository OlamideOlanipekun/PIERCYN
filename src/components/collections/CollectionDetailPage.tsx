import React from 'react';
import { Collection } from '../../types';
import { COLLECTIONS } from '../../data/collections';
import { formatPrice } from '../../utils/currency';
import { ArrowLeft, ArrowRight, Heart, Plus, Sparkles, MapPin, Layers } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

interface CollectionDetailPageProps {
  collection: Collection;
  onBackToCollections: () => void;
  onSelectCollection: (col: Collection) => void;
}

export const CollectionDetailPage: React.FC<CollectionDetailPageProps> = ({
  collection,
  onBackToCollections,
  onSelectCollection
}) => {
  const { products, setQuickViewProduct, toggleWishlist, isWishlisted, currency } = useShop();

  // Products belonging to this collection
  const collectionProducts = products.filter((p) =>
    collection.featuredProductIds.includes(p.id) || p.collection === collection.category
  );

  // Related collections (excluding current)
  const relatedCollections = COLLECTIONS.filter((c) => c.id !== collection.id).slice(0, 3);

  const handleScrollToGrid = () => {
    const el = document.getElementById('collection-product-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="collection-detail-landing" className="w-full bg-[#F2F0EB] text-[#141414] font-sans">
      
      {/* 01 — HERO */}
      <section className="relative w-full h-[75svh] sm:h-[85vh] bg-[#141414] text-[#F2F0EB] overflow-hidden select-none">
        <img
          src={collection.heroImage}
          alt={collection.name}
          className="w-full h-full object-cover filter contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/50" />

        <div className="relative z-20 h-full piercyn-container flex flex-col justify-between pt-24 pb-10 sm:pb-14">
          
          {/* Top Bar with Back Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToCollections}
              className="group h-10 px-4 rounded-full bg-black/60 backdrop-blur-md text-[#E3DEC3] text-[11px] font-mono tracking-[0.2em] uppercase border border-white/20 hover:bg-black transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>ALL COLLECTIONS</span>
            </button>

            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#E3DEC3]">
              {collection.season} • {collection.year}
            </span>
          </div>

          {/* Hero Typography */}
          <div className="max-w-4xl space-y-3 sm:space-y-4">
            <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-[#A48B71] block">
              PIERCYN COLLECTION ARCHIVE
            </span>
            <h1 className="font-editorial text-4xl sm:text-7xl lg:text-8xl uppercase tracking-[-0.035em] leading-[0.9]">
              {collection.name}
            </h1>
            <p className="text-[14px] sm:text-[17px] text-[#E3DEC3]/90 font-light max-w-xl">
              {collection.tagline}
            </p>

            <div className="pt-3 flex items-center gap-3">
              <button
                onClick={handleScrollToGrid}
                className="group h-12 min-h-[48px] px-8 rounded-full bg-[#F2F0EB] text-[#141414] text-[11px] sm:text-[12px] uppercase font-sans font-bold tracking-[0.2em] hover:bg-white transition-all duration-300 inline-flex items-center gap-2.5 cursor-pointer shadow-md active:scale-95"
              >
                <span>SHOP COLLECTION ({collectionProducts.length})</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 02 — COLLECTION STORY */}
      <section className="py-20 sm:py-28 bg-[#F2F0EB] border-b border-[#E3DEC3]/70">
        <div className="piercyn-container max-w-4xl space-y-8">
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#6E6B65]">
              01 / THE STORY & PHILOSOPHY
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl uppercase tracking-[-0.02em]">
              {collection.editorialSubhead || 'LAGOS ATELIER CURATION'}
            </h2>
          </div>

          <p className="font-sans text-[16px] sm:text-[19px] text-[#4A4844] font-normal leading-[1.65]">
            {collection.detailStory || collection.description}
          </p>

          {collection.detailQuotes && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E3DEC3]">
              {collection.detailQuotes.map((q, idx) => (
                <div key={idx} className="p-4 bg-[#E8E6E1] rounded-xl border border-[#DAD8D1]">
                  <span className="font-editorial text-xl italic text-[#141414]">"{q}"</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 03 — EDITORIAL IMAGE BREAK */}
      {collection.secondaryImages[0] && (
        <section className="relative w-full aspect-[4/5] sm:aspect-[16/8] bg-[#141414] overflow-hidden">
          <img
            src={collection.secondaryImages[0]}
            alt="Collection Editorial"
            className="w-full h-full object-cover filter contrast-[1.05]"
          />
        </section>
      )}

      {/* 04 — PRODUCT GRID */}
      <section id="collection-product-grid" className="py-20 sm:py-28 bg-[#F2F0EB] border-b border-[#E3DEC3]/70">
        <div className="piercyn-container space-y-8 sm:space-y-12">
          
          <div className="flex items-center justify-between border-b border-[#E3DEC3] pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#6E6B65] block">
                02 / COLLECTION PIECES
              </span>
              <h3 className="font-editorial text-3xl sm:text-4xl uppercase tracking-[-0.02em]">
                THE CATALOGUE ({collectionProducts.length})
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-2.5 sm:gap-x-6 gap-y-6 sm:gap-y-8">
            {collectionProducts.map((product) => {
              const displayImage = product.colors[0]?.image || product.images[0];
              return (
                <div
                  key={product.id}
                  onClick={() => setQuickViewProduct(product)}
                  className="group flex flex-col cursor-pointer select-none"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E7E2D6] mb-2.5 rounded-xl shadow-2xs">
                    <img
                      src={displayImage}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-[#141414]/90 text-[#F2F0EB]">
                        {product.gsm || 'LAGOS'}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isWishlisted(product.id) ? 'fill-[#141414] text-[#141414]' : 'text-[#141414]'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1 font-sans">
                    <h4 className="text-[12.5px] sm:text-[14px] uppercase tracking-[0.05em] font-semibold text-[#141414] line-clamp-1 group-hover:underline">
                      {product.name}
                    </h4>
                    <span className="text-[12.5px] sm:text-[14px] text-[#141414] font-semibold">
                      {formatPrice(product, currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 05 — RELATED COLLECTIONS (EXPLORE MORE) */}
      <section className="py-20 sm:py-28 bg-[#E8E6E1] border-b border-[#DAD8D1]">
        <div className="piercyn-container space-y-8 sm:space-y-12">
          
          <div className="border-b border-[#DAD8D1] pb-4">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#6E6B65] block">
              03 / CONTINUOUS BROWSING
            </span>
            <h3 className="font-editorial text-3xl sm:text-5xl uppercase tracking-[-0.02em]">
              EXPLORE MORE COLLECTIONS
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedCollections.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  onSelectCollection(rel);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative aspect-[4/5] bg-[#DED9CE] rounded-2xl overflow-hidden shadow-sm cursor-pointer"
              >
                <img
                  src={rel.heroImage}
                  alt={rel.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 text-[#F2F0EB]">
                  <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#E3DEC3] block mb-1">
                    {rel.season}
                  </span>
                  <h4 className="font-editorial text-3xl uppercase tracking-[-0.02em] leading-tight mb-2">
                    {rel.name}
                  </h4>
                  <span className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-[#E3DEC3] group-hover:underline inline-flex items-center gap-1">
                    <span>EXPLORE</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
};
