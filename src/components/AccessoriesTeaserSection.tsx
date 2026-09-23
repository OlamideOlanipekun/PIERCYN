import React from 'react';
import { ActivePageView } from '../types';
import { ArrowRight, Sparkles } from 'lucide-react';

interface AccessoriesTeaserSectionProps {
  onSelectPage: (page: ActivePageView) => void;
}

export const AccessoriesTeaserSection: React.FC<AccessoriesTeaserSectionProps> = ({
  onSelectPage,
}) => {
  return (
    <section
      id="accessories-teaser-section"
      className="w-full bg-[#141414] text-[#F2F0EB] py-12 sm:py-16 border-b border-[#282828]"
    >
      <div className="piercyn-container">
        <div className="relative rounded-2xl overflow-hidden bg-[#1C1C1C] p-6 sm:p-10 lg:p-12 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          
          <div className="max-w-xl text-left">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#A48B71] font-bold block mb-2">
              COMING SOON
            </span>

            <h3 className="font-editorial text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight text-[#F2F0EB] mb-2 font-normal">
              ACCESSORIES & CARRY GOODS
            </h3>

            <p className="font-sans text-xs sm:text-sm text-[#D5CFBF] leading-relaxed">
              Caps, full-grain leather cardholders, and heavyweight canvas bags are currently in development at our Surulere atelier.
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0">
            <button
              onClick={() => onSelectPage('accessories')}
              className="w-full md:w-auto h-12 px-7 rounded-full bg-[#F2F0EB] text-[#141414] hover:bg-white transition-all text-xs font-sans font-bold tracking-[0.16em] uppercase inline-flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 whitespace-nowrap"
            >
              <span>PREVIEW ACCESSORIES</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
