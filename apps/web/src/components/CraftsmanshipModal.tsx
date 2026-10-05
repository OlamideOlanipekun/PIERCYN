import React from 'react';
import { useShop } from '../context/ShopContext';
import { X, Check, Sparkles, Layers, Shield, Scissors } from 'lucide-react';

export const CraftsmanshipModal: React.FC = () => {
  const { isCraftsmanshipOpen, setIsCraftsmanshipOpen, setIsStoryOpen } = useShop();

  if (!isCraftsmanshipOpen) return null;

  const specs = [
    {
      title: '450 GSM DENSE LOOPBACK FLEECE',
      icon: Layers,
      description: 'Knitted on vintage loopwheel frames in West Africa using combed long-staple organic cotton. The resulting fleece delivers unmatched structural gravity and drape without stiffness.'
    },
    {
      title: 'DOUBLE-LAYER ARCHITECTURAL HOOD',
      icon: Scissors,
      description: 'Engineered with zero drawstrings. Self-fabric lining on both sides ensures the hood stands tall around the neck, maintaining an intentional sculptural profile.'
    },
    {
      title: 'TWIN-NEEDLE FLATLOCK SEAMING',
      icon: Shield,
      description: 'All structural joins are reinforced with high-tensile industrial thread, preventing seam torsion and distortion over decades of machine washing.'
    },
    {
      title: 'MINERAL WASH & PRE-SHRUNK CURE',
      icon: Sparkles,
      description: 'Garment dyed with low-impact natural pigments and cold-washed with sea minerals to eliminate shrinkage (<1% tolerance) and impart rich tactile depth.'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCraftsmanshipOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 lg:p-10">
        <div className="relative w-full max-w-4xl bg-[#F2F0EB] text-[#141414] shadow-2xl border border-[#E3DEC3] rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-[#E3DEC3] flex items-center justify-between bg-[#EBE7DF] font-sans">
            <div>
              <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] font-sans font-semibold text-[#6E6B65] block mb-1">
                MATERIAL BENCHMARK • LAGOS ATELIER
              </span>
              <h2 className="font-editorial text-2xl sm:text-4xl uppercase tracking-[-0.025em] text-[#141414]">
                THE CRAFTSMANSHIP OF 450 GSM
              </h2>
            </div>

            <button
              onClick={() => setIsCraftsmanshipOpen(false)}
              className="min-w-[44px] min-h-[44px] rounded-full border border-[#141414]/20 hover:bg-[#141414]/10 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-10 space-y-8 font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {specs.map((spec, i) => {
                const IconComponent = spec.icon;
                return (
                  <div 
                    key={spec.title}
                    className="p-5 bg-[#EAE5DA] border border-[#D5CFBF] rounded-xl shadow-2xs space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#141414] text-[#F2F0EB] flex items-center justify-center shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] sm:text-[12px] font-sans tracking-[0.14em] uppercase font-bold text-[#141414]">
                        0{i + 1}. {spec.title}
                      </span>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-[#4A4844] font-normal leading-[1.6]">
                      {spec.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* GSM Comparison Scale */}
            <div className="p-6 bg-[#141414] text-[#F2F0EB] rounded-xl space-y-4 font-sans">
              <div className="flex items-center justify-between text-[11px] font-sans tracking-[0.18em] uppercase font-semibold">
                <span className="text-[#A48B71]">FABRIC DENSITY COMPARISON MATRIX</span>
                <span className="text-white/70">STANDARDS</span>
              </div>

              <div className="space-y-3 font-sans text-[11px] sm:text-[12px]">
                <div>
                  <div className="flex justify-between mb-1 opacity-75 font-medium">
                    <span>FAST FASHION FLEECE (180 - 240 GSM)</span>
                    <span>FLIMSY</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full">
                    <div className="w-[35%] h-full bg-white/40 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 opacity-75 font-medium">
                    <span>STANDARD LUXURY STREETWEAR (320 - 380 GSM)</span>
                    <span>STANDARD</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full">
                    <div className="w-[68%] h-full bg-white/70 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-[#E3DEC3] font-bold">
                    <span>PIERCYN HEAVYWEIGHT FOUNDATION (450 GSM)</span>
                    <span className="text-[#A48B71]">MAXIMUM GRAVITY & STRUCTURE</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full">
                    <div className="w-[100%] h-full bg-[#A48B71] rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#E3DEC3] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <span className="text-[11px] uppercase font-sans tracking-[0.18em] text-[#6E6B65] font-semibold text-center sm:text-left">
                DESIGNED & CRAFTED IN SURULERE & VICTORIA ISLAND
              </span>
              <button
                onClick={() => {
                  setIsCraftsmanshipOpen(false);
                  setIsStoryOpen(true);
                }}
                className="w-full sm:w-auto h-12 min-h-[48px] px-7 rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] font-sans font-semibold uppercase tracking-[0.16em] hover:bg-black transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                OUR FULL STORY
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
