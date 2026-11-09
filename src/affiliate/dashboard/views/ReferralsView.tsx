import React, { useState } from 'react';
import { CommissionItem } from '../../../services/affiliateApi';
import { formatNGN, formatDate } from '../../types';
import {
  Receipt,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ShoppingBag,
} from 'lucide-react';

interface ReferralsViewProps {
  commissions: CommissionItem[];
}

export const ReferralsView: React.FC<ReferralsViewProps> = ({ commissions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredCommissions = commissions.filter((item) => {
    const matchesSearch =
      item.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.productName && item.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  });

  const totalPages = Math.ceil(filteredCommissions.length / pageSize) || 1;
  const paginatedCommissions = filteredCommissions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#141414] text-white">
            <CheckCircle2 className="w-3 h-3" /> Available
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#FAF8F5] text-[#141414] border border-[#E5E2DC]">
            Disbursed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#FAF8F5] text-[#735E29] border border-[#E5E2DC]">
            <Clock className="w-3 h-3 text-[#735E29]" /> In Hold (14d)
          </span>
        );
      case 'REVERSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#FDF2F2] text-[#7F1D1D] border border-[#FCA5A5]">
            <RotateCcw className="w-3 h-3" /> Reversed
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
            Attribution Logs
          </span>
          <h2 className="text-2xl font-serif font-medium text-[#141414]">
            Attributed Referrals
          </h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Transparent record of all customer orders attributed to your referral links.
          </p>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF8F5] border border-[#E5E2DC] text-[11px] text-[#737373]">
          <ShieldCheck className="w-4 h-4 text-[#141414]" />
          <span>Customer data is protected under PIERCYN Privacy Guidelines.</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-[#E5E2DC] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-sm">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['ALL', 'AVAILABLE', 'PENDING', 'PAID', 'REVERSED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#141414] text-white'
                  : 'bg-[#FAF8F5] border border-[#E5E2DC] text-[#555555] hover:border-[#141414]'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search by order ref or product..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E5E2DC] text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
          />
          <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Referrals Table / Cards */}
      <div className="bg-white border border-[#E5E2DC] shadow-sm overflow-hidden">
        {paginatedCommissions.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Receipt className="w-8 h-8 text-[#A3A3A3] mx-auto" />
            <h4 className="font-serif text-lg text-[#141414]">No Referrals Found</h4>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or status filter.'
                : 'As customers complete orders using your referral links, they will be listed here in real time.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#E5E2DC] text-[10px] uppercase tracking-wider font-semibold text-[#737373]">
                  <tr>
                    <th className="px-6 py-3.5">Order Reference</th>
                    <th className="px-6 py-3.5">Attributed Date</th>
                    <th className="px-6 py-3.5">Product Summary</th>
                    <th className="px-6 py-3.5">Commission</th>
                    <th className="px-6 py-3.5">Clearance Timeline</th>
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC] text-[#333333]">
                  {paginatedCommissions.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-[#141414]">
                        {item.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-[#737373]">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#141414] truncate max-w-xs">
                          {item.productName || 'PIERCYN Streetwear Order'}
                        </div>
                        {item.colour && (
                          <div className="text-[10px] text-[#737373]">
                            {item.colour} {item.size ? `· Size ${item.size}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#141414]">
                        {formatNGN(item.amountNGN || item.amountKobo / 100)}
                      </td>
                      <td className="px-6 py-4 text-[#737373] text-[11px]">
                        {item.status === 'AVAILABLE' ? (
                          <span className="text-[#141414] font-medium">Cleared to wallet</span>
                        ) : item.status === 'PAID' ? (
                          <span>Paid out on {formatDate(item.paidAt)}</span>
                        ) : item.status === 'REVERSED' ? (
                          <span className="text-[#7F1D1D]">{item.reversalReason || 'Order returned/cancelled'}</span>
                        ) : (
                          <span>Eligible ~ {item.eligibleAt ? formatDate(item.eligibleAt) : '14 days post-delivery'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {getStatusBadge(item.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-[#E5E2DC]">
              {paginatedCommissions.map((item) => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#141414]">
                      {item.orderNumber}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-xs font-serif font-medium text-[#141414]">
                    {item.productName || 'PIERCYN Order'}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#737373]">{formatDate(item.createdAt)}</span>
                    <span className="font-bold text-[#141414]">
                      {formatNGN(item.amountNGN || item.amountKobo / 100)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-[#FAF8F5] border-t border-[#E5E2DC] flex items-center justify-between text-xs text-[#737373]">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-[#E5E2DC] disabled:opacity-40 hover:border-[#141414] text-[#141414]"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 bg-white border border-[#E5E2DC] disabled:opacity-40 hover:border-[#141414] text-[#141414]"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

