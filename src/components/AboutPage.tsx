import React from 'react';
import { ActivePageView } from '../types';
import { ArrowRight } from 'lucide-react';

interface AboutPageProps {
  onSelectPage: (page: ActivePageView) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onSelectPage }) => {
  return (
    <main
      id="about-page"
      className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-20 sm:pt-24 pb-20 sm:pb-28 font-sans"
    >
      <div className="piercyn-container max-w-[900px]">
        
        {/* Eyebrow */}
        <div className="pt-6 sm:pt-10 mb-6 sm:mb-8">
          <span className="text-[10px] font-mono tracking-[0.28em] uppercase text-[#7A7771]">
            ABOUT PIERCYN
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-editorial italic text-[clamp(44px,8vw,96px)] leading-[0.88] tracking-[-0.025em] text-[#141414] mb-10 sm:mb-14">
          LOOK GOOD.<br />SPEND LESS.
        </h1>

        {/* Hero image */}
        <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-[#141414] overflow-hidden mb-12 sm:mb-16 rounded-none">
          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1600&auto=format&fit=crop"
            alt="PIERCYN — Modern Nigerian fashion brand"
            className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.05]"
            loading="lazy"
          />
        </div>

        {/* Brand Story */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-16 mb-14 sm:mb-20">
          
          {/* Left: Section Label */}
          <div className="md:col-span-4">
            <span className="text-[10px] font-mono tracking-[0.28em] uppercase text-[#7A7771] block sticky top-28">
              WHAT WE ARE
            </span>
          </div>

          {/* Right: Body Copy */}
          <div className="md:col-span-8 space-y-5">
            <p className="text-[16px] sm:text-[17px] leading-[1.7] text-[#2A2724] font-normal">
              PIERCYN is a modern Nigerian fashion brand built on a simple idea: you should be able to look genuinely good without spending a fortune.
            </p>
            <p className="text-[15px] sm:text-[16px] leading-[1.7] text-[#4A4844]">
              We design and produce clothing for young people who care about how they look — people who understand that confidence and style don't have to come with a luxury price tag.
            </p>
            <p className="text-[15px] sm:text-[16px] leading-[1.7] text-[#4A4844]">
              Our pieces are clean, considered, and built to last. No gimmicks. No logos for the sake of it. Just well-made garments that fit well, feel good, and hold up over time.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#DAD8D1] mb-14 sm:mb-20" />

        {/* Why it exists */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-16 mb-14 sm:mb-20">
          <div className="md:col-span-4">
            <span className="text-[10px] font-mono tracking-[0.28em] uppercase text-[#7A7771] block sticky top-28">
              WHY WE EXIST
            </span>
          </div>
          <div className="md:col-span-8 space-y-5">
            <p className="text-[15px] sm:text-[16px] leading-[1.7] text-[#4A4844]">
              Fashion in Nigeria — and across Africa — is changing. A new generation of young people are creating their own culture, their own aesthetics, and their own rules. They don't need to follow international trends. They set their own.
            </p>
            <p className="text-[15px] sm:text-[16px] leading-[1.7] text-[#4A4844]">
              PIERCYN exists to serve that generation. To give them access to elevated, well-made clothing that reflects who they are — without requiring them to break the bank or compromise on quality.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#DAD8D1] mb-14 sm:mb-20" />

        {/* Our Starting Point */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-16 mb-14 sm:mb-20">
          <div className="md:col-span-4">
            <span className="text-[10px] font-mono tracking-[0.28em] uppercase text-[#7A7771] block sticky top-28">
              WHERE WE START
            </span>
          </div>
          <div className="md:col-span-8 space-y-5">
            <p className="text-[16px] sm:text-[17px] leading-[1.7] text-[#2A2724] font-normal">
              Lagos. Nigeria. West Africa.
            </p>
            <p className="text-[15px] sm:text-[16px] leading-[1.7] text-[#4A4844]">
              We are building PIERCYN from one of the most dynamic, creative, and energetic cities on the planet. Lagos is our starting point — not because we want to be a "Lagos brand," but because this is where the ideas come from. This is where our customers live.
            </p>
            <p className="text-[15px] sm:text-[16px] leading-[1.7] text-[#4A4844]">
              We deliver across all of Nigeria. We're building for the whole country — and in time, much further.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-[#DAD8D1] pt-10 sm:pt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-editorial italic text-[22px] sm:text-[28px] text-[#141414] leading-tight">
              Ready to find your next piece?
            </p>
          </div>
          <button
            id="about-shop-now-btn"
            onClick={() => onSelectPage('shop')}
            className="group h-12 px-8 rounded-full bg-[#141414] text-[#F2F0EB] hover:bg-black transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] text-[12px] font-bold tracking-[0.16em] uppercase whitespace-nowrap"
          >
            <span>SHOP NOW</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    </main>
  );
};
