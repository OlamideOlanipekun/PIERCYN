import React from 'react';

export const WomenCollectionIntro: React.FC = () => {
  return (
    <section 
      id="women-collection-intro" 
      className="piercyn-section bg-[#F2F0EB] text-[#141414] border-b border-[#E2DDD3]"
    >
      <div className="piercyn-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Section Marker */}
          <div className="lg:col-span-3">
            <span className="text-[12px] font-mono tracking-[0.25em] text-[#706E6B] uppercase font-medium">
              01 / WOMEN
            </span>
          </div>

          {/* Section Title & Philosophy */}
          <div className="lg:col-span-9 space-y-4 sm:space-y-6">
            <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl uppercase tracking-[-0.02em] leading-[1.05] text-[#141414]">
              THE PIERCYN WOMEN’S EDIT
            </h2>
            <p className="text-[#3A3935] text-base sm:text-lg md:text-xl font-sans font-normal leading-relaxed max-w-3xl">
              An architectural reimagination of contemporary womenswear. We build each piece around uncompromising heavyweight jersey, sculpted draping, and versatile tailoring that moves seamlessly from day to night in Lagos and beyond.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
