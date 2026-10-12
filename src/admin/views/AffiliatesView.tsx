import React, { useState, useEffect } from 'react';
import { AdminApi } from '../api';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Link2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Ban,
  Check,
  Eye,
} from 'lucide-react';

export const AffiliatesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'directory' | 'payouts'>('applications');
  const [overview, setOverview] = useState<any>(null);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Modal State
  const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Review Dialog State
  const [reviewAffiliateId, setReviewAffiliateId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Payout Process State
  const [processPayoutId, setProcessPayoutId] = useState<string | null>(null);
  const [payoutAction, setPayoutAction] = useState<'PROCESSING' | 'PAID' | 'REJECTED'>('PAID');
  const [payoutRef, setPayoutRef] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [overviewData, affiliatesData, payoutsData] = await Promise.all([
        AdminApi.getAffiliateOverview(),
        AdminApi.getAffiliates({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: searchQuery || undefined,
        }),
        AdminApi.getAffiliatePayouts(),
      ]);

      setOverview(overviewData);
      setAffiliates(affiliatesData || []);
      setPayouts(payoutsData || []);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load affiliate operations data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenReview = (id: string, action: 'APPROVE' | 'REJECT') => {
    setReviewAffiliateId(id);
    setReviewAction(action);
    setReviewNotes('');
  };

  const handleSubmitReview = async () => {
    if (!reviewAffiliateId) return;
    setIsSubmittingReview(true);
    try {
      await AdminApi.reviewAffiliate(reviewAffiliateId, reviewAction, reviewNotes || undefined);
      showNotification('success', `Affiliate application ${reviewAction.toLowerCase()}ed successfully.`);
      setReviewAffiliateId(null);
      loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to process application review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleOpenPayout = (id: string, action: 'PROCESSING' | 'PAID' | 'REJECTED') => {
    setProcessPayoutId(id);
    setPayoutAction(action);
    setPayoutRef(`TRF-${Date.now().toString().slice(-6)}`);
    setPayoutNotes('');
  };

  const handleSubmitPayout = async () => {
    if (!processPayoutId) return;
    setIsSubmittingPayout(true);
    try {
      await AdminApi.processAffiliatePayout(
        processPayoutId,
        payoutAction,
        payoutNotes || undefined,
        payoutRef || undefined
      );
      showNotification('success', `Payout updated to ${payoutAction}.`);
      setProcessPayoutId(null);
      loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update payout.');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const handleToggleAffiliateStatus = async (affiliate: any) => {
    const nextStatus = affiliate.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!['ACTIVE', 'SUSPENDED'].includes(affiliate.status)) return;
    const reason = window.prompt(
      nextStatus === 'SUSPENDED' ? `Reason for suspending ${affiliate.firstName} ${affiliate.lastName}:` : `Reason for reactivating ${affiliate.firstName} ${affiliate.lastName}:`,
      nextStatus === 'SUSPENDED' ? 'Admin review' : 'Account reinstated after review'
    );
    if (reason === null) return;
    try {
      await AdminApi.updateAffiliateStatus(affiliate.id, nextStatus, reason.trim() || undefined);
      showNotification('success', `Affiliate ${nextStatus === 'SUSPENDED' ? 'suspended' : 'reactivated'} successfully.`);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update affiliate status.');
    }
  };

  const handleViewDetail = async (id: string) => {
    setIsDetailLoading(true);
    try {
      const detail = await AdminApi.getAffiliate(id);
      setSelectedAffiliate(detail);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load affiliate details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const pendingApplications = affiliates.filter((a) => a.status === 'PENDING');
  const pendingPayoutsList = payouts.filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING');

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#C9A96E] font-medium block">
            GROWTH & PARTNERSHIPS
          </span>
          <h1 className="text-2xl font-serif text-white">Creator & Affiliate Program</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="p-2 text-[#888888] hover:text-white rounded bg-[#181818] border border-[#2B2B2B] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#C9A96E]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-lg text-xs flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border border-red-800 text-red-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#141414] border border-[#242424]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] uppercase tracking-wider text-[#888888]">Pending Applications</span>
            <span className="p-1.5 rounded bg-amber-950/50 text-amber-400 border border-amber-800/40">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-serif text-white">{overview?.affiliates?.pending || 0}</div>
          <div className="text-[11px] text-[#777777] mt-1">Requiring editorial approval</div>
        </div>

        <div className="p-5 rounded-xl bg-[#141414] border border-[#242424]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] uppercase tracking-wider text-[#888888]">Active Partners</span>
            <span className="p-1.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-serif text-white">{overview?.affiliates?.active || 0}</div>
          <div className="text-[11px] text-[#777777] mt-1">Of {overview?.affiliates?.total || 0} total registered</div>
        </div>

        <div className="p-5 rounded-xl bg-[#141414] border border-[#242424]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] uppercase tracking-wider text-[#888888]">Pending Payouts</span>
            <span className="p-1.5 rounded bg-blue-950/50 text-blue-400 border border-blue-800/40">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-serif text-white">
            ₦{((overview?.payouts?.PENDING?.totalKobo || 0) / 100).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#777777] mt-1">
            {overview?.payouts?.PENDING?.count || 0} pending withdrawal requests
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#141414] border border-[#242424]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] uppercase tracking-wider text-[#888888]">Total Royalties Disbursed</span>
            <span className="p-1.5 rounded bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/30">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-serif text-[#C9A96E]">
            ₦{((overview?.commissions?.paidKobo || 0) / 100).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#777777] mt-1">Paid to creators to date</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#242424] flex space-x-6">
        <button
          onClick={() => setActiveTab('applications')}
          className={`py-3 text-xs uppercase tracking-widest font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'applications'
              ? 'border-[#C9A96E] text-[#C9A96E]'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          Review Queue
          {pendingApplications.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
              {pendingApplications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`py-3 text-xs uppercase tracking-widest font-medium border-b-2 transition-colors ${
            activeTab === 'directory'
              ? 'border-[#C9A96E] text-[#C9A96E]'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          Partners Directory
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`py-3 text-xs uppercase tracking-widest font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'payouts'
              ? 'border-[#C9A96E] text-[#C9A96E]'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          Payout Requests
          {pendingPayoutsList.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono">
              {pendingPayoutsList.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── TAB 1: APPLICATIONS QUEUE ───────────────────────────────────── */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {pendingApplications.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[#141414] border border-[#242424]">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-serif text-white mb-1">Review Queue Clear</h3>
              <p className="text-xs text-[#777777]">All creator applications have been reviewed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApplications.map((aff) => (
                <div
                  key={aff.id}
                  className="p-6 rounded-xl bg-[#141414] border border-[#292929] hover:border-[#3D3D3D] transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-serif text-white">
                        {aff.firstName} {aff.lastName}
                      </h3>
                      <div className="text-xs text-[#888888] font-mono mt-0.5">{aff.email}</div>
                      <div className="text-xs text-[#777777] font-mono">{aff.phone}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 text-[10px] uppercase font-mono">
                      PENDING
                    </span>
                  </div>

                  {/* Social & Channel Info */}
                  <div className="p-3.5 rounded bg-[#181818] border border-[#262626] text-xs space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-[#888888]">Audience Reach:</span>
                      <span className="text-white font-medium">{aff.audienceSize || 'Not specified'}</span>
                    </div>
                    {aff.instagram && (
                      <div className="flex justify-between">
                        <span className="text-[#888888]">Instagram:</span>
                        <span className="text-[#C9A96E]">{aff.instagram}</span>
                      </div>
                    )}
                    {aff.tiktok && (
                      <div className="flex justify-between">
                        <span className="text-[#888888]">TikTok:</span>
                        <span className="text-[#C9A96E]">{aff.tiktok}</span>
                      </div>
                    )}
                    {aff.promotionChannels && (
                      <div>
                        <span className="text-[#888888] block mb-1">Channels:</span>
                        <span className="text-white">{aff.promotionChannels}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleOpenReview(aff.id, 'REJECT')}
                      className="px-3.5 py-1.5 border border-red-900/60 hover:bg-red-950/40 text-red-400 text-xs font-medium rounded transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleOpenReview(aff.id, 'APPROVE')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition-colors"
                    >
                      Approve & Activate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: PARTNERS DIRECTORY ───────────────────────────────────── */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#242424] flex flex-col sm:flex-row gap-4 justify-between">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#777777] absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search partner by name, email, or phone..."
                className="w-full pl-9 pr-4 py-2 bg-[#1B1B1B] border border-[#2E2E2E] rounded text-white text-xs focus:border-[#C9A96E] outline-none"
              />
            </form>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#888888]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#1B1B1B] border border-[#2E2E2E] rounded text-white text-xs focus:border-[#C9A96E] outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
          <div className="rounded-xl bg-[#141414] border border-[#242424] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#242424] bg-[#181818] text-[10px] uppercase tracking-widest text-[#888888]">
                    <th className="py-3 px-4 sm:px-6">Partner</th>
                    <th className="py-3 px-4">Socials</th>
                    <th className="py-3 px-4 text-center">Links</th>
                    <th className="py-3 px-4 text-right">Lifetime Royalties</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {affiliates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#666666]">
                        No partners match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    affiliates.map((aff) => {
                      const totalEarningsNGN = (aff.commissions || []).reduce(
                        (sum: number, c: any) => sum + (c.amountKobo || 0) / 100,
                        0
                      );

                      return (
                        <tr key={aff.id} className="hover:bg-[#181818]/60 transition-colors">
                          <td className="py-4 px-4 sm:px-6">
                            <div className="font-medium text-white">
                              {aff.firstName} {aff.lastName}
                            </div>
                            <div className="text-[11px] font-mono text-[#777777] mt-0.5">{aff.email}</div>
                          </td>
                          <td className="py-4 px-4 text-[#AAAAAA]">
                            {aff.instagram ? (
                              <span className="text-[#C9A96E]">{aff.instagram}</span>
                            ) : (
                              'None'
                            )}
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-white">
                            {aff.links?.length || 0}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-semibold text-[#C9A96E]">
                            ₦{totalEarningsNGN.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-block text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                                aff.status === 'ACTIVE'
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                  : aff.status === 'PENDING'
                                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                                  : aff.status === 'SUSPENDED'
                                  ? 'bg-red-950/60 text-red-300 border border-red-800/40'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {aff.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex flex-wrap justify-end gap-2">
                              <button
                                onClick={() => handleViewDetail(aff.id)}
                                className="px-3 py-1 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white rounded border border-[#333333] text-[11px] inline-flex items-center gap-1.5 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Inspect
                              </button>
                              {(aff.status === 'ACTIVE' || aff.status === 'SUSPENDED') && (
                                <button
                                  onClick={() => void handleToggleAffiliateStatus(aff)}
                                  className={`px-3 py-1 rounded border text-[11px] inline-flex items-center gap-1.5 transition-colors ${aff.status === 'ACTIVE' ? 'border-red-900/70 text-red-300 hover:bg-red-950/40' : 'border-emerald-900/70 text-emerald-300 hover:bg-emerald-950/30'}`}
                                >
                                  {aff.status === 'ACTIVE' ? <Ban className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                                  {aff.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: PAYOUT REQUESTS ──────────────────────────────────────── */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-[#141414] border border-[#242424] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#242424] bg-[#181818] text-[10px] uppercase tracking-widest text-[#888888]">
                    <th className="py-3 px-4 sm:px-6">Requested</th>
                    <th className="py-3 px-4">Partner</th>
                    <th className="py-3 px-4">Bank Details</th>
                    <th className="py-3 px-4 text-right">Amount (₦)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#666666]">
                        No payout requests found.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#181818]/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6 text-[#888888] font-mono">
                          {new Date(p.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-white">
                            {p.affiliate?.firstName} {p.affiliate?.lastName}
                          </div>
                          <div className="text-[10px] text-[#777777] font-mono">{p.affiliate?.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-white font-medium">{p.bankName}</div>
                          <div className="text-[10px] font-mono text-[#AAAAAA]">
                            {p.accountNumber} • {p.accountName}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-semibold text-[#C9A96E]">
                          ₦{p.amountNGN.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                              p.status === 'PAID'
                                ? 'bg-emerald-950/60 text-emerald-300'
                                : p.status === 'PROCESSING'
                                ? 'bg-blue-950/60 text-blue-300'
                                : p.status === 'REJECTED'
                                ? 'bg-red-950/60 text-red-300'
                                : 'bg-amber-950/60 text-amber-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {p.status === 'PENDING' || p.status === 'PROCESSING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenPayout(p.id, 'PAID')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition-colors"
                              >
                                Mark Paid
                              </button>
                              <button
                                onClick={() => handleOpenPayout(p.id, 'REJECTED')}
                                className="px-2.5 py-1 border border-red-800 text-red-400 hover:bg-red-950/40 rounded text-[11px] transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-[#777777]">
                              {p.payoutReference || 'Completed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── REVIEW APPLICATION DIALOG MODAL ─────────────────────────────── */}
      {reviewAffiliateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#161616] w-full max-w-md rounded-2xl border border-[#2F2F2F] p-6 shadow-2xl">
            <h3 className="text-lg font-serif text-white mb-2">
              {reviewAction === 'APPROVE' ? 'Approve Affiliate Partner' : 'Reject Application'}
            </h3>
            <p className="text-xs text-[#888888] mb-4">
              {reviewAction === 'APPROVE'
                ? 'Approving will grant the creator immediate portal access and automatically generate their default referral link.'
                : 'Please provide a note or reason for rejecting this application.'}
            </p>

            <div className="mb-4">
              <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                Editorial / Review Notes
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === 'APPROVE'
                    ? 'Optional internal review comments...'
                    : 'Reason for rejection...'
                }
                className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] rounded text-white text-xs focus:border-[#C9A96E] outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewAffiliateId(null)}
                className="px-4 py-2 text-xs text-[#888888] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={handleSubmitReview}
                className={`px-5 py-2 text-xs font-semibold rounded transition-all ${
                  reviewAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {isSubmittingReview ? 'Processing...' : `Confirm ${reviewAction}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PROCESS PAYOUT DIALOG MODAL ─────────────────────────────────── */}
      {processPayoutId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#161616] w-full max-w-md rounded-2xl border border-[#2F2F2F] p-6 shadow-2xl">
            <h3 className="text-lg font-serif text-white mb-2">
              {payoutAction === 'PAID' ? 'Confirm Bank Transfer' : 'Reject Withdrawal Request'}
            </h3>
            <p className="text-xs text-[#888888] mb-4">
              Enter the bank transfer reference or reversal notes.
            </p>

            {payoutAction === 'PAID' && (
              <div className="mb-3">
                <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                  Bank Reference / Session ID *
                </label>
                <input
                  type="text"
                  required
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  placeholder="e.g. GTB-NIP-948274928"
                  className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] rounded text-white text-xs font-mono focus:border-[#C9A96E] outline-none"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">Notes</label>
              <textarea
                rows={2}
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder="Optional transaction remarks..."
                className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] rounded text-white text-xs focus:border-[#C9A96E] outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProcessPayoutId(null)}
                className="px-4 py-2 text-xs text-[#888888] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingPayout}
                onClick={handleSubmitPayout}
                className="px-5 py-2 bg-[#C9A96E] hover:bg-[#DBC392] text-black text-xs font-semibold rounded transition-all"
              >
                {isSubmittingPayout ? 'Processing...' : 'Save Payout Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── INSPECT AFFILIATE DETAIL DRAWER/MODAL ───────────────────────── */}
      {selectedAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-xs">
          <div className="bg-[#141414] w-full max-w-xl h-full border-l border-[#292929] p-6 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-[#242424] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#C9A96E]">PARTNER INSPECTION</span>
                <h2 className="text-xl font-serif text-white">
                  {selectedAffiliate.firstName} {selectedAffiliate.lastName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAffiliate(null)}
                className="text-xs text-[#888888] hover:text-white p-2"
              >
                ✕ Close
              </button>
            </div>

            {/* Profile Overview */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#1F1F1F]">
                <span className="text-[#888888]">Email</span>
                <span className="font-mono text-white">{selectedAffiliate.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1F1F1F]">
                <span className="text-[#888888]">Phone</span>
                <span className="font-mono text-white">{selectedAffiliate.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1F1F1F]">
                <span className="text-[#888888]">Instagram</span>
                <span className="text-[#C9A96E]">{selectedAffiliate.instagram || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1F1F1F]">
                <span className="text-[#888888]">TikTok</span>
                <span className="text-[#C9A96E]">{selectedAffiliate.tiktok || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1F1F1F]">
                <span className="text-[#888888]">Bank Account</span>
                <span className="font-mono text-white">
                  {selectedAffiliate.bankName} - {selectedAffiliate.accountNumber} ({selectedAffiliate.accountName})
                </span>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-[#C9A96E] mb-2 font-semibold">
                Campaign Links ({selectedAffiliate.links?.length || 0})
              </h4>
              <div className="space-y-2">
                {(selectedAffiliate.links || []).map((lnk: any) => (
                  <div
                    key={lnk.id}
                    className="p-3 rounded bg-[#181818] border border-[#242424] flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="text-white font-medium">{lnk.name}</div>
                      <div className="text-[10px] font-mono text-[#888888]">/r/{lnk.referralCode} → {lnk.destination}</div>
                    </div>
                    <div className="text-right text-[11px] font-mono">
                      <div>{lnk.clickCount} Clicks</div>
                      <div className="text-[#C9A96E]">{lnk.orderCount} Orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commissions */}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-[#C9A96E] mb-2 font-semibold">
                Recent Royalties ({selectedAffiliate.commissions?.length || 0})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(selectedAffiliate.commissions || []).map((cm: any) => (
                  <div
                    key={cm.id}
                    className="p-3 rounded bg-[#181818] border border-[#242424] flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="text-white font-medium">{cm.order?.orderNumber || 'Order'}</div>
                      <div className="text-[10px] text-[#777777] font-mono">
                        {new Date(cm.createdAt).toLocaleDateString()} • {cm.status}
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-[#C9A96E]">
                      ₦{((cm.amountKobo || 0) / 100).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
