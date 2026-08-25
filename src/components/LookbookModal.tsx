import React from 'react';
import { useShop } from '../context/ShopContext';
import { ALL_PRODUCTS } from '../data/allProducts';
import { formatPrice } from '../utils/currency';
import { X, Plus, ArrowRight, Sparkles, MapPin } from 'lucide-react';

export const LookbookModal: React.FC = () => {
  const { activeLook, setActiveLook, currency, addToCart } = useShop();

  if (!activeLook) return null;

  const outfitProducts = ALL_PRODUCTS.filter((p) => activeLook.pieces.includes(p.id));

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={() => setActiveLook(null)}
        className="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-6 lg:p-12">
        <div className="relative w-full max-w-5xl bg-[#F2F0EB] text-[#141414] shadow-2xl border-t sm:border border-[#E3DEC3] rounded-t-2xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 max-h-[92svh] sm:max-h-none flex flex-col">
          
          {/* Close Button */}
          <button
            onClick={() => setActiveLook(null)}
            className="absolute top-3.5 right-3.5 z-30 min-w-[44px] min-h-[44px] rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-[#141414] transition-all border border-[#141414]/10 cursor-pointer shadow-xs flex items-center justify-center"
            aria-label="Close Look"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
            
            {/* Left Column: Full Editorial Visual */}
            <div className="lg:col-span-7 relative bg-[#181818] aspect-[3/3.8] sm:aspect-[4/3] lg:aspect-auto min-h-[340px] sm:min-h-[450px]">
              <img
                src={activeLook.image}
                alt={activeLook.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

              {/* Identifier Tag */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
                <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase bg-[#141414]/90 text-[#F2F0EB] px-3.5 py-1 rounded-full border border-white/20 backdrop-blur-xs">
                  {activeLook.number} • ARCHIVE 2026
                </span>
              </div>

              {/* Location Tag */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20 text-[#F2F0EB] flex items-center gap-2 text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase">
                <MapPin className="w-3.5 h-3.5 text-[#E3DEC3]" />
                <span>{activeLook.location}</span>
              </div>
            </div>

            {/* Right Column: Complete Look Breakdown & Shoppable Pieces */}
            <div className="lg:col-span-5 p-5 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6 font-sans">
              
              <div>
                <span className="text-[11px] sm:text-[12px] font-sans uppercase tracking-[0.22em] text-[#6E6B65] font-semibold block mb-1 sm:mb-2">
                  EDITORIAL STYLING BREAKDOWN
                </span>
                
                <h2 className="font-editorial text-2xl sm:text-4xl uppercase tracking-[-0.025em] text-[#141414]">
                  {activeLook.title}
                </h2>

                <p className="text-[14px] sm:text-[15px] text-[#4A4844] font-normal leading-[1.6] mt-2">
                  {activeLook.subtitle}
                </p>

                <div className="mt-2 text-[11px] uppercase font-sans tracking-[0.16em] text-[#6E6B65] font-semibold">
                  MODEL: {activeLook.model}
                </div>
              </div>

              {/* Curated Outfit Garments */}
              <div className="space-y-3 sm:space-y-4">
                <div className="text-[11px] sm:text-[12px] font-sans uppercase tracking-[0.18em] text-[#141414] font-bold flex items-center gap-2 border-b border-[#E3DEC3] pb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#A48B71]" />
                  <span>PIECES IN THIS OUTFIT ({outfitProducts.length})</span>
                </div>

                <div className="space-y-2.5 max-h-[260px] sm:max-h-[300px] overflow-y-auto pr-1">
                  {outfitProducts.map((piece) => (
                    <div
                      key={piece.id}
                      className="p-3 bg-[#EAE5DA] border border-[#D5CFBF] rounded-lg flex items-center justify-between gap-3 group shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={piece.colors[0]?.image || piece.images[0]}
                          alt={piece.name}
                          className="w-12 aspect-[4/5] object-cover bg-[#DED9CE] rounded-md shrink-0"
                        />
                        <div>
                          <h4 className="text-[12px] sm:text-[13px] uppercase tracking-[0.06em] font-semibold text-[#141414] leading-snug line-clamp-1">
                            {piece.name}
                          </h4>
                          <span className="text-[11px] font-sans font-bold text-[#6E6B65] block mt-0.5">
                            {formatPrice(piece, currency)} • {piece.gsm || 'ORIGINAL'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            addToCart(piece);
                          }}
                          className="h-10 min-h-[40px] px-4 bg-[#141414] text-[#F2F0EB] text-[11px] font-sans font-semibold tracking-wider uppercase rounded-full hover:bg-black transition-all cursor-pointer shadow-xs active:scale-95 inline-flex items-center justify-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>ADD</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add All to Bag */}
              <div className="pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <button
                  onClick={() => {
                    outfitProducts.forEach((p) => addToCart(p));
                    setActiveLook(null);
                  }}
                  className="w-full h-12 min-h-[48px] px-6 rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] sm:text-[13px] uppercase tracking-[0.16em] font-semibold hover:bg-black transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>ADD COMPLETE LOOK TO BAG</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
