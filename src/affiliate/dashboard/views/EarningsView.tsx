import React, { useState, useEffect } from 'react';
import {
  WalletSummary,
  LedgerItem,
  CommissionItem,
  AffiliateApiClient,
} from '../../../services/affiliateApi';
import { formatNGN, formatDate, formatDateTime } from '../../types';
import {
  Activity,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Filter,
  Receipt,
  RotateCcw,
} from 'lucide-react';

interface EarningsViewProps {
  wallet: WalletSummary | null;
  ledger: LedgerItem[];
  commissions: CommissionItem[];
  onOpenWithdrawModal: () => void;
}

export const EarningsView: React.FC<EarningsViewProps> = ({
  wallet,
  ledger,
  commissions,
  onOpenWithdrawModal,
}) => {
  const [filterType, setFilterType] = useState('ALL');

  const summary = wallet || {
    totalEarnedNGN: 0,
    availableNGN: 0,
    pendingNGN: 0,
    reservedNGN: 0,
    paidNGN: 0,
    reversedNGN: 0,
    totalEarnedKobo: 0,
    availableKobo: 0,
    pendingKobo: 0,
    reservedKobo: 0,
    paidKobo: 0,
    reversedKobo: 0,
  };

  // Filter ledger entries
  const filteredLedger = ledger.filter((entry) => {
    if (filterType === 'ALL') return true;
    return entry.type.toLowerCase().includes(filterType.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373]">
            Financial Statement
          </span>
          <h2 className="text-2xl font-serif font-medium text-[#141414]">
            Earnings & Wallet Ledger
          </h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Verified double-entry ledger of all referral earnings, clearance events, and disbursements.
          </p>
        </div>

        <button
          onClick={onOpenWithdrawModal}
          disabled={summary.availableNGN <= 0}
          className="px-6 py-3 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer self-start md:self-auto"
        >
          <Wallet className="w-4 h-4" />
          <span>Request Payout</span>
        </button>
      </div>

      {/* KPI Cards in PIERCYN Brand Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Available Balance */}
        <div className="bg-[#FAF8F5] border border-[#141414] p-5 sm:p-6 space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#141414]">
            Available for Payout
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#141414]">
            {formatNGN(summary.availableNGN)}
          </div>
          <div className="text-[11px] text-[#737373]">No minimum balance required</div>
        </div>

        {/* Pending Commission */}
        <div className="bg-white border border-[#E5E2DC] p-5 sm:p-6 space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#737373]">
            Pending Commission
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#141414]">
            {formatNGN(summary.pendingNGN)}
          </div>
          <div className="text-[11px] text-[#737373]">Awaiting delivery verification</div>
        </div>

        {/* Total Earned */}
        <div className="bg-white border border-[#E5E2DC] p-5 sm:p-6 space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#737373]">
            Total Earned (All Time)
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#141414]">
            {formatNGN(summary.totalEarnedNGN)}
          </div>
          <div className="text-[11px] text-[#737373]">Gross approved commissions</div>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-white border border-[#E5E2DC] p-5 sm:p-6 space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#737373]">
            Total Disbursed
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#141414]">
            {formatNGN(summary.paidNGN)}
          </div>
          <div className="text-[11px] text-[#737373]">Transferred to Nigerian bank</div>
        </div>
      </div>

      {/* Accounting Ledger Table */}
      <div className="bg-white border border-[#E5E2DC] shadow-sm">
        <div className="p-5 border-b border-[#E5E2DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-serif font-medium text-[#141414]">
              Wallet Activity & Ledger Entries
            </h3>
            <p className="text-xs text-[#737373]">
              Every wallet credit and debit is logged with an immutable audit reference.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Transactions' },
              { id: 'COMMISSION', label: 'Commissions' },
              { id: 'PAYOUT', label: 'Payouts' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  filterType === f.id
                    ? 'bg-[#141414] text-white'
                    : 'bg-[#FAF8F5] border border-[#E5E2DC] text-[#555555] hover:border-[#141414]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="p-16 text-center space-y-2 text-[#737373] text-xs">
            <Activity className="w-8 h-8 text-[#A3A3A3] mx-auto mb-2" />
            <h4 className="font-serif text-base text-[#141414]">No Transactions Yet</h4>
            <p>Once orders are cleared or payouts requested, transactions will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E5E2DC] text-[10px] uppercase tracking-wider font-semibold text-[#737373]">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Type / Description</th>
                  <th className="px-6 py-3.5">Reference ID</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DC] text-[#333333]">
                {filteredLedger.map((item) => {
                  const isCredit = item.amountKobo > 0;
                  return (
                    <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="px-6 py-4 text-[#737373]">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#141414] uppercase text-[11px]">
                          {item.type.replace(/_/g, ' ')}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-[#737373] truncate max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-[#555555]">
                        {item.referenceId || item.id.slice(0, 12)}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold text-xs ${
                          isCredit ? 'text-[#141414]' : 'text-[#7F1D1D]'
                        }`}
                      >
                        {isCredit ? '+' : ''}
                        {formatNGN(item.amountKobo / 100)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-[#141414]">
                        {formatNGN(item.balanceAfterKobo / 100)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

