import React from 'react';

export const MenCollectionIntro: React.FC = () => {
  return (
    <section 
      id="men-collection-intro" 
      className="w-full bg-[#F2F0EB] text-[#141414] pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-12"
    >
      <div className="piercyn-container">
        <div className="max-w-3xl">
          {/* Small label: 01 / MEN */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <span className="text-[11px] sm:text-[12px] font-mono tracking-[0.25em] text-[#6E6B65] uppercase font-semibold">
              01 / MEN
            </span>
            <span className="w-8 h-[1px] bg-[#6E6B65]/40" />
            <span className="text-[10px] sm:text-[11px] font-sans tracking-[0.18em] text-[#6E6B65] uppercase font-medium">
              LAGOS ATELIER EDITION
            </span>
          </div>

          {/* Large heading: THE PIERCYN MEN'S EDIT. */}
          <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-[-0.03em] leading-[0.95] text-[#141414] mb-4 sm:mb-6">
            THE PIERCYN <br />
            <span className="italic font-light">MEN'S EDIT.</span>
          </h2>

          {/* Supporting paragraph (max-width ~500-600px) */}
          <p className="text-sm sm:text-base md:text-[17px] font-sans text-[#4A4742] leading-relaxed max-w-[580px] font-normal tracking-[0.01em]">
            A considered collection of modern silhouettes, heavyweight essentials and everyday pieces designed for movement, confidence and individuality.
          </p>
        </div>
      </div>
    </section>
  );
};
