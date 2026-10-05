import React from 'react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { ArrowRight, Sparkles, Tag } from 'lucide-react';

interface EditorialSectionsProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onSelectCategory: (category: string) => void;
}

export const EditorialSections: React.FC<EditorialSectionsProps> = ({
  products,
  onViewProduct,
  onSelectCategory,
}) => {
  const { addToCart } = useShop();

  // Curation filters
  const under10k = products.filter((p) => p.priceNGN <= 15000).slice(0, 4);
  const weekendEdit = products.filter((p) => p.collection === 'everyday' || p.category === 'polos' || p.category === 'tees').slice(0, 3);
  const piercynPicks = products.filter((p) => p.isBestSeller || p.tag === 'ICONIC').slice(0, 4);

  return (
    <div className="w-full space-y-20 py-12 bg-[#F2F0EB]">
      {/* 1. UNDER ₦15K EDITORIAL BANNER */}
      <section className="piercyn-container">
        <div className="bg-[#141414] text-[#F2F0EB] p-8 sm:p-12 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F2F0EB]/10 rounded-full text-[11px] font-mono tracking-wider uppercase mb-4 text-[#E8E6E1]">
              <Tag className="w-3.5 h-3.5" />
              <span>GREAT PIECES. FAIR PRICES.</span>
            </div>
            <h2 className="font-editorial italic text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight mb-3">
              ESSENTIALS UNDER ₦15,000
            </h2>
            <p className="text-sm text-[#E8E6E1]/80 leading-relaxed font-sans mb-6">
              Heavyweight cottons, custom cuts, and durable finishes. Good style shouldn't cost a fortune.
            </p>
            <button
              onClick={() => onSelectCategory('all')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F2F0EB] text-[#141414] text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-white transition-all duration-300"
            >
              <span>EXPLORE UNDER ₦15K</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto z-10">
            {under10k.slice(0, 2).map((item) => (
              <div
                key={item.id}
                onClick={() => onViewProduct(item)}
                className="bg-[#1A1A1A] p-4 rounded-xl cursor-pointer hover:bg-[#222] transition-colors group text-left border border-white/5"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-neutral-900 mb-3">
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h4 className="text-xs font-semibold tracking-wide truncate text-[#F2F0EB]">
                  {item.name}
                </h4>
                <p className="text-xs font-mono font-bold text-[#E8E6E1] mt-1">
                  ₦{item.priceNGN.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Background subtle watermark */}
          <div className="absolute right-0 bottom-0 text-[120px] font-editorial italic text-white/5 font-bold leading-none pointer-events-none select-none">
            PIERCYN
          </div>
        </div>
      </section>

      {/* 2. THE WEEKEND EDIT - EDITORIAL ASYMMETRIC GRID */}
      <section className="piercyn-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[#DAD8D1]">
          <div>
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#141414]/60 uppercase block mb-1">
              FOR THE WEEKEND
            </span>
            <h3 className="font-editorial italic text-3xl sm:text-4xl text-[#141414]">
              THE WEEKEND EDIT
            </h3>
          </div>
          <p className="text-xs text-[#141414]/70 max-w-sm mt-2 md:mt-0 font-sans">
            Easy pieces for warm afternoons and long nights out.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {weekendEdit.map((product, idx) => (
            <div
              key={product.id}
              className={`group bg-[#E8E6E1]/50 rounded-xl overflow-hidden p-4 flex flex-col justify-between border border-[#DAD8D1]/80 hover:border-[#141414]/30 transition-all ${
                idx === 0 ? 'md:col-span-2 md:flex-row md:items-center' : ''
              }`}
            >
              <div
                onClick={() => onViewProduct(product)}
                className={`cursor-pointer overflow-hidden rounded-lg bg-neutral-200 mb-4 md:mb-0 ${
                  idx === 0 ? 'md:w-1/2 md:mr-6 aspect-[4/5]' : 'aspect-square w-full'
                }`}
              >
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className={`flex flex-col justify-between ${idx === 0 ? 'md:w-1/2' : 'w-full'}`}>
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#141414]/50 block mb-1">
                    {product.category}
                  </span>
                  <h4
                    onClick={() => onViewProduct(product)}
                    className="font-sans text-sm sm:text-base font-bold text-[#141414] hover:underline cursor-pointer mb-2"
                  >
                    {product.name}
                  </h4>
                  <p className="text-xs text-[#141414]/70 line-clamp-2 mb-4 font-sans leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#DAD8D1]/60">
                  <span className="text-sm font-bold font-mono text-[#141414]">
                    ₦{product.priceNGN.toLocaleString()}
                  </span>
                  <button
                    onClick={() => addToCart(product)}
                    className="px-4 py-2 bg-[#141414] text-[#F2F0EB] text-[11px] font-semibold uppercase tracking-wider rounded-full hover:bg-black transition-colors"
                  >
                    ADD TO BAG
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. PIERCYN PICKS RAIL */}
      <section className="piercyn-container">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#DAD8D1]">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#141414]" />
            <h3 className="font-editorial italic text-2xl sm:text-3xl text-[#141414]">
              PIERCYN PICKS
            </h3>
          </div>
          <span className="text-xs font-mono text-[#141414]/60 uppercase">
            POPULAR RIGHT NOW
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {piercynPicks.map((product) => (
            <div
              key={product.id}
              onClick={() => onViewProduct(product)}
              className="group cursor-pointer bg-[#E8E6E1]/40 p-3 sm:p-4 rounded-xl border border-[#DAD8D1]/60 hover:shadow-sm transition-all text-left"
            >
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-neutral-200 mb-3 relative">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.tag && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#141414] text-[#F2F0EB] text-[9px] font-mono font-bold tracking-widest uppercase rounded">
                    {product.tag}
                  </span>
                )}
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#141414] truncate mb-1">
                {product.name}
              </h4>
              <p className="text-xs font-mono font-bold text-[#141414]">
                ₦{product.priceNGN.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
