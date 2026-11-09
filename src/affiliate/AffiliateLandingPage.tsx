import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Instagram,
  Link2,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';
import type { ActivePageView } from '../types';
import { AffiliateApiClient, type AffiliateUser } from '../services/affiliateApi';
import './affiliate-responsive.css';

type AffiliateTab = 'info' | 'apply' | 'login';
type StorePage = Extract<ActivePageView, 'shop' | 'collections' | 'about' | 'contact' | 'search' | 'account' | 'cart' | 'lookbook' | 'privacy' | 'terms'>;

interface AffiliateLandingPageProps {
  onGoToPortal: (user: AffiliateUser) => void;
  onBackToShop: () => void;
  onNavigatePage: (page: ActivePageView) => void;
}

const navItems: Array<{ label: string; page: StorePage }> = [
  { label: 'Shop', page: 'shop' },
  { label: 'Collections', page: 'collections' },
  { label: 'About', page: 'about' },
  { label: 'Support', page: 'contact' },
];

const faqItems = [
  {
    question: 'Can I apply without a PIERCYN customer account?',
    answer: 'Yes. The affiliate application is public and does not require customer sign-in. You create a separate affiliate account for your creator portal.',
  },
  {
    question: 'How much do affiliates earn?',
    answer: 'The current rate is ₦800 for each qualifying referred order. Referral clicks are attributed for 30 days using the program’s last-valid-click rules.',
  },
  {
    question: 'When can I withdraw my earnings?',
    answer: 'Commissions become available after the 7-day return cooling window. The current minimum withdrawal request is ₦5,000, paid in NGN to a Nigerian bank account.',
  },
  {
    question: 'What happens if a customer cancels or returns an order?',
    answer: 'Orders cancelled, returned, or refunded within the cooling window do not remain eligible for commission; any pending commission is reversed.',
  },
  {
    question: 'Where do I get links to share?',
    answer: 'After your application is approved, your affiliate portal lets you create referral links for products, collections, or the store homepage.',
  },
];

const inputClass = 'min-h-12 w-full rounded-md border border-[#d4d0c9] bg-white px-4 py-3 text-base text-[#101010] placeholder:text-[#827f79] outline-none transition focus:border-[#101010] focus:ring-2 focus:ring-[#101010]/10';
const labelClass = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#514f4b]';

function initialTab(): AffiliateTab {
  if (typeof window === 'undefined') return 'info';
  const mode = new URLSearchParams(window.location.search).get('mode');
  return mode === 'apply' || mode === 'login' ? mode : 'info';
}

export const AffiliateLandingPage: React.FC<AffiliateLandingPageProps> = ({
  onGoToPortal,
  onBackToShop,
  onNavigatePage,
}) => {
  const [activeTab, setActiveTab] = useState<AffiliateTab>(initialTab);
  const [ordersPerMonth, setOrdersPerMonth] = useState(30);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
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
    agreedToTerms: false,
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('.affiliate-reveal'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [activeTab]);

  const changeTab = (tab: AffiliateTab) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveTab(tab);
    setMobileMenuOpen(false);
    const url = new URL(window.location.href);
    if (tab === 'info') url.searchParams.delete('mode');
    else url.searchParams.set('mode', tab);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigate = (page: ActivePageView) => {
    setMobileMenuOpen(false);
    onNavigatePage(page);
  };

  const handleApplySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (applyForm.password.length < 6) {
      setErrorMessage('Choose a password with at least 6 characters.');
      return;
    }
    if (applyForm.password !== applyForm.confirmPassword) {
      setErrorMessage('Your passwords do not match.');
      return;
    }
    if (!applyForm.agreedToTerms) {
      setErrorMessage('Please accept the PIERCYN Creator Terms to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await AffiliateApiClient.apply({
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
        agreedToTerms: applyForm.agreedToTerms,
      });
      if (response.success && response.data) {
        setSuccessMessage('Application submitted successfully. Your creator application is now in the PIERCYN review flow.');
        onGoToPortal(response.data.affiliate);
      } else {
        setErrorMessage(response.error || 'We could not submit your application. Please check your details and try again.');
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await AffiliateApiClient.login(loginForm);
      if (response.success && response.data) onGoToPortal(response.data.affiliate);
      else setErrorMessage(response.error || 'Invalid email or password.');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedMonthlyIncome = ordersPerMonth * 800;
  const iconButtonClass = 'inline-flex h-10 w-10 items-center justify-center rounded-full text-[#101010] transition hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101010]';
  const primaryButtonClass = 'inline-flex min-h-12 items-center justify-center gap-3 rounded-sm bg-[#F5F3EF] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#101010] transition duration-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F5F3EF] active:translate-y-px';

  return (
    <div className="affiliate-landing-shell min-h-screen bg-[#F5F3EF] font-sans text-[#101010] antialiased selection:bg-[#101010] selection:text-[#F5F3EF]">
      <a className="affiliate-skip-link" href="#affiliate-main">Skip to content</a>

      <header className="affiliate-site-header sticky top-0 z-50 border-b border-black/10 bg-[#F5F3EF]/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <button type="button" onClick={onBackToShop} className="group inline-flex shrink-0 items-center gap-2.5 text-left" aria-label="PIERCYN home">
            <span className="font-editorial text-[25px] font-medium leading-none tracking-[-0.06em] sm:text-[29px]">PIERCYN</span>
            <span className="hidden border-l border-black/20 pl-2.5 text-[8px] font-semibold uppercase leading-tight tracking-[0.18em] text-black/55 sm:inline-block">Creator<br />Club</span>
          </button>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
            {navItems.slice(0, 3).map((item) => (
              <button key={item.page} type="button" onClick={() => navigate(item.page)} className="affiliate-nav-link">{item.label}</button>
            ))}
            <button type="button" onClick={() => changeTab('info')} className={`affiliate-nav-link ${activeTab === 'info' ? 'is-active' : ''}`} aria-current="page">Affiliate</button>
            <button type="button" onClick={() => navigate('contact')} className="affiliate-nav-link">Support</button>
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button type="button" className={iconButtonClass} onClick={() => navigate('search')} aria-label="Search PIERCYN" title="Search"><Search className="h-[18px] w-[18px]" /></button>
            <button type="button" className={iconButtonClass} onClick={() => navigate('account')} aria-label="Customer account — sign in" title="Customer account"><UserRound className="h-[18px] w-[18px]" /></button>
            <button type="button" className={iconButtonClass} onClick={() => navigate('cart')} aria-label="Shopping bag" title="Shopping bag"><ShoppingBag className="h-[18px] w-[18px]" /></button>
            <button type="button" className={`${iconButtonClass} lg:hidden`} onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} aria-controls="affiliate-mobile-navigation">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <button type="button" onClick={() => changeTab('login')} className="ml-1 hidden min-h-10 items-center rounded-sm border border-[#101010]/25 px-3 text-[10px] font-bold uppercase tracking-[0.12em] transition hover:border-[#101010] hover:bg-[#101010] hover:text-[#F5F3EF] sm:inline-flex">Partner sign in</button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav id="affiliate-mobile-navigation" className="affiliate-mobile-nav border-t border-black/10 bg-[#F5F3EF] px-4 pb-5 pt-2 lg:hidden" aria-label="Mobile navigation">
            {navItems.slice(0, 3).map((item) => (
              <button key={item.page} type="button" onClick={() => navigate(item.page)} className="affiliate-mobile-nav-link">{item.label}<ArrowUpRight className="h-4 w-4" /></button>
            ))}
            <button type="button" onClick={() => changeTab('info')} className="affiliate-mobile-nav-link font-bold" aria-current="page">Affiliate<span className="text-[10px] uppercase tracking-[0.16em]">Current page</span></button>
            <button type="button" onClick={() => navigate('contact')} className="affiliate-mobile-nav-link">Support<ArrowUpRight className="h-4 w-4" /></button>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => changeTab('login')} className="min-h-12 rounded-sm border border-[#101010]/25 px-3 text-[10px] font-bold uppercase tracking-[0.12em]">Affiliate portal sign in</button>
              <button type="button" onClick={() => changeTab('apply')} className="min-h-12 rounded-sm bg-[#101010] px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Apply for free</button>
            </div>
          </nav>
        )}
      </header>

      <main id="affiliate-main" tabIndex={-1}>
        {activeTab === 'info' && (
          <>
            <section className="affiliate-hero bg-[#101010] text-[#F5F3EF]">
              <div className="mx-auto grid max-w-[1440px] lg:min-h-[610px] lg:grid-cols-[0.92fr_1.08fr]">
                <div className="affiliate-hero-copy relative z-10 flex flex-col justify-center px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24 xl:px-16">
                  <span className="mb-5 inline-flex w-fit items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5F3EF]/65">
                    <Sparkles className="h-3.5 w-3.5" /> PIERCYN Affiliate Program
                  </span>
                  <h1 className="max-w-[700px] text-[clamp(3.25rem,8.3vw,7rem)] font-bold leading-[0.88] tracking-[-0.075em]">
                    Join the Team.<br /><span className="text-[#F5F3EF]/60">Earn More.</span>
                  </h1>
                  <p className="mt-6 max-w-[510px] text-base leading-7 text-[#F5F3EF]/70 sm:text-lg sm:leading-8">
                    Share PIERCYN with your community and earn rewards for every qualifying order.
                  </p>
                  <div className="mt-7 flex flex-wrap items-end gap-x-4 gap-y-1">
                    <span className="text-[clamp(2rem,4vw,3rem)] font-bold leading-none tracking-[-0.06em]">₦800</span>
                    <span className="pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F5F3EF]/65">per qualifying order</span>
                  </div>
                  <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                    <button type="button" onClick={() => changeTab('apply')} className={`${primaryButtonClass} w-full sm:w-auto`}>
                      Become an Affiliate <ArrowRight className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => changeTab('login')} className="min-h-12 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F5F3EF]/75 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-center">
                      Partner sign in
                    </button>
                  </div>
                  <p className="mt-4 text-[11px] leading-5 text-[#F5F3EF]/55">Free to join. No customer account required to apply.</p>
                </div>
                <div className="affiliate-hero-media relative min-h-[300px] overflow-hidden sm:min-h-[430px] lg:min-h-full">
                  <img src="/images/affiliate-hero.webp" alt="Two young Nigerian models in neutral oversized streetwear in a cinematic Lagos setting." className="absolute inset-0 h-full w-full object-cover object-[72%_center] transition-transform duration-700 ease-out hover:scale-[1.02]" loading="eager" decoding="async" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#101010]/80 via-[#101010]/10 to-transparent lg:from-[#101010]/45" />
                  <div className="absolute bottom-5 right-5 border border-white/25 bg-black/35 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur-sm sm:bottom-7 sm:right-7">Lagos · Built for everywhere</div>
                </div>
              </div>
            </section>

            <section className="bg-[#F5F3EF] px-5 py-12 sm:px-8 lg:px-10 lg:py-16" aria-label="Affiliate program benefits">
              <div className="mx-auto grid max-w-[1320px] grid-cols-1 divide-y divide-[#101010]/15 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                <article className="affiliate-benefit affiliate-reveal py-5 sm:px-5 sm:py-3 lg:px-7">
                  <TrendingUp className="mb-5 h-5 w-5" strokeWidth={1.6} />
                  <h2 className="text-sm font-bold tracking-[-0.02em]">₦800 Per Order</h2>
                  <p className="mt-2 max-w-[240px] text-xs leading-5 text-[#5b5852]">Get rewarded for every qualifying referral.</p>
                </article>
                <article className="affiliate-benefit affiliate-reveal py-5 sm:px-5 sm:py-3 lg:px-7">
                  <CreditCard className="mb-5 h-5 w-5" strokeWidth={1.6} />
                  <h2 className="text-sm font-bold tracking-[-0.02em]">Track Your Earnings</h2>
                  <p className="mt-2 max-w-[240px] text-xs leading-5 text-[#5b5852]">Monitor clicks, orders, and commissions in your affiliate portal.</p>
                </article>
                <article className="affiliate-benefit affiliate-reveal py-5 sm:px-5 sm:py-3 lg:px-7">
                  <ShieldCheck className="mb-5 h-5 w-5" strokeWidth={1.6} />
                  <h2 className="text-sm font-bold tracking-[-0.02em]">Clear Payout Terms</h2>
                  <p className="mt-2 max-w-[240px] text-xs leading-5 text-[#5b5852]">Request withdrawal once your approved balance reaches ₦5,000.</p>
                </article>
                <article className="affiliate-benefit affiliate-reveal py-5 sm:px-5 sm:py-3 lg:px-7">
                  <Link2 className="mb-5 h-5 w-5" strokeWidth={1.6} />
                  <h2 className="text-sm font-bold tracking-[-0.02em]">Share-Ready Stories</h2>
                  <p className="mt-2 max-w-[240px] text-xs leading-5 text-[#5b5852]">Use the live catalog and lookbook to show your community what moves you.</p>
                  <button type="button" onClick={() => navigate('lookbook')} className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] underline underline-offset-4">Explore the lookbook <ArrowUpRight className="h-3 w-3" /></button>
                </article>
              </div>
            </section>

            <section className="border-t border-black/10 bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
              <div className="mx-auto max-w-[1220px]">
                <div className="affiliate-reveal mb-10 flex flex-col justify-between gap-5 sm:mb-14 sm:flex-row sm:items-end">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6e6a63]">The creator journey</span>
                    <h2 className="mt-3 max-w-[600px] text-[clamp(2.1rem,5vw,4.1rem)] font-bold leading-[0.94] tracking-[-0.065em]">It’s Simple.<br className="hidden sm:block" /> Just 3 Steps.</h2>
                  </div>
                  <p className="max-w-sm text-sm leading-6 text-[#5b5852]">A clear path from your first application to your first qualifying referral.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { number: '01', title: 'Sign Up', copy: 'Apply to join the PIERCYN Affiliate Program. It’s free, and you do not need a customer account.' },
                    { number: '02', title: 'Share Your Link', copy: 'Once approved, create a unique referral link for a product, collection, or the store.' },
                    { number: '03', title: 'Earn Commission', copy: 'Receive ₦800 for each qualifying order attributed to your link.' },
                  ].map((step, index) => (
                    <article key={step.number} className="affiliate-step affiliate-reveal" style={{ transitionDelay: `${index * 90}ms` }}>
                      <span className="block text-[11px] font-bold tracking-[0.16em] text-[#77736d]">{step.number}</span>
                      <div className="my-5 h-px w-full bg-[#101010]/15" />
                      <h3 className="text-xl font-bold tracking-[-0.04em]">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#5b5852]">{step.copy}</p>
                    </article>
                  ))}
                </div>
                <div className="mt-8 flex justify-center sm:mt-10">
                  <button type="button" onClick={() => changeTab('apply')} className="affiliate-dark-button w-full sm:w-auto">Get Started <ArrowRight className="h-4 w-4" /></button>
                </div>
              </div>
            </section>

            <section className="bg-[#F5F3EF] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24" aria-labelledby="earnings-title">
              <div className="affiliate-earnings-banner affiliate-reveal mx-auto grid max-w-[1320px] overflow-hidden rounded-sm bg-[#1A1A1A] text-[#F5F3EF] lg:grid-cols-[1fr_0.88fr]">
                <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
                  <span className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">For creators, students & PIERCYN people</span>
                  <h2 id="earnings-title" className="max-w-[580px] text-[clamp(2.25rem,5vw,4.6rem)] font-bold leading-[0.93] tracking-[-0.065em]">Turn Your Influence Into Income.</h2>
                  <p className="mt-5 max-w-[520px] text-sm leading-6 text-white/70 sm:text-base sm:leading-7">Whether you create content, style clients, study, or simply love PIERCYN, you can earn by sharing what you love.</p>
                  <div className="mt-8 grid gap-5 border-t border-white/15 pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div>
                      <label htmlFor="orders-per-month" className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">Estimate referrals per month</label>
                      <input id="orders-per-month" type="range" min="5" max="500" step="5" value={ordersPerMonth} onChange={(event) => setOrdersPerMonth(Number(event.target.value))} className="affiliate-range w-full" />
                      <div className="mt-2 flex justify-between text-[10px] text-white/45"><span>5 orders</span><span>{ordersPerMonth} selected</span><span>500 orders</span></div>
                    </div>
                    <p className="text-left sm:text-right"><span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55">Illustrative monthly commission</span><strong className="mt-1 block text-2xl font-bold tracking-[-0.04em]">₦{estimatedMonthlyIncome.toLocaleString('en-NG')}</strong></p>
                  </div>
                  <p className="mt-4 text-[10px] leading-4 text-white/45">Estimate assumes every referral shown qualifies. Actual commissions depend on eligible orders and the program terms.</p>
                  <button type="button" onClick={() => changeTab('apply')} className={`${primaryButtonClass} mt-7 w-full sm:w-fit`}>Join the Program <ArrowRight className="h-4 w-4" /></button>
                </div>
                <div className="affiliate-earnings-photo relative min-h-[320px] overflow-hidden sm:min-h-[430px] lg:min-h-full">
                  <img src="/images/affiliate-campaign.webp" alt="PIERCYN-style editorial portrait of two young Nigerian adults in charcoal and ivory streetwear." className="absolute inset-0 h-full w-full object-cover object-[58%_center] transition-transform duration-700 ease-out hover:scale-[1.025]" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 sm:bottom-9 sm:left-9 sm:right-9">
                    <span className="block text-[clamp(3.8rem,10vw,7.5rem)] font-bold leading-[0.78] tracking-[-0.09em]">₦800</span>
                    <span className="mt-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">Per qualifying order</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="affiliate-brand-note bg-[#F5F3EF] px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
              <div className="affiliate-reveal mx-auto flex max-w-[1320px] flex-col gap-5 border-t border-[#101010]/15 pt-8 sm:flex-row sm:items-end sm:justify-between sm:pt-10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6e6a63]">Wear the Culture.</span>
                  <h2 className="mt-3 max-w-[770px] text-[clamp(2rem,5vw,4.3rem)] font-bold leading-[0.94] tracking-[-0.07em]">Not just a link.<br className="hidden sm:block" /> A point of view.</h2>
                </div>
                <div className="max-w-md">
                  <p className="text-sm leading-6 text-[#5b5852]">PIERCYN is Lagos-born contemporary streetwear, made for a generation that values style and knows the value of money. Bring your own perspective to the pieces you share.</p>
                  <button type="button" onClick={() => changeTab('apply')} className="mt-5 inline-flex min-h-11 items-center gap-2 border-b border-[#101010]/50 text-[10px] font-bold uppercase tracking-[0.16em] transition hover:border-[#101010]">Become an Affiliate <ArrowRight className="h-4 w-4" /></button>
                </div>
              </div>
            </section>

            <section className="border-t border-black/10 bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24" aria-labelledby="faq-title">
              <div className="mx-auto grid max-w-[1220px] gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
                <div className="affiliate-reveal">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6e6a63]">Good to know</span>
                  <h2 id="faq-title" className="mt-3 text-[clamp(2.2rem,4.6vw,4rem)] font-bold leading-[0.93] tracking-[-0.065em]">The details,<br />made clear.</h2>
                  <p className="mt-5 max-w-sm text-sm leading-6 text-[#5b5852]">Questions about joining, attribution, or payouts? Start here.</p>
                </div>
                <div className="affiliate-faq-list">
                  {faqItems.map((item, index) => (
                    <div key={item.question} className="affiliate-reveal border-b border-[#101010]/15">
                      <button type="button" className="flex min-h-[68px] w-full items-center justify-between gap-5 py-5 text-left" onClick={() => setOpenFaq((current) => current === index ? null : index)} aria-expanded={openFaq === index}>
                        <span className="text-sm font-semibold leading-5 sm:text-base">{item.question}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} />
                      </button>
                      {openFaq === index && <p className="max-w-3xl pb-5 pr-7 text-sm leading-6 text-[#5b5852]">{item.answer}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'apply' && (
          <section className="affiliate-form-view px-4 py-10 sm:px-6 sm:py-16 lg:py-20" aria-labelledby="apply-title">
            <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
              <div className="affiliate-reveal lg:sticky lg:top-28 lg:self-start">
                <button type="button" onClick={() => changeTab('info')} className="mb-8 inline-flex min-h-10 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#57534d] transition hover:text-[#101010]"><ArrowRight className="h-4 w-4 rotate-180" /> Back to program overview</button>
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#6e6a63]">PIERCYN Affiliate Program</span>
                <h1 id="apply-title" className="mt-3 text-[clamp(2.5rem,5.5vw,5rem)] font-bold leading-[0.9] tracking-[-0.07em]">Your next<br />chapter starts here.</h1>
                <p className="mt-5 max-w-md text-sm leading-6 text-[#5b5852]">Tell us a little about you and how you share style. Applications are reviewed by the PIERCYN team.</p>
                <div className="mt-6 flex gap-3 border-l-2 border-[#101010] bg-white px-4 py-4 text-sm leading-6 text-[#3e3b36]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <p><strong className="font-semibold text-[#101010]">No customer sign-in needed.</strong> This public form creates a separate affiliate account for your portal.</p>
                </div>
                <p className="mt-5 text-xs leading-5 text-[#6e6a63]">Joining is free. The current commission is ₦800 per qualifying order; payout requests start at ₦5,000.</p>
              </div>

              <div className="affiliate-reveal rounded-sm border border-black/10 bg-white p-5 shadow-[0_18px_60px_rgba(16,16,16,0.06)] sm:p-8 lg:p-10">
                {errorMessage && <div role="alert" className="mb-6 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}
                {successMessage && <div role="status" className="mb-6 flex items-start gap-3 border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{successMessage}</span></div>}
                <form onSubmit={handleApplySubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-[-0.04em]">Your details</h2>
                    <p className="mt-1 text-xs leading-5 text-[#6e6a63]">Use an email address you can access. Your affiliate portal login is separate from your customer account.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label htmlFor="affiliate-first-name" className={labelClass}>First name *</label><input id="affiliate-first-name" autoComplete="given-name" type="text" required value={applyForm.firstName} onChange={(event) => setApplyForm({ ...applyForm, firstName: event.target.value })} placeholder="First name" className={inputClass} /></div>
                    <div><label htmlFor="affiliate-last-name" className={labelClass}>Last name *</label><input id="affiliate-last-name" autoComplete="family-name" type="text" required value={applyForm.lastName} onChange={(event) => setApplyForm({ ...applyForm, lastName: event.target.value })} placeholder="Last name" className={inputClass} /></div>
                    <div><label htmlFor="affiliate-email" className={labelClass}>Email address *</label><input id="affiliate-email" autoComplete="email" type="email" required value={applyForm.email} onChange={(event) => setApplyForm({ ...applyForm, email: event.target.value })} placeholder="you@example.com" className={inputClass} /></div>
                    <div><label htmlFor="affiliate-phone" className={labelClass}>Phone / WhatsApp *</label><input id="affiliate-phone" autoComplete="tel" type="tel" required value={applyForm.phone} onChange={(event) => setApplyForm({ ...applyForm, phone: event.target.value })} placeholder="+234 801 234 5678" className={inputClass} /></div>
                    <div><label htmlFor="affiliate-password" className={labelClass}>Create password *</label><input id="affiliate-password" autoComplete="new-password" type="password" minLength={6} required value={applyForm.password} onChange={(event) => setApplyForm({ ...applyForm, password: event.target.value })} placeholder="At least 6 characters" className={inputClass} /></div>
                    <div><label htmlFor="affiliate-confirm-password" className={labelClass}>Confirm password *</label><input id="affiliate-confirm-password" autoComplete="new-password" type="password" required value={applyForm.confirmPassword} onChange={(event) => setApplyForm({ ...applyForm, confirmPassword: event.target.value })} placeholder="Re-enter password" className={inputClass} /></div>
                  </div>

                  <div className="border-t border-black/10 pt-6">
                    <h3 className="text-xl font-bold tracking-[-0.04em]">Your community</h3>
                    <p className="mt-1 text-xs leading-5 text-[#6e6a63]">Share the channels and audience you would use to introduce PIERCYN.</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div><label htmlFor="affiliate-instagram" className={labelClass}>Instagram handle</label><input id="affiliate-instagram" type="text" value={applyForm.instagram} onChange={(event) => setApplyForm({ ...applyForm, instagram: event.target.value })} placeholder="@yourhandle" className={inputClass} /></div>
                      <div><label htmlFor="affiliate-tiktok" className={labelClass}>TikTok handle</label><input id="affiliate-tiktok" type="text" value={applyForm.tiktok} onChange={(event) => setApplyForm({ ...applyForm, tiktok: event.target.value })} placeholder="@yourhandle" className={inputClass} /></div>
                      <div><label htmlFor="affiliate-audience" className={labelClass}>Estimated audience reach</label><select id="affiliate-audience" value={applyForm.audienceSize} onChange={(event) => setApplyForm({ ...applyForm, audienceSize: event.target.value })} className={inputClass}><option value="Under 1K">Under 1,000 followers / clients</option><option value="1K - 10K">1,000 - 10,000 followers</option><option value="10K - 50K">10,000 - 50,000 followers</option><option value="50K - 200K">50,000 - 200,000 followers</option><option value="200K+">200,000+ followers</option></select></div>
                      <div><label htmlFor="affiliate-channels" className={labelClass}>Primary promotion channels</label><input id="affiliate-channels" type="text" value={applyForm.promotionChannels} onChange={(event) => setApplyForm({ ...applyForm, promotionChannels: event.target.value })} placeholder="WhatsApp, styling clients, YouTube…" className={inputClass} /></div>
                    </div>
                    <div className="mt-4"><label htmlFor="affiliate-experience" className={labelClass}>Anything else you would like us to know? <span className="normal-case tracking-normal text-[#77736d]">Optional</span></label><textarea id="affiliate-experience" rows={3} value={applyForm.promotionExperience} onChange={(event) => setApplyForm({ ...applyForm, promotionExperience: event.target.value })} placeholder="Tell us about your approach to sharing fashion and style." className={`${inputClass} min-h-24 resize-y`} /></div>
                  </div>

                  <label className="flex items-start gap-3 border-t border-black/10 pt-5 text-xs leading-5 text-[#57534d]">
                    <input type="checkbox" required checked={applyForm.agreedToTerms} onChange={(event) => setApplyForm({ ...applyForm, agreedToTerms: event.target.checked })} className="affiliate-terms-checkbox mt-1 h-4 w-4 shrink-0 accent-[#101010]" />
                    <span>I agree to the PIERCYN Creator Terms and accurate promotion guidelines, and understand commissions are disbursed in NGN via Nigerian bank transfer.</span>
                  </label>
                  <button type="submit" disabled={isLoading} className="affiliate-dark-button w-full disabled:cursor-wait disabled:opacity-60">{isLoading ? 'Submitting application…' : 'Submit creator application'} <ArrowRight className="h-4 w-4" /></button>
                  <p className="text-center text-[10px] leading-4 text-[#77736d]">Free to apply · Separate affiliate account · Customer sign-in is not required</p>
                </form>
                <div className="mt-6 border-t border-black/10 pt-5 text-center text-sm text-[#5b5852]">Already an affiliate? <button type="button" onClick={() => changeTab('login')} className="font-bold text-[#101010] underline underline-offset-4">Sign in to your affiliate portal</button></div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'login' && (
          <section className="affiliate-form-view px-4 py-12 sm:px-6 sm:py-20" aria-labelledby="login-title">
            <div className="mx-auto grid max-w-[1000px] gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-14">
              <div className="affiliate-reveal">
                <button type="button" onClick={() => changeTab('info')} className="mb-8 inline-flex min-h-10 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#57534d] transition hover:text-[#101010]"><ArrowRight className="h-4 w-4 rotate-180" /> Back to program overview</button>
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#6e6a63]">Affiliate portal</span>
                <h1 id="login-title" className="mt-3 text-[clamp(2.5rem,5.5vw,5rem)] font-bold leading-[0.9] tracking-[-0.07em]">Welcome<br />back.</h1>
                <p className="mt-5 max-w-md text-sm leading-6 text-[#5b5852]">Sign in with the email and password you created for your PIERCYN affiliate account. This is separate from customer sign-in.</p>
                <button type="button" onClick={() => changeTab('apply')} className="mt-6 inline-flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] underline underline-offset-4">New to the program? Apply free <ArrowRight className="h-4 w-4" /></button>
              </div>
              <div className="affiliate-reveal rounded-sm border border-black/10 bg-white p-6 shadow-[0_18px_60px_rgba(16,16,16,0.06)] sm:p-9">
                {errorMessage && <div role="alert" className="mb-6 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div><label htmlFor="affiliate-login-email" className={labelClass}>Affiliate email</label><input id="affiliate-login-email" autoComplete="username" type="email" required value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="partner@example.com" className={inputClass} /></div>
                  <div><label htmlFor="affiliate-login-password" className={labelClass}>Affiliate password</label><input id="affiliate-login-password" autoComplete="current-password" type="password" required value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="Your affiliate password" className={inputClass} /></div>
                  <button type="submit" disabled={isLoading} className="affiliate-dark-button w-full disabled:cursor-wait disabled:opacity-60">{isLoading ? 'Signing in…' : 'Sign in to affiliate portal'} <ArrowRight className="h-4 w-4" /></button>
                </form>
                <p className="mt-5 text-center text-[10px] leading-4 text-[#77736d]">Need customer sign-in instead? <button type="button" onClick={() => navigate('account')} className="font-bold text-[#101010] underline underline-offset-2">Go to customer account</button></p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="affiliate-site-footer bg-[#101010] text-[#F5F3EF]">
        <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <div className="grid gap-10 border-b border-white/15 pb-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.8fr_0.8fr] lg:gap-12 lg:pb-14">
            <div>
              <button type="button" onClick={onBackToShop} className="font-editorial text-[32px] font-medium leading-none tracking-[-0.06em]" aria-label="PIERCYN home">PIERCYN</button>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">Wear the Culture.</p>
              <p className="mt-3 max-w-xs text-xs leading-5 text-white/55">Modern streetwear, born in Lagos and built for everywhere.</p>
            </div>
            <div>
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Explore</h2>
              <div className="flex flex-col items-start gap-1">
                <button type="button" onClick={() => navigate('shop')} className="affiliate-footer-link">Shop all</button>
                <button type="button" onClick={() => navigate('collections')} className="affiliate-footer-link">Collections</button>
                <button type="button" onClick={() => navigate('about')} className="affiliate-footer-link">About PIERCYN</button>
                <button type="button" onClick={() => changeTab('info')} className="affiliate-footer-link">Affiliate program</button>
              </div>
            </div>
            <div>
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Need help?</h2>
              <div className="flex flex-col items-start gap-1">
                <button type="button" onClick={() => navigate('contact')} className="affiliate-footer-link">Contact support</button>
                <button type="button" onClick={() => navigate('terms')} className="affiliate-footer-link">Terms of service</button>
                <button type="button" onClick={() => navigate('privacy')} className="affiliate-footer-link">Privacy policy</button>
              </div>
            </div>
            <div>
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Follow PIERCYN</h2>
              <div className="flex flex-col items-start gap-1">
                <a href="https://instagram.com/piercyn" target="_blank" rel="noopener noreferrer" className="affiliate-footer-link inline-flex items-center gap-2">Instagram <Instagram className="h-3.5 w-3.5" /><ArrowUpRight className="h-3 w-3" /></a>
                <a href="https://tiktok.com/@piercyn" target="_blank" rel="noopener noreferrer" className="affiliate-footer-link">TikTok <ArrowUpRight className="ml-1 inline h-3 w-3" /></a>
                <a href="https://wa.me/2348076431059?text=Hello%20PIERCYN%2C%20I%20need%20help." target="_blank" rel="noopener noreferrer" className="affiliate-footer-link">WhatsApp <ArrowUpRight className="ml-1 inline h-3 w-3" /></a>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-6 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} PIERCYN. All rights reserved.</p>
            <p>Lagos · Nigeria</p>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-fit text-white/70 transition hover:text-white">Back to top ↑</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
