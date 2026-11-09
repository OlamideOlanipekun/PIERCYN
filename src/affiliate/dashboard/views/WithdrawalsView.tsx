import React, { useState } from 'react';
import {
  PayoutItem,
  AffiliateUser,
  AffiliateApiClient,
} from '../../../services/affiliateApi';
import { formatNGN, formatDate, formatDateTime, AffiliateDashboardTab } from '../../types';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  ArrowRight,
  ShieldCheck,
  Plus,
  X,
  RotateCcw,
} from 'lucide-react';

interface WithdrawalsViewProps {
  user: AffiliateUser;
  availableNGN: number;
  payouts: PayoutItem[];
  isWithdrawModalOpen: boolean;
  onOpenWithdrawModal: () => void;
  onCloseWithdrawModal: () => void;
  onRefreshPayouts: () => void;
  onNavigateTab: (tab: AffiliateDashboardTab) => void;
}

export const WithdrawalsView: React.FC<WithdrawalsViewProps> = ({
  user,
  availableNGN,
  payouts,
  isWithdrawModalOpen,
  onOpenWithdrawModal,
  onCloseWithdrawModal,
  onRefreshPayouts,
  onNavigateTab,
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState<number>(availableNGN > 0 ? availableNGN : 0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const hasBankAccount = Boolean(user.bankName && user.accountNumber && user.accountName);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!hasBankAccount) {
      setFormError('Please configure your verified Nigerian bank account details in Settings before withdrawing.');
      return;
    }

    if (withdrawAmount <= 0) {
      setFormError('Withdrawal amount must be greater than ₦0.');
      return;
    }

    if (withdrawAmount > availableNGN) {
      setFormError(`Withdrawal amount cannot exceed your approved available balance of ${formatNGN(availableNGN)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await AffiliateApiClient.requestPayout({
        amountNGN: withdrawAmount,
        bankName: user.bankName!,
        accountNumber: user.accountNumber!,
        accountName: user.accountName!,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setSuccessMsg(`Withdrawal of ${formatNGN(withdrawAmount)} submitted successfully. Payout reference generated.`);
        onRefreshPayouts();
        setTimeout(() => {
          onCloseWithdrawModal();
          setSuccessMsg(null);
        }, 2000);
      } else {
        setFormError(res.error || 'Failed to submit withdrawal request.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while submitting withdrawal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#141414] text-white">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </span>
        );
      case 'PROCESSING':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#FAF8F5] text-[#141414] border border-[#E5E2DC]">
            <Clock className="w-3 h-3" /> Processing
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#FAF8F5] text-[#735E29] border border-[#E5E2DC]">
            <Clock className="w-3 h-3" /> Requested
          </span>
        );
      case 'REJECTED':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#FDF2F2] text-[#7F1D1D] border border-[#FCA5A5]">
            <RotateCcw className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#F2F0EB] text-[#737373]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373]">
            Disbursement Desk
          </span>
          <h2 className="text-2xl font-serif font-medium text-[#141414]">
            Withdrawals & Payouts
          </h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Request disbursements to your verified Nigerian bank account. Disbursed within 24–48 hours.
          </p>
        </div>

        <button
          onClick={onOpenWithdrawModal}
          disabled={availableNGN <= 0}
          className="px-6 py-3 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer self-start md:self-auto"
        >
          <Wallet className="w-4 h-4" />
          <span>Request Withdrawal</span>
        </button>
      </div>

      {/* Balance & Destination Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Card */}
        <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4">
            <span className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">
              Available For Withdrawal
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#141414] font-bold bg-[#F2F0EB] px-2 py-0.5">
              ₦0 Minimum
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-serif font-bold text-[#141414]">
            {formatNGN(availableNGN)}
          </div>
          <p className="text-xs text-[#555555] leading-relaxed">
            Commissions from qualifying delivered orders that have cleared their 14-day validation window.
          </p>
        </div>

        {/* Bank Account Destination Card */}
        <div className="bg-[#FAF8F5] border border-[#E5E2DC] p-6 sm:p-8 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4">
              <span className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">
                Saved Payout Destination
              </span>
              <button
                onClick={() => onNavigateTab('settings')}
                className="text-xs uppercase tracking-wider font-semibold text-[#141414] underline hover:opacity-80"
              >
                {hasBankAccount ? 'Edit Account' : 'Add Bank Account'}
              </button>
            </div>

            {hasBankAccount ? (
              <div className="pt-3 space-y-1">
                <div className="text-base font-serif font-medium text-[#141414]">
                  {user.bankName}
                </div>
                <div className="text-xs font-mono text-[#555555]">
                  Account: •••• {user.accountNumber?.slice(-4) || '••••'}
                </div>
                <div className="text-xs text-[#737373]">
                  Beneficiary: {user.accountName}
                </div>
              </div>
            ) : (
              <div className="pt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#7F1D1D]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No payout bank account configured yet.</span>
                </div>
                <p className="text-xs text-[#737373]">
                  Please add your Nigerian bank account to enable direct payouts.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 text-[11px] text-[#737373] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#141414]" />
            <span>NIP Direct Interbank Settlement · 24 to 48 business hours</span>
          </div>
        </div>
      </div>

      {/* Withdrawal History Table */}
      <div className="bg-white border border-[#E5E2DC] shadow-sm">
        <div className="p-5 border-b border-[#E5E2DC]">
          <h3 className="text-base font-serif font-medium text-[#141414]">
            Disbursement History ({payouts.length})
          </h3>
          <p className="text-xs text-[#737373]">
            Complete record of your past withdrawal requests and bank settlement statuses.
          </p>
        </div>

        {payouts.length === 0 ? (
          <div className="p-16 text-center space-y-2 text-[#737373] text-xs">
            <Wallet className="w-8 h-8 text-[#A3A3A3] mx-auto mb-2" />
            <h4 className="font-serif text-base text-[#141414]">No Withdrawals Yet</h4>
            <p>Your withdrawal requests will appear here once submitted.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E5E2DC] text-[10px] uppercase tracking-wider font-semibold text-[#737373]">
                <tr>
                  <th className="px-6 py-3.5">Reference</th>
                  <th className="px-6 py-3.5">Requested Date</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Destination Bank</th>
                  <th className="px-6 py-3.5">Processed Date</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DC] text-[#333333]">
                {payouts.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-[#141414]">
                      {item.payoutReference || item.id.slice(0, 10).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-[#737373]">
                      {formatDate(item.requestedAt)}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#141414]">
                      {formatNGN(item.amountNGN || item.amountKobo / 100)}
                    </td>
                    <td className="px-6 py-4 text-[#555555]">
                      <div>{item.bankName}</div>
                      <div className="text-[10px] text-[#737373] font-mono">
                        •••• {item.accountNumber?.slice(-4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#737373]">
                      {item.processedAt ? formatDate(item.processedAt) : 'Pending'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Request Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up">
          <div className="w-full max-w-md bg-white border border-[#E5E2DC] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC] bg-[#F2F0EB]">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-[#737373]">
                  Wallet Payout
                </span>
                <h3 className="font-serif text-lg font-medium text-[#141414]">
                  Request Withdrawal
                </h3>
              </div>
              <button
                onClick={onCloseWithdrawModal}
                className="p-1 text-[#737373] hover:text-[#141414]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-[#FDF2F2] border border-[#FCA5A5] text-[#7F1D1D] text-xs">
                  {formError}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-[#FAF8F5] border border-[#141414] text-[#141414] text-xs font-semibold">
                  {successMsg}
                </div>
              )}

              <div className="bg-[#FAF8F5] p-4 border border-[#E5E2DC] space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">
                  Available to Withdraw
                </span>
                <div className="text-2xl font-serif font-bold text-[#141414]">
                  {formatNGN(availableNGN)}
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                  Withdrawal Amount (₦) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={availableNGN}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] text-sm font-semibold text-[#141414] focus:outline-none"
                />

                {/* Quick Chips */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(availableNGN)}
                    className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-white border border-[#E5E2DC] hover:border-[#141414]"
                  >
                    Full Balance
                  </button>
                  {availableNGN >= 5000 && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(5000)}
                      className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-white border border-[#E5E2DC] hover:border-[#141414]"
                    >
                      ₦5,000
                    </button>
                  )}
                  {availableNGN >= 10000 && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(10000)}
                      className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-white border border-[#E5E2DC] hover:border-[#141414]"
                    >
                      ₦10,000
                    </button>
                  )}
                  {availableNGN >= 20000 && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(20000)}
                      className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-white border border-[#E5E2DC] hover:border-[#141414]"
                    >
                      ₦20,000
                    </button>
                  )}
                </div>
              </div>

              {/* Destination preview */}
              <div className="space-y-1.5 border-t border-[#E5E2DC] pt-4">
                <span className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">
                  Destination Bank Account
                </span>
                {hasBankAccount ? (
                  <div className="p-3 bg-[#FAF8F5] border border-[#E5E2DC] text-xs space-y-0.5">
                    <div className="font-semibold text-[#141414]">{user.bankName}</div>
                    <div className="text-[#555555] font-mono">
                      Account: •••• {user.accountNumber?.slice(-4)}
                    </div>
                    <div className="text-[11px] text-[#737373]">
                      Beneficiary: {user.accountName}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#FDF2F2] border border-[#FCA5A5] text-xs text-[#7F1D1D]">
                    No bank account configured. Please update your account in Settings first.
                  </div>
                )}
              </div>

              {/* Optional note */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                  Payout Reference Note (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. October Creator Earnings"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] text-xs text-[#141414] focus:outline-none"
                />
              </div>

              {/* Submit actions */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onCloseWithdrawModal}
                  className="px-4 py-2 border border-[#E5E2DC] text-xs uppercase tracking-wider font-semibold text-[#737373] hover:text-[#141414]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !hasBankAccount || availableNGN <= 0}
                  className="px-5 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-wider font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

