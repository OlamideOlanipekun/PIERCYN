import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { AdminNavTab, AdminAlerts } from '../types';
import { PiercynMonogram } from '../../components/PiercynLogo';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  BarChart3,
  History,
  Settings,
  LogOut,
  ExternalLink,
  Search,
  Bell,
  Menu,
  X,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  MoreHorizontal,
  TrendingUp,
} from 'lucide-react';
import { AdminApi } from '../api';

interface AdminLayoutProps {
  activeTab: AdminNavTab;
  onSelectTab: (tab: AdminNavTab) => void;
  onBackToStore: () => void;
  onOpenOrder?: (orderId: string) => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onSelectTab,
  onBackToStore,
  onOpenOrder,
  onRefreshData,
  isRefreshing = false,
  children,
}) => {
  const { admin, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    orders: any[];
    customers: any[];
    products: any[];
  }>({ orders: [], customers: [], products: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Operational alerts badge
  const [alerts, setAlerts] = useState<AdminAlerts | null>(null);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setShowAlertsDropdown(false);
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    AdminApi.getAlerts()
      .then((data) => setAlerts(data))
      .catch(() => {});
  }, [activeTab]);

  // Handle Universal Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ orders: [], customers: [], products: [] });
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      AdminApi.search(searchQuery.trim())
        .then((data) => setSearchResults(data))
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navItems: Array<{
    id: AdminNavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: alerts?.ordersNeedingAttention?.length || 0,
      badgeColor: 'bg-amber-600 text-white',
    },
    { id: 'products', label: 'Products', icon: Package },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Layers,
      badge: (alerts?.lowStockVariants?.length || 0) + (alerts?.outOfStockVariants?.length || 0),
      badgeColor: 'bg-rose-700 text-white',
    },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'affiliates', label: 'Affiliates', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Log', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getPageTitle = (tab: AdminNavTab): { title: string; subtitle: string } => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Operations Command',
          subtitle: 'Live Atelier overview, financial pulse & fulfillment priorities',
        };
      case 'orders':
        return {
          title: 'Order Management',
          subtitle: 'Verified payments, fulfillment pipeline & dispatch transitions',
        };
      case 'products':
        return {
          title: 'Product Catalog',
          subtitle: 'Garments, unit economics, status & active drops',
        };
      case 'inventory':
        return {
          title: 'Variant Inventory',
          subtitle: 'Real-time stock ledger, reservations & manual restock adjustments',
        };
      case 'customers':
        return {
          title: 'Customer Directory',
          subtitle: 'Atelier clients, lifetime spending & historical purchase logs',
        };
      case 'affiliates':
        return {
          title: 'Creator & Affiliate Program',
          subtitle: 'Partner applications, commission ledger, referral links & weekly bank payouts',
        };
      case 'analytics':
        return {
          title: 'Cycle 1 Learning',
          subtitle: 'Financial summary (Revenue − COGS = Gross Profit), sizes, colors & funnel',
        };
      case 'audit':
        return {
          title: 'Operations Audit Log',
          subtitle: 'Immutable record of order transitions, inventory adjustments & config edits',
        };
      case 'settings':
        return {
          title: 'Store Settings',
          subtitle: 'Shipping rules, free delivery threshold & gateway connectivity',
        };
    }
  };

  const { title, subtitle } = getPageTitle(activeTab);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#F2F0EB] flex font-sans selection:bg-[#F2F0EB] selection:text-[#0A0A0A]">
      {/* ------------------------------------------------------------- */}
      {/* DESKTOP SIDEBAR (Fixed Left) */}
      {/* ------------------------------------------------------------- */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[#242424] bg-[#121212] shrink-0 sticky top-0 h-screen select-none">
        <div>
          {/* Atelier Brand Header */}
          <div className="p-6 border-b border-[#242424] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PiercynMonogram size={30} className="text-[#F2F0EB]" />
              <div>
                <span className="font-editorial italic text-xl tracking-tight text-[#F2F0EB] block leading-none">
                  PIERCYN
                </span>
                <span className="text-[9px] font-mono tracking-[0.2em] text-[#A3A199] uppercase block mt-1">
                  V1 CONTROL ROOM
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F2F0EB] text-[#0A0A0A] font-semibold shadow-xs'
                      : 'text-[#A3A199] hover:text-[#F2F0EB] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#0A0A0A]' : 'text-[#A3A199]'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && item.badge > 0 ? (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-[#0A0A0A] text-[#F2F0EB]' : item.badgeColor || 'bg-white/10 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions & Profile */}
        <div className="p-4 border-t border-[#242424] space-y-3 bg-[#0F0F0F]">
          <button
            onClick={onBackToStore}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#A3A199] hover:text-[#F2F0EB] hover:bg-white/5 transition-colors cursor-pointer font-mono"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Storefront</span>
            </span>
            <span className="text-[10px] text-neutral-500">Live</span>
          </button>

          <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="overflow-hidden">
              <span className="text-[9px] font-mono text-[#A3A199] block uppercase tracking-wider">
                {admin?.role || 'ADMIN'}
              </span>
              <p className="text-xs font-semibold text-[#F2F0EB] truncate">
                {admin?.firstName ? `${admin.firstName} ${admin.lastName}` : admin?.email || 'Director'}
              </p>
            </div>
            <button
              onClick={() => logout()}
              title="Logout"
              className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE NAVIGATION DRAWER */}
      {/* ------------------------------------------------------------- */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="relative w-72 max-w-[85vw] bg-[#121212] border-r border-[#242424] h-full flex flex-col justify-between p-4 sm:p-5 z-10 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#242424] mb-4">
                <div className="flex items-center gap-2.5">
                  <PiercynMonogram size={26} className="text-[#F2F0EB]" />
                  <div>
                    <span className="font-editorial italic text-lg text-[#F2F0EB] block leading-none">PIERCYN</span>
                    <span className="text-[8px] font-mono tracking-[0.2em] text-[#A3A199] uppercase block mt-0.5">V1 CONTROL ROOM</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Nav Items */}
              <nav className="space-y-1" aria-label="Mobile Navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-medium tracking-wide transition-all min-h-[44px] cursor-pointer ${
                        isActive
                          ? 'bg-[#F2F0EB] text-[#0A0A0A] font-semibold shadow-xs'
                          : 'text-[#A3A199] hover:text-white hover:bg-white/5 active:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#0A0A0A]' : 'text-[#A3A199]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 ? (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-[#0A0A0A] text-[#F2F0EB]' : item.badgeColor || 'bg-rose-700 text-white'
                        }`}>
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Drawer Actions */}
            <div className="space-y-3 pt-4 border-t border-[#242424] mt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onBackToStore();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs text-[#A3A199] hover:text-[#F2F0EB] hover:bg-white/5 min-h-[42px] font-mono cursor-pointer transition-colors"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>Return to Storefront</span>
              </button>

              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="overflow-hidden min-w-0 pr-2">
                  <span className="text-[9px] font-mono text-[#A3A199] block uppercase tracking-wider">
                    {admin?.role || 'ADMIN'}
                  </span>
                  <p className="text-xs font-semibold text-[#F2F0EB] truncate">
                    {admin?.firstName ? `${admin.firstName} ${admin.lastName}` : admin?.email || 'Director'}
                  </p>
                </div>
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-2 text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN VIEW AREA (Top Bar + Scrollable Content) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-y-auto overflow-x-hidden">
        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0E0E0E]/95 backdrop-blur-md border-b border-[#242424] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 min-w-0 w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="lg:hidden flex items-center gap-1.5 shrink-0 mr-0.5">
              <PiercynMonogram size={22} className="text-[#F2F0EB]" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-[#F2F0EB] tracking-tight truncate">
                {title}
              </h1>
              <p className="hidden sm:block text-[11px] text-[#A3A199] font-sans truncate max-w-xl">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Quick Search & Operational Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Universal Search Trigger */}
            <button
              id="admin-search-trigger"
              onClick={() => setSearchModalOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-[#181818] border border-[#2D2D2D] text-xs text-[#A3A199] hover:text-[#F2F0EB] hover:border-neutral-500 transition-colors cursor-pointer min-h-[36px] flex items-center gap-2"
              aria-label="Open universal search"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline truncate max-w-[140px] md:max-w-none">Search order, SKU...</span>
              <kbd className="hidden md:inline text-[9px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-neutral-400 shrink-0">
                ⌘K
              </kbd>
            </button>

            {/* Refresh Button */}
            {onRefreshData && (
              <button
                onClick={onRefreshData}
                disabled={isRefreshing}
                aria-label="Refresh live data"
                className="p-2 rounded-lg bg-[#181818] border border-[#2D2D2D] text-[#A3A199] hover:text-[#F2F0EB] hover:border-neutral-500 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
              </button>
            )}

            {/* Operational Alerts Dropdown Trigger */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                aria-label={`Operational alerts${alerts && alerts.totalAlertsCount > 0 ? `, ${alerts.totalAlertsCount} items` : ''}`}
                aria-expanded={showAlertsDropdown}
                className="p-2 rounded-lg bg-[#181818] border border-[#2D2D2D] text-[#A3A199] hover:text-[#F2F0EB] hover:border-neutral-500 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center relative shrink-0"
              >
                <Bell className="w-3.5 h-3.5" />
                {alerts && alerts.totalAlertsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                )}
              </button>

              {showAlertsDropdown && alerts && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-1.25rem)] max-w-[340px] sm:w-80 bg-[#161616] border border-[#2E2E2E] rounded-xl shadow-2xl p-3.5 sm:p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                    <span className="text-xs font-mono tracking-widest text-[#F2F0EB] font-bold uppercase flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>OPERATIONAL ALERTS</span>
                    </span>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-neutral-300">
                      {alerts.totalAlertsCount} items
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-xs">
                    {/* Orders awaiting packing */}
                    {alerts.ordersNeedingAttention?.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40">
                        <span className="text-[10px] font-mono uppercase text-amber-300 font-bold block mb-1">
                          PAID ORDERS AWAITING FULFILLMENT ({alerts.ordersNeedingAttention.length})
                        </span>
                        {alerts.ordersNeedingAttention.slice(0, 3).map((ord) => (
                          <div
                            key={ord.id}
                            onClick={() => {
                              setShowAlertsDropdown(false);
                              if (onOpenOrder) onOpenOrder(ord.id);
                              else onSelectTab('orders');
                            }}
                            className="flex justify-between items-center py-1 hover:text-amber-200 cursor-pointer text-[11px]"
                          >
                            <span className="font-mono font-bold">#{ord.orderNumber}</span>
                            <span className="text-neutral-400 truncate max-w-[100px] sm:max-w-[120px]">{ord.customerName}</span>
                            <span className="font-mono">₦{ord.totalNGN.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Low Stock items */}
                    {alerts.lowStockVariants?.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40">
                        <span className="text-[10px] font-mono uppercase text-rose-300 font-bold block mb-1">
                          LOW STOCK PIECES ({alerts.lowStockVariants.length})
                        </span>
                        {alerts.lowStockVariants.slice(0, 3).map((it) => (
                          <div
                            key={it.variantId}
                            onClick={() => {
                              setShowAlertsDropdown(false);
                              onSelectTab('inventory');
                            }}
                            className="flex justify-between items-center py-1 hover:text-rose-200 cursor-pointer text-[11px]"
                          >
                            <span className="truncate max-w-[120px] sm:max-w-[140px] font-medium">{it.productName}</span>
                            <span className="text-neutral-400">{it.colour}/{it.size}</span>
                            <span className="font-mono text-rose-400 font-bold">{it.availableStock} left</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {alerts.totalAlertsCount === 0 && (
                      <p className="text-center py-4 text-neutral-500 font-mono text-xs">
                        All operations clear. No urgent alerts.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-28 lg:pb-8 min-w-0 w-full max-w-full overflow-x-hidden">{children}</main>

        {/* ------------------------------------------------------------- */}
        {/* MOBILE BOTTOM NAVIGATION BAR */}
        {/* ------------------------------------------------------------- */}
        <nav
          aria-label="Mobile Bottom Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-lg border-t border-[#242424] px-1 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none shadow-2xl"
        >
          {/* Home / Dashboard */}
          <button
            id="mobile-nav-dashboard"
            onClick={() => onSelectTab('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 min-h-[46px] rounded-lg transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#F2F0EB]' : 'text-[#888] hover:text-[#F2F0EB]'
            }`}
          >
            <div className="relative">
              <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[#F2F0EB]' : 'text-[#888]'}`} />
            </div>
            <span className={`text-[10px] tracking-tight mt-1 ${activeTab === 'dashboard' ? 'text-[#F2F0EB] font-bold' : 'text-[#888]'}`}>
              Home
            </span>
          </button>

          {/* Orders */}
          <button
            id="mobile-nav-orders"
            onClick={() => onSelectTab('orders')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 min-h-[46px] rounded-lg transition-colors cursor-pointer ${
              activeTab === 'orders' ? 'text-[#F2F0EB]' : 'text-[#888] hover:text-[#F2F0EB]'
            }`}
          >
            <div className="relative">
              <ShoppingBag className={`w-5 h-5 ${activeTab === 'orders' ? 'text-[#F2F0EB]' : 'text-[#888]'}`} />
              {alerts && alerts.ordersNeedingAttention?.length > 0 ? (
                <span className="absolute -top-1 -right-2 bg-amber-600 text-white font-mono text-[9px] font-bold px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center leading-none">
                  {alerts.ordersNeedingAttention.length}
                </span>
              ) : null}
            </div>
            <span className={`text-[10px] tracking-tight mt-1 ${activeTab === 'orders' ? 'text-[#F2F0EB] font-bold' : 'text-[#888]'}`}>
              Orders
            </span>
          </button>

          {/* Products */}
          <button
            id="mobile-nav-products"
            onClick={() => onSelectTab('products')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 min-h-[46px] rounded-lg transition-colors cursor-pointer ${
              activeTab === 'products' ? 'text-[#F2F0EB]' : 'text-[#888] hover:text-[#F2F0EB]'
            }`}
          >
            <div className="relative">
              <Package className={`w-5 h-5 ${activeTab === 'products' ? 'text-[#F2F0EB]' : 'text-[#888]'}`} />
            </div>
            <span className={`text-[10px] tracking-tight mt-1 ${activeTab === 'products' ? 'text-[#F2F0EB] font-bold' : 'text-[#888]'}`}>
              Products
            </span>
          </button>

          {/* Inventory */}
          <button
            id="mobile-nav-inventory"
            onClick={() => onSelectTab('inventory')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 min-h-[46px] rounded-lg transition-colors cursor-pointer ${
              activeTab === 'inventory' ? 'text-[#F2F0EB]' : 'text-[#888] hover:text-[#F2F0EB]'
            }`}
          >
            <div className="relative">
              <Layers className={`w-5 h-5 ${activeTab === 'inventory' ? 'text-[#F2F0EB]' : 'text-[#888]'}`} />
              {alerts && ((alerts.lowStockVariants?.length || 0) + (alerts.outOfStockVariants?.length || 0)) > 0 ? (
                <span className="absolute -top-1 -right-2 bg-rose-600 text-white font-mono text-[9px] font-bold px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center leading-none">
                  {(alerts.lowStockVariants?.length || 0) + (alerts.outOfStockVariants?.length || 0)}
                </span>
              ) : null}
            </div>
            <span className={`text-[10px] tracking-tight mt-1 ${activeTab === 'inventory' ? 'text-[#F2F0EB] font-bold' : 'text-[#888]'}`}>
              Inventory
            </span>
          </button>

          {/* More Menu */}
          <button
            id="mobile-nav-more"
            onClick={() => setMobileMenuOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 min-h-[46px] rounded-lg transition-colors cursor-pointer ${
              ['customers', 'analytics', 'audit', 'settings'].includes(activeTab)
                ? 'text-[#F2F0EB]'
                : 'text-[#888] hover:text-[#F2F0EB]'
            }`}
          >
            <div className="relative">
              <MoreHorizontal className={`w-5 h-5 ${['customers', 'analytics', 'audit', 'settings'].includes(activeTab) ? 'text-[#F2F0EB]' : 'text-[#888]'}`} />
              {['customers', 'analytics', 'audit', 'settings'].includes(activeTab) && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#F2F0EB]" />
              )}
            </div>
            <span className={`text-[10px] tracking-tight mt-1 ${['customers', 'analytics', 'audit', 'settings'].includes(activeTab) ? 'text-[#F2F0EB] font-bold' : 'text-[#888]'}`}>
              More
            </span>
          </button>
        </nav>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* UNIVERSAL SEARCH MODAL */}
      {/* ------------------------------------------------------------- */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-start justify-center pt-0 sm:pt-16 p-0 sm:p-4 bg-black/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Universal search"
        >
          <div className="w-full max-w-xl bg-[#141414] border border-[#2D2D2D] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 max-h-[92vh] sm:max-h-[85vh] flex flex-col">
            <div className="p-3 sm:p-4 border-b border-[#242424] flex items-center gap-2.5 sm:gap-3 shrink-0">
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order #, client, SKU..."
                className="w-full bg-transparent text-base sm:text-sm text-[#F2F0EB] placeholder:text-neutral-600 outline-hidden font-sans min-w-0"
              />
              <button
                onClick={() => {
                  setSearchModalOpen(false);
                  setSearchQuery('');
                }}
                className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-white/10 shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 text-xs">
              {isSearching ? (
                <div className="py-8 text-center text-neutral-500 font-mono">
                  SEARCHING ATELIER ARCHIVES...
                </div>
              ) : searchQuery &&
                searchResults.orders.length === 0 &&
                searchResults.customers.length === 0 &&
                searchResults.products.length === 0 ? (
                <div className="py-8 text-center text-neutral-500 font-mono">
                  NO MATCHING RECORDS FOUND FOR "{searchQuery}"
                </div>
              ) : (
                <>
                  {/* Matching Orders */}
                  {searchResults.orders.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-2">
                        ORDERS ({searchResults.orders.length})
                      </span>
                      <div className="space-y-1.5">
                        {searchResults.orders.map((ord) => (
                          <div
                            key={ord.id}
                            onClick={() => {
                              setSearchModalOpen(false);
                              if (onOpenOrder) onOpenOrder(ord.id);
                              else onSelectTab('orders');
                            }}
                            className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#F2F0EB]">#{ord.orderNumber}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/10 uppercase">
                                  {ord.orderStatus}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                {ord.customerName} • {ord.customerPhone}
                              </p>
                            </div>
                            <span className="font-mono font-semibold text-[#F2F0EB]">
                              ₦{ord.totalNGN.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Products */}
                  {searchResults.products.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-2">
                        PRODUCTS ({searchResults.products.length})
                      </span>
                      <div className="space-y-1.5">
                        {searchResults.products.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSearchModalOpen(false);
                              onSelectTab('products');
                            }}
                            className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {p.images?.[0] && (
                                <img
                                  src={p.images[0]}
                                  alt={p.name}
                                  className="w-8 h-8 object-cover rounded bg-neutral-800"
                                />
                              )}
                              <div>
                                <h4 className="font-medium text-[#F2F0EB]">{p.name}</h4>
                                <span className="text-[10px] text-neutral-400 uppercase font-mono">
                                  {p.categoryId.replace('cat-', '')}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-[#F2F0EB]">₦{p.priceNGN.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Customers */}
                  {searchResults.customers.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-2">
                        CUSTOMERS ({searchResults.customers.length})
                      </span>
                      <div className="space-y-1.5">
                        {searchResults.customers.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSearchModalOpen(false);
                              onSelectTab('customers');
                            }}
                            className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="font-medium text-[#F2F0EB]">{c.fullName}</p>
                              <span className="text-[11px] text-neutral-400">{c.email} • {c.phone}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-neutral-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
