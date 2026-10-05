import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { PiercynMonogram } from '../../components/PiercynLogo';
import { Lock, ArrowLeft, AlertCircle, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';

interface AdminLoginProps {
  onBackToStore?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToStore }) => {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both administrative email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid administrative credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoCredentials = () => {
    setEmail('admin@piercyn.com');
    setPassword('piercynAdmin2026');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F2F0EB] flex flex-col justify-between selection:bg-[#F2F0EB] selection:text-[#0A0A0A] font-sans relative overflow-hidden">
      {/* Subtle background ambient grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #F2F0EB 1px, transparent 1px), linear-gradient(to bottom, #F2F0EB 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Bar with Return button */}
      <header className="p-6 sm:p-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <PiercynMonogram size={30} className="text-[#F2F0EB]" />
          <span className="text-[11px] font-mono tracking-[0.25em] text-[#A3A199] uppercase">
            OPERATIONS GATEWAY
          </span>
        </div>

        {onBackToStore && (
          <button
            onClick={onBackToStore}
            className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#A3A199] hover:text-[#F2F0EB] transition-colors py-1.5 px-3 rounded border border-white/10 hover:border-white/20 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO ATELIER</span>
          </button>
        )}
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-[420px] bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#F2F0EB]">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="font-editorial italic text-3xl tracking-tight text-[#F2F0EB] mb-1">
              Control Room
            </h1>
            <p className="text-xs text-[#A3A199] font-sans">
              PIERCYN V1 Operations & Fulfillment Command
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A3A199] mb-1.5">
                Director Email
              </label>
              <input
                id="admin-email-input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@piercyn.com"
                className="w-full bg-[#0A0A0A] border border-[#2D2D2D] focus:border-[#F2F0EB] rounded-lg px-3.5 py-2.5 text-sm text-[#F2F0EB] placeholder:text-neutral-600 outline-hidden transition-colors font-sans"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A3A199]">
                  Secret Passphrase
                </label>
              </div>
              <input
                id="admin-password-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0A0A0A] border border-[#2D2D2D] focus:border-[#F2F0EB] rounded-lg px-3.5 py-2.5 text-sm text-[#F2F0EB] placeholder:text-neutral-600 outline-hidden transition-colors font-sans"
              />
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-[#F2F0EB] hover:bg-white text-[#0A0A0A] font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>ENTER CONTROL ROOM</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credential Autofill Helper for Validation */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <button
              type="button"
              onClick={handleFillDemoCredentials}
              className="text-[11px] font-mono text-[#A3A199] hover:text-[#F2F0EB] transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Fill Seeded Admin Credentials</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="p-6 text-center text-[10px] font-mono text-neutral-600 uppercase tracking-widest z-10">
        PIERCYN ATELIER LAGOS • CYCLE 1 90-DAY VALIDATION COHORT • STRICT ACCESS
      </footer>
    </div>
  );
};
