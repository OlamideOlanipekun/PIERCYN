import React, { useState, useEffect } from 'react';
import {
  AdminAnalyticsSummary,
  AdminOrder,
  AdminAlerts,
  AdminNavTab,
} from '../types';
import { AdminApi } from '../api';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Layers,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight,
  Package,
  Calendar,
  AlertCircle,
  Truck,
  Loader2,
} from 'lucide-react';

interface DashboardHomeViewProps {
  onSelectTab: (tab: AdminNavTab) => void;
  onOpenOrder: (orderId: string) => void;
}

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({
  onSelectTab,
  onOpenOrder,
}) => {
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [alerts, setAlerts] = useState<AdminAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<'today' | '7days' | '30days'>('7days');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsData, ordersData, alertsData] = await Promise.all([
        AdminApi.getAnalytics(),
        AdminApi.getOrders({ limit: 6 }),
        AdminApi.getAlerts(),
      ]);
      setAnalytics(analyticsData);
      setRecentOrders(ordersData);
      setAlerts(alertsData);
    } catch (err: any) {
      setError(err.message || 'Unable to load operational dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#F2F0EB]" />
        <span className="text-xs font-mono text-[#A3A199] uppercase tracking-widest">
          SYNCING OPERATIONS COMMAND...
        </span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-8 bg-red-950/20 border border-red-800/40 rounded-2xl max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
        <h3 className="font-bold text-sm text-[#F2F0EB]">Operations Data Unavailable</h3>
        <p className="text-xs text-neutral-400">{error || 'Please check network connection.'}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-[#F2F0EB] text-[#0A0A0A] rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white cursor-pointer"
        >
          RETRY SYNC
        </button>
      </div>
    );
  }

  // Active trend points based on period
  const trendPoints =
    trendPeriod === '30days'
      ? analytics.salesTrends.last30Days
      : analytics.salesTrends.last7Days;

  const maxRevenueInTrend = Math.max(
    ...trendPoints.map((p) => p.revenueNGN || 0),
    50000
  );
  const inventoryAlerts = [
    ...(alerts?.outOfStockVariants ?? []).map((item) => ({ ...item, alertType: 'OUT_OF_STOCK' as const })),
    ...analytics.lowStockItems.map((item) => ({ ...item, alertType: 'LOW_STOCK' as const })),
  ].slice(0, 4);

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP PRIMARY KPI CARDS (REVENUE, PAID ORDERS, UNITS, AOV) */}
      {/* ------------------------------------------------------------- */}
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-[#A3A199] truncate">
            FINANCIAL &amp; SALES PULSE
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40 shrink-0">
            LIVE DATA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: REVENUE */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#262626] hover:border-neutral-600 transition-colors min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199] block mb-1">
              TOTAL REVENUE
            </span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#F2F0EB] font-mono truncate">
              ₦{(analytics.revenueNGN || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 font-sans">
              Gross sales collected
            </p>
          </div>

          {/* Card 2: PAID ORDERS */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#262626] hover:border-neutral-600 transition-colors min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199] block mb-1">
              PAID ORDERS
            </span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#F2F0EB] font-mono truncate">
              {analytics.paidOrders}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 font-sans">
              {analytics.totalOrders} total inquiries
            </p>
          </div>

          {/* Card 3: UNITS SOLD */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#262626] hover:border-neutral-600 transition-colors min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199] block mb-1">
              UNITS SOLD
            </span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#F2F0EB] font-mono truncate">
              {analytics.unitsSold}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 font-sans">
              Units in paid orders
            </p>
          </div>

          {/* Card 4: AVERAGE ORDER VALUE */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#262626] hover:border-neutral-600 transition-colors min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199] block mb-1">
              AVERAGE ORDER VALUE
            </span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#F2F0EB] font-mono truncate">
              ₦{(analytics.averageOrderValueNGN || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 font-sans">
              Per paid order
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. OPERATIONAL STATUS METRICS (PENDING, LOW STOCK, OUT, CLIENTS) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 min-w-0">
        {/* PENDING ORDERS */}
        <div
          onClick={() => onSelectTab('orders')}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer min-w-0 ${
            analytics.pendingOrders > 0
              ? 'bg-amber-950/20 border-amber-800/50 hover:border-amber-500'
              : 'bg-[#141414] border-[#262626] hover:border-neutral-600'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-[#A3A199] truncate">
              PENDING
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-[#F2F0EB] mt-1 font-mono">
            {analytics.pendingOrders}
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1 truncate">
            {alerts?.ordersNeedingAttention?.length || 0} await dispatch
          </span>
        </div>

        {/* LOW STOCK */}
        <div
          onClick={() => onSelectTab('inventory')}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer min-w-0 ${
            analytics.lowStockVariantsCount > 0
              ? 'bg-amber-950/20 border-amber-800/50 hover:border-amber-500'
              : 'bg-[#141414] border-[#262626] hover:border-neutral-600'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-[#A3A199] truncate">
              LOW STOCK
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-[#F2F0EB] mt-1 font-mono">
            {analytics.lowStockVariantsCount}
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1 truncate">
            ≤ 5 units left
          </span>
        </div>

        {/* OUT OF STOCK */}
        <div
          onClick={() => onSelectTab('inventory')}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer min-w-0 ${
            alerts?.outOfStockVariants && alerts.outOfStockVariants.length > 0
              ? 'bg-rose-950/20 border-rose-800/50 hover:border-rose-500'
              : 'bg-[#141414] border-[#262626] hover:border-neutral-600'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-[#A3A199] truncate">
              OUT OF STOCK
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-[#F2F0EB] mt-1 font-mono">
            {alerts?.outOfStockVariants?.length || 0}
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1 truncate">
            Needs restock
          </span>
        </div>

        {/* TOTAL AVAILABLE STOCK */}
        <div
          onClick={() => onSelectTab('inventory')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#141414] border border-[#262626] hover:border-neutral-600 transition-colors cursor-pointer min-w-0"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-[#A3A199] truncate">
              INVENTORY
            </span>
            <Package className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-[#F2F0EB] mt-1 font-mono">
            {analytics.totalAvailableStock}
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1 truncate">
            Valuation: ₦{(analytics.inventoryValuationAtRetailNGN || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SALES OVERVIEW & TREND CHART */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626] min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-0.5">
              SALES OVERVIEW
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#F2F0EB]">Revenue &amp; Units Movement</h2>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0A0A0A] border border-[#282828] text-xs font-mono self-start sm:self-auto">
            <button
              onClick={() => setTrendPeriod('today')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer min-h-[32px] ${
                trendPeriod === 'today'
                  ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold'
                  : 'text-[#A3A199] hover:text-[#F2F0EB]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTrendPeriod('7days')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer min-h-[32px] ${
                trendPeriod === '7days'
                  ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold'
                  : 'text-[#A3A199] hover:text-[#F2F0EB]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTrendPeriod('30days')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer min-h-[32px] ${
                trendPeriod === '30days'
                  ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold'
                  : 'text-[#A3A199] hover:text-[#F2F0EB]'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {trendPeriod === 'today' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 py-2 sm:py-4 text-center">
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#1A1A1A] border border-[#2D2D2D]">
              <span className="text-[10px] font-mono text-[#A3A199] uppercase block mb-1">
                TODAY'S REVENUE
              </span>
              <span className="text-lg sm:text-2xl font-bold font-mono text-[#F2F0EB]">
                ₦{(analytics.salesTrends.today.revenueNGN || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#1A1A1A] border border-[#2D2D2D]">
              <span className="text-[10px] font-mono text-[#A3A199] uppercase block mb-1">
                TODAY'S ORDERS
              </span>
              <span className="text-lg sm:text-2xl font-bold font-mono text-[#F2F0EB]">
                {analytics.salesTrends.today.orders}
              </span>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#1A1A1A] border border-[#2D2D2D]">
              <span className="text-[10px] font-mono text-[#A3A199] uppercase block mb-1">
                TODAY'S UNITS
              </span>
              <span className="text-lg sm:text-2xl font-bold font-mono text-[#F2F0EB]">
                {analytics.salesTrends.today.unitsSold}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {trendPeriod === '30days' && (
              <div className="sm:hidden text-[10px] font-mono text-neutral-500 flex items-center justify-between">
                <span>← Scroll chart for 30-day timeline</span>
                <span>→</span>
              </div>
            )}
            {/* Visual Bar Graph */}
            <div className="overflow-x-auto pb-2 scrollbar-thin rounded-lg border border-[#202020]/60 p-2 sm:p-3 bg-[#0D0D0D]">
              <div className={`${trendPeriod === '30days' ? 'min-w-[560px]' : 'min-w-[280px]'}`}>
                <div className="h-40 sm:h-44 flex items-end gap-1.5 sm:gap-2 pt-4 px-2 border-b border-[#262626]">
                  {trendPoints.map((pt, idx) => {
                    const heightPercent = maxRevenueInTrend > 0
                      ? Math.max(10, Math.round((pt.revenueNGN / maxRevenueInTrend) * 100))
                      : 10;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative min-w-[8px]">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-[#222] border border-[#333] px-2 py-1 rounded text-[10px] font-mono pointer-events-none whitespace-nowrap z-20 shadow-lg">
                          <div className="font-bold text-white">₦{(pt.revenueNGN || 0).toLocaleString()}</div>
                          <div className="text-neutral-400">{pt.orders || 0} ord • {pt.unitsSold || 0} pcs</div>
                        </div>

                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[32px] rounded-t transition-all ${
                            pt.revenueNGN > 0
                              ? 'bg-[#F2F0EB] group-hover:bg-white'
                              : 'bg-white/10'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Labels under bars */}
                <div className="flex justify-between px-2 pt-2 text-[10px] font-mono text-neutral-500">
                  {trendPoints.map((pt, idx) => (
                    <span key={idx} className="truncate max-w-[44px] text-center">
                      {pt.label.split(',')[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. RECENT ORDERS & OPERATIONAL ATTENTION */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Left 2 Cols: Recent Orders Table */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626] min-w-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-0.5">
                DISPATCH PIPELINE
              </span>
              <h3 className="text-base font-bold text-[#F2F0EB]">Recent Orders</h3>
            </div>
            <button
              onClick={() => onSelectTab('orders')}
              className="text-xs font-mono text-[#A3A199] hover:text-[#F2F0EB] flex items-center gap-1 cursor-pointer transition-colors min-h-[36px]"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 font-mono text-xs">
              No orders placed yet. Orders will appear live once clients checkout.
            </div>
          ) : (
            <div>
              {/* MOBILE CARD VIEW (< md) */}
              <div className="md:hidden space-y-2.5">
                {recentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => onOpenOrder(ord.id)}
                    className="p-3.5 rounded-xl bg-[#181818] border border-[#262626] hover:border-neutral-500 active:bg-white/5 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-[#F2F0EB]">
                        #{ord.orderNumber}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                          ord.orderStatus === 'DELIVERED' || ord.orderStatus === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                            : ord.orderStatus === 'SHIPPED'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800/40'
                            : ord.orderStatus === 'PAID' || ord.orderStatus === 'PACKED' || ord.orderStatus === 'PROCESSING'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {ord.orderStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs">
                      <div>
                        <div className="font-medium text-[#F2F0EB]">{ord.customerName}</div>
                        <div className="text-[11px] text-neutral-400">{ord.shippingCity}</div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-[10px] text-neutral-400 block">
                          {(ord.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0)} pcs
                        </span>
                        <span className="font-bold text-[#F2F0EB]">
                          ₦{(ord.totalNGN || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#242424] flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="font-mono text-[10px]">
                        {new Date(ord.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-neutral-300 font-mono text-[10px] flex items-center gap-1 hover:text-white">
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW (>= md) */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-[#202020]">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[#262626] bg-[#0E0E0E] text-[10px] font-mono text-[#A3A199] uppercase tracking-wider">
                      <th className="py-2.5 px-3 font-normal">Order ID</th>
                      <th className="py-2.5 px-3 font-normal">Customer</th>
                      <th className="py-2.5 px-3 font-normal">Items</th>
                      <th className="py-2.5 px-3 font-normal">Amount</th>
                      <th className="py-2.5 px-3 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202020]">
                    {recentOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => onOpenOrder(ord.id)}
                        className="hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-[#F2F0EB] group-hover:underline">
                          #{ord.orderNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-[#F2F0EB]">{ord.customerName}</div>
                          <div className="text-[10px] text-neutral-400 truncate max-w-[140px]">{ord.shippingCity}</div>
                        </td>
                        <td className="py-3 px-3 text-neutral-300 font-mono">
                          {(ord.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0)} pcs
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-[#F2F0EB]">
                          ₦{(ord.totalNGN || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                              ord.orderStatus === 'DELIVERED' || ord.orderStatus === 'COMPLETED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                                : ord.orderStatus === 'SHIPPED'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800/40'
                                : ord.orderStatus === 'PAID' || ord.orderStatus === 'PACKED' || ord.orderStatus === 'PROCESSING'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {ord.orderStatus.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Low Stock & Fast Sellers */}
        <div className="space-y-6 min-w-0">
          {/* Low and Out-of-Stock Alerts */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#262626] min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199]">
                STOCK ALERTS
              </span>
              <button
                onClick={() => onSelectTab('inventory')}
                className="text-[11px] font-mono text-amber-400 hover:underline cursor-pointer"
              >
                Restock
              </button>
            </div>

            {inventoryAlerts.length === 0 ? (
              <p className="text-xs text-neutral-500 font-mono py-4 text-center">
                No low-stock or out-of-stock variants.
              </p>
            ) : (
              <div className="space-y-2">
                {inventoryAlerts.map((it) => (
                  <div
                    key={it.variantId}
                    onClick={() => onSelectTab('inventory')}
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-[#F2F0EB] truncate max-w-[150px]">{it.productName}</h4>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {it.colour} / {it.size}
                      </span>
                    </div>
                    <span className={`font-mono font-bold ${it.alertType === 'OUT_OF_STOCK' ? 'text-red-400' : 'text-amber-400'}`}>
                      {it.alertType === 'OUT_OF_STOCK' ? 'OUT OF STOCK' : `${it.availableStock} left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Winning Products (Cycle 1 Learning) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#262626] min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-3">
              FASTEST SELLING PIECES
            </span>

            {analytics.topSellingProducts.length === 0 ? (
              <p className="text-xs text-neutral-500 font-mono py-4 text-center">
                Sales rankings will compute as orders finalize.
              </p>
            ) : (
              <div className="space-y-2.5">
                {analytics.topSellingProducts.slice(0, 3).map((tp, idx) => (
                  <div key={tp.productId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-neutral-500 font-mono text-[10px]">#{idx + 1}</span>
                      <div>
                        <h4 className="font-medium text-[#F2F0EB] truncate max-w-[140px]">{tp.productName}</h4>
                        <span className="text-[10px] font-mono text-neutral-400">{tp.unitsSold} units sold</span>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-[#F2F0EB]">
                      ₦{(tp.revenueNGN || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
