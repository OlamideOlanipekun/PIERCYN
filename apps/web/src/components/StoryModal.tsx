import React from 'react';
import { useShop } from '../context/ShopContext';
import { X, ArrowRight, MapPin, Sparkles } from 'lucide-react';

export const StoryModal: React.FC = () => {
  const { isStoryOpen, setIsStoryOpen } = useShop();

  if (!isStoryOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={() => setIsStoryOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-6 lg:p-12">
        <div className="relative w-full max-w-5xl bg-[#F2F0EB] text-[#141414] shadow-2xl border-t sm:border border-[#E3DEC3] rounded-t-2xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 max-h-[92svh] overflow-y-auto">
          
          {/* Close */}
          <button
            onClick={() => setIsStoryOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 min-w-[44px] min-h-[44px] rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-[#141414] transition-all border border-[#141414]/10 cursor-pointer shadow-xs flex items-center justify-center"
            aria-label="Close Story"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Image Column */}
            <div className="lg:col-span-5 relative bg-[#181818] min-h-[260px] sm:min-h-[380px] lg:min-h-full">
              <img
                src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop"
                alt="PIERCYN Lagos Atelier Story"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 text-[#F2F0EB] text-[9px] sm:text-[10px] font-mono tracking-[0.2em] uppercase">
                <span className="block font-semibold">SURULERE & VICTORIA ISLAND</span>
                <span className="opacity-70">LAGOS ARCHITECTURAL MANIFESTO</span>
              </div>
            </div>

            {/* Story Content Column */}
            <div className="lg:col-span-7 p-5 sm:p-10 lg:p-12 space-y-5 sm:space-y-6 font-sans">
              <div>
                <span className="text-[11px] sm:text-[12px] font-sans font-semibold tracking-[0.25em] uppercase text-[#6E6B65] block mb-2">
                  THE GENESIS OF PIERCYN
                </span>
                <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl uppercase tracking-[-0.03em] leading-[0.95] text-[#141414]">
                  BORN IN NIGERIA. BUILT FOR EVERYWHERE.
                </h2>
              </div>

              <div className="space-y-3 sm:space-y-4 text-[14px] sm:text-[15px] text-[#4A4844] font-normal leading-[1.6]">
                <p>
                  PIERCYN was conceived out of a dissatisfaction with flimsy, generic fast fashion.
                  In Lagos, style is not an afterthought—it is a physical armor of presence and dignity.
                </p>
                <p>
                  We looked at the brutalist concrete structures across Lagos Island, the sharp contrasts of equatorial sunlight, and the kinetic confidence of African youth. We wanted clothing that held its own shape.
                </p>
                <p>
                  Every hoodie is cut from custom-milled 450 GSM French Terry that weighs nearly three times conventional cotton. Every seam is double-locked. Every shoulder drop is mathematically balanced to give the wearer an undeniable silhouette.
                </p>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-[#E3DEC3] grid grid-cols-2 gap-3 sm:gap-4 text-[10px] sm:text-[11px] font-sans uppercase tracking-[0.14em] text-[#141414]">
                <div>
                  <span className="text-[#8C8A84] block text-[9px] sm:text-[10px] font-semibold">DESIGN PHILOSOPHY</span>
                  <span className="font-bold">UNCOMPROMISING VOLUME</span>
                </div>
                <div>
                  <span className="text-[#8C8A84] block text-[9px] sm:text-[10px] font-semibold">SUSTAINABILITY</span>
                  <span className="font-bold">PERMANENT LONGEVITY</span>
                </div>
              </div>

              <div className="pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <button
                  onClick={() => setIsStoryOpen(false)}
                  className="w-full sm:w-auto h-12 min-h-[48px] px-8 rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] sm:text-[13px] uppercase tracking-[0.16em] font-semibold hover:bg-black transition-all cursor-pointer shadow-xs active:scale-[0.98] inline-flex items-center justify-center"
                >
                  ENTER THE COLLECTION
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
