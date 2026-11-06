import React, { useState } from 'react';
import './affiliate-responsive.css';
import { AffiliateApiClient, AffiliateUser } from '../services/affiliateApi';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Link2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Instagram,
  Clock,
  ChevronRight,
  Calculator,
} from 'lucide-react';

interface AffiliateLandingPageProps {
  onGoToPortal: (user: AffiliateUser) => void;
  onBackToShop: () => void;
}

export const AffiliateLandingPage: React.FC<AffiliateLandingPageProps> = ({
  onGoToPortal,
  onBackToShop,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'apply' | 'login'>('info');
  const [ordersPerMonth, setOrdersPerMonth] = useState<number>(30);
  const itemsSoldPerMonth = ordersPerMonth;
  const setItemsSoldPerMonth = setOrdersPerMonth;

  // Application form state
  const [applyForm, setApplyForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    instagram: '',
    tiktok: '',
    promotionChannels: '',
    audienceSize: '1K - 10K',
    promotionExperience: '',
    agreedToTerms: true,
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (applyForm.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (applyForm.password !== applyForm.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!applyForm.agreedToTerms) {
      setErrorMessage('You must accept the Affiliate Program Terms to proceed.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AffiliateApiClient.apply({
        firstName: applyForm.firstName,
        lastName: applyForm.lastName,
        email: applyForm.email,
        phone: applyForm.phone,
        password: applyForm.password,
        instagram: applyForm.instagram || undefined,
        tiktok: applyForm.tiktok || undefined,
        promotionChannels: applyForm.promotionChannels || undefined,
        audienceSize: applyForm.audienceSize,
        promotionExperience: applyForm.promotionExperience || undefined,
        agreedToTerms: true,
      });

      if (res.success && res.data) {
        setSuccessMessage(
          'Application submitted successfully! Our curation team reviews all creator applications within 24 hours.'
        );
        onGoToPortal(res.data.affiliate);
      } else {
        setErrorMessage(res.error || 'Failed to submit application. Please check your information.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await AffiliateApiClient.login({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (res.success && res.data) {
        onGoToPortal(res.data.affiliate);
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedMonthlyIncome = ordersPerMonth * 800;

  return (
    <div className="affiliate-landing-shell min-h-screen bg-[#0A0A0A] text-[#F2F0EB] font-sans antialiased selection:bg-[#A48B71] selection:text-[#0A0A0A]">
      {/* Top Brand Header */}
      <header className="border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onBackToShop}>
            <span className="font-serif tracking-[0.25em] text-2xl font-light text-[#F2F0EB] hover:text-[#A48B71] transition-colors">
              PIERCYN
            </span>
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 border border-[#333333] text-[#888888] rounded-full">
              CREATOR CLUB
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setActiveTab('info');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-xs uppercase tracking-widest font-medium transition-colors ${
                activeTab === 'info' ? 'text-[#A48B71]' : 'text-[#888888] hover:text-[#F2F0EB]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('apply')}
              className={`text-xs uppercase tracking-widest font-medium transition-colors ${
                activeTab === 'apply' ? 'text-[#A48B71]' : 'text-[#888888] hover:text-[#F2F0EB]'
              }`}
            >
              Apply
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className="text-xs uppercase tracking-widest px-4 py-2 bg-[#A48B71] text-[#0A0A0A] font-semibold rounded hover:bg-[#C2A98F] transition-all"
            >
              Partner Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Areas */}
      {activeTab === 'info' && (
        <main>
          {/* Hero Section */}
          <section className="relative overflow-hidden py-20 sm:py-28 border-b border-[#262626]">
            <div className="absolute inset-0 bg-radial from-[#A48B71]/5 via-transparent to-transparent pointer-events-none" />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#A48B71] font-medium border border-[#A48B71]/30 px-3 py-1 rounded-full mb-6 bg-[#A48B71]/5">
                <Sparkles className="w-3.5 h-3.5" />
                PIERCYN Creator & Affiliate Partner Program
              </span>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light font-serif tracking-tight text-[#F2F0EB] mb-6 leading-[1.08]">
                Curate Modern Luxury.
                <br />
                <span className="italic text-[#A48B71] font-serif">Earn ₦800 on every qualifying order.</span>
              </h1>
              <p className="text-[#999999] text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                Join our private circle of stylists, taste-makers, and digital creators. Share bespoke
                PIERCYN garments with your audience, track real-time orders, and withdraw your earnings directly
                to any Nigerian bank account.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setActiveTab('apply')}
                  className="w-full sm:w-auto px-8 py-4 bg-[#A48B71] hover:bg-[#C2A98F] text-[#0A0A0A] text-xs uppercase tracking-[0.2em] font-semibold rounded flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg shadow-[#A48B71]/10"
                >
                  Join The Creator Program
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('login')}
                  className="w-full sm:w-auto px-8 py-4 border border-[#333333] hover:border-white/40 text-[#F2F0EB] text-xs uppercase tracking-[0.2em] font-medium rounded transition-colors"
                >
                  Existing Affiliate Portal
                </button>
              </div>
            </div>
          </section>

          {/* Value Propositions */}
          <section className="py-16 sm:py-24 border-b border-[#262626] bg-[#111111]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-2xl sm:text-3xl font-serif text-[#F2F0EB] mb-3">Why Partner With PIERCYN?</h2>
                <p className="text-[#888888] text-sm font-light">
                  A high-converting, transparent partnership built specifically for fashion curators in Nigeria.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Prop 1 */}
                <div className="p-8 rounded-xl bg-[#141414] border border-[#222222] hover:border-[#A48B71]/40 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-[#A48B71]/10 flex items-center justify-center text-[#A48B71] mb-6">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-serif text-[#F2F0EB] mb-2">₦800 Flat / Qualifying Order</h3>
                  <p className="text-sm text-[#888888] leading-relaxed font-light">
                    Every qualified customer order referred through your unique link earns you a flat ₦800 commission, tracked in an immutable financial ledger.
                  </p>
                </div>

                {/* Prop 2 */}
                <div className="p-8 rounded-xl bg-[#141414] border border-[#222222] hover:border-[#A48B71]/40 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-[#A48B71]/10 flex items-center justify-center text-[#A48B71] mb-6">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-serif text-[#F2F0EB] mb-2">30-Day Attribution Window</h3>
                  <p className="text-sm text-[#888888] leading-relaxed font-light">
                    When someone clicks your referral link, you get credited for any order they place within 30 days — even if they browse and return later.
                  </p>
                </div>

                {/* Prop 3 */}
                <div className="p-8 rounded-xl bg-[#141414] border border-[#222222] hover:border-[#A48B71]/40 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-[#A48B71]/10 flex items-center justify-center text-[#A48B71] mb-6">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-serif text-[#F2F0EB] mb-2">Zero Minimum Withdrawal</h3>
                  <p className="text-sm text-[#888888] leading-relaxed font-light">
                    Withdraw your available earnings directly to any Nigerian bank account anytime with no minimum withdrawal restrictions (₦0 threshold).
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Calculator */}
          <section className="py-20 border-b border-[#262626]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="bg-gradient-to-b from-[#181818] to-[#121212] p-8 sm:p-12 rounded-2xl border border-[#2B2B2B]">
                <div className="flex items-center gap-3 text-[#A48B71] mb-4">
                  <Calculator className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-semibold">Earnings Forecast</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif text-[#F2F0EB] mb-2">
                  Calculate Your Creator Earnings
                </h2>
                <p className="text-[#888888] text-sm font-light mb-8">
                  Adjust the slider below to estimate your monthly earnings based on pieces purchased by your community.
                </p>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-[#CCCCCC]">Referral Orders / Month</span>
                      <span className="text-xl font-mono font-medium text-[#F2F0EB]">{ordersPerMonth} Orders</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="500"
                      step="5"
                      value={ordersPerMonth}
                      onChange={(e) => setOrdersPerMonth(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#A48B71]"
                    />
                    <div className="flex justify-between text-[11px] text-[#666666] mt-1 font-mono">
                      <span>5 orders</span>
                      <span>250 orders</span>
                      <span>500 orders</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-[#888888] uppercase tracking-wider block">Estimated Monthly Payout</span>
                      <span className="text-3xl sm:text-4xl font-serif font-light text-[#A48B71]">
                        ₦{estimatedMonthlyIncome.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveTab('apply')}
                      className="px-6 py-3 bg-[#F2F0EB] hover:bg-white text-[#0A0A0A] text-xs uppercase tracking-widest font-semibold rounded transition-colors"
                    >
                      Start Earning Today
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Program Steps */}
          <section className="py-20 border-b border-[#262626]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-xs uppercase tracking-widest text-[#A48B71] font-medium block mb-2">
                  THE ONBOARDING JOURNEY
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-[#F2F0EB]">How It Works in 4 Simple Steps</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    step: '01',
                    title: 'Submit Application',
                    desc: 'Fill out the simple creator form with your social handles and audience channels.',
                  },
                  {
                    step: '02',
                    title: 'Instant Link Suite',
                    desc: 'Generate branded referral links for any product, collection, or campaign in seconds.',
                  },
                  {
                    step: '03',
                    title: 'Share With Taste',
                    desc: 'Tag PIERCYN garments in your outfits, lookbooks, TikToks, and style guides.',
                  },
                  {
                    step: '04',
                    title: 'Manual Bank Payouts',
                    desc: 'Withdraw your accumulated royalties directly to your Nigerian bank account anytime.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-6 rounded-xl bg-[#141414] border border-[#222222]">
                    <span className="text-2xl font-serif font-light text-[#A48B71] mb-3 block">
                      {item.step}
                    </span>
                    <h4 className="text-base font-serif text-[#F2F0EB] mb-2">{item.title}</h4>
                    <p className="text-xs text-[#888888] leading-relaxed font-light">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-20 border-b border-[#262626] bg-[#0A0A0A]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl sm:text-3xl font-serif text-[#F2F0EB] text-center mb-12">
                Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                {[
                  {
                    q: 'Who is eligible to join the PIERCYN Creator Club?',
                    a: 'We welcome fashion creators, stylists, creative directors, fashion writers, and content creators with an active social presence (Instagram, TikTok, YouTube, WhatsApp channels) who appreciate modern, elevated style.',
                  },
                  {
                    q: 'How and when do I receive payment?',
                    a: 'Commissions become available once the customer return cooling window (7 days) has passed. You can withdraw your available earnings directly to your Nigerian bank account anytime with no minimum withdrawal restrictions (₦0 threshold).',
                  },
                  {
                    q: 'What happens if a customer returns or cancels an order?',
                    a: 'If a customer cancels, returns, or is refunded within the 7-day window, the pending commission is reversed to maintain honest, sustainable economics.',
                  },
                  {
                    q: 'Can I create referral links to specific products or collections?',
                    a: 'Yes! Inside your Creator Portal, you can generate custom links pointing to any product page, curated collection, or the store homepage.',
                  },
                ].map((faq, idx) => (
                  <div key={idx} className="p-6 rounded-lg bg-[#141414] border border-[#222222]">
                    <h4 className="text-sm font-medium text-[#F2F0EB] mb-2">{faq.q}</h4>
                    <p className="text-xs text-[#999999] leading-relaxed font-light">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Application Tab */}
      {activeTab === 'apply' && (
        <main className="py-16 sm:py-24">
          <div className="max-w-xl mx-auto px-4 sm:px-6">
            <div className="bg-[#141414] p-8 sm:p-10 rounded-2xl border border-[#262626] shadow-2xl">
              <div className="text-center mb-8">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#A48B71] font-medium block mb-2">
                  APPLICATION FORM
                </span>
                <h2 className="text-3xl font-serif text-[#F2F0EB] mb-2">Join PIERCYN Creator Club</h2>
                <p className="text-xs text-[#888888] font-light">
                  Complete the application below. Approvals are processed within 24 hours.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-6 p-4 rounded-lg bg-green-950/40 border border-green-800 text-green-300 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={applyForm.firstName}
                      onChange={(e) => setApplyForm({ ...applyForm, firstName: e.target.value })}
                      placeholder="e.g. Kelvin"
                      className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded text-[#F2F0EB] text-sm focus:border-[#A48B71] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={applyForm.lastName}
                      onChange={(e) => setApplyForm({ ...applyForm, lastName: e.target.value })}
                      placeholder="e.g. Adeyemi"
                      className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded text-[#F2F0EB] text-sm focus:border-[#A48B71] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={applyForm.email}
                    onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                    placeholder="kelvin@example.com"
                    className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded text-[#F2F0EB] text-sm focus:border-[#A48B71] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={applyForm.phone}
                    onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                    placeholder="+234 801 234 5678"
                    className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded text-[#F2F0EB] text-sm focus:border-[#A48B71] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={applyForm.password}
                      onChange={(e) => setApplyForm({ ...applyForm, password: e.target.value })}
                      placeholder="Min 6 chars"
                      className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded text-[#F2F0EB] text-sm focus:border-[#A48B71] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={applyForm.confirmPassword}
                      onChange={(e) => setApplyForm({ ...applyForm, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded text-[#F2F0EB] text-sm focus:border-[#A48B71] outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#262626]">
                  <span className="text-[10px] uppercase tracking-widest text-[#A48B71] block mb-3 font-semibold">
                    CREATOR SOCIALS & REACH
                  </span>

                  <div className="mb-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                        Instagram Handle
                      </label>
                      <input
                        type="text"
                        value={applyForm.instagram}
                        onChange={(e) => setApplyForm({ ...applyForm, instagram: e.target.value })}
                        placeholder="@yourhandle"
                        className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333333] rounded text-[#F2F0EB] text-sm focus:border-[#A48B71] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                        TikTok Handle
                      </label>
                      <input
                        type="text"
                        value={applyForm.tiktok}
                        onChange={(e) => setApplyForm({ ...applyForm, tiktok: e.target.value })}
                        placeholder="@yourhandle"
                        className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333333] rounded text-[#F2F0EB] text-sm focus:border-[#A48B71] outline-none"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                      Estimated Audience Reach
                    </label>
                    <select
                      value={applyForm.audienceSize}
                      onChange={(e) => setApplyForm({ ...applyForm, audienceSize: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded text-[#F2F0EB] text-sm focus:border-[#A48B71] outline-none"
                    >
                      <option value="Under 1K">Under 1,000 followers / clients</option>
                      <option value="1K - 10K">1,000 - 10,000 followers</option>
                      <option value="10K - 50K">10,000 - 50,000 followers</option>
                      <option value="50K - 200K">50,000 - 200,000 followers</option>
                      <option value="200K+">200,000+ followers</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                      Primary Promotion Channels (Optional)
                    </label>
                    <input
                      type="text"
                      value={applyForm.promotionChannels}
                      onChange={(e) => setApplyForm({ ...applyForm, promotionChannels: e.target.value })}
                      placeholder="e.g. WhatsApp Status, Styling Clients, YouTube, Substack"
                      className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333333] rounded text-[#F2F0EB] text-sm focus:border-[#A48B71] outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyForm.agreedToTerms}
                      onChange={(e) => setApplyForm({ ...applyForm, agreedToTerms: e.target.checked })}
                      className="mt-1 accent-[#A48B71]"
                    />
                    <span className="text-[11px] text-[#888888] leading-tight font-light">
                      I agree to the PIERCYN Creator Terms, accurate promotion guidelines, and understand commissions are disbursed in NGN via Nigerian bank transfer.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#A48B71] hover:bg-[#C2A98F] disabled:opacity-50 text-[#0A0A0A] text-xs uppercase tracking-[0.2em] font-semibold rounded transition-all mt-4"
                >
                  {isLoading ? 'Submitting Application...' : 'Submit Creator Application'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-xs text-[#777777]">Already an active partner? </span>
                <button
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-[#A48B71] hover:underline font-medium"
                >
                  Sign In Here
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Login Tab */}
      {activeTab === 'login' && (
        <main className="py-16 sm:py-24">
          <div className="max-w-md mx-auto px-4 sm:px-6">
            <div className="bg-[#141414] p-8 sm:p-10 rounded-2xl border border-[#262626] shadow-2xl">
              <div className="text-center mb-8">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#A48B71] font-medium block mb-2">
                  CREATOR PORTAL ACCESS
                </span>
                <h2 className="text-3xl font-serif text-[#F2F0EB] mb-2">Partner Sign In</h2>
                <p className="text-xs text-[#888888] font-light">
                  Access your earnings, link tracking, and payout ledger.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="partner@example.com"
                    className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded text-[#F2F0EB] text-sm focus:border-[#A48B71] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded text-[#F2F0EB] text-sm focus:border-[#A48B71] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#A48B71] hover:bg-[#C2A98F] disabled:opacity-50 text-[#0A0A0A] text-xs uppercase tracking-[0.2em] font-semibold rounded transition-all mt-4"
                >
                  {isLoading ? 'Signing In...' : 'Sign In to Portal'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-xs text-[#777777]">Don't have a creator account? </span>
                <button
                  onClick={() => setActiveTab('apply')}
                  className="text-xs text-[#A48B71] hover:underline font-medium"
                >
                  Apply Here
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="py-12 border-t border-[#262626] bg-[#0A0A0A] text-center text-xs text-[#666666]">
        <p className="mb-2">PIERCYN Atelier — Luxury Menswear & Creator Economics</p>
        <p>© {new Date().getFullYear()} PIERCYN. All rights reserved.</p>
      </footer>
    </div>
  );
};
