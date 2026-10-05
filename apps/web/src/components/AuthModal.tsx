import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { X, User, Mail, Lock, LogOut, Package, Heart, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthOpen, setIsAuthOpen, user, login, register, logout, setIsWishlistOpen, setIsConciergeOpen, showToast } = useShop();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthOpen) return null;

  const handleClose = () => {
    setIsAuthOpen(false);
    setErrorMessage(null);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !email.includes('@')) {
      showToast('Please provide a valid email address.');
      return;
    }
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);
    if (res.success) {
      handleClose();
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !email.includes('@')) {
      showToast('Please provide a valid email address.');
      return;
    }
    if (!firstName || !lastName) {
      showToast('Please enter your first and last name.');
      return;
    }
    setIsSubmitting(true);
    const res = await register({
      email,
      password,
      firstName,
      lastName,
    });
    setIsSubmitting(false);
    if (res.success) {
      handleClose();
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={handleClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 lg:p-10">
        <div className="relative w-full max-w-xl bg-[#F2F0EB] text-[#141414] shadow-2xl border border-[#E3DEC3] rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-[#E3DEC3] flex items-center justify-between bg-[#EBE7DF]">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-[#7A7771] flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-[#A48B71]" />
                PIERCYN ATELIER PORTAL
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl uppercase tracking-tight text-[#141414]">
                {user ? 'CLIENT ACCOUNT' : mode === 'signin' ? 'CLIENT SIGN IN' : 'CREATE ACCOUNT'}
              </h2>
            </div>

            <button
              onClick={handleClose}
              className="min-w-[44px] min-h-[44px] rounded-full border border-[#141414]/20 hover:bg-[#141414]/10 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Close Portal"
            >
              <X className="w-5 h-5 text-[#141414]" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6 font-sans">
            
            {/* LOGGED IN CLIENT PROFILE VIEW */}
            {user ? (
              <div className="space-y-6">
                
                {/* Welcome Card */}
                <div className="p-5 bg-[#E8E6E1] rounded-xl border border-[#DAD8D1] space-y-2">
                  <span className="text-[10px] font-mono tracking-[0.25em] text-[#7A7771] uppercase block">
                    REGISTERED CLIENT PROFILE
                  </span>
                  <h3 className="font-editorial text-2xl uppercase tracking-[-0.02em] text-[#141414]">
                    WELCOME BACK, {user.firstName} {user.lastName}.
                  </h3>
                  <p className="text-[13px] text-[#4A4844] font-medium">
                    {user.email} • {user.city}
                  </p>
                </div>

                {/* Orders Overview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] text-[#7A7771] border-b border-[#E3DEC3] pb-2">
                    <span>ATELIER DISPATCHES ({user.ordersCount || 1})</span>
                    <span>STATUS</span>
                  </div>

                  <div className="p-4 bg-white/70 rounded-xl border border-[#E3DEC3] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#141414] text-[#F2F0EB] flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold uppercase tracking-[0.05em]">
                          ORDER #PY-2026-8841
                        </h4>
                        <p className="text-[11px] text-[#6E6B65]">
                          PIERCYN SIGNATURE 450GSM HOODIE (L)
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      DELIVERED
                    </span>
                  </div>
                </div>

                {/* Quick Client Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      handleClose();
                      setIsWishlistOpen(true);
                    }}
                    className="h-11 min-h-[44px] px-4 rounded-xl border border-[#141414] text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#141414] hover:text-[#F2F0EB] transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>SAVED ARCHIVE</span>
                  </button>

                  <button
                    onClick={() => {
                      handleClose();
                      setIsConciergeOpen(true);
                    }}
                    className="h-11 min-h-[44px] px-4 rounded-xl border border-[#141414] text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#141414] hover:text-[#F2F0EB] transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>BOOK FITTING</span>
                  </button>
                </div>

                {/* Logout Button */}
                <div className="pt-4 border-t border-[#E3DEC3]">
                  <button
                    onClick={() => {
                      logout();
                    }}
                    className="w-full h-12 min-h-[48px] rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>SIGN OUT</span>
                  </button>
                </div>

              </div>
            ) : mode === 'signin' ? (
              /* SIGN IN FORM */
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                
                <p className="text-[13px] text-[#4A4844] leading-relaxed">
                  Sign in to access your saved pieces, private atelier dispatches, and priority access to limited drops.
                </p>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7771] block mb-1">
                      EMAIL ADDRESS *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7771]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="client@piercyn.com"
                        required
                        className="w-full h-12 min-h-[48px] pl-10 pr-4 bg-white/80 border border-[#DAD8D1] rounded-xl text-[13px] font-sans text-[#141414] focus:outline-none focus:border-[#141414]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7771]">
                        PASSWORD *
                      </label>
                      <button
                        type="button"
                        onClick={() => showToast('Demo password is "piercyn2026" or use your registered password.')}
                        className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#7A7771] hover:text-[#141414] underline"
                      >
                        FORGOT PASSWORD?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7771]" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full h-12 min-h-[48px] pl-10 pr-4 bg-white/80 border border-[#DAD8D1] rounded-xl text-[13px] font-sans text-[#141414] focus:outline-none focus:border-[#141414]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 min-h-[48px] rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'AUTHENTICATING...' : 'SIGN IN'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-4 text-center border-t border-[#E3DEC3]">
                  <p className="text-[12px] text-[#6E6B65]">
                    Don't have a PIERCYN account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMessage(null);
                      }}
                      className="font-bold text-[#141414] underline uppercase tracking-[0.1em] cursor-pointer ml-1"
                    >
                      REGISTER HERE
                    </button>
                  </p>
                </div>

              </form>
            ) : (
              /* CREATE ACCOUNT FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                <p className="text-[13px] text-[#4A4844] leading-relaxed">
                  Join the PIERCYN Atelier inner circle. Unlock bespoke fittings, express global dispatch, and private drop invitations.
                </p>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7771] block mb-1">
                      FIRST NAME *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      required
                      className="w-full h-12 min-h-[48px] px-3.5 bg-white/80 border border-[#DAD8D1] rounded-xl text-[13px] font-sans text-[#141414] focus:outline-none focus:border-[#141414]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7771] block mb-1">
                      LAST NAME *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      required
                      className="w-full h-12 min-h-[48px] px-3.5 bg-white/80 border border-[#DAD8D1] rounded-xl text-[13px] font-sans text-[#141414] focus:outline-none focus:border-[#141414]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7771] block mb-1">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@piercyn.com"
                    required
                    className="w-full h-12 min-h-[48px] px-3.5 bg-white/80 border border-[#DAD8D1] rounded-xl text-[13px] font-sans text-[#141414] focus:outline-none focus:border-[#141414]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7771] block mb-1">
                    CREATE PASSWORD *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    required
                    className="w-full h-12 min-h-[48px] px-3.5 bg-white/80 border border-[#DAD8D1] rounded-xl text-[13px] font-sans text-[#141414] focus:outline-none focus:border-[#141414]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 min-h-[48px] rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-4 text-center border-t border-[#E3DEC3]">
                  <p className="text-[12px] text-[#6E6B65]">
                    Already registered with PIERCYN?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setErrorMessage(null);
                      }}
                      className="font-bold text-[#141414] underline uppercase tracking-[0.1em] cursor-pointer ml-1"
                    >
                      SIGN IN HERE
                    </button>
                  </p>
                </div>

              </form>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
