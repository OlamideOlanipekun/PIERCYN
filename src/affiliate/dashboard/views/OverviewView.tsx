import React, { useState } from 'react';
import {
  AffiliateUser,
  DashboardStats,
  CommissionItem,
  AffiliateLinkItem,
} from '../../../services/affiliateApi';
import {
  MousePointerClick,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Clock,
  Wallet,
  ArrowRight,
  Share2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { formatNGN, formatDate, AffiliateDashboardTab } from '../../types';
import { QrCodeModal } from '../../components/QrCodeModal';

interface OverviewViewProps {
  user: AffiliateUser;
  stats: DashboardStats | null;
  links: AffiliateLinkItem[];
  commissions: CommissionItem[];
  isLoading: boolean;
  onNavigateTab: (tab: AffiliateDashboardTab) => void;
  onOpenWithdrawModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  user,
  stats,
  links,
  commissions,
  isLoading,
  onNavigateTab,
  onOpenWithdrawModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  const primaryLink = links[0];
  const primaryCode = primaryLink?.referralCode || user.id.slice(0, 8);
  const primaryUrl = `https://piercyn.vercel.app/?ref=${primaryCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(primaryUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const whatsappShareText = encodeURIComponent(
    `Check out PIERCYN's latest contemporary streetwear drop: ${primaryUrl}`
  );
  const whatsappShareUrl = `https://wa.me/?text=${whatsappShareText}`;

  // Safe data extraction
  const metrics = stats?.metrics || {
    totalClicks: 0,
    totalOrders: 0,
    conversionRatePercent: 0,
    activeLinksCount: links.length,
    averageOrderValueNGN: 0,
  };

  const earnings = stats?.earnings || {
    availableNGN: 0,
    pendingNGN: 0,
    totalEarnedNGN: 0,
    paidNGN: 0,
    reversedNGN: 0,
  };

  // Compute delivered vs total orders
  const deliveredOrders = commissions.filter((c) => c.status === 'AVAILABLE' || c.status === 'PAID').length;

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      {/* Editorial Welcome Header */}
      <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373]">
              Affiliate Overview
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#141414]" />
            <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#141414]">
              Active
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[#141414]">
            Welcome back, {user.firstName}
          </h2>
          <p className="text-xs sm:text-sm text-[#666666]">
            Your influence is making an impact. Here is your latest performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('products')}
            className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-[#F2F0EB] border border-[#E5E2DC] text-[#141414] text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Browse Products</span>
          </button>
          <button
            onClick={() => onNavigateTab('links')}
            className="px-4 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Link</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Clicks */}
        <div className="bg-white border border-[#E5E2DC] p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#737373]">
              Total Clicks
            </span>
            <MousePointerClick className="w-4 h-4 text-[#737373]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#141414]">
            {metrics.totalClicks.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#737373]">Across {links.length || 1} active links</div>
        </div>

        {/* Attributed Orders */}
        <div className="bg-white border border-[#E5E2DC] p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#737373]">
              Attributed Orders
            </span>
            <ShoppingBag className="w-4 h-4 text-[#737373]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#141414]">
            {metrics.totalOrders.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#737373]">{deliveredOrders} verified delivered</div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white border border-[#E5E2DC] p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#737373]">
              Conversion Rate
            </span>
            <TrendingUp className="w-4 h-4 text-[#737373]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#141414]">
            {metrics.conversionRatePercent.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#737373]">Orders / unique clicks</div>
        </div>

        {/* Available Balance */}
        <div className="bg-[#FAF8F5] border border-[#141414] p-5 sm:p-6 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#141414]">
              Available Balance
            </span>
            <Wallet className="w-4 h-4 text-[#141414]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#141414]">
            {formatNGN(earnings.availableNGN)}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#737373]">Ready for withdrawal</span>
            <button
              onClick={onOpenWithdrawModal}
              disabled={earnings.availableNGN <= 0}
              className="text-[11px] font-bold uppercase tracking-wider text-[#141414] underline hover:opacity-80 disabled:opacity-40 disabled:no-underline cursor-pointer"
            >
              Withdraw →
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Financial Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-[#E5E2DC] p-5 space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">
            Total Earned (All Time)
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#141414]">
            {formatNGN(earnings.totalEarnedNGN)}
          </div>
          <div className="text-[11px] text-[#737373]">Cumulative commission credit</div>
        </div>

        <div className="bg-white border border-[#E5E2DC] p-5 space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">
            Pending Commission
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#141414]">
            {formatNGN(earnings.pendingNGN)}
          </div>
          <div className="text-[11px] text-[#737373]">14-day delivery validation hold</div>
        </div>

        <div className="bg-white border border-[#E5E2DC] p-5 space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">
            Total Withdrawn
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#141414]">
            {formatNGN(earnings.paidNGN)}
          </div>
          <div className="text-[11px] text-[#737373]">Disbursed to bank account</div>
        </div>
      </div>

      {/* Quick-Share Primary Link Hero Box */}
      <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E2DC] pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373]">
              Quick Share
            </span>
            <h3 className="text-lg font-serif font-medium text-[#141414]">
              Your Primary Referral Link
            </h3>
            <p className="text-xs text-[#666666]">
              Share this link anywhere. Clicks are tracked for 30 days and earn ₦800 per delivered order.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQrOpen(true)}
              className="p-2 border border-[#E5E2DC] hover:border-[#141414] text-[#141414] hover:bg-[#FAF8F5] transition-all cursor-pointer"
              title="View QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border border-[#E5E2DC] hover:border-[#141414] text-[#141414] hover:bg-[#FAF8F5] transition-all"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="flex-1 bg-[#FAF8F5] border border-[#E5E2DC] px-4 py-3 text-xs sm:text-sm font-mono text-[#141414] truncate flex items-center">
            {primaryUrl}
          </div>
          <button
            onClick={handleCopyLink}
            className="px-6 py-3 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Recent Referral Activity Snippet */}
      <div className="bg-white border border-[#E5E2DC] shadow-sm">
        <div className="p-6 border-b border-[#E5E2DC] flex items-center justify-between">
          <div>
            <h3 className="text-base font-serif font-medium text-[#141414]">
              Recent Referral Activity
            </h3>
            <p className="text-xs text-[#737373]">
              Latest orders placed through your referral links.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('referrals')}
            className="text-xs font-semibold uppercase tracking-wider text-[#141414] hover:text-[#737373] flex items-center gap-1 transition-colors"
          >
            View All ({commissions.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {commissions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-8 h-8 text-[#A3A3A3] mx-auto" />
            <h4 className="text-sm font-serif font-medium text-[#141414]">No Referrals Yet</h4>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Start sharing your referral links on social media or direct messages to earn your first commission.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('products')}
                className="px-5 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer"
              >
                Browse Curated Products
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E5E2DC] text-[10px] uppercase tracking-wider font-semibold text-[#737373]">
                <tr>
                  <th className="px-6 py-3">Order Ref</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Item / Pieces</th>
                  <th className="px-6 py-3">Commission</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DC] text-[#333333]">
                {commissions.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-6 py-3.5 font-mono font-medium text-[#141414]">
                      {item.orderNumber}
                    </td>
                    <td className="px-6 py-3.5 text-[#737373]">{formatDate(item.createdAt)}</td>
                    <td className="px-6 py-3.5 font-medium text-[#141414] max-w-[200px] truncate">
                      {item.productName || 'PIERCYN Order'}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-[#141414]">
                      {formatNGN(item.amountNGN || item.amountKobo / 100)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${
                          item.status === 'AVAILABLE' || item.status === 'PAID'
                            ? 'bg-[#141414] text-white'
                            : item.status === 'PENDING'
                            ? 'bg-[#FAF8F5] text-[#735E29] border border-[#E5E2DC]'
                            : 'bg-[#FDF2F2] text-[#7F1D1D]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={primaryUrl}
        title="Primary Referral Link"
      />
    </div>
  );
};

