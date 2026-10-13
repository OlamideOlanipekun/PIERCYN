import React from 'react';
import { Truck, Clock, ShieldCheck, MapPin, ChevronRight, MessageCircle } from 'lucide-react';
import { ActivePageView } from '../types';
import { SHIPPING_CONFIG } from '../utils/shipping';

interface ShippingPageProps {
  onSelectPage: (page: ActivePageView) => void;
}

export const ShippingPage: React.FC<ShippingPageProps> = ({ onSelectPage }) => {
  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-24 sm:pt-28 pb-20 font-sans">
      <div className="piercyn-container max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-8">
          <button onClick={() => onSelectPage('home')} className="hover:text-[#141414] cursor-pointer">
            HOME
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <span className="text-[#141414] font-semibold">SHIPPING & DELIVERY</span>
        </nav>

        {/* Page Header */}
        <header className="mb-12 border-b border-[#DAD8D1] pb-8">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#7A7771] block mb-2 font-semibold">
            DELIVERY OPERATIONS · LAGOS & NATIONWIDE
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#141414] italic font-normal tracking-tight">
            Shipping & Delivery
          </h1>
          <p className="mt-4 text-[14px] sm:text-[15px] text-[#4A4844] max-w-2xl leading-relaxed">
            Every PIERCYN piece is inspected, packed with care in our Lagos studio, and dispatched via verified logistics partners. Transparent rates, genuine timelines, and live WhatsApp tracking updates.
          </p>
        </header>

        {/* Delivery Rates Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Lagos Doorstep */}
          <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#141414] text-[#F2F0EB] flex items-center justify-center mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[#7A7771] block mb-1">
                LOCAL DISPATCH
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl italic text-[#141414] mb-3">
                Lagos Doorstep
              </h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-mono text-2xl font-bold text-[#141414]">
                  ₦{SHIPPING_CONFIG.lagosDeliveryFeeNGN.toLocaleString()}
                </span>
                <span className="text-xs text-[#6E6B65]">flat rate</span>
              </div>
              <ul className="space-y-2 text-xs text-[#4A4844] mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-[#141414] font-bold">✓</span>
                  <span><strong>{SHIPPING_CONFIG.lagosTimeframe}</strong> average delivery window.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#141414] font-bold">✓</span>
                  <span>Orders confirmed before 12:00 PM dispatch same business day.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#141414] font-bold">✓</span>
                  <span>Direct bike dispatch across Island and Mainland areas.</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-[#DAD6CC] text-[11px] font-mono text-emerald-800 font-semibold">
              FREE for orders above ₦{SHIPPING_CONFIG.freeShippingThresholdNGN.toLocaleString()}
            </div>
          </div>

          {/* Nationwide Nigeria */}
          <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#141414] text-[#F2F0EB] flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[#7A7771] block mb-1">
                INTERSTATE TRANSIT
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl italic text-[#141414] mb-3">
                Nationwide Nigeria
              </h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-mono text-2xl font-bold text-[#141414]">
                  ₦{SHIPPING_CONFIG.nationwideDeliveryFeeNGN.toLocaleString()}
                </span>
                <span className="text-xs text-[#6E6B65]">flat rate</span>
              </div>
              <ul className="space-y-2 text-xs text-[#4A4844] mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-[#141414] font-bold">✓</span>
                  <span><strong>{SHIPPING_CONFIG.nationwideTimeframe}</strong> door delivery.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#141414] font-bold">✓</span>
                  <span>Dispatched via GIG Logistics, DHL, and Fez Delivery.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#141414] font-bold">✓</span>
                  <span>Includes tracking number and SMS delivery dispatch notice.</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-[#DAD6CC] text-[11px] font-mono text-emerald-800 font-semibold">
              FREE for orders above ₦{SHIPPING_CONFIG.freeShippingThresholdNGN.toLocaleString()}
            </div>
          </div>
        </section>

        {/* In-Stock vs Available-to-Order Dispatch Timelines */}
        <section className="bg-white/60 border border-[#DAD8D1] rounded-2xl p-6 sm:p-8 mb-12">
          <h2 className="font-editorial text-2xl sm:text-3xl italic text-[#141414] mb-4">
            Understanding Dispatch Timelines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#4A4844] leading-relaxed">
            <div className="border-l-2 border-[#141414] pl-4">
              <span className="font-mono font-bold uppercase text-[11px] text-[#141414] block mb-1">
                A. IN-STOCK PHYSICAL PIECES
              </span>
              <p>
                Our core graphic tees and drops held in Lagos warehouse inventory dispatch within <strong>24–48 hours</strong> of payment verification. When an item is marked "IN STOCK", physical units are physically counted and reserved for you.
              </p>
            </div>
            <div className="border-l-2 border-[#A48B71] pl-4">
              <span className="font-mono font-bold uppercase text-[11px] text-[#141414] block mb-1">
                B. AVAILABLE-TO-ORDER PIECES
              </span>
              <p>
                Certain outer garments and limited sizes are sourced directly on request from our partner production atelier. These are dispatched in <strong>5–7 business days</strong>. We verify availability before charging and notify you every step of the way.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Shipping Policies */}
        <section className="space-y-6 text-xs sm:text-sm text-[#4A4844] leading-relaxed border-t border-[#DAD8D1] pt-8">
          <div>
            <h3 className="font-bold text-[#141414] uppercase text-xs tracking-wider mb-2">
              Delivery Address & Instruction Changes
            </h3>
            <p>
              Please review your delivery address, city, and primary contact phone number during checkout. If you need to update your address after placing an order, please contact our WhatsApp concierge within <strong>2 hours</strong> of checkout so we can update the courier manifest before dispatch.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#141414] uppercase text-xs tracking-wider mb-2">
              Failed Delivery Attempts
            </h3>
            <p>
              Our dispatch riders make up to two delivery attempts. You will receive a phone call prior to arrival. If a delivery cannot be completed due to incorrect phone details or recipient unavailability, your package will be held at the nearest logistics hub for 48 hours for collection or rescheduled dispatch.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#141414] uppercase text-xs tracking-wider mb-2">
              International Delivery
            </h3>
            <p>
              Currently, V1 direct website checkout covers all 36 States of Nigeria. For international orders to Ghana, the UK, Europe, or North America, please reach out directly to our WhatsApp concierge for custom courier quotes via DHL Express.
            </p>
          </div>
        </section>

        {/* WhatsApp Assistance Banner */}
        <div className="mt-12 bg-[#141414] text-[#F2F0EB] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-editorial text-2xl italic">Need delivery assistance?</h3>
            <p className="text-xs text-white/70 mt-1">Our Lagos dispatch desk is active Monday to Saturday, 9 AM – 7 PM WAT.</p>
          </div>
          <a
            href="https://wa.me/2348000000000?text=Hello%20PIERCYN%20Dispatch!%20I%20have%20a%20question%20about%20shipping%20and%20delivery."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#20bd5a] transition-colors shrink-0 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat with Dispatch</span>
          </a>
        </div>
      </div>
    </main>
  );
};
