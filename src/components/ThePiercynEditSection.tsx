import React from 'react';
import { ActivePageView } from '../types';
import { ArrowRight } from 'lucide-react';

interface ThePiercynEditSectionProps {
  onSelectPage: (page: ActivePageView) => void;
}

export const ThePiercynEditSection: React.FC<ThePiercynEditSectionProps> = ({
  onSelectPage,
}) => {
  return (
    <section
      id="the-piercyn-edit-section"
      className="w-full bg-[#141414] text-[#F2F0EB] py-14 sm:py-20 lg:py-24 overflow-hidden relative"
    >
      <div className="piercyn-container">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#1D1D1D] min-h-[460px] sm:min-h-[540px] lg:min-h-[600px] flex flex-col justify-end p-6 sm:p-12 lg:p-16">
          {/* Campaign Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=85&w=1600&auto=format&fit=crop"
              alt="The Piercyn Edit — Lagos After Dark"
              className="w-full h-full object-cover object-center filter brightness-[0.70] contrast-[1.08] transition-transform duration-1000 hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/45 to-transparent" />
          </div>

          {/* Editorial Content */}
          <div className="relative z-10 max-w-2xl text-left">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase text-[#A48B71] font-bold block mb-2 sm:mb-3">
              THE PIERCYN EDIT • SERIES 26
            </span>

            <h2 className="font-editorial text-[10vw] sm:text-[7vw] lg:text-[5vw] xl:text-[68px] leading-[0.92] tracking-tight uppercase text-[#F2F0EB] mb-3 sm:mb-4">
              LAGOS AFTER <span className="italic font-light text-[#A48B71]">DARK.</span>
            </h2>

            <p className="font-sans text-[13px] sm:text-[15px] leading-relaxed text-[#D5CFBF] max-w-lg mb-6 sm:mb-8 font-normal">
              Heavyweight cottons, understated hardware, and effortless fits tailored for night movement.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => onSelectPage('collections')}
                className="h-12 px-7 rounded-full bg-[#F2F0EB] text-[#141414] hover:bg-white transition-all duration-300 font-sans text-[12px] sm:text-[13px] font-bold tracking-[0.16em] uppercase inline-flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
              >
                <span>SHOP THE EDIT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onSelectPage('shop')}
                className="h-12 px-6 rounded-full border border-[#F2F0EB]/60 bg-black/40 backdrop-blur-xs text-[#F2F0EB] hover:bg-[#F2F0EB] hover:text-[#141414] transition-all duration-300 font-sans text-[12px] sm:text-[13px] font-semibold tracking-[0.16em] uppercase inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>EXPLORE ALL PIECES</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
