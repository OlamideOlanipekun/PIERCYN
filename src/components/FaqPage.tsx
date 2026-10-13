import React, { useState } from 'react';
import { ActivePageView } from '../types';
import { ChevronDown, ChevronRight, HelpCircle, MessageCircle, ArrowRight } from 'lucide-react';
import { SHIPPING_CONFIG } from '../utils/shipping';

interface FaqPageProps {
  onSelectPage: (page: ActivePageView) => void;
}

interface FaqItem {
  question: string;
  answer: string | React.ReactNode;
  category: 'ordering' | 'availability' | 'shipping' | 'returns' | 'care';
}

export const FaqPage: React.FC<FaqPageProps> = ({ onSelectPage }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    '0': true,
    '3': true,
  });

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const faqList: FaqItem[] = [
    {
      category: 'ordering',
      question: 'Do I need an account to place an order on PIERCYN?',
      answer: 'No. PIERCYN is built on frictionless guest checkout. You only provide your name, phone number, and delivery address during checkout. No mandatory password or account creation is required.',
    },
    {
      category: 'ordering',
      question: 'What payment methods do you accept?',
      answer: (
        <span>
          We accept <strong>Direct Bank Transfer</strong> (with instant reservation) and online payments via <strong>Paystack</strong> (Mastercard, Visa, Verve, USSD, and bank transfer). All card transactions are 100% encrypted and processed securely.
        </span>
      ),
    },
    {
      category: 'availability',
      question: 'What is the difference between "In Stock" and "Available to Order"?',
      answer: (
        <span>
          <strong>In Stock</strong> pieces are physically stored in our Lagos studio and dispatch within 24–48 hours. <strong>Available to Order</strong> pieces are produced or sourced upon order from verified external craft partners, with dispatch typically occurring within 5–7 business days. We always disclose the expected timeline on each product page and during checkout.
        </span>
      ),
    },
    {
      category: 'shipping',
      question: 'How fast is delivery and how much does it cost?',
      answer: (
        <span>
          Within Lagos, delivery takes <strong>{SHIPPING_CONFIG.lagosTimeframe}</strong> at a flat rate of <strong>₦{SHIPPING_CONFIG.lagosDeliveryFeeNGN.toLocaleString()}</strong>. Nationwide delivery across Nigeria takes <strong>{SHIPPING_CONFIG.nationwideTimeframe}</strong> at <strong>₦{SHIPPING_CONFIG.nationwideDeliveryFeeNGN.toLocaleString()}</strong>. Orders over <strong>₦{SHIPPING_CONFIG.freeShippingThresholdNGN.toLocaleString()}</strong> qualify for complimentary free delivery!
        </span>
      ),
    },
    {
      category: 'shipping',
      question: 'How do I track my order once dispatched?',
      answer: 'Upon courier assignment, you will receive real-time updates with your rider contact or interstate tracking reference via WhatsApp and email. You can also track your order directly on our Track Order page.',
    },
    {
      category: 'returns',
      question: 'What is your exchange policy if a size does not fit?',
      answer: 'We offer a straightforward 7-day exchange window from delivery date for unworn pieces with original tags intact. If your size is not right, simply reach out to our WhatsApp concierge and we will arrange a replacement or store credit.',
    },
    {
      category: 'returns',
      question: 'What happens if a piece arrives defective or damaged?',
      answer: 'We thoroughly inspect every piece prior to dispatch. However, if any defect is identified, notify us within 48 hours of delivery and PIERCYN covers 100% of return courier costs for an immediate priority replacement.',
    },
    {
      category: 'care',
      question: 'How should I wash and care for heavyweight PIERCYN cotton tees?',
      answer: 'Wash inside out in cold water (30°C) with like colors. Avoid harsh bleaching agents or high-heat tumble dryers. Dry flat in shade and warm iron inside out to maintain the 280 GSM fabric density and graphic print vibrancy.',
    },
    {
      category: 'care',
      question: 'How do PIERCYN garments fit compared to standard high-street sizes?',
      answer: 'PIERCYN garments are engineered with an architectural, boxy oversized silhouette featuring dropped shoulders. We recommend choosing your normal size for our intended streetwear drape, or sizing down one size for a closer standard fit.',
    },
  ];

  const filteredFaqs = activeCategory === 'all'
    ? faqList
    : faqList.filter((f) => f.category === activeCategory);

  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-24 sm:pt-28 pb-20 font-sans">
      <div className="piercyn-container max-w-4xl mx-auto">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-8">
          <button onClick={() => onSelectPage('home')} className="hover:text-[#141414] cursor-pointer">
            HOME
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <span className="text-[#141414] font-semibold">FREQUENTLY ASKED QUESTIONS</span>
        </nav>

        {/* Page Header */}
        <header className="mb-10 border-b border-[#DAD8D1] pb-8">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#7A7771] block mb-2 font-semibold">
            KNOWLEDGE BASE & SUPPORT
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#141414] italic font-normal tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-[14px] sm:text-[15px] text-[#4A4844] max-w-2xl leading-relaxed">
            Clear, transparent answers regarding checkout, fulfillment timelines, sizing specifications, and order logistics from our Lagos studio.
          </p>
        </header>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { label: 'ALL QUESTIONS', value: 'all' },
            { label: 'ORDERING & PAYMENT', value: 'ordering' },
            { label: 'STOCK & SOURCING', value: 'availability' },
            { label: 'DELIVERY & SHIPPING', value: 'shipping' },
            { label: 'EXCHANGES & RETURNS', value: 'returns' },
            { label: 'FIT & CARE', value: 'care' },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === cat.value
                  ? 'bg-[#141414] text-[#F2F0EB] font-bold'
                  : 'bg-[#EAE6DD] border border-[#DAD6CC] text-[#55524D] hover:border-[#141414]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3 mb-12">
          {filteredFaqs.map((faq, idx) => {
            const key = `${idx}`;
            const isOpen = Boolean(openItems[key]);

            return (
              <div
                key={faq.question}
                className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(key)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-white/30 transition-colors"
                >
                  <span className="font-semibold text-sm sm:text-base text-[#141414] pr-4 font-sans">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#7A7771] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#141414]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-[#55524D] leading-relaxed border-t border-[#DAD6CC]/70 pt-3 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* WhatsApp Support Callout */}
        <div className="bg-[#141414] text-[#F2F0EB] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-editorial text-2xl italic">Still have an unanswered question?</h3>
            <p className="text-xs text-white/70 mt-1">Our live Lagos concierge is available via WhatsApp to answer any specific query.</p>
          </div>
          <a
            href="https://wa.me/2348000000000?text=Hello%20PIERCYN!%20I%20have%20a%20question%20not%20covered%20in%20your%20FAQ."
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full bg-[#F2F0EB] text-[#141414] text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shrink-0 inline-flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-800" />
            <span>Chat With Concierge</span>
          </a>
        </div>

      </div>
    </main>
  );
};
