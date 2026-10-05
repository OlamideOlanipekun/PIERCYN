import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface WomenNewArrivalsCtaProps {
  onShopAll: () => void;
}

export const WomenNewArrivalsCta: React.FC<WomenNewArrivalsCtaProps> = ({ onShopAll }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <section 
      id="women-new-arrivals-cta"
      className="w-full bg-[#141414] text-[#F2F0EB] py-16 sm:py-24 border-t border-white/10"
    >
      <div className="piercyn-container">
        <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-10">
          
          <div className="space-y-3">
            <span className="text-[11px] font-mono tracking-[0.3em] text-[#E3DEC3] uppercase font-semibold block">
              ATELIER RUNWAY & PRIVATE EDITS
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl md:text-6xl uppercase tracking-tight leading-[0.95] text-[#F2F0EB]">
              BE FIRST FOR THE NEXT WOMEN’S CAPSULE.
            </h2>
            <p className="text-sm sm:text-base md:text-lg font-sans text-[#D8D4CA] max-w-xl mx-auto leading-relaxed">
              Subscribers receive 1-hour early access to limited heavyweight women’s releases and private atelier salon invitations in Lagos.
            </p>
          </div>

          {/* Form or Success State */}
          <div className="max-w-md mx-auto">
            {subscribed ? (
              <div className="p-4 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center gap-3 text-sm font-sans tracking-wide text-[#E3DEC3]">
                <Check className="w-4 h-4 text-[#E3DEC3]" />
                <span>You are registered for PIERCYN Women’s Private Dispatches.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL"
                  required
                  className="flex-1 bg-white/10 border border-white/20 rounded-full px-5 py-3 text-xs sm:text-sm font-mono tracking-wider text-[#F2F0EB] placeholder:text-[#8C887B] focus:outline-hidden focus:border-[#E3DEC3] transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#F2F0EB] text-[#141414] rounded-full text-xs font-sans uppercase tracking-[0.2em] font-bold hover:bg-[#E3DEC3] transition-colors cursor-pointer shrink-0"
                >
                  JOIN DISPATCH
                </button>
              </form>
            )}
          </div>

          {/* Direct Shop Link */}
          <div className="pt-2">
            <button
              onClick={onShopAll}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#C5BDB0] hover:text-[#F2F0EB] border-b border-[#706E6B] hover:border-[#F2F0EB] pb-1 transition-all cursor-pointer"
            >
              <span>BACK TO ALL WOMEN'S PIECES</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
