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
        AdminApi.getOrders({ limit: 6 } as any),
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
    ...trendPoints.map((p) => p.revenueNGN),
    50000
  );

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP PRIMARY KPI CARDS (REVENUE, PAID ORDERS, UNITS, AOV) */}
      {/* ------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#A3A199]">
            FINANCIAL & SALES PULSE
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
            LIVE ATELIER DATA
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: REVENUE */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#262626] hover:border-neutral-600 transition-colors">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199] block mb-1">
              TOTAL REVENUE
            </span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#F2F0EB] truncate">
              ₦{analytics.revenueNGN.toLocaleString()}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 font-sans">
              Gross sales collected
            </p>
          </div>

          {/* Card 2: PAID ORDERS */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#262626] hover:border-neutral-600 transition-colors">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199] block mb-1">
              PAID ORDERS
            </span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#F2F0EB]">
              {analytics.paidOrders}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 font-sans">
              {analytics.totalOrders} total inquiries
            </p>
          </div>

          {/* Card 3: UNITS SOLD */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#262626] hover:border-neutral-600 transition-colors">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199] block mb-1">
              UNITS SOLD
            </span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#F2F0EB]">
              {analytics.unitsSold}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 font-sans">
              Garments dispatched
            </p>
          </div>

          {/* Card 4: AVERAGE ORDER VALUE */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#262626] hover:border-neutral-600 transition-colors">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199] block mb-1">
              AVERAGE ORDER VALUE
            </span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#F2F0EB] truncate">
              ₦{analytics.averageOrderValueNGN.toLocaleString()}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* PENDING ORDERS */}
        <div
          onClick={() => onSelectTab('orders')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            analytics.pendingOrders > 0
              ? 'bg-amber-950/20 border-amber-800/50 hover:border-amber-500'
              : 'bg-[#141414] border-[#262626] hover:border-neutral-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199]">
              PENDING ORDERS
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#F2F0EB] mt-1">
            {analytics.pendingOrders}
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1">
            {alerts?.ordersNeedingAttention?.length || 0} await packing/dispatch
          </span>
        </div>

        {/* LOW STOCK */}
        <div
          onClick={() => onSelectTab('inventory')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            analytics.lowStockVariantsCount > 0
              ? 'bg-amber-950/20 border-amber-800/50 hover:border-amber-500'
              : 'bg-[#141414] border-[#262626] hover:border-neutral-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199]">
              LOW STOCK PIECES
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#F2F0EB] mt-1">
            {analytics.lowStockVariantsCount}
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1">
            ≤ {5} units remaining
          </span>
        </div>

        {/* OUT OF STOCK */}
        <div
          onClick={() => onSelectTab('inventory')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            alerts?.outOfStockVariants && alerts.outOfStockVariants.length > 0
              ? 'bg-rose-950/20 border-rose-800/50 hover:border-rose-500'
              : 'bg-[#141414] border-[#262626] hover:border-neutral-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199]">
              OUT OF STOCK
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#F2F0EB] mt-1">
            {alerts?.outOfStockVariants?.length || 0}
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1">
            Requires atelier reorder
          </span>
        </div>

        {/* TOTAL AVAILABLE STOCK */}
        <div
          onClick={() => onSelectTab('inventory')}
          className="p-4 rounded-xl bg-[#141414] border border-[#262626] hover:border-neutral-600 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199]">
              INVENTORY PIECES
            </span>
            <Package className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#F2F0EB] mt-1">
            {analytics.totalAvailableStock}
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1 truncate">
            Valuation: ₦{analytics.inventoryValuationAtRetailNGN.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SALES OVERVIEW & TREND CHART */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-1">
              SALES OVERVIEW
            </span>
            <h2 className="text-lg font-bold text-[#F2F0EB]">Revenue & Units Movement</h2>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0A0A0A] border border-[#282828] text-xs font-mono">
            <button
              onClick={() => setTrendPeriod('today')}
              className={`px-3 py-1 rounded transition-colors ${
                trendPeriod === 'today'
                  ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold'
                  : 'text-[#A3A199] hover:text-[#F2F0EB]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTrendPeriod('7days')}
              className={`px-3 py-1 rounded transition-colors ${
                trendPeriod === '7days'
                  ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold'
                  : 'text-[#A3A199] hover:text-[#F2F0EB]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTrendPeriod('30days')}
              className={`px-3 py-1 rounded transition-colors ${
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-center">
            <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2D2D2D]">
              <span className="text-[10px] font-mono text-[#A3A199] uppercase block mb-1">
                TODAY'S REVENUE
              </span>
              <span className="text-2xl font-bold font-mono text-[#F2F0EB]">
                ₦{analytics.salesTrends.today.revenueNGN.toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2D2D2D]">
              <span className="text-[10px] font-mono text-[#A3A199] uppercase block mb-1">
                TODAY'S ORDERS
              </span>
              <span className="text-2xl font-bold font-mono text-[#F2F0EB]">
                {analytics.salesTrends.today.orders}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2D2D2D]">
              <span className="text-[10px] font-mono text-[#A3A199] uppercase block mb-1">
                TODAY'S UNITS
              </span>
              <span className="text-2xl font-bold font-mono text-[#F2F0EB]">
                {analytics.salesTrends.today.unitsSold}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visual Bar Graph */}
            <div className="h-44 flex items-end gap-2 pt-4 px-2 border-b border-[#262626]">
              {trendPoints.map((pt, idx) => {
                const heightPercent = maxRevenueInTrend > 0
                  ? Math.max(10, Math.round((pt.revenueNGN / maxRevenueInTrend) * 100))
                  : 10;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-[#222] border border-[#333] px-2 py-1 rounded text-[10px] font-mono pointer-events-none whitespace-nowrap z-20 shadow-lg">
                      <div className="font-bold text-white">₦{pt.revenueNGN.toLocaleString()}</div>
                      <div className="text-neutral-400">{pt.orders} ord • {pt.unitsSold} pcs</div>
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
            <div className="flex justify-between px-2 text-[10px] font-mono text-neutral-500">
              {trendPoints.map((pt, idx) => (
                <span key={idx} className="truncate max-w-[48px] text-center">
                  {pt.label.split(',')[0]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. RECENT ORDERS & OPERATIONAL ATTENTION */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Orders Table */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-0.5">
                DISPATCH PIPELINE
              </span>
              <h3 className="text-base font-bold text-[#F2F0EB]">Recent Orders</h3>
            </div>
            <button
              onClick={() => onSelectTab('orders')}
              className="text-xs font-mono text-[#A3A199] hover:text-[#F2F0EB] flex items-center gap-1 cursor-pointer transition-colors"
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#262626] text-[10px] font-mono text-[#A3A199] uppercase tracking-wider">
                    <th className="py-2.5 font-normal">Order ID</th>
                    <th className="py-2.5 font-normal">Customer</th>
                    <th className="py-2.5 font-normal">Items</th>
                    <th className="py-2.5 font-normal">Amount</th>
                    <th className="py-2.5 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020]">
                  {recentOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      onClick={() => onOpenOrder(ord.id)}
                      className="hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 font-mono font-bold text-[#F2F0EB] group-hover:underline">
                        #{ord.orderNumber}
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-[#F2F0EB]">{ord.customerName}</div>
                        <div className="text-[10px] text-neutral-400 truncate max-w-[140px]">{ord.shippingCity}</div>
                      </td>
                      <td className="py-3 text-neutral-300 font-mono">
                        {ord.items.reduce((sum, it) => sum + it.quantity, 0)} pcs
                      </td>
                      <td className="py-3 font-mono font-semibold text-[#F2F0EB]">
                        ₦{ord.totalNGN.toLocaleString()}
                      </td>
                      <td className="py-3">
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
          )}
        </div>

        {/* Right Col: Low Stock & Fast Sellers */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199]">
                LOW STOCK ALERT
              </span>
              <button
                onClick={() => onSelectTab('inventory')}
                className="text-[11px] font-mono text-amber-400 hover:underline cursor-pointer"
              >
                Restock
              </button>
            </div>

            {analytics.lowStockItems.length === 0 ? (
              <p className="text-xs text-neutral-500 font-mono py-4 text-center">
                All inventory levels healthy.
              </p>
            ) : (
              <div className="space-y-2">
                {analytics.lowStockItems.slice(0, 4).map((it) => (
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
                    <span className="font-mono text-amber-400 font-bold">
                      {it.availableStock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Winning Products (Cycle 1 Learning) */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626]">
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
                      ₦{tp.revenueNGN.toLocaleString()}
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
