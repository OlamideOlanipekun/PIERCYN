import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { SHIPPING_CONFIG } from '../utils/shipping';

export const AnnouncementBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { currency } = useShop();

  if (!isVisible) return null;

  const threshold =
    currency === 'NGN'
      ? `₦${SHIPPING_CONFIG.freeShippingThresholdNGN.toLocaleString()}`
      : currency === 'USD'
      ? '$150'
      : currency === 'GBP'
      ? '£120'
      : '€140';

  return (
    <aside
      id="announcement-ticker-bar"
      aria-label="Delivery information"
      className="relative z-[55] w-full bg-[#141414] text-[#F2F0EB] text-[9.5px] sm:text-[10.5px] tracking-[0.22em] uppercase font-mono py-2 border-b border-[#282828] select-none"
    >
      <div className="piercyn-container flex items-center justify-between">
        {/* Left: Lagos identifier (desktop only) */}
        <div className="hidden md:flex items-center gap-2 text-[#8C8A84] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A48B71]" />
          <span className="text-[#A48B71] font-semibold">LAGOS</span>
        </div>

        {/* Center: Commerce message */}
        <div className="flex-1 flex items-center justify-center gap-3 sm:gap-5 whitespace-nowrap text-[#F2F0EB]/85">
          <span>
            FREE DELIVERY ON ORDERS OVER{' '}
            <span className="text-[#F2F0EB] font-semibold">{threshold}</span>
          </span>
          <span className="text-white/25 hidden sm:inline">•</span>
          <a
            href="https://wa.me/2348000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline text-[#A48B71] hover:text-[#F2F0EB] transition-colors underline underline-offset-2"
          >
            CHAT ON WHATSAPP
          </a>
        </div>

        {/* Right: Dismiss */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => setIsVisible(false)}
            className="opacity-40 hover:opacity-100 transition-opacity min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
            aria-label="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
