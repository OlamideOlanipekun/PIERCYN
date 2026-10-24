import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS } from '../data/products';
import { formatPrice } from '../utils/currency';
import { Plus, Check, ArrowRight, Sparkles, Layers, Scissors, Info } from 'lucide-react';

export const ThePieceSection: React.FC = () => {
  const { currency, addToCart, setQuickViewProduct, setIsCraftsmanshipOpen, setIsSizeGuideOpen } = useShop();
  const signatureHoodie = PRODUCTS.find((p) => p.id === 'piercyn-sig-hoodie') || PRODUCTS[0];
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '2XL' | '3XL'>('L');
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const currentColor = signatureHoodie.colors[selectedColorIdx] || signatureHoodie.colors[0];

  return (
    <section 
      id="the-piece-section" 
      className="relative w-full bg-[#EBE7E0] py-20 sm:py-28 lg:py-32 overflow-hidden border-b border-[#E3DEC3]/70 flex flex-col justify-between"
    >
      {/* Top Header & Micro Identifier */}
      <div className="piercyn-container w-full flex items-center justify-between">
        <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-sans font-semibold">
          07 / SARTORIAL BENCHMARK
        </span>
        <button
          onClick={() => setIsCraftsmanshipOpen(true)}
          className="text-[11px] sm:text-[12px] uppercase tracking-[0.18em] text-[#141414] hover:text-[#A48B71] font-sans font-medium flex items-center gap-1.5 underline cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-[#A48B71]" />
          <span>INSPECT FABRIC SPEC SHEET</span>
        </button>
      </div>

      {/* Main Showcase Stage with Center Hoodie Image & Floating Editorial Annotation Tags */}
      <div className="piercyn-container w-full my-auto py-8 sm:py-12 lg:py-14">
        
        {/* Top Left Huge Serif: THE PIECE */}
        <div className="relative z-20 select-none mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between">
          <h2 className="font-editorial text-[14vw] sm:text-[12vw] lg:text-[9vw] xl:text-[130px] leading-[0.84] tracking-[-0.03em] uppercase text-[#141414]">
            THE PIECE<span className="text-[#A48B71]">.</span>
          </h2>
          <span className="text-[11px] sm:text-[12px] font-sans font-semibold tracking-[0.2em] text-[#6E6B65] uppercase mt-1 sm:mt-0">
            INTERACTIVE ANATOMY • 450 GSM FOUNDATION
          </span>
        </div>

        {/* Central Hoodie Visual & Floating Technical Callouts */}
        <div className="relative w-full max-w-4xl mx-auto aspect-[4/3.8] sm:aspect-[16/11] flex items-center justify-center">
          
          {/* Main Giant Hoodie Photography */}
          <div className="relative w-[92%] sm:w-[75%] lg:w-[68%] h-full flex items-center justify-center">
            <img
              src={currentColor.image}
              alt={signatureHoodie.name}
              className="max-w-full max-h-full object-contain filter drop-shadow-[0_25px_40px_rgba(0,0,0,0.18)] transition-all duration-700 hover:scale-105"
              loading="lazy"
            />
          </div>

          {/* Floating Editorial Annotation Callout 1: Top Left */}
          <button
            onClick={() => setIsCraftsmanshipOpen(true)}
            className="absolute top-[8%] left-[2%] sm:left-[8%] z-30 flex items-center gap-2 sm:gap-3 cursor-pointer group text-left"
          >
            <div className="w-3 h-3 rounded-full bg-[#141414] group-hover:scale-125 transition-transform flex items-center justify-center text-white text-[8px]">
              +
            </div>
            <div className="bg-[#F2F0EB]/95 backdrop-blur-sm border border-[#D5CFBF] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg shadow-xs group-hover:border-[#141414] transition-all">
              <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.25em] uppercase text-[#141414] font-semibold block">
                450 GSM
              </span>
              <span className="text-[7px] sm:text-[8px] tracking-[0.15em] uppercase text-[#7A7771] block">
                LOOPBACK FLEECE
              </span>
            </div>
          </button>

          {/* Floating Editorial Annotation Callout 2: Top Right */}
          <button
            onClick={() => setIsCraftsmanshipOpen(true)}
            className="absolute top-[10%] right-[2%] sm:right-[10%] z-30 flex items-center gap-2 sm:gap-3 cursor-pointer group text-right"
          >
            <div className="bg-[#F2F0EB]/95 backdrop-blur-sm border border-[#D5CFBF] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg shadow-xs group-hover:border-[#141414] transition-all">
              <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.25em] uppercase text-[#141414] font-semibold block">
                SCULPTED HOOD
              </span>
              <span className="text-[7px] sm:text-[8px] tracking-[0.15em] uppercase text-[#7A7771] block">
                ZERO-DRAWSTRING
              </span>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#141414] group-hover:scale-125 transition-transform flex items-center justify-center text-white text-[8px]">
              +
            </div>
          </button>

          {/* Floating Editorial Annotation Callout 3: Bottom Left */}
          <button
            onClick={() => setIsCraftsmanshipOpen(true)}
            className="absolute bottom-[10%] left-[2%] sm:left-[12%] z-30 hidden sm:flex items-center gap-3 cursor-pointer group text-left"
          >
            <div className="w-3 h-3 rounded-full bg-[#141414] group-hover:scale-125 transition-transform flex items-center justify-center text-white text-[8px]">
              +
            </div>
            <div className="bg-[#F2F0EB]/95 backdrop-blur-sm border border-[#D5CFBF] px-3.5 py-2 rounded-lg shadow-xs group-hover:border-[#141414] transition-all">
              <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-[#141414] font-semibold block">
                ARCHITECTURAL DRAPE
              </span>
              <span className="text-[8px] tracking-[0.15em] uppercase text-[#7A7771] block">
                ENGINEERED SEAM TENSION
              </span>
            </div>
          </button>

          {/* Floating Editorial Annotation Callout 4: Bottom Right */}
          <button
            onClick={() => setIsCraftsmanshipOpen(true)}
            className="absolute bottom-[10%] right-[2%] sm:right-[14%] z-30 hidden sm:flex items-center gap-3 cursor-pointer group text-right"
          >
            <div className="bg-[#F2F0EB]/95 backdrop-blur-sm border border-[#D5CFBF] px-3.5 py-2 rounded-lg shadow-xs group-hover:border-[#141414] transition-all">
              <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-[#141414] font-semibold block">
                HAND-FINISHED
              </span>
              <span className="text-[8px] tracking-[0.15em] uppercase text-[#7A7771] block">
                LAGOS ATELIER BESPOKE
              </span>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#141414] group-hover:scale-125 transition-transform flex items-center justify-center text-white text-[8px]">
              +
            </div>
          </button>
        </div>

      </div>

      {/* Bottom Bar: Narrative on Left, Color/Size & Add on Right */}
      <div className="piercyn-container w-full pt-6 sm:pt-8 border-t border-[#DCD5C5] flex flex-col md:flex-row items-start md:items-end justify-between gap-6 sm:gap-8">
        
        {/* Bottom Left Narrative */}
        <div className="max-w-md font-sans">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] sm:text-[15px] uppercase tracking-[0.08em] font-semibold text-[#141414]">
              {signatureHoodie.name}
            </h3>
            <span className="text-[10px] font-sans font-semibold tracking-wider bg-[#141414] text-[#F2F0EB] px-2 py-0.5 rounded-full">
              CORE ICON
            </span>
          </div>
          <p className="text-[13px] sm:text-[14px] text-[#4A4844] font-normal leading-[1.6] mt-1.5">
            Heavyweight oversized essential designed for everyday presence. Engineered from dense Nigerian combed cotton with rigid architecture that never loses its drape.
          </p>
          <div className="mt-2.5 flex items-center gap-4">
            <span className="font-sans text-[15px] sm:text-[16px] text-[#141414] font-bold">
              {formatPrice(signatureHoodie, currency)}
            </span>
            <button
              onClick={() => setIsSizeGuideOpen(true)}
              className="text-[11px] font-sans font-medium text-[#6E6B65] underline uppercase tracking-wider hover:text-black cursor-pointer"
            >
              SIZE GUIDE (CHEST/LENGTH)
            </button>
          </div>
        </div>

        {/* Bottom Right Interactive Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-10 w-full md:w-auto font-sans">
          {/* Color Selector */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[10px] sm:text-[11px] font-sans font-semibold tracking-[0.15em] uppercase text-[#6E6B65]">
              COLORWAY: {currentColor.name}
            </span>
            <div className="flex items-center space-x-2.5">
              {signatureHoodie.colors.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColorIdx(i)}
                  className={`min-w-[36px] min-h-[36px] rounded-full border-2 p-0.5 transition-all cursor-pointer flex items-center justify-center ${
                    selectedColorIdx === i ? 'border-[#141414] scale-110' : 'border-transparent opacity-70'
                  }`}
                  title={c.name}
                >
                  <span
                    className="w-6 h-6 rounded-full block border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[10px] sm:text-[11px] font-sans font-semibold tracking-[0.15em] uppercase text-[#6E6B65]">
              SELECT SIZE:
            </span>
            <div className="flex items-center space-x-1.5">
              {signatureHoodie.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`min-w-[40px] min-h-[40px] px-3 py-1.5 text-[11px] font-sans font-semibold uppercase tracking-[0.05em] rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                    selectedSize === s
                      ? 'border-[#141414] bg-[#141414] text-[#F2F0EB] font-bold'
                      : 'border-[#D5CFBF] text-[#141414] hover:border-[#141414] bg-white/50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto pt-2 sm:pt-0">
            <button
              onClick={() => addToCart(signatureHoodie, currentColor.name, selectedSize)}
              className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] sm:text-[13px] tracking-[0.18em] uppercase font-semibold hover:bg-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <span>ADD TO BAG</span>
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsCraftsmanshipOpen(true)}
              className="w-full sm:w-auto min-h-[48px] px-6 rounded-full border border-[#141414]/40 hover:border-[#141414] text-[12px] tracking-[0.15em] uppercase text-[#141414] font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>SPEC SHEET</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};

