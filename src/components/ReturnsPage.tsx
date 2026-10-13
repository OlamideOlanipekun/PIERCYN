import React from 'react';
import { ActivePageView } from '../types';
import { 
  RotateCcw, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  MessageCircle, 
  CheckCircle2, 
  ArrowRight,
  PackageCheck
} from 'lucide-react';

interface ReturnsPageProps {
  onSelectPage: (page: ActivePageView) => void;
}

export const ReturnsPage: React.FC<ReturnsPageProps> = ({ onSelectPage }) => {
  const whatsappReturnMessage = encodeURIComponent(
    "Hello PIERCYN Support! I would like to request an exchange for my recent order."
  );

  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-24 sm:pt-28 pb-20 font-sans">
      <div className="piercyn-container max-w-4xl mx-auto">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-8">
          <button onClick={() => onSelectPage('home')} className="hover:text-[#141414] cursor-pointer">
            HOME
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <span className="text-[#141414] font-semibold">RETURNS & EXCHANGES</span>
        </nav>

        {/* Page Header */}
        <header className="mb-12 border-b border-[#DAD8D1] pb-8">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#7A7771] block mb-2 font-semibold">
            CLIENT SATISFACTION · LAGOS ATELIER
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#141414] italic font-normal tracking-tight">
            Returns & Exchanges
          </h1>
          <p className="mt-4 text-[14px] sm:text-[15px] text-[#4A4844] max-w-2xl leading-relaxed">
            We want every PIERCYN piece to fit you with absolute confidence. If your size isn't right or a piece arrives with an imperfection, our straightforward exchange policy ensures a seamless resolution.
          </p>
        </header>

        {/* Core Principles Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#141414] text-[#F2F0EB] flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-xl italic text-[#141414] mb-2">
                7-Day Exchange Window
              </h3>
              <p className="text-xs text-[#55524D] leading-relaxed">
                Contact our concierge team within 7 calendar days of delivery to request an exchange for size or alternative piece.
              </p>
            </div>
            <span className="mt-4 text-[10px] font-mono uppercase tracking-wider text-[#7A7771] font-semibold">
              PROMPT RESOLUTION
            </span>
          </div>

          <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#141414] text-[#F2F0EB] flex items-center justify-center mb-4">
                <PackageCheck className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-xl italic text-[#141414] mb-2">
                Pristine Condition
              </h3>
              <p className="text-xs text-[#55524D] leading-relaxed">
                Garments must be unworn, unwashed, free of stains or fragrance, with original PIERCYN tags intact.
              </p>
            </div>
            <span className="mt-4 text-[10px] font-mono uppercase tracking-wider text-[#7A7771] font-semibold">
              ORIGINAL PACKAGING
            </span>
          </div>

          <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#141414] text-[#F2F0EB] flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-xl italic text-[#141414] mb-2">
                Defect Guarantee
              </h3>
              <p className="text-xs text-[#55524D] leading-relaxed">
                If an item is damaged or incorrectly fulfilled, we cover 100% of the replacement courier costs immediately.
              </p>
            </div>
            <span className="mt-4 text-[10px] font-mono uppercase tracking-wider text-[#7A7771] font-semibold">
              ZERO CLIENT CHARGE
            </span>
          </div>

        </section>

        {/* Step-by-Step Procedure */}
        <section className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-9 mb-12">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7771] block mb-2 font-semibold">
            THE PROCESS
          </span>
          <h2 className="font-editorial text-2xl sm:text-3xl italic text-[#141414] mb-6">
            How to Request an Exchange
          </h2>

          <div className="space-y-6">
            
            <div className="flex gap-4 items-start">
              <span className="w-7 h-7 rounded-full bg-[#141414] text-[#F2F0EB] flex items-center justify-center font-mono text-xs font-bold shrink-0">
                1
              </span>
              <div>
                <h4 className="font-semibold text-sm text-[#141414] mb-1">
                  Message Our WhatsApp Concierge
                </h4>
                <p className="text-xs text-[#55524D] leading-relaxed">
                  Provide your order number (e.g. <code>PCY-123456-789</code>), the garment you wish to exchange, and your preferred replacement size.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <span className="w-7 h-7 rounded-full bg-[#141414] text-[#F2F0EB] flex items-center justify-center font-mono text-xs font-bold shrink-0">
                2
              </span>
              <div>
                <h4 className="font-semibold text-sm text-[#141414] mb-1">
                  Atelier Authorization & Inspection
                </h4>
                <p className="text-xs text-[#55524D] leading-relaxed">
                  Our team confirms replacement availability and assigns a courier return tag. In Lagos, our dispatch rider collects the piece from your address. For nationwide orders, drop-off is arranged via our partner hub.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <span className="w-7 h-7 rounded-full bg-[#141414] text-[#F2F0EB] flex items-center justify-center font-mono text-xs font-bold shrink-0">
                3
              </span>
              <div>
                <h4 className="font-semibold text-sm text-[#141414] mb-1">
                  Replacement Dispatch
                </h4>
                <p className="text-xs text-[#55524D] leading-relaxed">
                  Upon receiving and inspecting the returned item, your replacement piece is dispatched within 24–48 business hours with fresh tracking updates.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Policy Specifics Accordion / Cards */}
        <section className="space-y-4 mb-12">
          
          <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-xl p-5">
            <h4 className="font-semibold text-sm text-[#141414] mb-1.5 uppercase font-mono tracking-wider">
              Exchanges vs Refunds
            </h4>
            <p className="text-xs text-[#55524D] leading-relaxed">
              As a limited-batch fashion label producing curated drops, orders are eligible for size or style exchanges or store credit valid for 12 months. Monetary refunds are issued specifically in cases of verified manufacturer defects that cannot be replaced or unfulfillable supplier items.
            </p>
          </div>

          <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-xl p-5">
            <h4 className="font-semibold text-sm text-[#141414] mb-1.5 uppercase font-mono tracking-wider">
              Available-to-Order Piece Cancellations
            </h4>
            <p className="text-xs text-[#55524D] leading-relaxed">
              Pieces marked <em>Available to Order</em> may be cancelled for a 100% full refund before the external supplier sourcing window completes (within 24 hours of placing the order). If the supplier cannot fulfill your piece, you will be notified immediately and refunded in full.
            </p>
          </div>

        </section>

        {/* WhatsApp Direct Action Bar */}
        <section className="bg-[#141414] text-[#F2F0EB] rounded-2xl p-6 sm:p-9 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#DAD8D1]/80 block mb-1">
              SUPPORT OPERATIONS
            </span>
            <h3 className="font-editorial text-2xl sm:text-3xl italic">
              Need assistance with an order?
            </h3>
            <p className="mt-1 text-xs text-white/70 max-w-md">
              Speak directly with our Lagos team. Response time is usually under 15 minutes during operating hours (Mon–Sat, 9am–6pm WAT).
            </p>
          </div>

          <a
            href={`https://wa.me/2348000000000?text=${whatsappReturnMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#F2F0EB] text-[#141414] text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-800" />
            <span>Open WhatsApp Chat</span>
          </a>
        </section>

      </div>
    </main>
  );
};
