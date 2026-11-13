import React, { useState } from 'react';
import { AffiliateApiClient, AffiliateUser } from '../../services/affiliateApi';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Phone,
  Instagram,
  Share2,
} from 'lucide-react';
import { GuidelinesModal } from '../components/GuidelinesModal';

interface AffiliateRegisterPageProps {
  onNavigate: (route: 'landing' | 'register' | 'login' | 'application') => void;
  onSuccess: (user: AffiliateUser) => void;
  onBackToShop: () => void;
}

export const AffiliateRegisterPage: React.FC<AffiliateRegisterPageProps> = ({
  onNavigate,
  onSuccess,
  onBackToShop,
}) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    instagram: '',
    tiktok: '',
    promotionExperience: '',
    agreedToTerms: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (form.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password.');
      return;
    }

    if (!form.agreedToTerms) {
      setErrorMessage('You must accept the PIERCYN Affiliate Guidelines to proceed.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AffiliateApiClient.apply({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        instagram: form.instagram.trim() || undefined,
        tiktok: form.tiktok.trim() || undefined,
        promotionExperience: form.promotionExperience.trim() || undefined,
        agreedToTerms: true,
      });

      if (res.success && res.data?.affiliate) {
        onSuccess(res.data.affiliate);
      } else {
        setErrorMessage(res.error || 'Failed to submit application. Please check your details.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error communicating with the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F0EB] text-[#141414] font-sans antialiased flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-[#E5E2DC] bg-[#F2F0EB]/90 backdrop-blur-md px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('landing')}
              className="text-2xl font-serif font-bold uppercase tracking-widest text-[#141414] hover:opacity-80 transition-opacity"
            >
              PIERCYN
            </button>
            <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373] border-l border-[#E5E2DC] pl-4 hidden sm:inline">
              Creator Application
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider">
            <span className="text-[#737373] hidden sm:inline">Already an affiliate?</span>
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 bg-white hover:bg-[#FAF8F5] border border-[#E5E2DC] text-[#141414] transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Brand Context & Value Proposition */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <span className="text-[11px] tracking-[0.24em] font-semibold uppercase text-[#737373]">
                Join the Network
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-medium text-[#141414] leading-tight">
                Partner with Contemporary African Streetwear.
              </h1>
              <p className="text-sm text-[#555555] leading-relaxed">
                Connect your community with distinct Lagos-crafted heavyweight garments. We curate long-term
                partnerships with stylists, curators, and creative storytellers.
              </p>
            </div>

            <div className="bg-white border border-[#E5E2DC] p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest font-bold text-[#141414] border-b border-[#E5E2DC] pb-3">
                Creator Compensation Terms
              </div>
              <div className="space-y-3 text-xs text-[#555555]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#141414] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#141414]">₦1,000 Flat Commission</strong> per qualifying delivered referral order.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#141414] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#141414]">30-Day Cookie Tracking</strong> ensures you receive credit even if customers purchase later.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#141414] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#141414]">Direct NIP Bank Transfers</strong> with zero minimum balance requirement.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#141414] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#141414]">Dedicated Media Suite</strong> with official lookbooks, reels, and product stills.
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border border-[#E5E2DC] text-xs text-[#737373] space-y-1">
              <p className="font-semibold text-[#141414]">Curation Review Process</p>
              <p>
                Applications are reviewed by our Lagos studio within 24 to 48 hours. Once approved, you gain full access to your custom affiliate code, link generators, and real-time dashboard.
              </p>
            </div>
          </div>

          {/* Right Column: Clean High-Fashion Application Form */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-[#E5E2DC] p-6 sm:p-10 shadow-sm">
              <div className="border-b border-[#E5E2DC] pb-5 mb-6">
                <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#141414]">
                  Affiliate Application
                </h2>
                <p className="text-xs text-[#737373] mt-1">
                  Please complete the details below. All fields are required unless marked optional.
                </p>
              </div>

              {errorMessage && (
                <div className="p-4 mb-6 bg-[#FDF2F2] border border-[#FCA5A5] text-[#7F1D1D] text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      placeholder="e.g. Tunde"
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] focus:outline-none text-sm text-[#141414] transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      placeholder="e.g. Adeleke"
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] focus:outline-none text-sm text-[#141414] transition-colors"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="tunde@example.com"
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] focus:outline-none text-sm text-[#141414] transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+234 812 345 6789"
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] focus:outline-none text-sm text-[#141414] transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] focus:outline-none text-sm text-[#141414] transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] focus:outline-none text-sm text-[#141414] transition-colors"
                    />
                  </div>
                </div>

                {/* Social Handles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      value={form.instagram}
                      onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                      placeholder="@yourhandle"
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] focus:outline-none text-sm text-[#141414] transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                      TikTok Handle
                    </label>
                    <input
                      type="text"
                      value={form.tiktok}
                      onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
                      placeholder="@yourtiktok"
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] focus:outline-none text-sm text-[#141414] transition-colors"
                    />
                  </div>
                </div>

                {/* Experience / Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                    How do you plan to curate or style PIERCYN? (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={form.promotionExperience}
                    onChange={(e) => setForm({ ...form, promotionExperience: e.target.value })}
                    placeholder="Tell us about your community, style aesthetic, or content format..."
                    className="w-full px-4 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] focus:outline-none text-sm text-[#141414] transition-colors resize-none"
                  />
                </div>

                {/* Terms agreement */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.agreedToTerms}
                      onChange={(e) => setForm({ ...form, agreedToTerms: e.target.checked })}
                      className="mt-1 w-4 h-4 accent-[#141414] cursor-pointer"
                    />
                    <span className="text-xs text-[#555555] leading-relaxed">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setIsGuidelinesOpen(true)}
                        className="text-[#141414] font-semibold underline underline-offset-2 hover:opacity-80"
                      >
                        PIERCYN Affiliate Operating Guidelines
                      </button>
                      , including the ₦1,000 per delivered order commission structure, immediate post-delivery withdrawal eligibility, and prohibition of self-referrals.
                    </span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-[#141414] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-[0.22em] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting Application...
                      </span>
                    ) : (
                      <>
                        Submit Affiliate Application <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E2DC] py-6 px-4 text-center text-xs text-[#737373]">
        <span>© {new Date().getFullYear()} PIERCYN. All rights reserved. · Lagos, Nigeria.</span>
      </footer>

      {/* Guidelines Modal */}
      <GuidelinesModal isOpen={isGuidelinesOpen} onClose={() => setIsGuidelinesOpen(false)} />
    </div>
  );
};

