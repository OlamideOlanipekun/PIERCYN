import React from 'react';
import { Truck, ShieldCheck, MessageCircle, Sparkles } from 'lucide-react';
import { SHIPPING_CONFIG } from '../utils/shipping';

export const TrustReassuranceSection: React.FC = () => {
  const pillars = [
    {
      icon: Truck,
      title: 'FAST DOORSTEP DELIVERY',
      desc: `Lagos orders in ${SHIPPING_CONFIG.lagosTimeframe}. Nationwide delivery across Nigeria in ${SHIPPING_CONFIG.nationwideTimeframe}.`,
    },
    {
      icon: ShieldCheck,
      title: 'SECURE ORDERING',
      desc: 'Pay directly via verified bank transfer or Paystack. Instant SMS and email order reservation.',
    },
    {
      icon: MessageCircle,
      title: 'WHATSAPP CONCIERGE',
      desc: 'Real human support based in Lagos. Chat with us directly for sizing guidance and order updates.',
    },
    {
      icon: Sparkles,
      title: 'HONEST FASHION VALUE',
      desc: 'Heavyweight fabrics (320–450 GSM), custom proportions, and clean finishing without luxury markups.',
    },
  ];

  return (
    <section
      id="trust-reassurance-section"
      className="w-full bg-[#EAE5D9]/60 text-[#141414] py-12 sm:py-16 border-b border-[#DAD8D1]/70 font-sans"
    >
      <div className="piercyn-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="flex flex-col text-left space-y-2.5 p-4 rounded-xl bg-[#F2F0EB]/60 border border-[#DAD8D1]/50"
              >
                <div className="w-9 h-9 rounded-full bg-[#141414] text-[#F2F0EB] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#141414] font-sans">
                  {p.title}
                </h4>
                <p className="text-xs text-[#6E6B65] leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
