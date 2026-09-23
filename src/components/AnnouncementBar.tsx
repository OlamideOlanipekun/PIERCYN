import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, X, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AnnouncementBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lagosTime, setLagosTime] = useState('');
  const { setIsConciergeOpen, currency } = useShop();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Africa/Lagos',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      setLagosTime(`${new Intl.DateTimeFormat([], options).format(now)} WAT`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <aside 
      id="announcement-ticker-bar"
      aria-label="Atelier Dispatches"
      className="relative z-[55] w-full bg-[#141414] text-[#F2F0EB] text-[9.5px] sm:text-[10.5px] tracking-[0.24em] uppercase font-mono py-2 border-b border-[#282828] overflow-hidden select-none"
    >
      <div className="piercyn-container flex items-center justify-between">
        {/* Left: Location & Time Indicator */}
        <div className="hidden md:flex items-center gap-2.5 text-[#A48B71] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A48B71] animate-pulse" />
          <span className="font-semibold text-white/90">LAGOS ATELIER</span>
          <span className="opacity-60">• {lagosTime}</span>
        </div>

        {/* Center: Running Editorial Marquee / Ticker Message */}
        <div className="flex-1 flex items-center justify-center overflow-hidden mx-2 sm:mx-6">
          <div className="flex items-center gap-4 sm:gap-6 whitespace-nowrap text-[#F2F0EB]/90">
            <span className="flex items-center gap-2">
              <span className="text-[#A48B71] font-bold">JUST DROPPED</span>
              <span>— NEW HEAVYWEIGHT PIECES</span>
            </span>
            <span className="text-white/30 hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              FREE DELIVERY ON ORDERS OVER {currency === 'NGN' ? '₦100,000' : '$150 / €140'}
            </span>
            <span className="text-white/30 hidden lg:inline">•</span>
            <button 
              onClick={() => setIsConciergeOpen(true)}
              className="hidden lg:inline-flex items-center gap-1 text-[#E3DEC3] underline hover:text-white transition-colors cursor-pointer"
            >
              <span>CHAT WITH US ON WHATSAPP</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Right: WhatsApp Help & Close Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsConciergeOpen(true)}
            className="sm:hidden text-[9px] text-[#A48B71] underline cursor-pointer py-1"
          >
            NEED HELP?
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="opacity-50 hover:opacity-100 transition-opacity min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
            aria-label="Dismiss Announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
