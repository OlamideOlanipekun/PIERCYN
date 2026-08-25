import React from 'react';

export const EditorialIntro: React.FC = () => {
  return (
    <section 
      id="editorial-intro"
      className="relative w-full bg-[#F2F0EB] py-20 sm:py-28 lg:py-36 border-b border-[#E3DEC3]/70 overflow-hidden"
    >
      <div className="piercyn-container flex flex-col items-start justify-center">
        
        {/* Small Label */}
        <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-sans font-semibold block mb-4 sm:mb-6">
          01 / THE WORLD
        </span>

        {/* Large Statement in Cormorant Garamond */}
        <h2 className="font-editorial text-[11vw] sm:text-[8vw] lg:text-[6vw] xl:text-[84px] leading-[0.9] tracking-[-0.03em] uppercase text-[#141414] mb-6 sm:mb-8 max-w-4xl">
          <div>NOT ONE MOOD<span className="text-[#A48B71]">.</span></div>
          <div className="italic font-light text-[#4A4844]">NOT ONE WAY TO WEAR IT<span className="not-italic text-[#A48B71]">.</span></div>
        </h2>

        {/* Supporting Body in Manrope with Max Width 550-650px */}
        <p className="font-sans text-[15px] sm:text-[18px] text-[#4A4844] font-normal leading-[1.65] max-w-[620px]">
          PIERCYN collections are built around different moods, moments and expressions — connected by one unmistakable Lagos identity.
        </p>

      </div>
    </section>
  );
};
