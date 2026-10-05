import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Product } from '../../types';

interface ProductDetailsAccordionProps {
  product: Product;
}

export const ProductDetailsAccordion: React.FC<ProductDetailsAccordionProps> = ({ product }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    specs: true,
    care: false,
    story: false,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  return (
    <div className="w-full divide-y divide-[#DAD8D1] border-y border-[#DAD8D1] font-sans text-left">
      {/* 1. Technical Specifications */}
      <div className="py-3.5">
        <button
          onClick={() => toggleSection('specs')}
          className="w-full flex items-center justify-between text-xs font-mono font-bold tracking-[0.16em] uppercase text-[#141414] cursor-pointer hover:opacity-75 transition-opacity min-h-[36px]"
          aria-expanded={openSections.specs}
        >
          <span>FABRIC & SPECIFICATIONS</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              openSections.specs ? 'rotate-180 text-[#141414]' : 'text-[#7A7771]'
            }`}
          />
        </button>

        {openSections.specs && (
          <div className="pt-3 pb-1 grid grid-cols-2 gap-3 text-xs text-[#4A4844] animate-in fade-in duration-200">
            <div>
              <span className="text-[10px] font-mono text-[#7A7771] uppercase block font-semibold">
                FABRIC DENSITY
              </span>
              <span className="font-semibold text-[#141414]">{product.gsm || 'HEAVYWEIGHT'}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#7A7771] uppercase block font-semibold">
                SILHOUETTE / FIT
              </span>
              <span className="font-semibold text-[#141414]">{product.fit}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#7A7771] uppercase block font-semibold">
                COMPOSITION
              </span>
              <span className="font-semibold text-[#141414]">{product.fabric}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#7A7771] uppercase block font-semibold">
                PROVENANCE
              </span>
              <span className="font-semibold text-[#141414]">{product.origin}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Garment Care */}
      <div className="py-3.5">
        <button
          onClick={() => toggleSection('care')}
          className="w-full flex items-center justify-between text-xs font-mono font-bold tracking-[0.16em] uppercase text-[#141414] cursor-pointer hover:opacity-75 transition-opacity min-h-[36px]"
          aria-expanded={openSections.care}
        >
          <span>GARMENT CARE</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              openSections.care ? 'rotate-180 text-[#141414]' : 'text-[#7A7771]'
            }`}
          />
        </button>

        {openSections.care && (
          <div className="pt-3 pb-1 text-xs text-[#4A4844] leading-relaxed space-y-1.5 animate-in fade-in duration-200 font-sans">
            <p>• Machine wash cold (30°C) with similar darks or like tones.</p>
            <p>• Wash inside out to preserve the fabric hand-feel and garment density.</p>
            <p>• Do not tumble dry. Reshape while damp and flat dry in shade.</p>
            <p>• Warm iron inside out if needed. Avoid direct heat on prints.</p>
          </div>
        )}
      </div>

      {/* 3. Product Story & Heritage */}
      <div className="py-3.5">
        <button
          onClick={() => toggleSection('story')}
          className="w-full flex items-center justify-between text-xs font-mono font-bold tracking-[0.16em] uppercase text-[#141414] cursor-pointer hover:opacity-75 transition-opacity min-h-[36px]"
          aria-expanded={openSections.story}
        >
          <span>THE LAGOS ATELIER NOTE</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              openSections.story ? 'rotate-180 text-[#141414]' : 'text-[#7A7771]'
            }`}
          />
        </button>

        {openSections.story && (
          <div className="pt-3 pb-1 text-xs text-[#4A4844] leading-relaxed animate-in fade-in duration-200 font-sans">
            <p>
              Engineered with custom proportions cut for daily movement. Every PIERCYN piece is finished in Lagos with double-needle reverse stitching, eliminating unnecessary luxury markups while maintaining heavyweight architectural structure.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
