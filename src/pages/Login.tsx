import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { ShieldCheck, Sparkles, Package, ArrowLeft, AlertCircle } from 'lucide-react';

interface LoginProps {
  onBackToShop?: () => void;
  onSuccessRedirect?: (path: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onBackToShop, onSuccessRedirect }) => {
  const { isAuthenticated } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check URL query parameters for redirects or errors
  const searchParams = new URLSearchParams(window.location.search);
  const nextParam = searchParams.get('next') || '/account';
  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (errorParam === 'auth_failed') {
      setErrorMessage('Google authentication could not be completed. Please try again.');
    }
  }, [errorParam]);

  useEffect(() => {
    if (isAuthenticated) {
      if (onSuccessRedirect) {
        onSuccessRedirect(nextParam);
      } else {
        window.history.pushState({}, '', nextParam);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }, [isAuthenticated, nextParam, onSuccessRedirect]);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F2F0EB] flex flex-col justify-center items-center px-4 sm:px-6 py-20 relative selection:bg-[#F2F0EB] selection:text-[#0A0A0A]">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/5 via-neutral-500/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Navigation Return */}
      <div className="w-full max-w-md mb-8">
        <button
          type="button"
          onClick={() => {
            if (onBackToShop) {
              onBackToShop();
            } else {
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
          className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#888888] hover:text-[#F2F0EB] transition-colors uppercase cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Store</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#121212] border border-[#262626] p-8 sm:p-10 relative shadow-2xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#A8A59D] block mb-2">
            CLIENT PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-white mb-3">
            PIERCYN ATELIER
          </h1>
          <p className="text-xs text-[#8E8B82] leading-relaxed">
            Sign in with your verified Google account to track orders, manage addresses, and access VIP drops.
          </p>
        </div>

        {/* Error message notification */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-950/40 border border-red-800/60 rounded flex items-start gap-2.5 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Google Auth Action */}
        <div className="space-y-4">
          <GoogleSignInButton
            redirectTo={nextParam}
            label="Sign in with Google"
            onError={(err) => setErrorMessage(err.message || 'Authentication failed. Please retry.')}
          />
        </div>

        {/* Security & Experience Pillars */}
        <div className="mt-8 pt-8 border-t border-[#222222] space-y-3.5">
          <div className="flex items-center gap-3 text-left">
            <ShieldCheck className="w-4 h-4 text-[#A8A59D] flex-shrink-0" />
            <span className="text-[11px] text-[#A8A59D] font-sans">
              Encrypted, passwordless identity powered by Supabase Auth
            </span>
          </div>

          <div className="flex items-center gap-3 text-left">
            <Package className="w-4 h-4 text-[#A8A59D] flex-shrink-0" />
            <span className="text-[11px] text-[#A8A59D] font-sans">
              Instant sync with past guest purchases made with your email
            </span>
          </div>

          <div className="flex items-center gap-3 text-left">
            <Sparkles className="w-4 h-4 text-[#A8A59D] flex-shrink-0" />
            <span className="text-[11px] text-[#A8A59D] font-sans">
              Fast 1-click checkout with stored shipping addresses
            </span>
          </div>
        </div>

        {/* Footer Policy Note */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-[#555555] font-mono leading-relaxed">
            By signing in, you agree to PIERCYN’s{' '}
            <a href="/terms" className="underline hover:text-[#888888] transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-[#888888] transition-colors">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
};
export default Login;
