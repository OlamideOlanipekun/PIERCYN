import React, { useEffect, useMemo, useState } from 'react';
import './affiliate-responsive.css';
import {
  AffiliateApiClient,
  AffiliateUser,
  DashboardStats,
  AffiliateLinkItem,
  CommissionItem,
  PayoutItem,
  LedgerItem,
  MediaItem,
} from '../services/affiliateApi';
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Headphones,
  Image as ImageIcon,
  LayoutDashboard,
  Link2,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';

type PortalTab = 'overview' | 'links' | 'commissions' | 'ledger' | 'media' | 'payouts' | 'profile' | 'support';

interface AffiliatePortalProps {
  initialUser: AffiliateUser;
  onLogout: () => void;
  onBackToShop: () => void;
}

const naira = (amount: number) => `₦${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
const dateLabel = (date: string) => new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
const tabLabels: Record<PortalTab, { title: string; subtitle: string }> = {
  overview: { title: 'Affiliate Dashboard', subtitle: 'Your performance, links and earnings at a glance.' },
  links: { title: 'Referral Links', subtitle: 'Create campaign links and share PIERCYN with your community.' },
  commissions: { title: 'My Referrals', subtitle: 'Orders attributed to your referral links and their current status.' },
  ledger: { title: 'Earnings', subtitle: 'A clear record of commission activity and wallet movements.' },
  payouts: { title: 'Withdrawals', subtitle: 'Request a payout from your approved available balance.' },
  media: { title: 'Promotional Media', subtitle: 'Official PIERCYN creative assets for your content.' },
  profile: { title: 'Settings', subtitle: 'Manage your creator profile and payout destination.' },
  support: { title: 'Support', subtitle: 'Find the right PIERCYN channel for affiliate questions.' },
};

const navItems: Array<{ id: PortalTab; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'links', label: 'Referral links', icon: Link2 },
  { id: 'commissions', label: 'My referrals', icon: Receipt },
  { id: 'ledger', label: 'Earnings', icon: Activity },
  { id: 'payouts', label: 'Withdrawals', icon: Wallet },
  { id: 'media', label: 'Promotional media', icon: ImageIcon },
  { id: 'profile', label: 'Settings', icon: UserRound },
  { id: 'support', label: 'Support', icon: Headphones },
];

const statusTone = (status: string) => {
  if (['AVAILABLE', 'PAID', 'APPROVED', 'ACTIVE'].includes(status)) return 'good';
  if (['PENDING', 'PROCESSING'].includes(status)) return 'pending';
  if (['REVERSED', 'REJECTED', 'SUSPENDED', 'FAILED'].includes(status)) return 'bad';
  return 'neutral';
};

export const AffiliatePortal: React.FC<AffiliatePortalProps> = ({ initialUser, onLogout, onBackToShop }) => {
  const [currentUser, setCurrentUser] = useState<AffiliateUser>(initialUser);
  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [links, setLinks] = useState<AffiliateLinkItem[]>([]);
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerItem[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkDestination, setNewLinkDestination] = useState('/shop');
  const [newLinkType, setNewLinkType] = useState<'collection' | 'product' | 'homepage'>('collection');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [payoutAmountNGN, setPayoutAmountNGN] = useState<number>(0);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bankName: initialUser.bankName || '',
    accountNumber: initialUser.accountNumber || '',
    accountName: initialUser.accountName || '',
    instagram: initialUser.instagram || '',
    tiktok: initialUser.tiktok || '',
    otherSocials: initialUser.otherSocials || '',
    promotionChannels: initialUser.promotionChannels || '',
    audienceSize: initialUser.audienceSize || '',
  });
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [commissionQuery, setCommissionQuery] = useState('');
  const [commissionStatus, setCommissionStatus] = useState('ALL');
  const [commissionDateFrom, setCommissionDateFrom] = useState('');
  const [commissionDateTo, setCommissionDateTo] = useState('');
  const [commissionPage, setCommissionPage] = useState(1);
  const pageSize = 8;

  const fetchPortalData = async () => {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const [dashRes, linksRes, commsRes, payoutsRes, meRes, ledgerRes, mediaRes] = await Promise.all([
        AffiliateApiClient.getDashboard(),
        AffiliateApiClient.getLinks(),
        AffiliateApiClient.getCommissions(),
        AffiliateApiClient.getPayouts(),
        AffiliateApiClient.getMe(),
        AffiliateApiClient.getLedger(),
        AffiliateApiClient.getMedia(),
      ]);
      const failed = [dashRes, linksRes, commsRes, payoutsRes, meRes, ledgerRes, mediaRes].find((result) => !result.success);
      if (failed && !dashRes.success) throw new Error(failed.error || 'Your dashboard could not be loaded.');
      if (dashRes.success && dashRes.data) setStats(dashRes.data);
      if (linksRes.success && linksRes.data) setLinks(linksRes.data);
      if (commsRes.success && commsRes.data) setCommissions(commsRes.data);
      if (payoutsRes.success && payoutsRes.data) setPayouts(payoutsRes.data);
      if (ledgerRes.success && ledgerRes.data) setLedgerEntries(ledgerRes.data);
      if (mediaRes.success && mediaRes.data) setMediaAssets(mediaRes.data);
      if (meRes.success && meRes.data) {
        setCurrentUser(meRes.data);
        setProfileForm((previous) => ({
          ...previous,
          bankName: meRes.data.bankName || previous.bankName,
          accountNumber: meRes.data.accountNumber || previous.accountNumber,
          accountName: meRes.data.accountName || previous.accountName,
          instagram: meRes.data.instagram || previous.instagram,
          tiktok: meRes.data.tiktok || previous.tiktok,
          otherSocials: meRes.data.otherSocials || previous.otherSocials,
          promotionChannels: meRes.data.promotionChannels || previous.promotionChannels,
          audienceSize: meRes.data.audienceSize || previous.audienceSize,
        }));
      }
      if (failed) setLoadError(failed.error || 'Some dashboard information could not be refreshed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Your dashboard could not be loaded.';
      setLoadError(message);
      console.error('[AFFILIATE_PORTAL_FETCH_ERROR]', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { void fetchPortalData(); }, []);
  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(null), 2800);
      return () => window.clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    if (stats?.earnings.availableNGN && payoutAmountNGN === 0) setPayoutAmountNGN(stats.earnings.availableNGN);
  }, [stats?.earnings.availableNGN]);

  const minimumPayoutNGN = stats?.config.minimumPayoutNGN || 0;
  const referralUrl = (code: string) => `${window.location.origin}/r/${code}`;
  const openTab = (tab: PortalTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyLink = async (code: string) => {
    try {
      await navigator.clipboard.writeText(referralUrl(code));
      setCopiedCode(code);
      setToast('Referral link copied');
      window.setTimeout(() => setCopiedCode(null), 2400);
    } catch {
      setToast('Could not copy link. Please copy it from the field.');
    }
  };

  const handleNativeShare = async (code: string) => {
    const url = referralUrl(code);
    if (!navigator.share) {
      await handleCopyLink(code);
      return;
    }
    try {
      await navigator.share({ title: 'PIERCYN', text: 'Shop PIERCYN with my link:', url });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setToast('Sharing is not available right now.');
    }
  };

  const handleCreateLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setLinkError(null);
    if (!newLinkName.trim()) { setLinkError('Please give your link a campaign name.'); return; }
    setIsSubmittingLink(true);
    try {
      const result = await AffiliateApiClient.createLink({ name: newLinkName, destination: newLinkDestination, destinationType: newLinkType });
      if (result.success && result.data) {
        setLinks((previous) => [result.data!, ...previous]);
        setIsCreatingLink(false);
        setNewLinkName('');
        setToast('Your referral link is ready');
      } else setLinkError(result.error || 'Failed to create link.');
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : 'An error occurred.');
    } finally { setIsSubmittingLink(false); }
  };

  const handleRequestPayout = async (event: React.FormEvent) => {
    event.preventDefault();
    setPayoutError(null);
    setPayoutSuccess(null);
    if (!currentUser.bankName || !currentUser.accountNumber || !currentUser.accountName) {
      setPayoutError('Please complete your bank account details under Settings before requesting a withdrawal.'); return;
    }
    const availableNGN = stats?.earnings.availableNGN || 0;
    if (payoutAmountNGN > availableNGN) { setPayoutError(`Requested amount exceeds your available balance of ${naira(availableNGN)}.`); return; }
    if (payoutAmountNGN <= 0) { setPayoutError('Withdrawal amount must be greater than zero.'); return; }
    if (minimumPayoutNGN > 0 && payoutAmountNGN < minimumPayoutNGN) { setPayoutError(`Minimum withdrawal amount is ${naira(minimumPayoutNGN)}.`); return; }
    setIsSubmittingPayout(true);
    try {
      const result = await AffiliateApiClient.requestPayout({
        amountNGN: payoutAmountNGN,
        bankName: currentUser.bankName,
        accountNumber: currentUser.accountNumber,
        accountName: currentUser.accountName,
        notes: payoutNotes || undefined,
      });
      if (result.success && result.data) {
        setPayoutSuccess(`Withdrawal request for ${naira(payoutAmountNGN)} was submitted.`);
        setToast('Withdrawal request submitted');
        setPayoutNotes('');
        await fetchPortalData();
      } else setPayoutError(result.error || 'Failed to submit withdrawal request.');
    } catch (error) {
      setPayoutError(error instanceof Error ? error.message : 'An error occurred submitting the withdrawal.');
    } finally { setIsSubmittingPayout(false); }
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsSavingProfile(true);
    try {
      const result = await AffiliateApiClient.updateProfile(profileForm);
      if (result.success && result.data) {
        setCurrentUser(result.data);
        setProfileSuccess('Your profile and payout details have been saved.');
        setToast('Settings saved');
      } else setProfileError(result.error || 'Failed to update profile.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'An error occurred.');
    } finally { setIsSavingProfile(false); }
  };

  const filteredCommissions = useMemo(() => commissions.filter((commission) => {
    const query = commissionQuery.trim().toLowerCase();
    const matchesQuery = !query || [commission.orderNumber, commission.productName, commission.sku].some((value) => value?.toLowerCase().includes(query));
    const matchesStatus = commissionStatus === 'ALL' || commission.status === commissionStatus;
    const createdAt = new Date(commission.createdAt).getTime();
    const from = commissionDateFrom ? new Date(`${commissionDateFrom}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const to = commissionDateTo ? new Date(`${commissionDateTo}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
    return matchesQuery && matchesStatus && createdAt >= from && createdAt <= to;
  }), [commissions, commissionQuery, commissionStatus, commissionDateFrom, commissionDateTo]);
  const totalPages = Math.max(1, Math.ceil(filteredCommissions.length / pageSize));
  const pageCommissions = filteredCommissions.slice((commissionPage - 1) * pageSize, commissionPage * pageSize);
  const topProducts = useMemo(() => {
    const byProduct = new Map<string, { orders: Set<string>; revenue: number }>();
    commissions.forEach((commission) => {
      const name = commission.productName || 'PIERCYN item';
      const current = byProduct.get(name) || { orders: new Set<string>(), revenue: 0 };
      current.orders.add(commission.orderId);
      current.revenue += (commission.unitPriceNGN || 0) * (commission.quantity || 1);
      byProduct.set(name, current);
    });
    return [...byProduct.entries()].map(([name, value]) => ({ name, orders: value.orders.size, revenue: value.revenue }))
      .sort((a, b) => b.orders - a.orders || b.revenue - a.revenue).slice(0, 3);
  }, [commissions]);

  const isPendingReview = currentUser.status === 'PENDING';
  const isSuspended = currentUser.status === 'SUSPENDED';
  const primaryLink = links.find((link) => link.isActive) || links[0];
  const available = stats?.earnings.availableNGN || 0;
  const earned = stats?.earnings.totalEarnedNGN || 0;
  const pending = stats?.earnings.pendingNGN || 0;
  const paid = stats?.earnings.paidNGN || 0;

  const renderStatus = (status: string) => <span className={`ap-status ap-status--${statusTone(status)}`}><span className="ap-status-dot" />{status.replace(/_/g, ' ')}</span>;
  const renderCommissionRows = (items: CommissionItem[]) => items.map((commission) => (
    <tr key={commission.id}>
      <td><span className="ap-date">{dateLabel(commission.createdAt)}</span></td>
      <td><strong className="ap-order">{commission.orderNumber || commission.orderId.slice(0, 8)}</strong></td>
      <td><div className="ap-product-cell"><strong>{commission.productName || 'PIERCYN item'}</strong><small>{[commission.colour, commission.size && `Size ${commission.size}`, commission.sku].filter(Boolean).join(' · ')}</small></div></td>
      <td className="ap-number">{commission.quantity}</td>
      <td className="ap-money">{naira(commission.amountNGN)}</td>
      <td>{renderStatus(commission.status)}</td>
    </tr>
  ));

  return (
    <div className="affiliate-portal-shell ap-shell">
      <header className="ap-topbar">
        <button className="ap-brand" onClick={onBackToShop} aria-label="Return to PIERCYN shop">
          <span className="ap-brand-word">PIERCYN</span><span className="ap-brand-tag">PARTNER STUDIO</span>
        </button>
        <div className="ap-topbar-right">
          <button className={`ap-icon-button ${isRefreshing ? 'is-spinning' : ''}`} onClick={() => void fetchPortalData()} disabled={isRefreshing} aria-label="Refresh dashboard" title="Refresh dashboard"><RefreshCw size={17} /></button>
          <div className="ap-profile-wrap">
            <button className="ap-profile-trigger" onClick={() => setProfileMenuOpen((open) => !open)} aria-expanded={profileMenuOpen}>
              <span className="ap-avatar">{(currentUser.firstName?.[0] || 'P')}{(currentUser.lastName?.[0] || '')}</span>
              <span className="ap-profile-name">{currentUser.firstName} {currentUser.lastName}</span><ChevronDown size={15} />
            </button>
            {profileMenuOpen && <div className="ap-profile-menu"><button onClick={() => openTab('profile')}><UserRound size={15} /> Profile & payout details</button><button onClick={onLogout}><LogOut size={15} /> Sign out</button></div>}
          </div>
          <button className="ap-mobile-menu-toggle" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}>{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </header>

      {(isPendingReview || isSuspended || loadError) && <div className={`ap-notice ${isSuspended ? 'ap-notice--bad' : loadError ? 'ap-notice--error' : 'ap-notice--pending'}`}>
        {isPendingReview && <><Clock3 size={17} /><span><strong>Application under review.</strong> Your partner profile is being reviewed by the PIERCYN team.</span></>}
        {isSuspended && <><ShieldCheck size={17} /><span><strong>Account status: suspended.</strong> Contact <a href="mailto:director@piercyn.com">director@piercyn.com</a> for assistance.</span></>}
        {loadError && !isSuspended && !isPendingReview && <><RefreshCw size={17} /><span>{loadError}</span><button onClick={() => void fetchPortalData()}>Try again</button></>}
      </div>}

      <aside className={`ap-sidebar ${mobileMenuOpen ? 'ap-sidebar--open' : ''}`}>
        <div className="ap-sidebar-section-label">YOUR STUDIO</div>
        <nav className="ap-side-nav" aria-label="Affiliate dashboard">
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => openTab(id)} className={`ap-nav-item ${activeTab === id ? 'is-active' : ''}`} aria-current={activeTab === id ? 'page' : undefined}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{activeTab === id && <span className="ap-nav-indicator" />}</button>)}
        </nav>
        <div className="ap-sidebar-bottom">
          <div className="ap-sidebar-promo-kicker">PIERCYN CREATOR CLUB</div>
          <p>Share PIERCYN.<br /><strong>Earn more.</strong></p>
          <button onClick={() => openTab('links')}>Get your link <ArrowRight size={14} /></button>
          <button className="ap-sidebar-support" onClick={() => openTab('support')}>Need help? Contact support</button>
        </div>
        <button className="ap-sidebar-shop" onClick={onBackToShop}><ArrowUpRight size={15} /> Back to PIERCYN</button>
      </aside>

      <main className="ap-main">
        <div className="ap-page-heading">
          <div><div className="ap-eyebrow">PIERCYN AFFILIATE PROGRAM</div><h1>{tabLabels[activeTab].title}</h1><p>{tabLabels[activeTab].subtitle}</p></div>
          <span className={`ap-account-state ap-account-state--${statusTone(currentUser.status)}`}><span className="ap-status-dot" />{currentUser.status}</span>
        </div>

        {isLoading ? <div className="ap-loading" aria-live="polite"><span className="ap-spinner" /><span>Loading your studio…</span><div className="ap-skeleton-grid"><i /><i /><i /><i /></div><i className="ap-skeleton-wide" /></div> : <>
          {activeTab === 'overview' && <div className="ap-page-content ap-overview">
            <section className="ap-hero">
              <img className="ap-hero-image" src="/images/affiliate-hero.webp" alt="PIERCYN streetwear editorial campaign" />
              <div className="ap-hero-shade" />
              <div className="ap-hero-copy"><div className="ap-hero-kicker">LAGOS · BUILT FOR EVERYWHERE</div><h2>Share your point<br />of view. <em>Earn more.</em></h2><p>Earn {naira(stats?.config.commissionPerOrderNGN ?? stats?.config.commissionPerProductNGN ?? 800)} for every qualifying order. Your community, your edit, your impact.</p><div className="ap-hero-actions"><button className="ap-button ap-button--light" onClick={() => primaryLink ? void handleCopyLink(primaryLink.referralCode) : openTab('links')}>{primaryLink ? <><Copy size={15} /> Copy your link</> : <><Plus size={16} /> Create your link</>}</button><button className="ap-button ap-button--outline-light" onClick={() => openTab('media')}>Explore resources <ArrowRight size={15} /></button></div></div>
              <div className="ap-hero-caption">PIERCYN CREATOR CLUB <span>01 / YOUR STUDIO</span></div>
            </section>

            <div className="ap-stat-grid">
              <article className="ap-stat-card"><div className="ap-stat-top"><span>Total earnings</span><Banknote size={17} /></div><strong>{naira(earned)}</strong><small>Lifetime commissions earned</small></article>
              <article className="ap-stat-card"><div className="ap-stat-top"><span>Referral visits</span><Link2 size={17} /></div><strong>{(stats?.metrics.totalClicks || 0).toLocaleString()}</strong><small>Tracked clicks across your links</small></article>
              <article className="ap-stat-card"><div className="ap-stat-top"><span>Qualifying orders</span><ShoppingBag size={17} /></div><strong>{(stats?.metrics.totalOrders || 0).toLocaleString()}</strong><small>Orders attributed to your links</small></article>
              <article className="ap-stat-card ap-stat-card--balance"><div className="ap-stat-top"><span>Available balance</span><Wallet size={17} /></div><strong>{naira(available)}</strong><small>Approved and ready to withdraw</small><button onClick={() => openTab('payouts')}>Withdraw <ArrowRight size={14} /></button></article>
            </div>

            <div className="ap-overview-grid">
              <section className="ap-panel ap-link-panel">
                <div className="ap-panel-heading"><div><div className="ap-eyebrow">YOUR LINK</div><h2>Your Referral Link</h2></div><Link2 size={19} /></div>
                <p className="ap-muted">Share this with friends, your community and followers.</p>
                {primaryLink ? <><div className="ap-link-field"><span title={referralUrl(primaryLink.referralCode)}>{referralUrl(primaryLink.referralCode)}</span><button onClick={() => void handleCopyLink(primaryLink.referralCode)} aria-label="Copy referral link">{copiedCode === primaryLink.referralCode ? <Check size={16} /> : <Copy size={16} />}</button></div><div className="ap-link-meta"><span>{primaryLink.name}</span><span>{primaryLink.clickCount.toLocaleString()} visits · {primaryLink.orderCount.toLocaleString()} orders</span></div><div className="ap-share-actions"><button onClick={() => void handleCopyLink(primaryLink.referralCode)}><Copy size={14} /> Copy</button><a href={`https://wa.me/?text=${encodeURIComponent(`Shop PIERCYN with my link: ${referralUrl(primaryLink.referralCode)}`)}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a><button onClick={() => { const text = `Shop PIERCYN with my link: ${referralUrl(primaryLink.referralCode)}`; window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl(primaryLink.referralCode))}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer'); }}><Share2 size={14} /> Telegram</button><a href={`https://x.com/intent/post?text=${encodeURIComponent(`Shop PIERCYN with my link: ${referralUrl(primaryLink.referralCode)}`)}`} target="_blank" rel="noreferrer">X</a><a href={`mailto:?subject=${encodeURIComponent('PIERCYN — shop with my link')}&body=${encodeURIComponent(`Shop PIERCYN with my link: ${referralUrl(primaryLink.referralCode)}`)}`}><Mail size={14} /> Email</a><button onClick={() => void handleNativeShare(primaryLink.referralCode)}><Share2 size={14} /> Share</button></div></> : <div className="ap-empty-inline"><span>No referral links yet</span><button className="ap-button ap-button--dark" onClick={() => { openTab('links'); setIsCreatingLink(true); }}><Plus size={15} /> Create a link</button></div>}
              </section>
              <section className="ap-panel ap-activity-panel"><div className="ap-panel-heading"><div><div className="ap-eyebrow">LATEST ACTIVITY</div><h2>Recent referrals</h2></div><button className="ap-text-link" onClick={() => openTab('commissions')}>View all <ArrowRight size={14} /></button></div>
                {commissions.length ? <div className="ap-activity-list">{commissions.slice(0, 4).map((commission) => <div className="ap-activity-row" key={commission.id}><div className="ap-activity-icon"><ShoppingBag size={16} /></div><div className="ap-activity-main"><strong>{commission.productName || `Order ${commission.orderNumber}`}</strong><span>Order {commission.orderNumber} · {dateLabel(commission.createdAt)}</span></div><div className="ap-activity-value"><strong>{naira(commission.amountNGN)}</strong>{renderStatus(commission.status)}</div></div>)}</div> : <div className="ap-empty-state ap-empty-state--compact"><span className="ap-empty-mark"><Link2 size={20} /></span><strong>Your first referral is one share away.</strong><p>When an order is attributed to one of your links, it will appear here.</p><button className="ap-text-link" onClick={() => openTab('links')}>View your links <ArrowRight size={14} /></button></div>}
              </section>
            </div>

            {topProducts.length > 0 && <section className="ap-panel ap-products-panel"><div className="ap-panel-heading"><div><div className="ap-eyebrow">BASED ON ATTRIBUTED ORDERS</div><h2>Products your community chose</h2></div><button className="ap-text-link" onClick={() => openTab('commissions')}>See referrals <ArrowRight size={14} /></button></div><div className="ap-product-list">{topProducts.map((product, index) => <div className="ap-product-row" key={product.name}><span className="ap-product-rank">0{index + 1}</span><div className="ap-product-info"><strong>{product.name}</strong><span>{product.orders} attributed {product.orders === 1 ? 'order' : 'orders'}</span></div><span className="ap-product-revenue">{naira(product.revenue)}</span></div>)}</div></section>}

            <section className="ap-resource-banner"><img src="/images/affiliate-campaign.webp" alt="PIERCYN creator campaign" loading="lazy" /><div className="ap-resource-shade" /><div className="ap-resource-copy"><div className="ap-eyebrow">YOUR NEXT POST STARTS HERE</div><h2>Create content.<br />Share your link.<br /><em>Earn more.</em></h2><button className="ap-button ap-button--light" onClick={() => openTab('media')}>View resources <ArrowRight size={15} /></button></div></section>
          </div>}

          {activeTab === 'links' && <div className="ap-page-content ap-section-stack">
            <div className="ap-section-toolbar"><div><div className="ap-eyebrow">TRACK EVERY CAMPAIGN</div><h2>Your referral links</h2><p className="ap-muted">Each link carries your unique referral code and destination.</p></div><button className="ap-button ap-button--dark" onClick={() => { setLinkError(null); setIsCreatingLink((open) => !open); }}><Plus size={16} /> Create link</button></div>
            {isCreatingLink && <section className="ap-panel ap-form-panel"><div className="ap-panel-heading"><div><div className="ap-eyebrow">NEW TRACKED LINK</div><h2>Create a referral link</h2></div><button className="ap-icon-button" onClick={() => setIsCreatingLink(false)} aria-label="Close form"><X size={18} /></button></div>{linkError && <div className="ap-form-alert ap-form-alert--error">{linkError}</div>}<form onSubmit={handleCreateLink} className="ap-form-grid"><label>Campaign name<input required minLength={3} maxLength={100} value={newLinkName} onChange={(event) => setNewLinkName(event.target.value)} placeholder="e.g. Weekend lookbook" /></label><label>Destination<select value={newLinkDestination} onChange={(event) => setNewLinkDestination(event.target.value)}><option value="/shop">Shop all</option><option value="/men">Men's collection</option><option value="/new">New arrivals</option><option value="/">Storefront home</option></select></label><label>Destination type<select value={newLinkType} onChange={(event) => setNewLinkType(event.target.value as typeof newLinkType)}><option value="collection">Collection</option><option value="product">Product</option><option value="homepage">Homepage</option></select></label><div className="ap-form-actions"><button className="ap-button ap-button--dark" type="submit" disabled={isSubmittingLink}>{isSubmittingLink ? 'Creating…' : 'Create link'}</button><button className="ap-button ap-button--quiet" type="button" onClick={() => setIsCreatingLink(false)}>Cancel</button></div></form></section>}
            {links.length ? <div className="ap-link-grid">{links.map((link) => <article className="ap-panel ap-campaign-card" key={link.id}><div className="ap-campaign-top"><span className="ap-campaign-icon"><Link2 size={18} /></span>{renderStatus(link.isActive ? 'ACTIVE' : 'INACTIVE')}</div><h3>{link.name}</h3><div className="ap-link-field"><span title={referralUrl(link.referralCode)}>{referralUrl(link.referralCode)}</span><button onClick={() => void handleCopyLink(link.referralCode)} aria-label={`Copy ${link.name}`}>{copiedCode === link.referralCode ? <Check size={16} /> : <Copy size={16} />}</button></div><div className="ap-link-stats"><span><small>Visits</small><strong>{link.clickCount.toLocaleString()}</strong></span><span><small>Orders</small><strong>{link.orderCount.toLocaleString()}</strong></span><span><small>Created</small><strong>{dateLabel(link.createdAt)}</strong></span></div><div className="ap-card-foot"><span>{link.destination}</span><button onClick={() => void handleCopyLink(link.referralCode)}><Share2 size={14} /> Share link</button></div></article>)}</div> : !isCreatingLink && <div className="ap-empty-state"><span className="ap-empty-mark"><Link2 size={22} /></span><h3>Start with your first link</h3><p>Create a unique link for a campaign, collection or product. Share it with your audience to track attributed orders.</p><button className="ap-button ap-button--dark" onClick={() => setIsCreatingLink(true)}><Plus size={16} /> Create a referral link</button></div>}
          </div>}

          {activeTab === 'commissions' && <div className="ap-page-content ap-section-stack"><div className="ap-table-summary"><div className="ap-stat-card ap-stat-card--small"><span>Attributed orders</span><strong>{(stats?.metrics.totalOrders || 0).toLocaleString()}</strong></div><div className="ap-stat-card ap-stat-card--small"><span>Pending commission</span><strong>{naira(pending)}</strong></div><div className="ap-stat-card ap-stat-card--small"><span>Available commission</span><strong>{naira(available)}</strong></div></div><section className="ap-panel ap-table-panel"><div className="ap-section-toolbar ap-section-toolbar--inside"><div><div className="ap-eyebrow">ORDER ATTRIBUTION</div><h2>Referral history</h2></div><div className="ap-table-filters"><label className="ap-search"><Search size={15} /><input aria-label="Search orders" placeholder="Search order or product" value={commissionQuery} onChange={(event) => { setCommissionQuery(event.target.value); setCommissionPage(1); }} /></label><select aria-label="Filter by status" value={commissionStatus} onChange={(event) => { setCommissionStatus(event.target.value); setCommissionPage(1); }}><option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="AVAILABLE">Available</option><option value="PAID">Paid</option><option value="REVERSED">Reversed</option></select><label className="ap-date-filter"><span>From</span><input aria-label="Start date" type="date" value={commissionDateFrom} onChange={(event) => { setCommissionDateFrom(event.target.value); setCommissionPage(1); }} /></label><label className="ap-date-filter"><span>To</span><input aria-label="End date" type="date" value={commissionDateTo} onChange={(event) => { setCommissionDateTo(event.target.value); setCommissionPage(1); }} /></label></div></div><div className="ap-table-scroll"><table className="ap-table"><thead><tr><th>Date</th><th>Order reference</th><th>Product</th><th>Qty</th><th>Commission</th><th>Status</th></tr></thead><tbody>{pageCommissions.length ? renderCommissionRows(pageCommissions) : <tr><td colSpan={6}><div className="ap-table-empty">{commissions.length ? 'No referrals match those filters.' : 'No attributed orders yet. Share your link to get started.'}</div></td></tr>}</tbody></table></div><div className="ap-pagination"><span>{filteredCommissions.length ? `Showing ${(commissionPage - 1) * pageSize + 1}–${Math.min(commissionPage * pageSize, filteredCommissions.length)} of ${filteredCommissions.length}` : 'No results'}</span><div><button onClick={() => setCommissionPage((page) => Math.max(1, page - 1))} disabled={commissionPage <= 1}>Previous</button><span>{commissionPage} / {totalPages}</span><button onClick={() => setCommissionPage((page) => Math.min(totalPages, page + 1))} disabled={commissionPage >= totalPages}>Next</button></div></div></section></div>}

          {activeTab === 'ledger' && <div className="ap-page-content ap-section-stack"><div className="ap-table-summary"><div className="ap-stat-card ap-stat-card--small"><span>Total earned</span><strong>{naira(earned)}</strong></div><div className="ap-stat-card ap-stat-card--small"><span>Pending</span><strong>{naira(pending)}</strong></div><div className="ap-stat-card ap-stat-card--small"><span>Available</span><strong>{naira(available)}</strong></div><div className="ap-stat-card ap-stat-card--small"><span>Paid out</span><strong>{naira(paid)}</strong></div></div><section className="ap-panel ap-table-panel"><div className="ap-section-toolbar ap-section-toolbar--inside"><div><div className="ap-eyebrow">WALLET ACTIVITY</div><h2>Financial ledger</h2><p className="ap-muted">Each entry reflects a recorded wallet movement.</p></div><button className="ap-button ap-button--light-border" onClick={() => void fetchPortalData()} disabled={isRefreshing}><RefreshCw size={15} className={isRefreshing ? 'ap-spin' : ''} /> Refresh</button></div><div className="ap-table-scroll"><table className="ap-table"><thead><tr><th>Date</th><th>Entry</th><th>Description</th><th>Amount</th><th>Balance after</th></tr></thead><tbody>{ledgerEntries.length ? ledgerEntries.map((entry: LedgerItem) => <tr key={entry.id}><td><span className="ap-date">{dateLabel(entry.createdAt)}</span></td><td>{renderStatus(entry.type)}</td><td>{entry.description || entry.referenceType || 'Financial entry'}</td><td className={entry.amountKobo >= 0 ? 'ap-money' : 'ap-money ap-money--debit'}>{entry.amountKobo >= 0 ? '+' : '−'}{naira(Math.abs(entry.amountKobo) / 100)}</td><td className="ap-number">{naira(entry.balanceAfterKobo / 100)}</td></tr>) : <tr><td colSpan={5}><div className="ap-table-empty">No ledger movements recorded yet.</div></td></tr>}</tbody></table></div></section><section className="ap-panel ap-commission-mini"><div className="ap-panel-heading"><div><div className="ap-eyebrow">COMMISSION DETAIL</div><h2>Recent commissions</h2></div><button className="ap-text-link" onClick={() => openTab('commissions')}>View referrals <ArrowRight size={14} /></button></div>{commissions.length ? <div className="ap-activity-list">{commissions.slice(0, 5).map((commission) => <div className="ap-activity-row" key={commission.id}><div className="ap-activity-main"><strong>{commission.productName || commission.orderNumber}</strong><span>Order {commission.orderNumber} · {dateLabel(commission.createdAt)}</span></div><div className="ap-activity-value"><strong>{naira(commission.amountNGN)}</strong>{renderStatus(commission.status)}</div></div>)}</div> : <p className="ap-muted">Commissions will appear here when orders are attributed.</p>}</section></div>}

          {activeTab === 'payouts' && <div className="ap-page-content ap-section-stack"><div className="ap-withdrawal-summary"><article className="ap-balance-feature"><div className="ap-eyebrow">AVAILABLE TO WITHDRAW</div><strong>{naira(available)}</strong><span>Only approved available commissions can be requested. Pending commissions are not withdrawable.</span></article><div className="ap-stat-card ap-stat-card--small"><span>Pending commissions</span><strong>{naira(pending)}</strong><small>Not yet available</small></div><div className="ap-stat-card ap-stat-card--small"><span>Total paid</span><strong>{naira(paid)}</strong><small>Recorded payouts</small></div></div><div className="ap-payout-layout"><section className="ap-panel ap-withdrawal-form"><div className="ap-panel-heading"><div><div className="ap-eyebrow">PAYOUT REQUEST</div><h2>Request a withdrawal</h2></div><CreditCard size={19} /></div><p className="ap-muted">Choose an amount up to your available balance. Your saved bank details will be used.</p>{payoutError && <div className="ap-form-alert ap-form-alert--error">{payoutError}</div>}{payoutSuccess && <div className="ap-form-alert ap-form-alert--success"><CheckCircle2 size={17} />{payoutSuccess}</div>}<form onSubmit={handleRequestPayout} className="ap-form-stack"><label>Amount in naira<div className="ap-amount-input"><span>₦</span><input type="number" required min={minimumPayoutNGN || 0.01} max={available} step="0.01" value={payoutAmountNGN || ''} onChange={(event) => setPayoutAmountNGN(Number(event.target.value) || 0)} placeholder="0.00" /></div><small>{minimumPayoutNGN > 0 ? `Current minimum: ${naira(minimumPayoutNGN)} (program setting)` : 'No minimum amount is currently configured.'}</small></label><div className="ap-destination"><span className="ap-eyebrow">SAVED DESTINATION</span><strong>{currentUser.bankName || 'No bank saved'}</strong><span>{currentUser.accountNumber ? `••••••${currentUser.accountNumber.slice(-4)}` : 'Add an account number in Settings'}{currentUser.accountName ? ` · ${currentUser.accountName}` : ''}</span><button type="button" className="ap-text-link" onClick={() => openTab('profile')}>Manage bank details <ArrowRight size={14} /></button></div><label>Note for the finance team <span className="ap-optional">Optional</span><textarea rows={3} maxLength={500} value={payoutNotes} onChange={(event) => setPayoutNotes(event.target.value)} placeholder="Add a note if needed" /></label><button className="ap-button ap-button--dark ap-button--full" type="submit" disabled={isSubmittingPayout || available <= 0 || payoutAmountNGN <= 0 || payoutAmountNGN > available || (minimumPayoutNGN > 0 && payoutAmountNGN < minimumPayoutNGN)}>{isSubmittingPayout ? 'Submitting request…' : <><Wallet size={16} /> Request withdrawal</>}</button></form></section><section className="ap-panel ap-table-panel"><div className="ap-section-toolbar ap-section-toolbar--inside"><div><div className="ap-eyebrow">PAYOUT HISTORY</div><h2>Withdrawal requests</h2></div></div><div className="ap-table-scroll"><table className="ap-table"><thead><tr><th>Date requested</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead><tbody>{payouts.length ? payouts.map((payout: PayoutItem) => <tr key={payout.id}><td>{dateLabel(payout.requestedAt)}</td><td>{payout.payoutReference || 'Awaiting reference'}</td><td className="ap-money">{naira(payout.amountNGN)}</td><td>{renderStatus(payout.status)}</td></tr>) : <tr><td colSpan={4}><div className="ap-table-empty">Your withdrawal requests will appear here.</div></td></tr>}</tbody></table></div></section></div></div>}

          {activeTab === 'media' && <div className="ap-page-content ap-section-stack"><div className="ap-media-intro"><div className="ap-eyebrow">OFFICIAL PIERCYN CREATIVE</div><h2>Make the story yours.</h2><p>Browse the current media kit and use the original files to bring your own point of view to the pieces you share.</p></div>{mediaAssets.length ? <div className="ap-media-grid">{mediaAssets.map((asset: MediaItem) => <article className="ap-panel ap-media-card" key={asset.id}><button className="ap-media-preview" onClick={() => window.open(asset.url, '_blank', 'noopener,noreferrer')} aria-label={`Preview ${asset.title}`}>{asset.thumbnailUrl || asset.url ? <img src={asset.thumbnailUrl || asset.url} alt={asset.title} loading="lazy" /> : <ImageIcon size={26} />}<span>{asset.mediaType}</span></button><div className="ap-media-copy"><div className="ap-eyebrow">{asset.category}</div><h3>{asset.title}</h3>{asset.description && <p>{asset.description}</p>}<div className="ap-media-meta">{asset.dimensions && <span>{asset.dimensions}</span>}{asset.fileSize && <span>{asset.fileSize}</span>}</div><div className="ap-media-actions"><button onClick={async () => { try { await navigator.clipboard.writeText(asset.url); setToast('Media link copied'); } catch { setToast('Could not copy media link'); } }}><Copy size={14} /> Copy link</button><a href={asset.downloadUrl || asset.url} target="_blank" rel="noreferrer" download><Download size={14} /> Download <ArrowDownToLine size={13} /></a></div></div></article>)}</div> : <div className="ap-empty-state"><span className="ap-empty-mark"><ImageIcon size={22} /></span><h3>New assets are on the way</h3><p>There are no active promotional files available in the media library right now. Please check back later or contact PIERCYN support.</p><button className="ap-button ap-button--light-border" onClick={() => openTab('support')}><Headphones size={15} /> Contact support</button></div>}</div>}

          {activeTab === 'profile' && <div className="ap-page-content ap-settings-layout"><section className="ap-settings-identity"><span className="ap-settings-avatar">{(currentUser.firstName?.[0] || 'P')}{(currentUser.lastName?.[0] || '')}</span><div className="ap-eyebrow">AFFILIATE PROFILE</div><h2>{currentUser.firstName} {currentUser.lastName}</h2><span>{currentUser.email}</span><div className="ap-settings-meta"><span>Affiliate ID</span><strong>{currentUser.id}</strong></div><div className="ap-settings-meta"><span>Account status</span>{renderStatus(currentUser.status)}</div></section><section className="ap-panel ap-form-panel ap-profile-form"><div className="ap-panel-heading"><div><div className="ap-eyebrow">YOUR DETAILS</div><h2>Profile & payout details</h2></div><BadgeCheck size={19} /></div><p className="ap-muted">Keep your creator channels and settlement details current.</p>{profileError && <div className="ap-form-alert ap-form-alert--error">{profileError}</div>}{profileSuccess && <div className="ap-form-alert ap-form-alert--success"><CheckCircle2 size={17} />{profileSuccess}</div>}<form onSubmit={handleSaveProfile} className="ap-form-grid"><div className="ap-form-section-title">Payout destination</div><label>Bank name<input required value={profileForm.bankName} onChange={(event) => setProfileForm({ ...profileForm, bankName: event.target.value })} placeholder="Bank name" /></label><label>Account number<input required maxLength={10} inputMode="numeric" value={profileForm.accountNumber} onChange={(event) => setProfileForm({ ...profileForm, accountNumber: event.target.value })} placeholder="10-digit account number" /></label><label>Account holder name<input required value={profileForm.accountName} onChange={(event) => setProfileForm({ ...profileForm, accountName: event.target.value })} placeholder="Name on bank account" /></label><div className="ap-form-section-title">Creator channels</div><label>Instagram<input value={profileForm.instagram} onChange={(event) => setProfileForm({ ...profileForm, instagram: event.target.value })} placeholder="@yourhandle" /></label><label>TikTok<input value={profileForm.tiktok} onChange={(event) => setProfileForm({ ...profileForm, tiktok: event.target.value })} placeholder="@yourhandle" /></label><label>Other socials<input value={profileForm.otherSocials} onChange={(event) => setProfileForm({ ...profileForm, otherSocials: event.target.value })} placeholder="Other social links" /></label><label>Promotion channels<input value={profileForm.promotionChannels} onChange={(event) => setProfileForm({ ...profileForm, promotionChannels: event.target.value })} placeholder="Where you share content" /></label><label>Audience size<input value={profileForm.audienceSize} onChange={(event) => setProfileForm({ ...profileForm, audienceSize: event.target.value })} placeholder="Your audience range" /></label><div className="ap-form-actions ap-form-actions--wide"><button type="submit" className="ap-button ap-button--dark" disabled={isSavingProfile}>{isSavingProfile ? 'Saving…' : 'Save settings'}</button></div></form></section></div>}

          {activeTab === 'support' && <div className="ap-page-content ap-section-stack"><section className="ap-support-hero"><div><div className="ap-eyebrow">HERE WHEN YOU NEED US</div><h2>Good partnerships<br /><em>start with good support.</em></h2><p>Reach PIERCYN using the existing support channels below. For account-specific help, include your affiliate email and referral code.</p></div><Headphones size={42} strokeWidth={1.3} /></section><div className="ap-support-grid"><a className="ap-panel ap-support-card" href="mailto:director@piercyn.com"><span className="ap-support-icon"><Mail size={19} /></span><div className="ap-eyebrow">EMAIL</div><h3>Affiliate assistance</h3><p>For portal access, profile or earnings questions.</p><strong>director@piercyn.com <ArrowUpRight size={14} /></strong></a><a className="ap-panel ap-support-card" href="https://wa.me/2348076431059?text=Hello%20PIERCYN%2C%20I%20need%20help%20with%20the%20affiliate%20program." target="_blank" rel="noreferrer"><span className="ap-support-icon"><MessageCircle size={19} /></span><div className="ap-eyebrow">WHATSAPP</div><h3>Message PIERCYN</h3><p>Use the existing PIERCYN WhatsApp support channel.</p><strong>Open WhatsApp <ArrowUpRight size={14} /></strong></a><a className="ap-panel ap-support-card" href="/affiliate"><span className="ap-support-icon"><FileText size={19} /></span><div className="ap-eyebrow">PROGRAM GUIDE</div><h3>Affiliate program</h3><p>Review the public program overview and published FAQs.</p><strong>View program details <ArrowUpRight size={14} /></strong></a><a className="ap-panel ap-support-card" href="/contact"><span className="ap-support-icon"><ExternalLink size={19} /></span><div className="ap-eyebrow">HELP CENTRE</div><h3>Contact PIERCYN</h3><p>Visit the existing store contact page for general enquiries.</p><strong>Open contact page <ArrowUpRight size={14} /></strong></a></div><div className="ap-support-note"><ShieldCheck size={17} /><span>Withdrawals are processed according to the current PIERCYN program rules. Pending commissions remain separate from the available balance shown in Withdrawals.</span></div></div>}
        </>}
      </main>

      {toast && <div className="ap-toast" role="status"><CheckCircle2 size={17} />{toast}</div>}
      <footer className="ap-mobile-footer">PIERCYN · LAGOS, NIGERIA <button onClick={onBackToShop}>Shop PIERCYN <ArrowUpRight size={13} /></button></footer>
    </div>
  );
};
