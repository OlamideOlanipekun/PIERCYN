import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showToast } = useShop();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please provide a valid email address.');
      return;
    }
    setIsSubmitted(true);
    showToast("You're on the list!");
  };

  return (
    <section 
      id="newsletter-section" 
      className="relative w-full bg-[#F2F0EB] py-20 sm:py-28 lg:py-32 overflow-hidden border-b border-[#DAD8D1]"
    >
      <div className="piercyn-container text-center flex flex-col items-center font-sans">
        
        {/* Eyebrow */}
        <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-semibold block mb-3 sm:mb-4">
          STAY IN TOUCH
        </span>

        {/* Serif Headline: STAY CLOSE. */}
        <h2 className="font-editorial italic text-[15vw] sm:text-[12vw] lg:text-[9vw] xl:text-[125px] leading-[0.84] tracking-[-0.03em] uppercase text-[#141414] mb-4 sm:mb-6 select-none">
          <div>STAY</div>
          <div className="font-light text-[#141414]">CLOSE<span className="not-italic text-[#A48B71]">.</span></div>
        </h2>

        {/* Supporting Copy */}
        <p className="text-[14px] sm:text-[15px] text-[#4A4844] font-normal max-w-md mx-auto leading-[1.6] mb-8 sm:mb-12 tracking-[0.01em]">
          Be the first to know when new pieces drop.
        </p>

        {/* Underline Email Input */}
        {!isSubmitted ? (
          <form 
            onSubmit={handleSubmit} 
            className="w-full max-w-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0 border-b border-[#141414] pb-2 sm:pb-3 group focus-within:border-black transition-colors"
          >
            <input
              type="email"
              id="newsletter-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER YOUR EMAIL"
              required
              className="w-full min-h-[48px] bg-transparent text-[12px] sm:text-[13px] uppercase tracking-[0.15em] font-sans text-[#141414] placeholder-[#141414]/45 focus:outline-none"
            />
            <button
              type="submit"
              id="newsletter-submit-btn"
              className="min-h-[48px] text-[12px] sm:text-[13px] uppercase tracking-[0.2em] font-bold text-[#141414] flex items-center justify-center sm:justify-start gap-2 pl-0 sm:pl-4 cursor-pointer hover:opacity-70 transition-opacity active:scale-95"
            >
              <span>JOIN</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3 text-[#141414] text-[12px] sm:text-[13px] uppercase tracking-[0.15em] font-semibold border border-[#141414] px-6 py-3 rounded-full bg-[#E8E6E1]">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>YOU'RE ON THE LIST</span>
          </div>
        )}

        <div className="mt-8 text-[11px] sm:text-[12px] uppercase tracking-[0.22em] text-[#141414]/60 font-medium">
          LAGOS — LONDON — NEW YORK — TOKYO
        </div>

      </div>
    </section>
  );
};

