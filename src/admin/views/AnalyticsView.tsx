import React, { useState, useEffect } from 'react';
import { AdminAnalyticsSummary } from '../types';
import { AdminApi } from '../api';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Percent,
  Layers,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  Users,
  Activity,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [trafficDays, setTrafficDays] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    AdminApi.getAnalytics(trafficDays)
      .then((data) => setAnalytics(data))
      .catch((err) => setError(err.message || 'Unable to load analytics'))
      .finally(() => setLoading(false));
  }, [trafficDays]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#F2F0EB]" />
        <span className="text-xs font-mono text-neutral-400">COMPUTING CYCLE 1 METRICS...</span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-800/40 rounded-xl text-center space-y-2">
        <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
        <p className="text-xs text-neutral-300">{error || 'Data unavailable.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-1">STOREFRONT TRAFFIC</span>
            <h2 className="text-base font-bold text-[#F2F0EB]">Who is visiting PIERCYN?</h2>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0A0A0A] border border-[#282828] text-xs font-mono self-start sm:self-auto">
            {([7, 30, 90] as const).map((days) => (
              <button key={days} type="button" onClick={() => setTrafficDays(days)} className={`px-3 py-1.5 rounded min-h-[32px] ${trafficDays === days ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold' : 'text-[#A3A199] hover:text-[#F2F0EB]'}`}>
                {days} Days
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'PAGE VIEWS', value: analytics.traffic.pageViews, note: 'Storefront page visits', Icon: Eye },
            { label: 'UNIQUE BROWSERS', value: analytics.traffic.uniqueVisitors, note: 'Estimated first-party IDs', Icon: Users },
            { label: 'SESSIONS', value: analytics.traffic.sessions, note: 'New after 30 min idle', Icon: Activity },
          ].map(({ label, value, note, Icon }) => (
            <div key={label} className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199]">{label}</span>
                <Icon className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#F2F0EB]">{value.toLocaleString()}</div>
              <p className="text-[10px] text-neutral-500 mt-1">{note} · last {trafficDays} days</p>
            </div>
          ))}
        </div>

        {!analytics.traffic.trackingEnabled ? (
          <p className="mt-4 p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-200">
            Traffic tracking is awaiting its database update. Counts will begin after activation; earlier visits cannot be recovered.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              Unique browsers are estimates, not named customers or cross-device people. PIERCYN stores the page path only (not query strings) and respects Do Not Track.
            </p>
            <div className="rounded-xl bg-white/5 border border-white/5 p-3">
              <div className="text-[9px] font-mono uppercase tracking-wider text-[#A3A199] mb-2">TOP PAGES</div>
              {analytics.traffic.topPages.length === 0 ? (
                <p className="text-[11px] text-neutral-500">No page visits recorded in this period.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.traffic.topPages.map((page) => (
                    <div key={page.path} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-mono text-neutral-300 truncate">{page.path}</span>
                      <span className="font-mono text-[#F2F0EB] shrink-0">{page.views.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 1. FINANCIAL SUMMARY (Revenue - COGS = Gross Profit) */}
      {/* ------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A3A199]">
            FINANCIAL STATEMENT (STRICT CYCLE 1 COGS)
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            Terminologically Accurate Gross Margin
          </span>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
          {/* Mobile: vertical stack with operators; Desktop: 4-col grid */}
          <div className="flex flex-col md:grid md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-stretch md:items-center">
            {/* 1. Gross Revenue */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199] block mb-1">
                GROSS REVENUE
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#F2F0EB]">
                ₦{(analytics.revenueNGN || 0).toLocaleString()}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1 font-sans">
                {analytics.paidOrders} completed customer transactions
              </p>
            </div>

            {/* Operator: minus */}
            <div className="flex items-center justify-center text-neutral-500 font-mono text-xl py-1 md:py-0">
              <span className="md:hidden">−</span>
              <span className="hidden md:block">−</span>
            </div>

            {/* 2. COGS (Cost of Goods Sold) */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300/80 block mb-1">
                COST OF GOODS SOLD (COGS)
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-300">
                ₦{(analytics.cogsNGN || 0).toLocaleString()}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1 font-sans">
                Direct atelier fabrication &amp; fabric cost
              </p>
            </div>

            {/* Operator: equals */}
            <div className="flex items-center justify-center text-neutral-500 font-mono text-xl py-1 md:py-0">
              =
            </div>

            {/* 3. Gross Profit — spans full on mobile, last col on desktop */}
            <div className="md:col-span-1 p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  GROSS PROFIT
                </span>
                <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded">
                  {analytics.grossMarginPercent}% Margin
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                ₦{(analytics.grossProfitNGN || 0).toLocaleString()}
              </div>
              <p className="text-[10px] text-emerald-300/70 mt-1 font-sans">
                Available contribution capital
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SIZES & COLORS BREAKDOWN (Cycle 1 Learning Questions) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Selling Sizes */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-1">
            SIZE DISTRIBUTION
          </span>
          <h3 className="text-sm font-bold text-[#F2F0EB] mb-4">Which sizes move fastest?</h3>

          {analytics.topSellingSizes.length === 0 ? (
            <p className="text-xs text-neutral-500 font-mono py-8 text-center">
              Size metrics compute as orders accumulate.
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.topSellingSizes.map((sz) => (
                <div key={sz.size} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-[#F2F0EB]">Size {sz.size}</span>
                    <span className="text-neutral-400">
                      {sz.unitsSold} units ({sz.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      style={{ width: `${sz.percentage}%` }}
                      className="h-full bg-[#F2F0EB] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Selling Colors */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-1">
            COLOR PALETTE DEMAND
          </span>
          <h3 className="text-sm font-bold text-[#F2F0EB] mb-4">Which colorways perform?</h3>

          {analytics.topSellingColors.length === 0 ? (
            <p className="text-xs text-neutral-500 font-mono py-8 text-center">
              Color metrics compute as orders accumulate.
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.topSellingColors.map((col) => (
                <div key={col.colour} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-semibold text-[#F2F0EB]">{col.colour}</span>
                    <span className="text-neutral-400">
                      {col.unitsSold} units ({col.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      style={{ width: `${col.percentage}%` }}
                      className="h-full bg-neutral-300 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CONVERSION FUNNEL (Drop-off Learning) */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-0.5">
              STOREFRONT CONVERSION FUNNEL
            </span>
            <h3 className="text-sm font-bold text-[#F2F0EB]">Where do clients drop off?</h3>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            Measured events · last {trafficDays} days
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 text-center">
          {/* Step 1: Views */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] sm:text-[10px] font-mono text-[#A3A199] uppercase block mb-1">
              1. PRODUCT VIEWS
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F2F0EB]">
              {analytics.funnel.productViews}
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">Catalog discovery</p>
          </div>

          {/* Step 2: Add to cart */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] sm:text-[10px] font-mono text-[#A3A199] uppercase block mb-0.5">
              2. ADD TO CART
            </span>
            <span className="text-[9px] font-mono text-emerald-400 block mb-1">
              ({analytics.funnel.viewToCartPercent}%)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F2F0EB]">
              {analytics.funnel.addToCart}
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">Items bagged</p>
          </div>

          {/* Step 3: Checkout Started */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] sm:text-[10px] font-mono text-[#A3A199] uppercase block mb-0.5">
              3. CHECKOUT
            </span>
            <span className="text-[9px] font-mono text-emerald-400 block mb-1">
              ({analytics.funnel.cartToCheckoutPercent}%)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F2F0EB]">
              {analytics.funnel.checkoutStarted}
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">Shipping entered</p>
          </div>

          {/* Step 4: Purchase Completed */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
            <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 uppercase block mb-0.5">
              4. PAID ORDER
            </span>
            <span className="text-[9px] font-mono text-emerald-300 block mb-1">
              ({analytics.funnel.checkoutToPurchasePercent}%)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
              {analytics.funnel.purchases}
            </div>
            <p className="text-[10px] text-emerald-400/70 mt-1">Payment finalized</p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. PRODUCT PERFORMANCE TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-0.5">
              SKU REORDER INTELLIGENCE
            </span>
            <h3 className="text-sm font-bold text-[#F2F0EB]">Product Performance Breakdown</h3>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            Sorted by velocity
          </span>
        </div>

        {/* Mobile product performance cards */}
        <div className="md:hidden space-y-2.5">
          {analytics.productPerformance.map((item) => (
            <div
              key={item.productId}
              className="p-3.5 rounded-xl bg-[#181818] border border-[#262626] space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-sm text-[#F2F0EB]">{item.productName}</span>
                <span className="text-[9px] font-mono text-neutral-400 uppercase bg-white/5 px-2 py-0.5 rounded shrink-0">
                  {item.category}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5 text-center font-mono text-xs">
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block">Units Sold</span>
                  <span className="font-bold text-[#F2F0EB]">{item.unitsSold}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block">Revenue</span>
                  <span className="font-bold text-[#F2F0EB] text-[11px]">₦{(item.revenueNGN || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block">Gross Profit</span>
                  <span className="font-bold text-emerald-400 text-[11px]">₦{(item.grossProfitNGN || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">{item.ordersCount} orders</span>
                <span className={item.currentStock <= 5 ? 'text-amber-400 font-bold' : 'text-neutral-400'}>
                  {item.currentStock} in stock
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop product performance table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#262626] text-[10px] font-mono text-[#A3A199] uppercase tracking-wider">
                <th className="py-2.5 font-normal">Product</th>
                <th className="py-2.5 font-normal">Category</th>
                <th className="py-2.5 font-normal">Units Sold</th>
                <th className="py-2.5 font-normal">Revenue</th>
                <th className="py-2.5 font-normal">Gross Profit</th>
                <th className="py-2.5 font-normal">Current Stock</th>
                <th className="py-2.5 font-normal text-right">Orders Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202020] font-mono">
              {analytics.productPerformance.map((item) => (
                <tr key={item.productId} className="hover:bg-white/5">
                  <td className="py-3 font-semibold text-[#F2F0EB] font-sans">
                    {item.productName}
                  </td>
                  <td className="py-3 text-neutral-400 uppercase text-[11px]">
                    {item.category}
                  </td>
                  <td className="py-3 font-bold text-[#F2F0EB]">
                    {item.unitsSold} pcs
                  </td>
                  <td className="py-3 text-[#F2F0EB]">
                    ₦{(item.revenueNGN || 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-emerald-400 font-semibold">
                    ₦{(item.grossProfitNGN || 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-neutral-300">
                    <span className={item.currentStock <= 5 ? 'text-amber-400 font-bold' : ''}>
                      {item.currentStock} units
                    </span>
                  </td>
                  <td className="py-3 text-right text-neutral-400">
                    {item.ordersCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
