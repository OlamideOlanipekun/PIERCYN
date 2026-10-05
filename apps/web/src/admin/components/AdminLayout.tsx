import React, { useState, useEffect } from 'react';
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
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative w-72 max-w-[80vw] bg-[#121212] border-r border-[#242424] h-full flex flex-col justify-between p-4 z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#242424] mb-4">
                <div className="flex items-center gap-2.5">
                  <PiercynMonogram size={26} className="text-[#F2F0EB]" />
                  <span className="font-editorial italic text-lg text-[#F2F0EB]">PIERCYN</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
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
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                        isActive
                          ? 'bg-[#F2F0EB] text-[#0A0A0A] font-semibold'
                          : 'text-[#A3A199] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-700 text-white font-bold">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#242424]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onBackToStore();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#A3A199] hover:text-[#F2F0EB] hover:bg-white/5"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Return to Storefront</span>
              </button>

              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 bg-red-950/30 border border-red-900/50 hover:bg-red-950/60"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN VIEW AREA (Top Bar + Scrollable Content) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0E0E0E]/95 backdrop-blur-md border-b border-[#242424] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#F2F0EB] tracking-tight flex items-center gap-2">
                <span>{title}</span>
              </h1>
              <p className="hidden sm:block text-[11px] text-[#A3A199] font-sans truncate max-w-xl">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Quick Search & Operational Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Universal Search Trigger */}
            <button
              id="admin-search-trigger"
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181818] border border-[#2D2D2D] text-xs text-[#A3A199] hover:text-[#F2F0EB] hover:border-neutral-500 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search order, SKU, client...</span>
              <kbd className="hidden md:inline text-[9px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-neutral-400">
                ⌘K
              </kbd>
            </button>

            {/* Refresh Button */}
            {onRefreshData && (
              <button
                onClick={onRefreshData}
                disabled={isRefreshing}
                title="Refresh Live Data"
                className="p-2 rounded-lg bg-[#181818] border border-[#2D2D2D] text-[#A3A199] hover:text-[#F2F0EB] hover:border-neutral-500 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
              </button>
            )}

            {/* Operational Alerts Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                className="p-2 rounded-lg bg-[#181818] border border-[#2D2D2D] text-[#A3A199] hover:text-[#F2F0EB] hover:border-neutral-500 transition-colors cursor-pointer relative"
              >
                <Bell className="w-3.5 h-3.5" />
                {alerts && alerts.totalAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                )}
              </button>

              {showAlertsDropdown && alerts && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#161616] border border-[#2E2E2E] rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <span className="text-xs font-mono tracking-widest text-[#F2F0EB] font-bold uppercase flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>OPERATIONAL ATTENTION</span>
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
                            <span className="text-neutral-400 truncate max-w-[120px]">{ord.customerName}</span>
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
                            <span className="truncate max-w-[140px] font-medium">{it.productName}</span>
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
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* UNIVERSAL SEARCH MODAL */}
      {/* ------------------------------------------------------------- */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#242424] flex items-center gap-3">
              <Search className="w-4 h-4 text-neutral-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order #, client name, phone, product or SKU..."
                className="w-full bg-transparent text-sm text-[#F2F0EB] placeholder:text-neutral-600 outline-hidden font-sans"
              />
              <button
                onClick={() => {
                  setSearchModalOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
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
