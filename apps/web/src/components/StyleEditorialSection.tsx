import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ActivePageView } from '../types';

interface StyleEditorialSectionProps {
  onSelectPage?: (page: ActivePageView) => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const StyleEditorialSection: React.FC<StyleEditorialSectionProps> = ({
  onSelectPage,
  onNavigateSection,
}) => {
  const handleExplore = () => {
    if (onSelectPage) onSelectPage('lookbook');
    if (onNavigateSection) onNavigateSection('lookbook-section');
  };

  return (
    <section
      id="style-editorial-section"
      className="w-full bg-[#141414] text-[#F2F0EB] py-16 sm:py-24 lg:py-28 overflow-hidden"
    >
      <div className="piercyn-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Two Editorial Images Collage */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#1E1E1E]">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=800&auto=format&fit=crop"
                alt="PIERCYN Editorial Style 1"
                className="w-full h-full object-cover object-center filter contrast-[1.05]"
                loading="lazy"
              />
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#1E1E1E] mt-6 sm:mt-10">
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=800&auto=format&fit=crop"
                alt="PIERCYN Editorial Style 2"
                className="w-full h-full object-cover object-center filter contrast-[1.05]"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right Column: Editorial Text */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-4 sm:space-y-6">
            <span className="section-eyebrow text-[#A48B71]">
              STYLE EDITORIAL • VOLUME 01
            </span>

            <h2 className="font-editorial text-[10vw] sm:text-[6vw] lg:text-[44px] leading-[0.94] tracking-[-0.03em] uppercase text-[#F2F0EB]">
              HOW TO DRESS WELL <span className="italic font-light text-[#A48B71]">EVERY DAY.</span>
            </h2>

            <p className="font-sans text-[13px] sm:text-[15px] leading-relaxed text-[#D5CFBF] font-normal">
              Good style is not complicated. It begins with the right cut, solid fabrics, and effortless shapes designed to move freely through Lagos days and nights.
            </p>

            <div className="pt-2">
              <button
                onClick={handleExplore}
                className="h-12 px-7 rounded-full bg-[#F2F0EB] text-[#141414] hover:bg-white transition-all duration-300 font-sans text-[12px] sm:text-[13px] font-bold tracking-[0.16em] uppercase inline-flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
              >
                <span>EXPLORE THE LOOKBOOK</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
