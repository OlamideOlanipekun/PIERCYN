import React, { useState } from 'react';
import { CURATED_LOOKS, CuratedOutfit } from '../data/curatedLooks';
import { useShop } from '../context/ShopContext';
import { ALL_PRODUCTS } from '../data/allProducts';
import { Product } from '../types';
import { Plus, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatNGN } from '../utils/currency';
import { ProductImage } from './ProductImage';

interface BuildTheLookSectionProps {
  onViewProduct?: (product: Product) => void;
}

export const BuildTheLookSection: React.FC<BuildTheLookSectionProps> = ({ onViewProduct }) => {
  const { addToCart, showToast, setIsCartOpen } = useShop();
  const [selectedOutfitIndex, setSelectedOutfitIndex] = useState(0);
  const [addedOutfit, setAddedOutfit] = useState(false);

  const outfit = CURATED_LOOKS[selectedOutfitIndex] || CURATED_LOOKS[0];

  const handleAddSingleItem = (lookItem: { id: string; size: string; color: string; name: string }) => {
    const product = ALL_PRODUCTS.find((p) => p.id === lookItem.id) || ALL_PRODUCTS[0];
    addToCart(product, lookItem.color, lookItem.size, 1);
  };

  const handleAddFullOutfit = () => {
    outfit.items.forEach((item) => {
      const product = ALL_PRODUCTS.find((p) => p.id === item.id) || ALL_PRODUCTS[0];
      addToCart(product, item.color, item.size, 1);
    });
    setAddedOutfit(true);
    showToast(`Added full outfit (${outfit.items.length} pieces) to bag`);
    setIsCartOpen(true);
    setTimeout(() => setAddedOutfit(false), 2400);
  };

  return (
    <section id="build-the-look-section" className="py-14 sm:py-20 bg-[#FAFAFA] text-[#111111] border-b border-[#F0F0F0]">
      <div className="piercyn-container">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12">
          <div>
            <span className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-[#737069] block mb-1.5">
              CURATED STYLING
            </span>
            <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight uppercase text-[#111111]">
              BUILD THE LOOK
            </h2>
          </div>
          <div className="mt-3 sm:mt-0 flex items-center gap-2">
            {CURATED_LOOKS.map((look, idx) => (
              <button
                key={look.id}
                onClick={() => setSelectedOutfitIndex(idx)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-mono tracking-wider transition-all cursor-pointer ${
                  selectedOutfitIndex === idx
                    ? 'bg-[#111111] text-[#F5F3EE]'
                    : 'bg-[#ECE8E1] text-[#6E6C66] hover:bg-[#DFDBD3]'
                }`}
              >
                0{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Model Showcase */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="relative w-full rounded-2xl overflow-hidden bg-[#ECE8E1] shadow-sm group">
              <ProductImage
                src={outfit.modelImage}
                alt={outfit.title}
                aspectRatio="4/5"
                objectPosition="center 15%"
                imgClassName="transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Overlay Badge */}
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between pointer-events-auto">
                <div className="text-white">
                  <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md inline-block mb-1.5">
                    {outfit.subtitle}
                  </span>
                  <h3 className="font-sans text-lg sm:text-xl font-bold tracking-tight">
                    {outfit.title}
                  </h3>
                </div>
                <div className="text-right text-white">
                  <span className="text-[10px] uppercase font-mono block opacity-80">Full Fit</span>
                  <span className="font-mono text-base sm:text-lg font-bold">
                    {formatNGN(outfit.totalPriceNGN)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Piece-by-Piece Breakdown */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between h-full space-y-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD7] mb-4">
                <h3 className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#111111]">
                  SHOP THE LOOK ({outfit.items.length} PIECES)
                </h3>
                <span className="text-[11px] font-mono text-[#737069]">
                  Total: {formatNGN(outfit.totalPriceNGN)}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3.5">
                {outfit.items.map((item, index) => {
                  const product = ALL_PRODUCTS.find((p) => p.id === item.id);
                  return (
                    <div
                      key={item.id + index}
                      className="flex items-center justify-between p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E2DFD7] hover:border-[#111111]/30 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          onClick={() => product && onViewProduct?.(product)}
                          className="w-14 rounded-lg overflow-hidden bg-[#ECE8E1] shrink-0 cursor-pointer"
                        >
                          <ProductImage
                            src={item.image}
                            productName={item.name}
                            aspectRatio="4/5"
                            objectPosition="center 15%"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4
                            onClick={() => product && onViewProduct?.(product)}
                            className="font-sans text-xs sm:text-sm font-bold text-[#111111] hover:underline cursor-pointer truncate"
                          >
                            {item.name}
                          </h4>
                          <p className="text-[11px] font-mono text-[#737069] mt-0.5">
                            {item.color} • Size {item.size}
                          </p>
                          <span className="font-mono text-xs sm:text-sm font-semibold text-[#111111] mt-1 block">
                            {formatNGN(item.priceNGN)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddSingleItem(item)}
                        className="w-8 h-8 rounded-full bg-[#111111] text-[#F5F3EE] hover:bg-[#333333] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs active:scale-95"
                        title={`Add ${item.name} to bag`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bundle Action */}
            <div className="pt-4">
              <button
                id="add-full-look-btn"
                onClick={handleAddFullOutfit}
                disabled={addedOutfit}
                className={`w-full h-12 rounded-full font-sans text-xs sm:text-sm font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.99] ${
                  addedOutfit
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#111111] text-[#F5F3EE] hover:bg-black'
                }`}
              >
                {addedOutfit ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>OUTFIT ADDED TO BAG</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>ADD FULL LOOK TO CART ({formatNGN(outfit.totalPriceNGN)})</span>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] font-mono text-[#737069] mt-2.5">
                Complimentary express Lagos delivery & free returns on full outfit orders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
