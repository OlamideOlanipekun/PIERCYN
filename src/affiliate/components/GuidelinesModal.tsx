import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Scale, Clock, CreditCard } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-none border border-[#E5E2DC] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E2DC] bg-[#F2F0EB]">
          <div>
            <span className="text-[10px] tracking-[0.24em] font-semibold uppercase text-[#737373]">
              PIERCYN Creator Network
            </span>
            <h2 className="text-xl sm:text-2xl font-serif tracking-tight text-[#141414] mt-0.5">
              Affiliate Operating Guidelines & Terms
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#737373] hover:text-[#141414] hover:bg-[#E5E2DC]/50 rounded-none transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 text-sm text-[#333333] leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#141414] font-medium">
              <Scale className="w-4 h-4 text-[#141414]" />
              <h3 className="uppercase text-xs tracking-widest font-bold">1. Program Overview & Commission Structure</h3>
            </div>
            <p>
              The PIERCYN Affiliate Program empowers selected creators, curators, and community leaders to earn commission
              by sharing PIERCYN collections with their audience.
            </p>
            <div className="bg-[#F2F0EB] p-4 border border-[#E5E2DC] space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#141414] shrink-0 mt-0.5" />
                <span>
                  <strong>₦800 Flat Commission</strong> per qualifying delivered referral order.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#141414] shrink-0 mt-0.5" />
                <span>
                  <strong>30-Day Attribution Window:</strong> Orders placed within 30 days of the last click are attributed to your account.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#141414] shrink-0 mt-0.5" />
                <span>
                  <strong>No Minimum Payout:</strong> Request withdrawal as soon as any commission is cleared and available.
                </span>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#141414] font-medium">
              <Clock className="w-4 h-4 text-[#141414]" />
              <h3 className="uppercase text-xs tracking-widest font-bold">2. Delivery Validation & Return Window</h3>
            </div>
            <p>
              To protect the brand and ensure fair payouts, commissions enter a <strong>14-day clearance hold</strong> following successful order delivery.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#555555]">
              <li>If an order is returned, cancelled before fulfillment, or flagged for fraudulent activity, commission is reversed.</li>
              <li>Once the 14-day validation window elapses without return, the commission status automatically changes to <strong>AVAILABLE</strong> in your wallet.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#141414] font-medium">
              <CreditCard className="w-4 h-4 text-[#141414]" />
              <h3 className="uppercase text-xs tracking-widest font-bold">3. Payout Processing</h3>
            </div>
            <p>
              Approved available balances can be withdrawn at any time directly into your registered Nigerian bank account.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#555555]">
              <li>Payouts are processed via direct NIP bank transfer within 24 to 48 business hours.</li>
              <li>Bank account details must match the legal name on your affiliate profile. Third-party account transfers may be rejected for security compliance.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#141414] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#141414]" />
              <h3 className="uppercase text-xs tracking-widest font-bold">4. Ethical Promotion Standards</h3>
            </div>
            <p>
              As a representative of PIERCYN’s visual and cultural identity, affiliates are held to high editorial and ethical standards:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#555555]">
              <li>Clearly disclose your affiliate relationship (e.g., using #PIERCYNpartner, #ad, or #affiliate).</li>
              <li>Only use official assets provided in the Media Library or self-produced styling content that honors brand standards.</li>
              <li>Do not make misleading claims regarding product fabrics, delivery guarantees, or inventory availability.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#7F1D1D] font-medium">
              <AlertTriangle className="w-4 h-4 text-[#7F1D1D]" />
              <h3 className="uppercase text-xs tracking-widest font-bold text-[#7F1D1D]">5. Strictly Prohibited Practices</h3>
            </div>
            <div className="bg-[#FDF2F2] p-4 border border-[#FCA5A5] text-[#7F1D1D] space-y-2 text-xs">
              <p>Violating any of the following will result in immediate account termination and forfeiture of unpaid commissions:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Self-referrals (using your own affiliate link to purchase personal orders).</li>
                <li>Bidding on PIERCYN brand search terms (e.g. Google Ads for "PIERCYN", "piercyn clothing").</li>
                <li>Posting links on coupon aggregator websites or spamming comment sections.</li>
                <li>Impersonating official PIERCYN social media handles or running misleading discount promotions.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E2DC] bg-[#FAF8F5] flex justify-between items-center">
          <span className="text-xs text-[#737373]">Last updated: March 2026</span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-widest font-semibold transition-colors"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};

