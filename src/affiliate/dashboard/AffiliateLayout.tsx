import React, { useState } from 'react';
import {
  LayoutDashboard,
  Link2,
  ShoppingBag,
  Image as ImageIcon,
  Receipt,
  Activity,
  Wallet,
  Bell,
  Settings,
  LogOut,
  ExternalLink,
  HelpCircle,
  FileText,
  Menu,
  X,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';
import { AffiliateUser } from '../../services/affiliateApi';
import { AffiliateDashboardTab } from '../types';
import { GuidelinesModal } from '../components/GuidelinesModal';
import { SupportModal } from '../components/SupportModal';

interface AffiliateLayoutProps {
  user: AffiliateUser;
  activeTab: AffiliateDashboardTab;
  onTabChange: (tab: AffiliateDashboardTab) => void;
  onLogout: () => void;
  onBackToShop: () => void;
  unreadNotificationsCount?: number;
  primaryReferralCode?: string;
  children: React.ReactNode;
}

export const AffiliateLayout: React.FC<AffiliateLayoutProps> = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
  onBackToShop,
  unreadNotificationsCount = 0,
  primaryReferralCode,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const primaryUrl = `https://piercyn.vercel.app/?ref=${primaryReferralCode || user.id.slice(0, 8)}`;

  const handleCopyPrimary = () => {
    navigator.clipboard.writeText(primaryUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const navItems: Array<{
    id: AffiliateDashboardTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'links', label: 'My Links', icon: Link2 },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'referrals', label: 'Referrals', icon: Receipt },
    { id: 'earnings', label: 'Earnings', icon: Activity },
    { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getPageTitle = (tab: AffiliateDashboardTab) => {
    switch (tab) {
      case 'overview':
        return { title: 'Dashboard Overview', subtitle: 'Your influence, live attribution, and wallet performance at a glance.' };
      case 'links':
        return { title: 'Referral Links', subtitle: 'Create, manage, and share trackable campaign links.' };
      case 'products':
        return { title: 'PIERCYN Catalog', subtitle: 'Browse Lagos-crafted pieces and generate product-specific referral links.' };
      case 'media':
        return { title: 'Creator Media Library', subtitle: 'Official campaign photography, reels, and copy-ready captions.' };
      case 'referrals':
        return { title: 'Attributed Referrals', subtitle: 'Transparent record of all customer orders attributed to your links.' };
      case 'earnings':
        return { title: 'Earnings & Ledger', subtitle: 'Accounting-grade record of commissions and wallet transactions.' };
      case 'withdrawals':
        return { title: 'Withdrawals & Payouts', subtitle: 'Request disbursements from your approved available balance.' };
      case 'notifications':
        return { title: 'Notification Center', subtitle: 'Important alerts regarding orders, payouts, and brand campaigns.' };
      case 'settings':
        return { title: 'Account Settings', subtitle: 'Manage your profile, verified Nigerian bank account, and security.' };
    }
  };

  const currentMeta = getPageTitle(activeTab);

  return (
    <div className="min-h-screen bg-[#F2F0EB] text-[#141414] font-sans antialiased flex flex-col md:flex-row selection:bg-[#141414] selection:text-white">
      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR                                          */}
      {/* ======================================================== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-[#E5E2DC] shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#E5E2DC]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onTabChange('overview')}
              className="text-2xl font-serif font-bold uppercase tracking-widest text-[#141414] hover:opacity-80 transition-opacity"
            >
              PIERCYN
            </button>
            <span className="text-[9px] uppercase tracking-[0.24em] font-semibold px-2 py-0.5 bg-[#F2F0EB] border border-[#E5E2DC] text-[#737373]">
              CREATOR
            </span>
          </div>
          <div className="mt-2 text-xs text-[#737373] truncate">
            {user.firstName} {user.lastName}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#141414] text-white'
                    : 'text-[#555555] hover:text-[#141414] hover:bg-[#F2F0EB]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-white text-[#141414]' : 'bg-[#141414] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Link Card in Sidebar */}
        <div className="p-4 mx-4 mb-4 bg-[#FAF8F5] border border-[#E5E2DC] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#737373]">
              Your Referral Link
            </span>
            <button
              onClick={handleCopyPrimary}
              className="text-[10px] font-bold uppercase tracking-wider text-[#141414] flex items-center gap-1 hover:underline"
            >
              {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="text-[11px] font-mono text-[#555555] truncate bg-white p-1.5 border border-[#E5E2DC]">
            {primaryUrl}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5E2DC] space-y-1 text-xs">
          <button
            onClick={() => setIsGuidelinesOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[#737373] hover:text-[#141414] hover:bg-[#F2F0EB] transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Affiliate Guidelines</span>
          </button>
          <button
            onClick={() => setIsSupportOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[#737373] hover:text-[#141414] hover:bg-[#F2F0EB] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Creator Support</span>
          </button>
          <button
            onClick={onBackToShop}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[#737373] hover:text-[#141414] hover:bg-[#F2F0EB] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[#7F1D1D] hover:bg-[#FDF2F2] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE TOP BAR                                           */}
      {/* ======================================================== */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#E5E2DC] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTabChange('overview')}
            className="text-xl font-serif font-bold uppercase tracking-widest text-[#141414]"
          >
            PIERCYN
          </button>
          <span className="text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 bg-[#F2F0EB] border border-[#E5E2DC] text-[#737373]">
            CREATOR
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTabChange('notifications')}
            className="relative p-2 text-[#555555] hover:text-[#141414]"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#141414] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-[#141414] hover:bg-[#F2F0EB]"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN CONTENT AREA                                        */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 bg-white border-b border-[#E5E2DC]">
          <div>
            <h1 className="text-xl font-serif font-medium text-[#141414] tracking-tight">
              {currentMeta.title}
            </h1>
            <p className="text-xs text-[#737373] mt-0.5 font-normal">
              {currentMeta.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Share Pill */}
            <button
              onClick={handleCopyPrimary}
              className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F2F0EB] border border-[#E5E2DC] text-xs font-semibold uppercase tracking-wider text-[#141414] flex items-center gap-2 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Copy Primary Link'}</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => onTabChange('notifications')}
              className="relative p-2 text-[#555555] hover:text-[#141414] hover:bg-[#F2F0EB] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#141414] rounded-full" />
              )}
            </button>

            {/* User Avatar & Dropdown */}
            <button
              onClick={() => onTabChange('settings')}
              className="flex items-center gap-2.5 pl-3 border-l border-[#E5E2DC] hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-[#141414] text-white text-xs font-semibold flex items-center justify-center">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-semibold text-[#141414] leading-tight">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-[10px] text-[#737373] uppercase tracking-wider">
                  Verified Partner
                </div>
              </div>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION                                 */}
      {/* ======================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E2DC] px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => onTabChange('overview')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold uppercase tracking-wider ${
            activeTab === 'overview' ? 'text-[#141414]' : 'text-[#737373]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onTabChange('links')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold uppercase tracking-wider ${
            activeTab === 'links' ? 'text-[#141414]' : 'text-[#737373]'
          }`}
        >
          <Link2 className="w-4 h-4 mb-0.5" />
          <span>Links</span>
        </button>

        <button
          onClick={() => onTabChange('products')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold uppercase tracking-wider ${
            activeTab === 'products' ? 'text-[#141414]' : 'text-[#737373]'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          <span>Shop</span>
        </button>

        <button
          onClick={() => onTabChange('earnings')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold uppercase tracking-wider ${
            activeTab === 'earnings' ? 'text-[#141414]' : 'text-[#737373]'
          }`}
        >
          <Activity className="w-4 h-4 mb-0.5" />
          <span>Earnings</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center py-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#737373]"
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span>More</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* MOBILE DRAWER SHEET                                      */}
      {/* ======================================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-up">
          <div className="w-full max-w-xs bg-white h-full flex flex-col justify-between shadow-2xl p-6">
            <div>
              <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4 mb-4">
                <span className="font-serif font-bold text-xl uppercase tracking-widest text-[#141414]">
                  PIERCYN
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-[#737373] hover:text-[#141414]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                        isActive ? 'bg-[#141414] text-white' : 'text-[#555555] hover:bg-[#F2F0EB]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-[#141414] text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#E5E2DC] pt-4 space-y-2 text-xs">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsGuidelinesOpen(true);
                }}
                className="w-full text-left py-2 text-[#737373] hover:text-[#141414]"
              >
                Operating Guidelines
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSupportOpen(true);
                }}
                className="w-full text-left py-2 text-[#737373] hover:text-[#141414]"
              >
                Creator Support
              </button>
              <button
                onClick={onBackToShop}
                className="w-full text-left py-2 text-[#141414] font-semibold"
              >
                Back to Storefront
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left py-2 text-[#7F1D1D] font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guidelines & Support Modals */}
      <GuidelinesModal isOpen={isGuidelinesOpen} onClose={() => setIsGuidelinesOpen(false)} />
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        affiliateEmail={user.email}
        affiliateCode={primaryReferralCode}
      />
    </div>
  );
};

