import React from 'react';
import { ActivePageView } from '../types';
import { ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { SHIPPING_CONFIG } from '../utils/shipping';

interface TermsPageProps {
  onSelectPage: (page: ActivePageView) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onSelectPage }) => {
  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-24 sm:pt-28 pb-20 font-sans">
      <div className="piercyn-container max-w-4xl mx-auto">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-8">
          <button onClick={() => onSelectPage('home')} className="hover:text-[#141414] cursor-pointer">
            HOME
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <span className="text-[#141414] font-semibold">TERMS & CONDITIONS</span>
        </nav>

        {/* Page Header */}
        <header className="mb-12 border-b border-[#DAD8D1] pb-8">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#7A7771] block mb-2 font-semibold">
            LEGAL FRAMEWORK · PIERCYN ATELIER
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#141414] italic font-normal tracking-tight">
            Terms & Conditions
          </h1>
          <p className="mt-4 text-[14px] sm:text-[15px] text-[#4A4844] max-w-2xl leading-relaxed">
            These terms govern all orders placed on piercyn.com and interactions with our Lagos atelier. By placing an order, you agree to these operational policies.
          </p>
          <span className="text-[11px] font-mono text-[#7A7771] block mt-4">
            EFFECTIVE DATE: OCTOBER 2026 · REGULATED UNDER THE LAWS OF THE FEDERAL REPUBLIC OF NIGERIA
          </span>
        </header>

        {/* Terms Sections */}
        <div className="space-y-8 text-[14px] sm:text-[15px] leading-relaxed text-[#3A3834] font-sans">
          
          <section className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8">
            <h2 className="font-editorial text-2xl italic text-[#141414] mb-3">
              1. Ordering & Contract Formation
            </h2>
            <p className="text-xs sm:text-sm text-[#4A4844] leading-relaxed mb-3">
              When you submit an order through our storefront, you receive an automated order reference (e.g. <code>PCY-123456-789</code>). A contract is formally accepted when our atelier verifies inventory availability and confirms receipt of payment. We reserve the right to decline or cancel orders in cases of pricing inaccuracies, suspected automated scraping, or unfulfillable supplier inventory.
            </p>
          </section>

          <section className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8">
            <h2 className="font-editorial text-2xl italic text-[#141414] mb-3">
              2. Product Availability: Physical Stock vs. Available to Order
            </h2>
            <p className="text-xs sm:text-sm text-[#4A4844] leading-relaxed mb-3">
              PIERCYN operates with a hybrid inventory structure to maintain limited, high-quality production runs:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#4A4844]">
              <li><strong>In Stock:</strong> Physical garments present in our Lagos atelier. These pieces are prepared and dispatched within <strong>24–48 hours</strong> of verified payment.</li>
              <li><strong>Available to Order:</strong> Pieces sourced on demand from external verified craft partners. Sourcing and dispatch takes approximately <strong>5–7 business days</strong>. If a supplier fails to provide the requested piece, the customer is immediately refunded in full.</li>
            </ul>
          </section>

          <section className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8">
            <h2 className="font-editorial text-2xl italic text-[#141414] mb-3">
              3. Pricing & Currency
            </h2>
            <p className="text-xs sm:text-sm text-[#4A4844] leading-relaxed mb-3">
              All authoritative prices on our storefront are quoted in <strong>Nigerian Naira (NGN)</strong>. Any foreign currency conversions shown are advisory estimates. The authoritative checkout amount charged is computed on our secure server during final checkout.
            </p>
          </section>

          <section className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8">
            <h2 className="font-editorial text-2xl italic text-[#141414] mb-3">
              4. Payment Policy
            </h2>
            <p className="text-xs sm:text-sm text-[#4A4844] leading-relaxed mb-3">
              Orders placed via <strong>Direct Bank Transfer</strong> hold a temporary inventory reservation for 24 hours. If proof of payment or verified bank credit is not received within this window, the reserved stock is automatically returned to the public catalogue.
            </p>
          </section>

          <section className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8">
            <h2 className="font-editorial text-2xl italic text-[#141414] mb-3">
              5. Delivery & Customer Responsibility
            </h2>
            <p className="text-xs sm:text-sm text-[#4A4844] leading-relaxed mb-3">
              Deliveries within Lagos are completed via doorstep couriers ({SHIPPING_CONFIG.lagosTimeframe}, ₦{SHIPPING_CONFIG.lagosDeliveryFeeNGN.toLocaleString()}). Deliveries outside Lagos are serviced via verified interstate logistics ({SHIPPING_CONFIG.nationwideTimeframe}, ₦{SHIPPING_CONFIG.nationwideDeliveryFeeNGN.toLocaleString()}). Orders exceeding ₦{SHIPPING_CONFIG.freeShippingThresholdNGN.toLocaleString()} receive free delivery. It is the customer's responsibility to provide an accurate address and active contact phone number.
            </p>
          </section>

          <section className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8">
            <h2 className="font-editorial text-2xl italic text-[#141414] mb-3">
              6. Exchanges & Cancellations
            </h2>
            <p className="text-xs sm:text-sm text-[#4A4844] leading-relaxed mb-3">
              Exchanges must be initiated within 7 calendar days of receipt. Garments must be unworn, undamaged, with original tags intact. In-stock orders already dispatched to couriers cannot be cancelled in transit. For detailed exchange guidelines, refer to our <button onClick={() => onSelectPage('returns')} className="underline font-semibold text-[#141414]">Returns Policy</button>.
            </p>
          </section>

        </div>

      </div>
    </main>
  );
};
