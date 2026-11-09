import React, { useState, useEffect } from 'react';
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

export const AffiliateLandingPage: React.FC<AffiliateLandingPageProps> = ({
  onNavigate,
  onBackToShop,
}) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [ordersPerMonth, setOrdersPerMonth] = useState<number>(35);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    catalogService
      .getProducts()
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          setFeaturedProducts(items.slice(0, 4));
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

  const projectedEarnings = ordersPerMonth * 800;

  const faqs = [
    {
      q: 'How does the PIERCYN Affiliate Program work?',
      a: 'When you are accepted as a PIERCYN creator affiliate, you receive a dedicated tracking code and custom links for the store, collections, and individual products. Whenever a customer purchases through your link and the order is successfully delivered, you earn a flat ₦800 commission.',
    },
    {
      q: 'When do I get paid for qualifying referrals?',
      a: 'Commissions clear 14 days after the customer takes delivery of their order (our standard return window). Once cleared, the balance moves to your Available Wallet, and you can withdraw anytime with no minimum balance directly to your Nigerian bank account.',
    },
    {
      q: 'Is there a minimum withdrawal threshold?',
      a: 'No. PIERCYN imposes zero minimum withdrawal amount. Whether you have ₦800 or ₦250,000 in approved commissions, you can request an instant disbursement to your registered bank account.',
    },
    {
      q: 'How long does affiliate tracking last?',
      a: 'Our tracking window lasts 30 full days from the moment someone clicks your link. If they return to piercyn.com and purchase anytime within 30 days, you receive the full commission credit.',
    },
    {
      q: 'What assets do I receive to promote PIERCYN?',
      a: 'You get full access to our curated Creator Media Library, including campaign lookbooks, high-resolution product photography, 9:16 vertical reels, editorial video assets, and copy-ready caption templates.',
    },
    {
      q: 'Who is eligible to join the Creator Network?',
      a: 'We welcome stylists, content creators, fashion enthusiasts, and community builders who resonate with contemporary streetwear, refined tailoring, and African design narratives. Every application is reviewed individually by our team within 24 to 48 hours.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F2F0EB] text-[#141414] font-sans antialiased selection:bg-[#141414] selection:text-white">
      {/* Editorial Announcement Bar */}
      <div className="bg-[#141414] text-[#F2F0EB] text-center py-2 px-4 text-[11px] font-medium tracking-[0.2em] uppercase flex items-center justify-center gap-3">
        <span>PIERCYN Creator Network</span>
        <span className="opacity-40">·</span>
        <span>₦800 Commission On Every Delivered Order</span>
        <span className="opacity-40">·</span>
        <span className="hidden sm:inline">Direct Bank Payouts</span>
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
              className="px-5 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-widest transition-colors"
            >
              Become an Affiliate
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-[#E5E2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Editorial Headline & Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E2DC] text-[11px] font-semibold uppercase tracking-[0.22em] text-[#737373]">
                <Sparkles className="w-3.5 h-3.5 text-[#141414]" />
                Official Creator & Affiliate Program
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-medium tracking-tight text-[#141414] leading-[1.05]">
                YOUR INFLUENCE.
                <br />
                <span className="italic font-normal">YOUR INCOME.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#555555] max-w-xl leading-relaxed font-normal">
                Turn your style, community, and creativity into earnings. Share PIERCYN, connect people with pieces
                they love, and earn <span className="text-[#141414] font-semibold">₦800</span> for every qualifying
                delivered referral.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('register')}
                  className="px-8 py-4 bg-[#141414] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-[0.22em] flex items-center justify-center gap-3 transition-colors shadow-sm"
                >
                  Become an Affiliate <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-8 py-4 bg-white hover:bg-[#FAF8F5] text-[#141414] border border-[#E5E2DC] hover:border-[#141414] text-xs font-semibold uppercase tracking-[0.22em] transition-all text-center"
                >
                  Affiliate Login
                </button>
              </div>

              {/* Trust micro-badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E5E2DC] max-w-lg">
                <div>
                  <div className="text-xl sm:text-2xl font-serif font-semibold text-[#141414]">₦800</div>
                  <div className="text-[11px] text-[#737373] uppercase tracking-wider mt-0.5">Per Order</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-serif font-semibold text-[#141414]">30 Days</div>
                  <div className="text-[11px] text-[#737373] uppercase tracking-wider mt-0.5">Attribution</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-serif font-semibold text-[#141414]">₦0 Min</div>
                  <div className="text-[11px] text-[#737373] uppercase tracking-wider mt-0.5">Withdrawal</div>
                </div>
              </div>
            </div>

            {/* Right Column: Editorial Campaign Imagery */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Hero Card */}
                <div className="aspect-[3/4] bg-[#E5E2DC] overflow-hidden border border-[#E5E2DC] shadow-xl relative group">
                  <img
                    src="/images/affiliate-hero.webp"
                    alt="PIERCYN Editorial Campaign"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {/* Subtle brand tag */}
                  <div className="absolute top-4 left-4 bg-[#141414]/90 backdrop-blur-sm text-white px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-medium">
                    PIERCYN STUDIOS · LAGOS
                  </div>
                  {/* Floating live badge */}
                  <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md border border-[#E5E2DC] p-3 shadow-lg max-w-[200px]">
                    <div className="text-[10px] uppercase tracking-wider text-[#737373] font-semibold">Earn on Pieces</div>
                    <div className="text-xs font-serif font-medium text-[#141414] mt-0.5">
                      ₦800 per referral credited directly
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="p-8 bg-[#FAF8F5] border border-[#E5E2DC] space-y-4 relative">
              <span className="text-3xl font-serif text-[#141414] font-semibold">01</span>
              <h3 className="text-lg font-serif font-medium text-[#141414] uppercase tracking-wide">
                Apply & Get Approved
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                Submit your simple creator application with your social handles. Our team reviews submissions within 24 to 48 hours to ensure brand alignment.
              </p>
              <div className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
                Instant code generation upon approval
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 bg-[#FAF8F5] border border-[#E5E2DC] space-y-4 relative">
              <span className="text-3xl font-serif text-[#141414] font-semibold">02</span>
              <h3 className="text-lg font-serif font-medium text-[#141414] uppercase tracking-wide">
                Curate & Share Pieces
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                Generate custom links for your favorite hoodies, tees, caps, or drop campaigns. Share them seamlessly on Instagram, TikTok, WhatsApp, or Twitter.
              </p>
              <div className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
                30-day tracking cookie attached to every link
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 bg-[#FAF8F5] border border-[#E5E2DC] space-y-4 relative">
              <span className="text-3xl font-serif text-[#141414] font-semibold">03</span>
              <h3 className="text-lg font-serif font-medium text-[#141414] uppercase tracking-wide">
                Earn ₦800 Per Order
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                For every qualifying delivered order attributed to your links, receive ₦800 directly in your wallet. Withdraw anytime directly to your bank.
              </p>
              <div className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
                Zero minimum withdrawal threshold
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commission Potential Calculator */}
      <section className="py-20 sm:py-28 bg-[#F2F0EB] border-b border-[#E5E2DC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#E5E2DC] p-8 sm:p-12 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#E5E2DC] pb-8">
              <div>
                <span className="text-[11px] tracking-[0.24em] font-semibold uppercase text-[#737373]">
                  Interactive Estimate
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-[#141414] font-medium mt-1">
                  Commission Potential Calculator
                </h2>
                <p className="text-xs sm:text-sm text-[#666666] mt-1">
                  Adjust the slider based on your estimated monthly referred orders.
                </p>
              </div>
              <div className="text-left md:text-right bg-[#FAF8F5] p-4 border border-[#E5E2DC] w-full md:w-auto">
                <span className="text-[10px] uppercase tracking-widest text-[#737373] block font-semibold">
                  Estimated Monthly Payout
                </span>
                <span className="text-3xl sm:text-4xl font-serif font-bold text-[#141414]">
                  {formatNGN(projectedEarnings)}
                </span>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold text-[#141414] uppercase tracking-wider">
                <span>Monthly Delivered Orders:</span>
                <span className="text-base font-serif font-bold px-3 py-1 bg-[#F2F0EB] border border-[#E5E2DC]">
                  {ordersPerMonth} orders
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={ordersPerMonth}
                onChange={(e) => setOrdersPerMonth(Number(e.target.value))}
                className="w-full h-2 bg-[#E5E2DC] rounded-none appearance-none cursor-pointer accent-[#141414]"
              />
              <div className="flex justify-between text-[11px] text-[#737373]">
                <span>5 orders (₦4,000)</span>
                <span>50 orders (₦40,000)</span>
                <span>100 orders (₦80,000)</span>
                <span>200 orders (₦160,000)</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#555555] bg-[#FAF8F5] p-4 border border-[#E5E2DC]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#141414]" />
                <span>₦800 per order · 30-day cookie · Direct Nigerian bank account transfers</span>
              </div>
              <button
                onClick={() => onNavigate('register')}
                className="text-xs font-semibold uppercase tracking-wider text-[#141414] hover:underline shrink-0"
              >
                Start Earning Now →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured PIERCYN Pieces for Affiliates */}
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
                  High-converting streetwear staples crafted in Lagos, Nigeria.
                </p>
              </div>
              <button
                onClick={onBackToShop}
                className="text-xs uppercase tracking-widest font-semibold text-[#141414] hover:text-[#737373] flex items-center gap-1.5 transition-colors self-start md:self-auto"
              >
                View Full Store Catalog <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => {
                const img = product.images?.[0] || product.colors?.[0]?.image || '';
                return (
                  <div
                    key={product.id}
                    className="group bg-[#FAF8F5] border border-[#E5E2DC] overflow-hidden flex flex-col justify-between"
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
                      <div className="absolute top-2 left-2 bg-[#141414] text-white text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5">
                        ₦800 Commission
                      </div>
                    </div>
                    <div className="p-4 space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-[#737373] font-medium">
                        {product.category || 'Apparel'}
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold uppercase text-[#141414] truncate">
                        {product.name}
                      </h4>
                      <div className="text-xs font-serif font-bold text-[#141414] pt-1">
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
                  className="px-6 py-3.5 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-widest font-semibold transition-colors"
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
                    <span className="w-2 h-2 rounded-full bg-[#141414]"></span>
                    <span className="text-[10px] uppercase tracking-wider text-[#737373] font-semibold">Active Creator</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-[#FAF8F5] border border-[#E5E2DC]">
                    <div className="text-[10px] uppercase tracking-widest text-[#737373]">Available Balance</div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#141414] mt-1">₦42,400</div>
                  </div>
                  <div className="p-4 bg-[#FAF8F5] border border-[#E5E2DC]">
                    <div className="text-[10px] uppercase tracking-widest text-[#737373]">Delivered Orders</div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#141414] mt-1">53</div>
                  </div>
                  <div className="p-4 bg-[#FAF8F5] border border-[#E5E2DC]">
                    <div className="text-[10px] uppercase tracking-widest text-[#737373]">Conversion Rate</div>
                    <div className="text-xl sm:text-2xl font-serif font-bold text-[#141414] mt-1">4.8%</div>
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
                    className="w-full flex items-center justify-between text-left text-base sm:text-lg font-serif font-medium text-[#141414] hover:text-[#737373] transition-colors gap-4"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#737373] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''
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
              className="text-xs uppercase tracking-widest font-semibold text-[#141414] hover:underline"
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
            Join a curated roster of tastemakers, stylists, and creators sharing contemporary African fashion.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#141414] hover:bg-[#F2F0EB] text-xs uppercase tracking-[0.22em] font-semibold transition-colors shadow-lg"
            >
              Apply to Partner Today
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-4 border border-[#404040] hover:border-white text-white text-xs uppercase tracking-[0.22em] font-semibold transition-colors"
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
              className="hover:text-[#141414] transition-colors"
            >
              Operating Guidelines
            </button>
            <button
              onClick={() => setIsSupportOpen(true)}
              className="hover:text-[#141414] transition-colors"
            >
              Creator Support
            </button>
            <button
              onClick={onBackToShop}
              className="hover:text-[#141414] transition-colors font-medium text-[#141414]"
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

