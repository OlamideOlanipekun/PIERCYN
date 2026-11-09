import React, { useState, useEffect } from 'react';
import {
  AffiliateApiClient,
  AffiliateUser,
  DashboardStats,
  AffiliateLinkItem,
  CommissionItem,
  LedgerItem,
  PayoutItem,
  WalletSummary,
} from '../services/affiliateApi';
import { AffiliateDashboardTab, AffiliateNotification } from './types';
import { AffiliateLayout } from './dashboard/AffiliateLayout';
import { OverviewView } from './dashboard/views/OverviewView';
import { LinksView } from './dashboard/views/LinksView';
import { ProductsView } from './dashboard/views/ProductsView';
import { MediaView } from './dashboard/views/MediaView';
import { ReferralsView } from './dashboard/views/ReferralsView';
import { EarningsView } from './dashboard/views/EarningsView';
import { WithdrawalsView } from './dashboard/views/WithdrawalsView';
import { NotificationsView } from './dashboard/views/NotificationsView';
import { SettingsView } from './dashboard/views/SettingsView';

interface AffiliatePortalProps {
  initialUser: AffiliateUser;
  activeTab: AffiliateDashboardTab;
  onTabChange: (tab: AffiliateDashboardTab) => void;
  onLogout: () => void;
  onBackToShop: () => void;
}

export const AffiliatePortal: React.FC<AffiliatePortalProps> = ({
  initialUser,
  activeTab,
  onTabChange,
  onLogout,
  onBackToShop,
}) => {
  const [user, setUser] = useState<AffiliateUser>(initialUser);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [links, setLinks] = useState<AffiliateLinkItem[]>([]);
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Dynamic notification state
  const [notifications, setNotifications] = useState<AffiliateNotification[]>([]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, linksRes, commRes, ledgerRes, payoutsRes, walletRes] = await Promise.all([
        AffiliateApiClient.getDashboard().catch(() => ({ success: false, data: null })),
        AffiliateApiClient.getLinks().catch(() => ({ success: false, data: [] })),
        AffiliateApiClient.getCommissions().catch(() => ({ success: false, data: [] })),
        AffiliateApiClient.getLedger().catch(() => ({ success: false, data: [] })),
        AffiliateApiClient.getPayouts().catch(() => ({ success: false, data: [] })),
        AffiliateApiClient.getWallet().catch(() => ({ success: false, data: null })),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (linksRes.success && Array.isArray(linksRes.data)) setLinks(linksRes.data);
      if (commRes.success && Array.isArray(commRes.data)) setCommissions(commRes.data);
      if (ledgerRes.success && Array.isArray(ledgerRes.data)) setLedger(ledgerRes.data);
      if (payoutsRes.success && Array.isArray(payoutsRes.data)) setPayouts(payoutsRes.data);
      if (walletRes.success && walletRes.data) setWallet(walletRes.data);

      // Build real notification events
      const notifs: AffiliateNotification[] = [
        {
          id: 'notif-welcome',
          title: 'Welcome to the PIERCYN Creator Network',
          message: 'Your partner account is active. You earn ₦1,000 per delivered referral with 30-day cookie tracking.',
          timestamp: user.createdAt || new Date().toISOString(),
          type: 'announcement',
          isRead: false,
          linkTab: 'overview',
        },
      ];

      // If commissions exist, add recent commission alert
      if (commRes.success && Array.isArray(commRes.data) && commRes.data.length > 0) {
        const latest = commRes.data[0];
        notifs.push({
          id: `notif-comm-${latest.id}`,
          title: 'Referral Order Attributed',
          message: `Order #${latest.orderNumber} for "${latest.productName || 'PIERCYN piece'}" was attributed to your link. Commission: ₦1,000.`,
          timestamp: latest.createdAt,
          type: 'order',
          isRead: false,
          linkTab: 'referrals',
        });
      }

      // If payouts exist, add latest payout alert
      if (payoutsRes.success && Array.isArray(payoutsRes.data) && payoutsRes.data.length > 0) {
        const latestPayout = payoutsRes.data[0];
        notifs.push({
          id: `notif-payout-${latestPayout.id}`,
          title: `Withdrawal ${latestPayout.status}`,
          message: `Your withdrawal request of ₦${(latestPayout.amountNGN || latestPayout.amountKobo / 100).toLocaleString()} is currently ${latestPayout.status.toLowerCase()}.`,
          timestamp: latestPayout.requestedAt,
          type: 'payout',
          isRead: false,
          linkTab: 'withdrawals',
        });
      }

      // Add campaign announcement
      notifs.push({
        id: 'notif-campaign-drop',
        title: 'New Creative Assets Available in Media Library',
        message: 'High-resolution lookbooks and 9:16 vertical reels for the latest Lagos drop are now available for download.',
        timestamp: new Date().toISOString(),
        type: 'announcement',
        isRead: true,
        linkTab: 'media',
      });

      setNotifications(notifs);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const primaryReferralCode = links[0]?.referralCode || user.id.slice(0, 8);

  const availableBalanceNGN =
    wallet?.availableNGN ??
    stats?.earnings.availableNGN ??
    commissions
      .filter((c) => c.status === 'AVAILABLE')
      .reduce((acc, c) => acc + (c.amountNGN || c.amountKobo / 100), 0);

  return (
    <AffiliateLayout
      user={user}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onLogout={onLogout}
      onBackToShop={onBackToShop}
      unreadNotificationsCount={unreadCount}
      primaryReferralCode={primaryReferralCode}
    >
      {activeTab === 'overview' && (
        <OverviewView
          user={user}
          stats={stats}
          links={links}
          commissions={commissions}
          isLoading={isLoading}
          onNavigateTab={onTabChange}
          onOpenWithdrawModal={() => setIsWithdrawModalOpen(true)}
        />
      )}

      {activeTab === 'links' && (
        <LinksView
          links={links}
          onRefreshLinks={loadAllData}
          primaryReferralCode={primaryReferralCode}
        />
      )}

      {activeTab === 'products' && (
        <ProductsView
          primaryReferralCode={primaryReferralCode}
        />
      )}

      {activeTab === 'media' && (
        <MediaView
          primaryReferralCode={primaryReferralCode}
        />
      )}

      {activeTab === 'referrals' && (
        <ReferralsView
          commissions={commissions}
        />
      )}

      {activeTab === 'earnings' && (
        <EarningsView
          wallet={wallet}
          ledger={ledger}
          commissions={commissions}
          onOpenWithdrawModal={() => setIsWithdrawModalOpen(true)}
        />
      )}

      {activeTab === 'withdrawals' && (
        <WithdrawalsView
          user={user}
          availableNGN={availableBalanceNGN}
          payouts={payouts}
          isWithdrawModalOpen={isWithdrawModalOpen}
          onOpenWithdrawModal={() => setIsWithdrawModalOpen(true)}
          onCloseWithdrawModal={() => setIsWithdrawModalOpen(false)}
          onRefreshPayouts={loadAllData}
          onNavigateTab={onTabChange}
        />
      )}

      {activeTab === 'notifications' && (
        <NotificationsView
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllRead}
          onMarkAsRead={handleMarkAsRead}
          onNavigateTab={onTabChange}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsView
          user={user}
          onUpdateUser={(updated) => setUser(updated)}
          onLogout={onLogout}
          primaryReferralCode={primaryReferralCode}
        />
      )}
    </AffiliateLayout>
  );
};
