import React, { useState } from 'react';
import { AffiliateApiClient, AffiliateUser } from '../../services/affiliateApi';
import { ArrowRight, AlertCircle, Lock, Mail } from 'lucide-react';

interface AffiliateLoginPageProps {
  onNavigate: (route: 'landing' | 'register' | 'login' | 'application') => void;
  onSuccess: (user: AffiliateUser) => void;
  onBackToShop: () => void;
}

export const AffiliateLoginPage: React.FC<AffiliateLoginPageProps> = ({
  onNavigate,
  onSuccess,
  onBackToShop,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AffiliateApiClient.login({
        email: email.trim(),
        password,
      });

      if (res.success && res.data?.affiliate) {
        onSuccess(res.data.affiliate);
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while signing in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F0EB] text-[#141414] font-sans antialiased flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-[#E5E2DC] bg-[#F2F0EB]/90 backdrop-blur-md px-4 sm:px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('landing')}
              className="text-2xl font-serif font-bold uppercase tracking-widest text-[#141414] hover:opacity-80 transition-opacity"
            >
              PIERCYN
            </button>
            <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373] border-l border-[#E5E2DC] pl-4 hidden sm:inline">
              Creator Portal
            </span>
          </div>
          <button
            onClick={onBackToShop}
            className="text-xs font-semibold uppercase tracking-wider text-[#737373] hover:text-[#141414] transition-colors"
          >
            Back to Storefront
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex flex-col justify-center">
        <div className="bg-white border border-[#E5E2DC] p-8 sm:p-10 shadow-sm space-y-6">
          <div className="text-center space-y-2 border-b border-[#E5E2DC] pb-6">
            <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373]">
              PIERCYN Affiliate Program
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#141414]">
              Creator Sign In
            </h1>
            <p className="text-xs text-[#666666]">
              Access your referral performance, links, and payout balance.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-[#FDF2F2] border border-[#FCA5A5] text-[#7F1D1D] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] focus:outline-none text-sm text-[#141414] transition-colors"
                />
                <Mail className="w-4 h-4 text-[#737373] absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] focus:outline-none text-sm text-[#141414] transition-colors"
                />
                <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#141414] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-[0.22em] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <>
                    Sign In to Dashboard <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="border-t border-[#E5E2DC] pt-6 text-center space-y-3">
            <p className="text-xs text-[#737373]">
              Not an approved PIERCYN creator yet?
            </p>
            <button
              onClick={() => onNavigate('register')}
              className="w-full py-3 bg-[#FAF8F5] hover:bg-white border border-[#E5E2DC] hover:border-[#141414] text-[#141414] text-xs font-semibold uppercase tracking-widest transition-all"
            >
              Apply for Creator Membership
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E2DC] py-6 px-4 text-center text-xs text-[#737373]">
        <span>© {new Date().getFullYear()} PIERCYN. All rights reserved. · Lagos, Nigeria.</span>
      </footer>
    </div>
  );
};

