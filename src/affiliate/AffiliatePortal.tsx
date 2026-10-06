import React, { useState, useEffect } from 'react';
import {
  AffiliateApiClient,
  AffiliateUser,
  DashboardStats,
  AffiliateLinkItem,
  CommissionItem,
  PayoutItem,
} from '../services/affiliateApi';
import {
  LayoutDashboard,
  Link2,
  Receipt,
  CreditCard,
  User,
  Copy,
  Check,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Plus,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

interface AffiliatePortalProps {
  initialUser: AffiliateUser;
  onLogout: () => void;
  onBackToShop: () => void;
}

export const AffiliatePortal: React.FC<AffiliatePortalProps> = ({
  initialUser,
  onLogout,
  onBackToShop,
}) => {
  const [currentUser, setCurrentUser] = useState<AffiliateUser>(initialUser);
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'commissions' | 'payouts' | 'profile'>(
    'overview'
  );
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [links, setLinks] = useState<AffiliateLinkItem[]>([]);
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Link generator modal / inline form state
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkDestination, setNewLinkDestination] = useState('/shop');
  const [newLinkType, setNewLinkType] = useState<'collection' | 'product' | 'homepage'>('collection');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);

  // Payout request modal / inline form state
  const [payoutAmountNGN, setPayoutAmountNGN] = useState<number>(0);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Profile update form state
  const [profileForm, setProfileForm] = useState({
    bankName: initialUser.bankName || 'Guaranty Trust Bank (GTBank)',
    accountNumber: initialUser.accountNumber || '',
    accountName: initialUser.accountName || '',
    instagram: initialUser.instagram || '',
    tiktok: initialUser.tiktok || '',
    otherSocials: initialUser.otherSocials || '',
    promotionChannels: initialUser.promotionChannels || '',
    audienceSize: initialUser.audienceSize || '1K - 10K',
  });
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fetchPortalData = async () => {
    setIsRefreshing(true);
    try {
      const [dashRes, linksRes, commsRes, payoutsRes, meRes] = await Promise.all([
        AffiliateApiClient.getDashboard(),
        AffiliateApiClient.getLinks(),
        AffiliateApiClient.getCommissions(),
        AffiliateApiClient.getPayouts(),
        AffiliateApiClient.getMe(),
      ]);

      if (dashRes.success && dashRes.data) {
        setStats(dashRes.data);
      }
      if (linksRes.success && linksRes.data) {
        setLinks(linksRes.data);
      }
      if (commsRes.success && commsRes.data) {
        setCommissions(commsRes.data);
      }
      if (payoutsRes.success && payoutsRes.data) {
        setPayouts(payoutsRes.data);
      }
      if (meRes.success && meRes.data) {
        setCurrentUser(meRes.data);
        setProfileForm((prev) => ({
          ...prev,
          bankName: meRes.data.bankName || prev.bankName,
          accountNumber: meRes.data.accountNumber || prev.accountNumber,
          accountName: meRes.data.accountName || prev.accountName,
          instagram: meRes.data.instagram || prev.instagram,
          tiktok: meRes.data.tiktok || prev.tiktok,
        }));
      }
    } catch (err) {
      console.error('[AFFILIATE_PORTAL_FETCH_ERROR]', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const minimumPayoutNGN = stats?.config.minimumPayoutNGN || 0;

  useEffect(() => {
    if (minimumPayoutNGN && payoutAmountNGN < minimumPayoutNGN) {
      setPayoutAmountNGN(minimumPayoutNGN);
    }
  }, [minimumPayoutNGN, payoutAmountNGN]);

  const handleCopyLink = (code: string) => {
    const fullUrl = `${window.location.origin}/r/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    if (!newLinkName.trim()) {
      setLinkError('Please give your link a campaign name.');
      return;
    }

    setIsSubmittingLink(true);
    try {
      const res = await AffiliateApiClient.createLink({
        name: newLinkName,
        destination: newLinkDestination,
        destinationType: newLinkType,
      });

      if (res.success && res.data) {
        setLinks([res.data, ...links]);
        setIsCreatingLink(false);
        setNewLinkName('');
      } else {
        setLinkError(res.error || 'Failed to create link.');
      }
    } catch (err: any) {
      setLinkError(err.message || 'An error occurred.');
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutSuccess(null);

    if (!currentUser.bankName || !currentUser.accountNumber || !currentUser.accountName) {
      setPayoutError('Please complete your bank account details under Profile & Banking before requesting a payout.');
      return;
    }

    const availableNGN = stats?.earnings.availableNGN || 0;
    if (payoutAmountNGN > availableNGN) {
      setPayoutError(`Requested amount exceeds your available balance of ₦${availableNGN.toLocaleString()}`);
      return;
    }

    if (payoutAmountNGN < minimumPayoutNGN) {
      setPayoutError(`Minimum withdrawal amount is ₦${minimumPayoutNGN.toLocaleString()}.`);
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const res = await AffiliateApiClient.requestPayout({
        amountNGN: payoutAmountNGN,
        bankName: currentUser.bankName,
        accountNumber: currentUser.accountNumber,
        accountName: currentUser.accountName,
        notes: payoutNotes || undefined,
      });

      if (res.success && res.data) {
        setPayoutSuccess(
          `Payout request of ₦${payoutAmountNGN.toLocaleString()} submitted successfully! PIERCYN Finance processes payouts every Friday.`
        );
        fetchPortalData();
      } else {
        setPayoutError(res.error || 'Failed to submit payout request.');
      }
    } catch (err: any) {
      setPayoutError(err.message || 'An error occurred submitting payout.');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsSavingProfile(true);

    try {
      const res = await AffiliateApiClient.updateProfile(profileForm);
      if (res.success && res.data) {
        setCurrentUser(res.data);
        setProfileSuccess('Profile & banking information updated successfully.');
      } else {
        setProfileError(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setProfileError(err.message || 'An error occurred.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const isPendingReview = currentUser.status === 'PENDING';
  const isSuspended = currentUser.status === 'SUSPENDED';

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#EDECE8] font-sans antialiased selection:bg-[#C9A96E] selection:text-black">
      {/* Top Bar */}
      <header className="border-b border-[#222222] bg-[#111111]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={onBackToShop}>
              <span className="font-serif tracking-[0.25em] text-xl font-light text-white hover:text-[#C9A96E] transition-colors">
                PIERCYN
              </span>
              <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 border border-[#C9A96E]/40 text-[#C9A96E] rounded-full">
                PARTNER PORTAL
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchPortalData}
              disabled={isRefreshing}
              className="p-2 text-[#888888] hover:text-white rounded border border-[#2B2B2B] hover:border-[#444444] transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#C9A96E]' : ''}`} />
            </button>

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-[#181818] border border-[#2B2B2B] rounded">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-[#CCCCCC]">
                {currentUser.firstName} {currentUser.lastName}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs text-[#888888] hover:text-white border border-[#2B2B2B] hover:border-red-900/60 rounded flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Account Status Notice Banner (if Pending or Suspended) */}
      {isPendingReview && (
        <div className="bg-[#C9A96E]/10 border-b border-[#C9A96E]/30 px-4 py-3 text-center">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-xs text-[#E6C98F]">
            <Clock className="w-4 h-4 shrink-0 text-[#C9A96E]" />
            <span>
              <strong>Application Under Review:</strong> Your partner profile is currently being reviewed by our editorial team. You will be activated within 24 hours.
            </span>
          </div>
        </div>
      )}

      {isSuspended && (
        <div className="bg-red-950/40 border-b border-red-800 px-4 py-3 text-center">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>
              <strong>Account Suspended:</strong> Please contact director@piercyn.com for creator partner assistance.
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-[#222222] bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview & Earnings', icon: LayoutDashboard },
              { id: 'links', label: 'Referral Links', icon: Link2 },
              { id: 'commissions', label: 'Orders & Royalties', icon: Receipt },
              { id: 'payouts', label: 'Payout Requests', icon: CreditCard },
              { id: 'profile', label: 'Bank & Profile', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 border-b-2 text-xs uppercase tracking-widest font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-[#C9A96E] text-[#C9A96E]'
                      : 'border-transparent text-[#888888] hover:text-white hover:border-[#444444]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* ─── TAB 1: OVERVIEW ───────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Available Balance */}
              <div className="p-6 rounded-xl bg-[#141414] border border-[#242424] relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[11px] uppercase tracking-wider text-[#888888] font-medium">
                    Available For Payout
                  </span>
                  <div className="p-2 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-serif text-white mb-1">
                  ₦{(stats?.earnings.availableNGN || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-[#777777] font-light">
                  Ready to withdraw to bank account
                </div>
              </div>

              {/* Pending Maturation */}
              <div className="p-6 rounded-xl bg-[#141414] border border-[#242424] relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[11px] uppercase tracking-wider text-[#888888] font-medium">
                    Pending Maturation
                  </span>
                  <div className="p-2 rounded bg-amber-950/50 text-amber-400 border border-amber-800/40">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-serif text-white mb-1">
                  ₦{(stats?.earnings.pendingNGN || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-[#777777] font-light">
                  Within 7-day customer return window
                </div>
              </div>

              {/* Total Earned (Lifetime) */}
              <div className="p-6 rounded-xl bg-[#141414] border border-[#242424] relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[11px] uppercase tracking-wider text-[#888888] font-medium">
                    Lifetime Royalties
                  </span>
                  <div className="p-2 rounded bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/30">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-serif text-[#C9A96E] mb-1">
                  ₦{(stats?.earnings.totalEarnedNGN || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-[#777777] font-light">
                  Total revenue generated across all campaigns
                </div>
              </div>

              {/* Conversion Stats */}
              <div className="p-6 rounded-xl bg-[#141414] border border-[#242424] relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[11px] uppercase tracking-wider text-[#888888] font-medium">
                    Conversions & Clicks
                  </span>
                  <div className="p-2 rounded bg-[#222222] text-[#AAAAAA] border border-[#333333]">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-serif text-white mb-1">
                  {stats?.metrics.totalOrders || 0} Orders
                </div>
                <div className="text-[11px] text-[#777777] font-light">
                  From {stats?.metrics.totalClicks || 0} clicks ({stats?.metrics.conversionRatePercent || 0}% CVR)
                </div>
              </div>
            </div>

            {/* Default Primary Referral Link Card */}
            {links.length > 0 && (
              <div className="p-6 rounded-xl bg-gradient-to-r from-[#171717] to-[#121212] border border-[#2B2B2B]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#C9A96E] font-semibold block mb-1">
                      YOUR PRIMARY REFERRAL LINK
                    </span>
                    <h3 className="text-lg font-serif text-white">{links[0].name}</h3>
                    <p className="text-xs text-[#888888] font-mono mt-1">
                      {window.location.origin}/r/{links[0].referralCode}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCopyLink(links[0].referralCode)}
                      className="px-5 py-2.5 bg-[#C9A96E] hover:bg-[#DBC392] text-black text-xs uppercase tracking-widest font-semibold rounded flex items-center gap-2 transition-all shadow-md"
                    >
                      {copiedCode === links[0].referralCode ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Referral Link
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('links')}
                      className="px-4 py-2.5 border border-[#333333] hover:border-white/40 text-white text-xs uppercase tracking-widest font-medium rounded transition-colors"
                    >
                      Manage Links
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Royalties & Activity Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Commissions */}
              <div className="p-6 rounded-xl bg-[#141414] border border-[#242424]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-serif text-white">Recent Royalties</h3>
                  <button
                    onClick={() => setActiveTab('commissions')}
                    className="text-xs text-[#C9A96E] hover:underline"
                  >
                    View All →
                  </button>
                </div>

                {commissions.length === 0 ? (
                  <div className="text-center py-10 text-[#666666] text-xs">
                    No royalties recorded yet. Share your links to start earning!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commissions.slice(0, 5).map((comm) => (
                      <div
                        key={comm.id}
                        className="p-3.5 rounded bg-[#181818] border border-[#262626] flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-medium text-white">{comm.productName}</div>
                          <div className="text-[10px] text-[#777777] font-mono mt-0.5">
                            Order {comm.orderNumber} • Qty: {comm.quantity} • {new Date(comm.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-mono font-semibold text-[#C9A96E]">
                            +₦{comm.amountNGN.toLocaleString()}
                          </div>
                          <span
                            className={`inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono mt-0.5 ${
                              comm.status === 'AVAILABLE'
                                ? 'bg-emerald-950/60 text-emerald-300'
                                : comm.status === 'PAID'
                                ? 'bg-blue-950/60 text-blue-300'
                                : comm.status === 'REVERSED'
                                ? 'bg-red-950/60 text-red-300'
                                : 'bg-amber-950/60 text-amber-300'
                            }`}
                          >
                            {comm.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Click Activity */}
              <div className="p-6 rounded-xl bg-[#141414] border border-[#242424]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-serif text-white">Live Click Tracking</h3>
                  <span className="text-xs text-[#888888]">Last 30 days</span>
                </div>

                {stats?.recentClicks && stats.recentClicks.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentClicks.slice(0, 5).map((click) => (
                      <div
                        key={click.id}
                        className="p-3.5 rounded bg-[#181818] border border-[#262626] flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs text-white">{click.linkName}</div>
                          <div className="text-[10px] text-[#777777] truncate max-w-[200px] mt-0.5">
                            Landing: {click.landingPage || '/shop'}
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-[#888888]">
                          {new Date(click.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-[#666666] text-xs">
                    Clicks will register in real-time as visitors use your link.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: LINKS ──────────────────────────────────────────────── */}
        {activeTab === 'links' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-serif text-white">Referral Link Suite</h2>
                <p className="text-xs text-[#888888] font-light mt-1">
                  Create tailored links for different campaigns, lookbooks, or social bio placements.
                </p>
              </div>

              <button
                onClick={() => setIsCreatingLink(!isCreatingLink)}
                className="px-4 py-2.5 bg-[#C9A96E] hover:bg-[#DBC392] text-black text-xs uppercase tracking-widest font-semibold rounded flex items-center gap-2 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Create New Link
              </button>
            </div>

            {/* Create Link Drawer / Inline Form */}
            {isCreatingLink && (
              <div className="p-6 rounded-xl bg-[#171717] border border-[#C9A96E]/30 animate-in fade-in">
                <h3 className="text-base font-serif text-white mb-4">Generate Campaign Referral Link</h3>

                {linkError && (
                  <div className="mb-4 p-3 rounded bg-red-950/40 border border-red-800 text-red-300 text-xs">
                    {linkError}
                  </div>
                )}

                <form onSubmit={handleCreateLink} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                        Campaign Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newLinkName}
                        onChange={(e) => setNewLinkName(e.target.value)}
                        placeholder="e.g. Instagram Bio, December Lookbook"
                        className="w-full px-4 py-2 bg-[#1F1F1F] border border-[#333333] rounded text-white text-sm focus:border-[#C9A96E] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                        Destination Page *
                      </label>
                      <select
                        value={newLinkDestination}
                        onChange={(e) => setNewLinkDestination(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#333333] rounded text-white text-sm focus:border-[#C9A96E] outline-none"
                      >
                        <option value="/shop">Shop All Collections (/shop)</option>
                        <option value="/men">Men's Collection (/men)</option>
                        <option value="/new">New Arrivals (/new)</option>
                        <option value="/">Storefront Homepage (/)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingLink(false)}
                      className="px-4 py-2 text-xs text-[#888888] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingLink}
                      className="px-5 py-2 bg-[#C9A96E] hover:bg-[#DBC392] disabled:opacity-50 text-black text-xs uppercase tracking-widest font-semibold rounded"
                    >
                      {isSubmittingLink ? 'Generating...' : 'Generate Link'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Links Table */}
            <div className="rounded-xl bg-[#141414] border border-[#242424] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#242424] bg-[#181818] text-[10px] uppercase tracking-widest text-[#888888]">
                      <th className="py-3 px-4 sm:px-6">Campaign & Link</th>
                      <th className="py-3 px-4">Destination</th>
                      <th className="py-3 px-4 text-center">Clicks</th>
                      <th className="py-3 px-4 text-center">Orders</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F] text-xs">
                    {links.map((link) => (
                      <tr key={link.id} className="hover:bg-[#181818]/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-medium text-white">{link.name}</div>
                          <div className="text-[11px] font-mono text-[#C9A96E] mt-0.5 flex items-center gap-1.5">
                            <span>/r/{link.referralCode}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-[#888888]">{link.destination}</td>
                        <td className="py-4 px-4 text-center font-mono text-white">{link.clickCount}</td>
                        <td className="py-4 px-4 text-center font-mono text-white">{link.orderCount}</td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleCopyLink(link.referralCode)}
                            className="px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#CCCCCC] hover:text-white rounded border border-[#333333] text-[11px] inline-flex items-center gap-1.5 transition-colors"
                          >
                            {copiedCode === link.referralCode ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy Link
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: COMMISSIONS & ORDERS ───────────────────────────────── */}
        {activeTab === 'commissions' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-serif text-white">Order & Royalty Ledger</h2>
              <p className="text-xs text-[#888888] font-light mt-1">
                Itemized breakdown of every garment purchase attributed to your creator links.
              </p>
            </div>

            <div className="rounded-xl bg-[#141414] border border-[#242424] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#242424] bg-[#181818] text-[10px] uppercase tracking-widest text-[#888888]">
                      <th className="py-3 px-4 sm:px-6">Date</th>
                      <th className="py-3 px-4">Order Ref</th>
                      <th className="py-3 px-4">Item Details</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Royalty (₦)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F] text-xs">
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#666666]">
                          No orders recorded yet.
                        </td>
                      </tr>
                    ) : (
                      commissions.map((comm) => (
                        <tr key={comm.id} className="hover:bg-[#181818]/60 transition-colors">
                          <td className="py-4 px-4 sm:px-6 text-[#888888] font-mono">
                            {new Date(comm.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 font-mono font-medium text-white">{comm.orderNumber}</td>
                          <td className="py-4 px-4">
                            <div className="text-white font-medium">{comm.productName}</div>
                            <div className="text-[10px] text-[#777777] font-mono mt-0.5">
                              {comm.colour} • Size {comm.size} • SKU: {comm.sku}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-white">{comm.quantity}</td>
                          <td className="py-4 px-4 text-right font-mono font-semibold text-[#C9A96E]">
                            ₦{comm.amountNGN.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-block text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                                comm.status === 'AVAILABLE'
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                  : comm.status === 'PAID'
                                  ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                                  : comm.status === 'REVERSED'
                                  ? 'bg-red-950/60 text-red-300 border border-red-800/40'
                                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                              }`}
                            >
                              {comm.status}
                            </span>
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

        {/* ─── TAB 4: PAYOUTS ────────────────────────────────────────────── */}
        {activeTab === 'payouts' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Request Payout Card */}
              <div className="p-6 rounded-xl bg-[#141414] border border-[#242424] lg:col-span-1">
                <h3 className="text-lg font-serif text-white mb-2">Request Bank Payout</h3>
                <p className="text-xs text-[#888888] font-light mb-6">
                  Available Balance: <strong className="text-white">₦{(stats?.earnings.availableNGN || 0).toLocaleString()}</strong>
                </p>

                {payoutError && (
                  <div className="mb-4 p-3 rounded bg-red-950/40 border border-red-800 text-red-300 text-xs">
                    {payoutError}
                  </div>
                )}

                {payoutSuccess && (
                  <div className="mb-4 p-3 rounded bg-green-950/40 border border-green-800 text-green-300 text-xs">
                    {payoutSuccess}
                  </div>
                )}

                <form onSubmit={handleRequestPayout} className="space-y-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                      Withdrawal Amount (₦) *
                    </label>
                    <input
                      type="number"
                      required
                      min={minimumPayoutNGN}
                      max={stats?.earnings.availableNGN || 0}
                      step={100}
                      value={payoutAmountNGN}
                      onChange={(e) => setPayoutAmountNGN(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-4 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white font-mono text-sm focus:border-[#C9A96E] outline-none"
                    />
                    <span className="text-[10px] text-[#666666] mt-1 block">Minimum payout: ₦{minimumPayoutNGN.toLocaleString()}</span>
                  </div>

                  <div className="p-3.5 rounded bg-[#181818] border border-[#292929] text-xs">
                    <span className="text-[10px] uppercase tracking-wider text-[#888888] block mb-1">
                      Destination Account
                    </span>
                    <div className="text-white font-medium">{currentUser.bankName || 'No bank saved'}</div>
                    <div className="text-xs font-mono text-[#AAAAAA] mt-0.5">
                      {currentUser.accountNumber || '••••••••••'} • {currentUser.accountName || 'Not Set'}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingPayout || !minimumPayoutNGN || (stats?.earnings.availableNGN || 0) < minimumPayoutNGN}
                    className="w-full py-3 bg-[#C9A96E] hover:bg-[#DBC392] disabled:opacity-40 text-black text-xs uppercase tracking-widest font-semibold rounded transition-all"
                  >
                    {isSubmittingPayout ? 'Submitting Request...' : 'Submit Withdrawal Request'}
                  </button>
                </form>
              </div>

              {/* Payout History Ledger */}
              <div className="rounded-xl bg-[#141414] border border-[#242424] lg:col-span-2 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-[#242424]">
                  <h3 className="text-lg font-serif text-white">Withdrawal History</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#242424] bg-[#181818] text-[10px] uppercase tracking-widest text-[#888888]">
                        <th className="py-3 px-4 sm:px-6">Requested Date</th>
                        <th className="py-3 px-4">Amount (₦)</th>
                        <th className="py-3 px-4">Bank Reference</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F1F1F] text-xs">
                      {payouts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-[#666666]">
                            No payout requests found.
                          </td>
                        </tr>
                      ) : (
                        payouts.map((p) => (
                          <tr key={p.id} className="hover:bg-[#181818]/60 transition-colors">
                            <td className="py-4 px-4 sm:px-6 text-[#888888] font-mono">
                              {new Date(p.requestedAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 font-mono font-medium text-white">
                              ₦{p.amountNGN.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 font-mono text-[#888888]">
                              {p.payoutReference || 'In Review'}
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
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: PROFILE & BANKING ──────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-[#141414] p-8 rounded-2xl border border-[#242424]">
              <h2 className="text-2xl font-serif text-white mb-2">Banking & Creator Profile</h2>
              <p className="text-xs text-[#888888] font-light mb-6">
                Update your Nigerian settlement account and creator socials for campaign matching.
              </p>

              {profileError && (
                <div className="mb-4 p-3 rounded bg-red-950/40 border border-red-800 text-red-300 text-xs">
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="mb-4 p-3 rounded bg-green-950/40 border border-green-800 text-green-300 text-xs">
                  {profileSuccess}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A96E] block mb-3 font-semibold">
                    SETTLEMENT BANK DETAILS
                  </span>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.bankName}
                        onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })}
                        placeholder="e.g. GTBank, Access Bank, Zenith Bank, Kuda"
                        className="w-full px-4 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:border-[#C9A96E] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                          Account Number (10 Digits) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={profileForm.accountNumber}
                          onChange={(e) => setProfileForm({ ...profileForm, accountNumber: e.target.value })}
                          placeholder="0123456789"
                          className="w-full px-4 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white font-mono text-sm focus:border-[#C9A96E] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                          Account Holder Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={profileForm.accountName}
                          onChange={(e) => setProfileForm({ ...profileForm, accountName: e.target.value })}
                          placeholder="Kelvin Adeyemi"
                          className="w-full px-4 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:border-[#C9A96E] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#242424]">
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A96E] block mb-3 font-semibold">
                    CREATOR SOCIALS
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={profileForm.instagram}
                        onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                        placeholder="@yourhandle"
                        className="w-full px-4 py-2 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:border-[#C9A96E] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#AAAAAA] mb-1">
                        TikTok
                      </label>
                      <input
                        type="text"
                        value={profileForm.tiktok}
                        onChange={(e) => setProfileForm({ ...profileForm, tiktok: e.target.value })}
                        placeholder="@yourhandle"
                        className="w-full px-4 py-2 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:border-[#C9A96E] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-3 bg-[#C9A96E] hover:bg-[#DBC392] disabled:opacity-50 text-black text-xs uppercase tracking-widest font-semibold rounded transition-all mt-4"
                >
                  {isSavingProfile ? 'Saving Details...' : 'Save Bank & Profile Information'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
