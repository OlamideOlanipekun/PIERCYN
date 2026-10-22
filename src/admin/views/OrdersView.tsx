import React, { useState, useEffect } from 'react';
import { AdminOrder } from '../types';
import { AdminApi } from '../api';
import {
  Search,
  Calendar,
  ArrowRight,
  Loader2,
  X,
  MessageSquare,
  Bike,
} from 'lucide-react';

interface OrdersViewProps {
  onOpenOrder: (orderId: string) => void;
}

interface StatusTabConfig {
  id: string;
  label: string;
  orderStatus?: string;
  quoteStatus?: string;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onOpenOrder }) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedTabId, setSelectedTabId] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const statusTabs: StatusTabConfig[] = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'AWAITING_QUOTE', label: 'Awaiting Quote', quoteStatus: 'PENDING' },
    { id: 'QUOTE_READY', label: 'Quote Ready (SET)', quoteStatus: 'SET' },
    { id: 'QUOTE_SENT', label: 'Quote Sent (WA)', quoteStatus: 'SENT' },
    { id: 'QUOTE_ACCEPTED', label: 'Quote Accepted', quoteStatus: 'ACCEPTED' },
    { id: 'QUOTE_REJECTED', label: 'Quote Declined', quoteStatus: 'REJECTED' },
    { id: 'AWAITING_PAYMENT_VERIFICATION', label: 'Receipt Under Review', orderStatus: 'AWAITING_PAYMENT_VERIFICATION' },
    { id: 'PAID', label: 'Paid (Fulfill)', orderStatus: 'PAID' },
    { id: 'PROCESSING', label: 'Processing', orderStatus: 'PROCESSING' },
    { id: 'PACKED', label: 'Packed', orderStatus: 'PACKED' },
    { id: 'SHIPPED', label: 'Dispatched', orderStatus: 'SHIPPED' },
    { id: 'DELIVERED', label: 'Delivered', orderStatus: 'DELIVERED' },
    { id: 'PENDING_PAYMENT', label: 'Pending Payment', orderStatus: 'PENDING_PAYMENT' },
    { id: 'CANCELLED', label: 'Cancelled / Expired', orderStatus: 'CANCELLED' },
    { id: 'REFUNDED', label: 'Refunded', orderStatus: 'REFUNDED' },
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const activeTab = statusTabs.find((t) => t.id === selectedTabId) || statusTabs[0];

      const data = await AdminApi.getOrders({
        status: activeTab.orderStatus,
        quoteStatus: activeTab.quoteStatus,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedTabId, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const renderQuoteBadge = (quoteStatus?: string, fee?: number) => {
    switch (quoteStatus) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Quote Needed
          </span>
        );
      case 'SET':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700/50">
            <MessageSquare className="w-2.5 h-2.5" />
            Fee Set (Send WA)
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50">
            Quote Sent
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">
            Quote Accepted {fee ? `(₦${fee.toLocaleString()})` : ''}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700/50">
            Quote Declined
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. STATUS TABS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#242424] text-xs font-mono scrollbar-none -mx-1 px-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTabId(tab.id)}
            className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 min-h-[36px] ${
              selectedTabId === tab.id
                ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold shadow-xs'
                : 'text-[#A3A199] hover:text-[#F2F0EB] hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SEARCH & DATE FILTER BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-[#141414] border border-[#262626] flex flex-col gap-3 min-w-0">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order #, customer, email, phone..."
              className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg pl-9 pr-8 py-2 text-xs text-[#F2F0EB] placeholder:text-neutral-600 outline-hidden font-sans min-h-[40px]"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchOrders();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-3.5 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-[#F2F0EB] rounded-lg text-xs font-mono uppercase cursor-pointer shrink-0 min-h-[40px]"
          >
            SEARCH
          </button>
        </form>

        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-2.5 py-1.5 text-neutral-400 flex-1 min-w-0 min-h-[38px]">
              <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[#F2F0EB] outline-hidden text-[11px] min-w-0 w-full"
                aria-label="Start date"
              />
            </div>
            <span className="text-neutral-500 text-[11px] shrink-0">to</span>
            <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-2.5 py-1.5 text-neutral-400 flex-1 min-w-0 min-h-[38px]">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-[#F2F0EB] outline-hidden text-[11px] min-w-0 w-full"
                aria-label="End date"
              />
            </div>
          </div>

          {(startDate || endDate || search || selectedTabId !== 'ALL') && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearch('');
                setSelectedTabId('ALL');
              }}
              className="text-neutral-400 hover:text-white text-xs underline cursor-pointer shrink-0 self-end sm:self-auto py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. ORDERS TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626] min-w-0">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199]">
            MATCHING ORDERS ({orders.length})
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#F2F0EB]" />
            <span className="text-xs font-mono text-neutral-400">LOADING ORDERS LEDGER...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs text-center">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 text-xs font-mono">
            NO ORDERS FOUND MATCHING CURRENT FILTERS
          </div>
        ) : (
          <div>
            {/* MOBILE CARD VIEW (< md) */}
            <div className="md:hidden space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => onOpenOrder(ord.id)}
                  className="p-4 rounded-xl bg-[#181818] border border-[#262626] hover:border-neutral-500 active:bg-white/5 transition-all cursor-pointer space-y-3"
                >
                  {/* Top Bar: Order Number, Date, Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#F2F0EB]">
                        #{ord.orderNumber}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {new Date(ord.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                        ord.orderStatus === 'DELIVERED' || ord.orderStatus === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                          : ord.orderStatus === 'SHIPPED'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800/40'
                          : ord.orderStatus === 'PAID' || ord.orderStatus === 'PROCESSING' || ord.orderStatus === 'PACKED'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {ord.orderStatus.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Quote & Rider Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {renderQuoteBadge(ord.quoteStatus, ord.quoteAcceptedFeeNGN || ord.quoteDeliveryFeeNGN)}
                    {ord.riderName && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                        <Bike className="w-2.5 h-2.5" />
                        {ord.riderName}
                      </span>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-[#F2F0EB]">{ord.customerName}</div>
                    <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                      <span>{ord.customerPhone}</span>
                      <span className="truncate max-w-[150px] text-neutral-500">
                        {ord.shippingCity}, {ord.shippingState}
                      </span>
                    </div>
                  </div>

                  {/* Items & Financial Breakdown */}
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-neutral-300 text-[11px] block">
                        {ord.items.reduce((sum, it) => sum + it.quantity, 0)} pcs • {ord.items[0]?.productName || 'Garments'}
                      </span>
                      <span
                        className={`inline-block mt-1 text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                          ord.paymentStatus === 'PAID'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/30'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/30'
                        }`}
                      >
                        Payment: {ord.paymentStatus}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-neutral-500 block font-mono">Total NGN</span>
                      <span className="font-mono font-bold text-sm text-[#F2F0EB]">
                        ₦{(ord.totalNGN || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenOrder(ord.id);
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/20 text-[#F2F0EB] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors min-h-[42px]"
                  >
                    <span>Manage Quote & Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW (>= md) */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-[#202020]">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#262626] bg-[#0E0E0E] text-[10px] font-mono text-[#A3A199] uppercase tracking-wider">
                    <th className="py-3 px-3 font-normal">Order ID</th>
                    <th className="py-3 px-3 font-normal">Customer</th>
                    <th className="py-3 px-3 font-normal">Delivery Quote</th>
                    <th className="py-3 px-3 font-normal">Items</th>
                    <th className="py-3 px-3 font-normal">Total NGN</th>
                    <th className="py-3 px-3 font-normal">Payment</th>
                    <th className="py-3 px-3 font-normal">Fulfillment</th>
                    <th className="py-3 px-3 font-normal">Date</th>
                    <th className="py-3 px-3 font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020]">
                  {orders.map((ord) => (
                    <tr
                      key={ord.id}
                      onClick={() => onOpenOrder(ord.id)}
                      className="hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-[#F2F0EB] group-hover:underline">
                        #{ord.orderNumber}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-[#F2F0EB]">{ord.customerName}</div>
                        <div className="text-[11px] text-neutral-400">{ord.customerPhone}</div>
                        <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">
                          {ord.shippingCity}, {ord.shippingState}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          {renderQuoteBadge(ord.quoteStatus, ord.quoteAcceptedFeeNGN || ord.quoteDeliveryFeeNGN)}
                          {ord.riderName && (
                            <div className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                              <Bike className="w-2.5 h-2.5" />
                              {ord.riderName}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-neutral-300 font-bold">
                          {ord.items.reduce((sum, it) => sum + it.quantity, 0)} pcs
                        </span>
                        <p className="text-[10px] text-neutral-500 truncate max-w-[130px]">
                          {ord.items[0]?.productName || 'Garments'}
                        </p>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-[#F2F0EB]">
                        ₦{(ord.totalNGN || 0).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                            ord.paymentStatus === 'PAID'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                            ord.orderStatus === 'DELIVERED' || ord.orderStatus === 'COMPLETED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                              : ord.orderStatus === 'SHIPPED'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/40'
                              : ord.orderStatus === 'PAID' || ord.orderStatus === 'PROCESSING' || ord.orderStatus === 'PACKED'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {ord.orderStatus.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenOrder(ord.id);
                          }}
                          className="px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-mono text-[10px] cursor-pointer min-h-[30px]"
                        >
                          MANAGE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
