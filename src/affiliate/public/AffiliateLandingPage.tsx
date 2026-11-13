import React, { useLayoutEffect, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import '../affiliate-responsive.css';
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Share2,
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  Percent,
  Layers,
  ArrowUpRight,
  Calculator,
  Sliders,
  DollarSign,
  Copy,
  Check,
  Award,
  Zap,
} from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { PRODUCTS } from '../../data/products';
import { Product } from '../../types';
import { formatNGN } from '../types';
import { GuidelinesModal } from '../components/GuidelinesModal';
import { SupportModal } from '../components/SupportModal';

interface AffiliateLandingPageProps {
  onNavigate: (route: 'landing' | 'register' | 'login' | 'application') => void;
  onBackToShop: () => void;
}

const tickerMessages = [
  'PIERCYN CREATOR NETWORK',
  '₦1,000 COMMISSION PER QUALIFYING DELIVERED ORDER',
  '30-DAY COOKIE ATTRIBUTION',
  '₦0 MINIMUM WITHDRAWAL',
  'CONTEMPORARY AFRICAN STREETWEAR',
  'DIRECT NIGERIAN BANK PAYOUTS',
];

export const AffiliateLandingPage: React.FC<AffiliateLandingPageProps> = ({
  onNavigate,
  onBackToShop,
}) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [ordersPerMonth, setOrdersPerMonth] = useState<number>(40);
  const [calcTimeframe, setCalcTimeframe] = useState<'monthly' | 'weekly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<string | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<number>(0);
  const landingRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    catalogService
      .getProducts()
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          setFeaturedProducts(items.slice(0, 4));
        } else if (isMounted) {
          setFeaturedProducts(PRODUCTS.slice(0, 4));
        }
      })
      .catch(() => {
        if (isMounted) {
          setFeaturedProducts(PRODUCTS.slice(0, 4));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useLayoutEffect(() => {
    const root = landingRootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      return;
    }

    const targets = root.querySelectorAll<HTMLElement>(':scope > section, [data-reveal-stagger] > *');
    if (targets.length === 0) return;

    root.classList.add('affiliate-motion-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -44px 0px' });

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [featuredProducts.length]);

  // Commission math: ₦1,000 per qualifying order
  const COMMISSION_PER_ORDER = 1000;
  const projectedEarnings =
    calcTimeframe === 'monthly'
      ? ordersPerMonth * COMMISSION_PER_ORDER
      : Math.round((ordersPerMonth / 4) * COMMISSION_PER_ORDER);

  // Dynamic Tier Milestone based on order volume
  const getCuratorTier = (orders: number) => {
    if (orders >= 120) {
      return {
        name: 'Atelier Head Curator',
        badge: 'VIP Tier',
        perk: 'Dedicated PR seeding & bespoke capsule lookbook early access',
        color: '#141414',
      };
    }
    if (orders >= 60) {
      return {
        name: 'Senior Stylist',
        badge: 'Tier 02',
        perk: 'Direct WhatsApp creator desk & custom campaign deep-links',
        color: '#141414',
      };
    }
    if (orders >= 25) {
      return {
        name: 'Established Curator',
        badge: 'Tier 01',
        perk: 'Fast-track bank disbursement settlement within 24h',
        color: '#141414',
      };
    }
    return {
      name: 'Emerging Tastemaker',
      badge: 'Starter',
      perk: '₦1,000 flat per delivered order · No minimum withdrawal',
      color: '#737373',
    };
  };

  const currentTier = getCuratorTier(ordersPerMonth);

  const faqs = [
    {
      q: 'How does the PIERCYN Affiliate Program work?',
      a: 'When accepted into the PIERCYN Creator Network, you receive a dedicated tracking code and custom links for the storefront, collections, or individual pieces. Whenever a customer orders through your link and the piece is delivered, you earn a flat ₦1,000 commission.',
    },
    {
      q: 'When do I get paid for qualifying referrals?',
      a: 'Commissions clear immediately when an administrator verifies successful customer delivery. Once verified delivered, the commission moves directly to your Available Wallet for immediate withdrawal into your Nigerian bank account.',
    },
    {
      q: 'Is there a minimum withdrawal threshold?',
      a: 'No. PIERCYN enforces zero minimum withdrawal requirement. Whether you have ₦1,000 or ₦350,000 in approved available balance, you can request an instant disbursement.',
    },
    {
      q: 'How long does affiliate tracking last?',
      a: 'Our tracking window lasts 30 full days from the moment someone clicks your referral link. If they return to piercyn.com and complete their order anytime within 30 days, you receive the full ₦1,000 credit.',
    },
    {
      q: 'What assets do I receive to promote PIERCYN?',
      a: 'You get full access to our curated Creator Media Library, including campaign lookbooks, high-resolution product photography, 9:16 vertical reels, editorial video assets, and copy-ready caption templates.',
    },
    {
      q: 'Who is eligible to join the Creator Network?',
      a: 'We welcome stylists, content creators, fashion enthusiasts, and community builders who resonate with contemporary African streetwear and refined tailoring. Every application is reviewed individually by our team within 24 to 48 hours.',
    },
  ];

  const creatorSteps = [
    {
      num: '01',
      title: 'Apply & Get Curated',
      subtitle: '24–48h Curation Review',
      desc: 'Submit your creator profile and social handles. Our Lagos editorial team approves creators who align with contemporary luxury streetwear aesthetics.',
      metric: 'Instant code generated',
    },
    {
      num: '02',
      title: 'Share Curated Pieces',
      subtitle: '30-Day Active Cookie',
      desc: 'Generate trackable links to hoodies, tees, caps, or drop campaigns. Share effortlessly on Instagram Stories, TikTok, Twitter/X, and WhatsApp.',
      metric: 'Deep-link to any piece',
    },
    {
      num: '03',
      title: 'Earn ₦1,000 Per Order',
      subtitle: '₦0 Minimum Payout',
      desc: 'For every qualifying delivered order attributed to your links, receive ₦1,000 directly into your wallet. Withdraw anytime directly to your bank account.',
      metric: 'Direct NIP bank transfer',
    },
  ];

  const handleCopyProductLink = (slug: string) => {
    const url = `https://piercyn.vercel.app/product/${slug}?ref=CREATOR_VIP`;
    navigator.clipboard.writeText(url);
    setCopiedLinkIndex(slug);
    setTimeout(() => setCopiedLinkIndex(null), 2000);
  };

  return (
    <div ref={landingRootRef} className="affiliate-landing-shell min-h-screen bg-[#F2F0EB] text-[#141414] font-sans antialiased selection:bg-[#141414] selection:text-white relative">
      {/* Editorial Live Ticker Tape */}
      <div className="affiliate-marquee bg-[#141414] text-[#F2F0EB] overflow-hidden py-2.5 border-b border-[#2B2B2B]">
        <span className="sr-only">
          PIERCYN Creator Network. ₦1,000 commission per qualifying delivered order. 30-day cookie attribution. ₦0 minimum withdrawal. Contemporary African streetwear. Direct Nigerian bank payouts.
        </span>
        <div aria-hidden="true" className="affiliate-marquee-track flex whitespace-nowrap text-[11px] font-semibold tracking-[0.25em] uppercase">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-8 pr-8">
              {tickerMessages.map((message) => (
                <React.Fragment key={`${copy}-${message}`}>
                  <span>{message}</span>
                  <span className="text-[#A48B71]">·</span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#F2F0EB]/95 backdrop-blur-md border-b border-[#E5E2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onBackToShop}
              className="text-2xl sm:text-3xl font-serif tracking-widest uppercase font-bold text-[#141414] hover:opacity-80 transition-opacity"
            >
              PIERCYN
            </button>
            <span className="hidden md:inline-block text-[10px] tracking-[0.24em] font-semibold uppercase text-[#737373] border-l border-[#E5E2DC] pl-6">
              Affiliate Platform
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#141414] hover:text-[#737373] transition-colors"
            >
              Affiliate Login
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-5 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-widest transition-all shadow-sm active:scale-95"
            >
              Become an Affiliate
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-[#E5E2DC]">
        {/* Subtle decorative grid backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e2dc_1px,transparent_1px),linear-gradient(to_bottom,#e5e2dc_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div data-reveal-stagger className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Editorial Headline & Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E2DC] text-[11px] font-semibold uppercase tracking-[0.22em] text-[#737373] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Official Creator & Affiliate Program</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-medium tracking-tight text-[#141414] leading-[1.05]">
                YOUR INFLUENCE.
                <br />
                <span className="italic font-normal">YOUR INCOME.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#555555] max-w-xl leading-relaxed font-normal">
                Turn your style, community, and creativity into earnings. Share PIERCYN, connect people with pieces
                they love, and earn <span className="text-[#141414] font-bold border-b border-[#141414] pb-0.5">₦1,000</span> for every qualifying
                delivered referral.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('register')}
                  className="group px-8 py-4 bg-[#141414] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-[0.22em] flex items-center justify-center gap-3 transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <span>Become an Affiliate</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-8 py-4 bg-white hover:bg-[#FAF8F5] text-[#141414] border border-[#E5E2DC] hover:border-[#141414] text-xs font-semibold uppercase tracking-[0.22em] transition-all text-center shadow-xs cursor-pointer"
                >
                  Affiliate Login
                </button>
              </div>

              {/* Trust micro-badges */}
              <div data-reveal-stagger className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E5E2DC] max-w-lg">
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#141414]">₦1,000</div>
                  <div className="text-[11px] text-[#737373] uppercase tracking-wider font-semibold">Per Order</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#141414]">30 Days</div>
                  <div className="text-[11px] text-[#737373] uppercase tracking-wider font-semibold">Cookie Window</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#141414]">₦0 Min</div>
                  <div className="text-[11px] text-[#737373] uppercase tracking-wider font-semibold">Direct Payout</div>
                </div>
              </div>
            </div>

            {/* Right Column: Editorial Campaign Imagery with Dynamic Overlay */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Hero Card with dynamic hover depth */}
                <div className="aspect-[3/4] bg-[#E5E2DC] overflow-hidden border border-[#E5E2DC] shadow-2xl relative group">
                  <img
                    src="/images/affiliate-hero.webp"
                    alt="PIERCYN Editorial Campaign"
                    className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {/* Subtle brand tag */}
                  <div className="absolute top-4 left-4 bg-[#141414]/90 backdrop-blur-sm text-white px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-medium">
                    PIERCYN STUDIOS · LAGOS
                  </div>

                  {/* Dynamic Floating Live Rate Badge */}
                  <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md border border-[#E5E2DC] p-4 shadow-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#737373] font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                        <span>Live Referral Reward</span>
                      </div>
                      <div className="text-base font-serif font-bold text-[#141414] mt-0.5">
                        ₦1,000 per delivered piece
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('register')}
                      className="px-3 py-1.5 bg-[#141414] text-white text-[10px] font-semibold uppercase tracking-wider hover:bg-[#262626] transition-colors"
                    >
                      Join Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Step Progression (Interactive tabs) */}
      <section className="py-20 sm:py-28 bg-white border-b border-[#E5E2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-[11px] tracking-[0.24em] font-semibold uppercase text-[#737373]">
              Simple & Transparent
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-[#141414]">
              How the Creator Program Works
            </h2>
            <p className="text-sm sm:text-base text-[#666666] leading-relaxed">
              We built an affiliate experience tailored to high-taste curators, stylists, and creators with zero friction.
            </p>
          </div>

          <div data-reveal-stagger className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {creatorSteps.map((step, idx) => (
              <div
                key={step.num}
                onMouseEnter={() => setActiveStepTab(idx)}
                className={`p-8 border transition-all duration-300 relative flex flex-col justify-between cursor-pointer ${
                  activeStepTab === idx
                    ? 'bg-[#141414] text-white border-[#141414] shadow-xl -translate-y-1'
                    : 'bg-[#FAF8F5] text-[#141414] border-[#E5E2DC] hover:border-[#141414]'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-4xl font-serif font-bold ${
                        activeStepTab === idx ? 'text-[#A48B71]' : 'text-[#141414]'
                      }`}
                    >
                      {step.num}
                    </span>
                    <span
                      className={`text-[9px] uppercase tracking-widest px-2 py-0.5 font-bold ${
                        activeStepTab === idx
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'bg-white text-[#737373] border border-[#E5E2DC]'
                      }`}
                    >
                      {step.subtitle}
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-medium uppercase tracking-wide">
                    {step.title}
                  </h3>

                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      activeStepTab === idx ? 'text-[#D4D2CD]' : 'text-[#555555]'
                    }`}
                  >
                    {step.desc}
                  </p>
                </div>

                <div
                  className={`pt-6 mt-6 border-t text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between ${
                    activeStepTab === idx ? 'border-white/15 text-[#A48B71]' : 'border-[#E5E2DC] text-[#737373]'
                  }`}
                >
                  <span>{step.metric}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Commission Potential Calculator */}
      <section className="py-20 sm:py-28 bg-[#F2F0EB] border-b border-[#E5E2DC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#E5E2DC] p-8 sm:p-12 shadow-md space-y-8 relative overflow-hidden">
            {/* Header with Timeframe Toggle */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#E5E2DC] pb-8">
              <div>
                <span className="text-[11px] tracking-[0.24em] font-semibold uppercase text-[#737373]">
                  Interactive Earnings Simulator
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-[#141414] font-medium mt-1">
                  Commission Potential Calculator
                </h2>
                <p className="text-xs sm:text-sm text-[#666666] mt-1">
                  Simulate your projected revenue based on <strong>₦1,000 per delivered order</strong>.
                </p>
              </div>

              {/* Projected Display with Timeframe switch */}
              <div className="bg-[#FAF8F5] p-5 border border-[#141414] w-full md:w-auto text-left md:text-right shrink-0">
                <div className="flex items-center justify-between md:justify-end gap-3 mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">
                    Projected Payout
                  </span>
                  <div className="inline-flex p-0.5 bg-[#E5E2DC] rounded-none text-[9px] uppercase font-bold">
                    <button
                      onClick={() => setCalcTimeframe('monthly')}
                      className={`px-2 py-0.5 transition-colors ${
                        calcTimeframe === 'monthly' ? 'bg-[#141414] text-white' : 'text-[#555555]'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setCalcTimeframe('weekly')}
                      className={`px-2 py-0.5 transition-colors ${
                        calcTimeframe === 'weekly' ? 'bg-[#141414] text-white' : 'text-[#555555]'
                      }`}
                    >
                      Weekly
                    </button>
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-serif font-bold text-[#141414] tracking-tight">
                  {formatNGN(projectedEarnings)}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#737373] font-medium">
                  {calcTimeframe === 'monthly' ? 'Based on 30-day projection' : 'Based on weekly pace'}
                </span>
              </div>
            </div>

            {/* Slider with Volume Presets */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-xs font-semibold text-[#141414] uppercase tracking-wider flex items-center gap-2">
                  <span>Monthly Delivered Orders:</span>
                  <span className="text-base font-serif font-bold px-3 py-1 bg-[#F2F0EB] border border-[#E5E2DC]">
                    {ordersPerMonth} orders
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase text-[#737373] font-semibold hidden sm:inline">Presets:</span>
                  {[15, 40, 80, 150].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setOrdersPerMonth(preset)}
                      className={`px-2.5 py-1 text-[11px] font-mono font-semibold border transition-all ${
                        ordersPerMonth === preset
                          ? 'bg-[#141414] text-white border-[#141414]'
                          : 'bg-[#FAF8F5] text-[#555555] border-[#E5E2DC] hover:border-[#141414]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Range Input */}
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={ordersPerMonth}
                onChange={(e) => setOrdersPerMonth(Number(e.target.value))}
                className="w-full h-3 bg-[#E5E2DC] appearance-none cursor-pointer accent-[#141414]"
              />

              <div className="flex justify-between text-[11px] text-[#737373] font-mono">
                <span>5 orders (₦5,000)</span>
                <span>50 orders (₦50,000)</span>
                <span>100 orders (₦100,000)</span>
                <span>200 orders (₦200,000)</span>
              </div>
            </div>

            {/* Dynamic Milestone Card */}
            <div className="p-5 bg-[#FAF8F5] border border-[#E5E2DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#141414]" />
                  <span className="text-xs uppercase tracking-wider font-bold text-[#141414]">
                    {currentTier.name}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-white border border-[#E5E2DC] font-semibold text-[#737373]">
                    {currentTier.badge}
                  </span>
                </div>
                <p className="text-xs text-[#555555]">{currentTier.perk}</p>
              </div>

              <button
                onClick={() => onNavigate('register')}
                className="px-5 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-widest font-semibold shrink-0 transition-colors cursor-pointer"
              >
                Apply for this Tier →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured PIERCYN Pieces (with Live Colorway Switcher & Direct Copy) */}
      {featuredProducts.length > 0 && (
        <section className="py-20 sm:py-28 bg-white border-b border-[#E5E2DC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-[11px] tracking-[0.24em] font-semibold uppercase text-[#737373]">
                  Catalog Preview
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif text-[#141414] font-medium mt-1">
                  Pieces Ready for Your Curation
                </h2>
                <p className="text-xs sm:text-sm text-[#666666] mt-1">
                  High-converting streetwear staples crafted in Lagos, Nigeria. Every piece pays <strong>₦1,000</strong> per qualifying referral.
                </p>
              </div>
              <button
                onClick={onBackToShop}
                className="text-xs uppercase tracking-widest font-semibold text-[#141414] hover:text-[#737373] flex items-center gap-1.5 transition-colors self-start md:self-auto"
              >
                View Full Store Catalog <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div data-reveal-stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => {
                const img = product.images?.[0] || '';
                const isCopied = copiedLinkIndex === product.slug;

                return (
                  <div
                    key={product.id}
                    className="group bg-[#FAF8F5] border border-[#E5E2DC] hover:border-[#141414] transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md"
                  >
                    <div className="aspect-[3/4] bg-[#E5E2DC] overflow-hidden relative">
                      {img ? (
                        <img
                          src={img}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs uppercase text-[#737373]">
                          PIERCYN
                        </div>
                      )}

                      {/* Commission Tag */}
                      <div className="absolute top-3 left-3 bg-[#141414] text-white text-[9px] uppercase tracking-widest font-bold px-2 py-0.5">
                        ₦1,000 Commission
                      </div>

                      {/* Quick copy overlay on hover */}
                      <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyProductLink(product.slug)}
                          className="w-full py-2 bg-white/95 backdrop-blur-sm text-[#141414] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:bg-white transition-colors"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Link Copied!' : 'Copy Piece Link'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#737373]">
                        <span>{product.category || 'Apparel'}</span>
                        {product.gsm && <span>{product.gsm}</span>}
                      </div>

                      <h4 className="text-sm font-semibold uppercase text-[#141414] truncate">
                        {product.name}
                      </h4>

                      <div className="text-xs font-serif font-bold text-[#141414]">
                        {formatNGN(product.priceNGN)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Dashboard Preview Section */}
      <section className="py-20 sm:py-28 bg-[#F2F0EB] border-b border-[#E5E2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[11px] tracking-[0.24em] font-semibold uppercase text-[#737373]">
                Creator Platform
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#141414] font-medium leading-tight">
                An Editorial Dashboard Built for Creators.
              </h2>
              <p className="text-sm sm:text-base text-[#555555] leading-relaxed">
                No cluttered corporate interfaces. The PIERCYN Creator Dashboard is intentionally minimal, giving you
                real-time analytics, instant link generators, high-resolution media, and transparent payout tracking.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-[#141414] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-[#141414]">Real-Time Attribution</h4>
                    <p className="text-xs text-[#666666]">Monitor clicks, orders, and delivery clearances live.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-[#141414] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-[#141414]">One-Click Link Generator</h4>
                    <p className="text-xs text-[#666666]">Deep-link to any piece or collection with custom campaign tags.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-[#141414] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-[#141414]">Curated Media Studio</h4>
                    <p className="text-xs text-[#666666]">Official campaign lookbooks, story reels, and caption copy.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => onNavigate('register')}
                  className="px-6 py-3.5 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-widest font-semibold transition-colors shadow-sm"
                >
                  Join the Network
                </button>
              </div>
            </div>

            {/* Dashboard Mockup Representation */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-[#E5E2DC] shadow-2xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-lg tracking-widest uppercase">PIERCYN</span>
                    <span className="text-[10px] uppercase tracking-widest bg-[#F2F0EB] px-2 py-0.5 font-semibold text-[#737373]">
                      PORTAL
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] uppercase tracking-wider text-[#737373] font-semibold">Active Partner</span>
                  </div>
                </div>

                <div data-reveal-stagger className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-[#FAF8F5] border border-[#E5E2DC]">
                    <div className="text-[10px] uppercase tracking-widest text-[#737373]">Available Balance</div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#141414] mt-1">₦52,000</div>
                  </div>
                  <div className="p-4 bg-[#FAF8F5] border border-[#E5E2DC]">
                    <div className="text-[10px] uppercase tracking-widest text-[#737373]">Delivered Orders</div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#141414] mt-1">52</div>
                  </div>
                  <div className="p-4 bg-[#FAF8F5] border border-[#E5E2DC]">
                    <div className="text-[10px] uppercase tracking-widest text-[#737373]">Commission Rate</div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#141414] mt-1">₦1,000</div>
                  </div>
                </div>

                <div className="p-4 bg-[#F2F0EB] border border-[#E5E2DC] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[#737373]">Primary Referral Link</div>
                    <div className="text-xs font-mono text-[#141414] font-medium mt-0.5">
                      https://piercyn.vercel.app/?ref=CREATOR_VIP
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[#141414] text-white text-[10px] uppercase tracking-widest font-semibold">
                    Copy Link
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 sm:py-28 bg-white border-b border-[#E5E2DC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <span className="text-[11px] tracking-[0.24em] font-semibold uppercase text-[#737373]">
              Transparency
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#141414] font-medium">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              Clear answers regarding commission, payouts, attribution, and guidelines.
            </p>
          </div>

          <div className="divide-y divide-[#E5E2DC] border-y border-[#E5E2DC]">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-5">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-base sm:text-lg font-serif font-medium text-[#141414] hover:text-[#737373] transition-colors gap-4 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#737373] shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pt-3 text-sm text-[#555555] leading-relaxed font-sans pr-6 animate-fade-up">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-8">
            <button
              onClick={() => setIsGuidelinesOpen(true)}
              className="text-xs uppercase tracking-widest font-semibold text-[#141414] hover:underline cursor-pointer"
            >
              Read Full Program Guidelines & Terms →
            </button>
          </div>
        </div>
      </section>

      {/* Final Call to Action Banner */}
      <section className="py-20 sm:py-24 bg-[#141414] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="text-[11px] tracking-[0.28em] font-semibold uppercase text-[#A48B71]">
            Curate · Share · Earn
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-medium tracking-tight">
            Ready to Monetize Your Taste?
          </h2>
          <p className="text-sm sm:text-base text-[#A3A3A3] max-w-xl mx-auto leading-relaxed">
            Join a curated roster of tastemakers, stylists, and creators sharing contemporary African fashion at ₦1,000 per referral.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#141414] hover:bg-[#F2F0EB] text-xs uppercase tracking-[0.22em] font-semibold transition-colors shadow-lg cursor-pointer"
            >
              Apply to Partner Today
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-4 border border-[#404040] hover:border-white text-white text-xs uppercase tracking-[0.22em] font-semibold transition-colors cursor-pointer"
            >
              Creator Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 bg-[#F2F0EB] border-t border-[#E5E2DC] text-xs text-[#737373]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="font-serif font-bold text-base uppercase text-[#141414]">PIERCYN</span>
            <span className="text-[11px] uppercase tracking-wider text-[#737373]">
              © {new Date().getFullYear()} PIERCYN. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsGuidelinesOpen(true)}
              className="hover:text-[#141414] transition-colors cursor-pointer"
            >
              Operating Guidelines
            </button>
            <button
              onClick={() => setIsSupportOpen(true)}
              className="hover:text-[#141414] transition-colors cursor-pointer"
            >
              Creator Support
            </button>
            <button
              onClick={onBackToShop}
              className="hover:text-[#141414] transition-colors font-medium text-[#141414] cursor-pointer"
            >
              Back to Storefront
            </button>
          </div>
        </div>
      </footer>

      {/* Guidelines & Support Modals */}
      <GuidelinesModal isOpen={isGuidelinesOpen} onClose={() => setIsGuidelinesOpen(false)} />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
};
