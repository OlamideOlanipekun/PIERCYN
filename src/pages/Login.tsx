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
    if (errorParam) {
      if (errorParam === 'auth_failed') {
        setErrorMessage('Google authentication could not be completed. Please try again.');
      } else if (errorParam === 'auth_timeout') {
        setErrorMessage('Authentication timed out. Please try signing in again.');
      } else {
        setErrorMessage(decodeURIComponent(errorParam));
      }
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
    <main className="relative flex min-h-screen min-h-[100svh] flex-col items-center justify-center overflow-x-hidden bg-[#0A0A0A] px-4 py-8 text-[#F2F0EB] selection:bg-[#F2F0EB] selection:text-[#0A0A0A] sm:px-6 sm:py-12">
      {/* Background ambient gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/4 h-[min(100vw,500px)] w-[min(100vw,500px)] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-amber-500/5 via-neutral-500/5 to-transparent blur-[min(24vw,120px)]"
      />

      {/* Navigation Return */}
      <div className="relative mb-5 w-full max-w-md sm:mb-8">
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
          className="inline-flex min-h-11 items-center gap-2 py-2 pr-3 text-xs font-mono tracking-widest text-[#888888] uppercase transition-colors hover:text-[#F2F0EB] cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Store</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="relative w-full min-w-0 max-w-md border border-[#262626] bg-[#121212] p-5 shadow-2xl [overflow-wrap:anywhere] min-[360px]:p-6 sm:p-10">
        {/* Brand Header */}
        <div className="mb-6 text-center sm:mb-8">
          <span className="mb-2 block text-[10px] font-mono uppercase tracking-[0.22em] text-[#A8A59D] min-[360px]:tracking-[0.3em]">
            CLIENT PORTAL
          </span>
          <h1 className="mb-3 break-words font-sans text-2xl font-extrabold tracking-tight text-white min-[360px]:text-[1.7rem] sm:text-3xl">
            PIERCYN ATELIER
          </h1>
          <p className="mx-auto max-w-[34rem] text-xs leading-relaxed text-[#8E8B82] sm:text-[13px]">
            Sign in with your verified Google account to track orders, manage addresses, and access VIP drops.
          </p>
        </div>

        {/* Error message notification */}
        {errorMessage && (
          <div role="alert" className="mb-5 flex min-w-0 items-start gap-2.5 rounded border border-red-800/60 bg-red-950/40 p-3.5 text-xs text-red-300 sm:mb-6">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{errorMessage}</span>
          </div>
        )}

        {/* Primary Google Auth Action */}
        <div className="min-w-0 space-y-4">
          <GoogleSignInButton
            redirectTo={nextParam}
            label="Sign in with Google"
            onError={(err) => setErrorMessage(err.message || 'Authentication failed. Please retry.')}
          />
        </div>

        {/* Security & Experience Pillars */}
        <div className="mt-6 space-y-3.5 border-t border-[#222222] pt-6 min-[360px]:mt-8 min-[360px]:pt-8">
          <div className="flex min-w-0 items-start gap-3 text-left sm:items-center">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#A8A59D] sm:mt-0" />
            <span className="min-w-0 font-sans text-[11px] leading-relaxed text-[#A8A59D]">
              Encrypted, passwordless identity powered by Supabase Auth
            </span>
          </div>

          <div className="flex min-w-0 items-start gap-3 text-left sm:items-center">
            <Package className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#A8A59D] sm:mt-0" />
            <span className="min-w-0 font-sans text-[11px] leading-relaxed text-[#A8A59D]">
              Instant sync with past guest purchases made with your email
            </span>
          </div>

          <div className="flex min-w-0 items-start gap-3 text-left sm:items-center">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#A8A59D] sm:mt-0" />
            <span className="min-w-0 font-sans text-[11px] leading-relaxed text-[#A8A59D]">
              Fast 1-click checkout with stored shipping addresses
            </span>
          </div>
        </div>

        {/* Footer Policy Note */}
        <div className="mt-6 text-center min-[360px]:mt-8">
          <p className="font-mono text-[10px] leading-relaxed text-[#77736B]">
            By signing in, you agree to PIERCYN’s{' '}
            <a href="/terms" className="underline transition-colors hover:text-[#888888]">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline transition-colors hover:text-[#888888]">
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
