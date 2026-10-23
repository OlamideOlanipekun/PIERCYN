import React from 'react';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const WhatsAppCTASection: React.FC = () => {
  const { setIsConciergeOpen } = useShop();

  const defaultMsg = encodeURIComponent(
    "Hello PIERCYN! I'm browsing the store and have a question about sizing and delivery."
  );

  return (
    <section
      id="whatsapp-cta-section"
      className="w-full bg-[#1C1A18] text-[#F2F0EB] py-14 sm:py-20 border-b border-[#333]"
    >
      <div className="piercyn-container">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8 bg-gradient-to-r from-[#24211D] to-[#1C1A18] p-6 sm:p-10 lg:p-12 rounded-2xl border border-white/10">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="section-eyebrow text-[#A48B71]">
                LAGOS CUSTOMER CARE
              </span>
            </div>
            
            <h3 className="font-editorial text-[24px] sm:text-[34px] lg:text-[40px] leading-tight uppercase mb-2">
              NEED HELP? WE'RE HERE.
            </h3>
            
            <p className="font-sans text-[13px] sm:text-[14px] text-[#D5CFBF] font-normal leading-relaxed">
              Chat directly with our Lagos team on WhatsApp — we'll help you pick your size, track your delivery, or place an order.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <a
              href={`https://wa.me/2348076431059?text=${defaultMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-7 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all duration-300 font-sans text-[12px] sm:text-[13px] font-bold tracking-[0.14em] uppercase inline-flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>CHAT ON WHATSAPP</span>
            </a>

            <button
              onClick={() => setIsConciergeOpen(true)}
              className="h-12 px-6 rounded-full border border-white/30 hover:border-white text-[#F2F0EB] transition-all duration-300 font-sans text-[12px] sm:text-[13px] font-semibold tracking-[0.14em] uppercase inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>SEND A MESSAGE</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
