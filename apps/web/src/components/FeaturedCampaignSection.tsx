import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ActivePageView } from '../types';

interface FeaturedCampaignSectionProps {
  onExplore?: (category?: string) => void;
  onSelectPage?: (page: ActivePageView) => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const FeaturedCampaignSection: React.FC<FeaturedCampaignSectionProps> = ({
  onExplore,
  onSelectPage,
  onNavigateSection,
}) => {
  const handleShop = () => {
    if (onSelectPage) {
      onSelectPage('collections');
    }
    if (onNavigateSection) {
      onNavigateSection('collections-hero');
    } else if (onExplore) {
      onExplore('collections');
    }
  };

  return (
    <section
      id="featured-campaign-section"
      className="w-full bg-[#141414] text-[#F2F0EB] py-16 sm:py-24 lg:py-28 overflow-hidden relative"
    >
      <div className="piercyn-container">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#1D1D1D] min-h-[480px] sm:min-h-[580px] lg:min-h-[640px] flex flex-col justify-end p-6 sm:p-12 lg:p-16">
          {/* Background Campaign Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=85&w=1600&auto=format&fit=crop"
              alt="The Everyday Campaign"
              className="w-full h-full object-cover object-center filter brightness-[0.75] contrast-[1.05] scale-[1.02] transition-transform duration-1000 hover:scale-[1.05]"
              loading="lazy"
            />
            {/* Ambient Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-transparent" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none" />
          </div>

          {/* Content Content Container */}
          <div className="relative z-10 max-w-2xl">
            <span className="section-eyebrow text-[#A48B71] block mb-3">
              FEATURED CAMPAIGN • DROP 26.1
            </span>

            <h2 className="font-editorial text-[10vw] sm:text-[7vw] lg:text-[5vw] xl:text-[72px] leading-[0.92] tracking-[-0.03em] uppercase text-[#F2F0EB] mb-4">
              THE EVERYDAY <span className="italic font-light text-[#A48B71]">DROP</span>
            </h2>

            <p className="font-sans text-[13px] sm:text-[15px] leading-relaxed text-[#D5CFBF] max-w-lg mb-6 sm:mb-8 font-normal">
              Easy pieces. Better fits. Sculpted for daytime Lagos rhythm and global movement without the luxury markup.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleShop}
                className="h-12 px-7 rounded-full bg-[#F2F0EB] text-[#141414] hover:bg-white transition-all duration-300 font-sans text-[12px] sm:text-[13px] font-bold tracking-[0.16em] uppercase inline-flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
              >
                <span>SHOP THE DROP</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (onSelectPage) onSelectPage('lookbook');
                  if (onNavigateSection) onNavigateSection('lookbook-section');
                }}
                className="h-12 px-6 rounded-full border border-[#F2F0EB]/60 bg-black/30 backdrop-blur-xs text-[#F2F0EB] hover:bg-[#F2F0EB] hover:text-[#141414] transition-all duration-300 font-sans text-[12px] sm:text-[13px] font-semibold tracking-[0.16em] uppercase inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>VIEW LOOKBOOK</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
