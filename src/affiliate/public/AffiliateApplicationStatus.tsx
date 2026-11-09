import React, { useState } from 'react';
import { AffiliateApiClient, AffiliateUser } from '../../services/affiliateApi';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Mail,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '../types';
import { GuidelinesModal } from '../components/GuidelinesModal';
import { SupportModal } from '../components/SupportModal';

interface AffiliateApplicationStatusProps {
  user: AffiliateUser;
  onRefreshUser: (updatedUser: AffiliateUser) => void;
  onGoToDashboard: () => void;
  onLogout: () => void;
  onBackToShop: () => void;
}

export const AffiliateApplicationStatus: React.FC<AffiliateApplicationStatusProps> = ({
  user,
  onRefreshUser,
  onGoToDashboard,
  onLogout,
  onBackToShop,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setMessage(null);
    try {
      const res = await AffiliateApiClient.getMe();
      if (res.success && res.data) {
        onRefreshUser(res.data);
        if (res.data.status === 'ACTIVE') {
          onGoToDashboard();
        } else {
          setMessage('Status refreshed: Your application is currently still under review.');
        }
      } else {
        setMessage('Could not refresh status at this time. Please try again later.');
      }
    } catch {
      setMessage('Network error communicating with the server.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F0EB] text-[#141414] font-sans antialiased flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-[#E5E2DC] bg-[#F2F0EB]/90 backdrop-blur-md px-4 sm:px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToShop}
              className="text-2xl font-serif font-bold uppercase tracking-widest text-[#141414] hover:opacity-80 transition-opacity"
            >
              PIERCYN
            </button>
            <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373] border-l border-[#E5E2DC] pl-4 hidden sm:inline">
              Application Tracker
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#737373] hover:text-[#141414] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="bg-white border border-[#E5E2DC] p-8 sm:p-10 shadow-sm space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-5">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373]">
                Application Status
              </span>
              <h1 className="text-2xl font-serif font-medium text-[#141414]">
                {user.status === 'ACTIVE'
                  ? 'Application Approved'
                  : user.status === 'REJECTED'
                  ? 'Application Not Approved'
                  : user.status === 'SUSPENDED'
                  ? 'Account Suspended'
                  : 'Application Under Review'}
              </h1>
            </div>

            <div className="shrink-0">
              {user.status === 'ACTIVE' ? (
                <span className="px-3 py-1 bg-[#141414] text-white text-xs uppercase tracking-widest font-semibold">
                  Approved
                </span>
              ) : user.status === 'REJECTED' ? (
                <span className="px-3 py-1 bg-[#FDF2F2] border border-[#FCA5A5] text-[#7F1D1D] text-xs uppercase tracking-widest font-semibold">
                  Declined
                </span>
              ) : user.status === 'SUSPENDED' ? (
                <span className="px-3 py-1 bg-[#FDF2F2] border border-[#FCA5A5] text-[#7F1D1D] text-xs uppercase tracking-widest font-semibold">
                  Suspended
                </span>
              ) : (
                <span className="px-3 py-1 bg-[#FAF8F5] border border-[#E5E2DC] text-[#735E29] text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#735E29]" /> Pending
                </span>
              )}
            </div>
          </div>

          {/* Feedback message */}
          {message && (
            <div className="p-3 bg-[#FAF8F5] border border-[#E5E2DC] text-xs text-[#555555]">
              {message}
            </div>
          )}

          {/* Body based on status */}
          {user.status === 'ACTIVE' ? (
            <div className="space-y-6 text-sm">
              <p className="text-[#555555]">
                Congratulations, <strong>{user.firstName}</strong>. Your affiliate application has been approved by the
                PIERCYN editorial team. Your creator dashboard and custom referral tracking code are ready.
              </p>
              <button
                onClick={onGoToDashboard}
                className="w-full py-4 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-[0.22em] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                Enter Creator Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : user.status === 'REJECTED' ? (
            <div className="space-y-4 text-sm text-[#555555]">
              <p>
                Thank you for your interest in partnering with PIERCYN. At this time, our editorial team was unable to
                approve your creator application due to limited slots in this review cycle.
              </p>
              <p className="text-xs text-[#737373]">
                You are welcome to re-apply after 30 days as our creator roster expands. If you believe this was an error,
                please contact our creator relations desk.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsSupportOpen(true)}
                  className="px-5 py-2.5 border border-[#141414] text-[#141414] hover:bg-[#FAF8F5] text-xs uppercase tracking-widest font-semibold transition-colors"
                >
                  Contact Creator Support
                </button>
              </div>
            </div>
          ) : user.status === 'SUSPENDED' ? (
            <div className="space-y-4 text-sm text-[#555555]">
              <p>
                Your PIERCYN affiliate account has been temporarily suspended due to a compliance or policy review.
              </p>
              <p className="text-xs text-[#737373]">
                Please contact creator support to verify your account details or resolve any outstanding questions.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsSupportOpen(true)}
                  className="px-5 py-2.5 border border-[#141414] text-[#141414] hover:bg-[#FAF8F5] text-xs uppercase tracking-widest font-semibold transition-colors"
                >
                  Contact Creator Relations
                </button>
              </div>
            </div>
          ) : (
            /* PENDING STATUS */
            <div className="space-y-6">
              <div className="bg-[#FAF8F5] p-5 border border-[#E5E2DC] space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#141414]">
                  <Clock className="w-4 h-4 text-[#141414]" />
                  <span>Review Timeline: 24 to 48 Hours</span>
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  Our team manually curates each partner to maintain high editorial and aesthetic standards. We will
                  send you an email notification as soon as your account is activated.
                </p>
              </div>

              {/* Submitted Details Snapshot */}
              <div className="border border-[#E5E2DC] p-5 space-y-3">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#737373] block">
                  Submitted Profile Summary
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#737373] block">Full Name:</span>
                    <span className="font-semibold text-[#141414]">{user.firstName} {user.lastName}</span>
                  </div>
                  <div>
                    <span className="text-[#737373] block">Account Email:</span>
                    <span className="font-semibold text-[#141414] truncate">{user.email}</span>
                  </div>
                  {user.instagram && (
                    <div>
                      <span className="text-[#737373] block">Instagram:</span>
                      <span className="font-semibold text-[#141414]">{user.instagram}</span>
                    </div>
                  )}
                  {user.audienceSize && (
                    <div>
                      <span className="text-[#737373] block">Audience Size:</span>
                      <span className="font-semibold text-[#141414]">{user.audienceSize}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[#737373] block">Submitted Date:</span>
                    <span className="font-semibold text-[#141414]">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="space-y-2 text-xs text-[#555555]">
                <span className="font-semibold text-[#141414] uppercase tracking-wider block">
                  What happens once approved?
                </span>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your custom affiliate link and unique tracking code are activated instantly.</li>
                  <li>You earn ₦800 flat commission per qualifying delivered referral order.</li>
                  <li>Access to high-res lookbooks, video assets, and pre-written editorial captions.</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-full sm:w-auto px-6 py-3 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Check Status
                </button>
                <button
                  onClick={() => setIsGuidelinesOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-[#FAF8F5] border border-[#E5E2DC] text-[#141414] text-xs uppercase tracking-widest font-semibold transition-all"
                >
                  Review Operating Guidelines
                </button>
                <button
                  onClick={() => setIsSupportOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 text-xs uppercase tracking-widest font-semibold text-[#737373] hover:text-[#141414] transition-colors"
                >
                  Need Help?
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E2DC] py-6 px-4 text-center text-xs text-[#737373]">
        <span>© {new Date().getFullYear()} PIERCYN. All rights reserved. · Lagos, Nigeria.</span>
      </footer>

      {/* Modals */}
      <GuidelinesModal isOpen={isGuidelinesOpen} onClose={() => setIsGuidelinesOpen(false)} />
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        affiliateEmail={user.email}
      />
    </div>
  );
};

