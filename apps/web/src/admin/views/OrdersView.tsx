import React, { useState, useEffect } from 'react';
import { AdminOrder } from '../types';
import { AdminApi } from '../api';
import {
  Search,
  Filter,
  Calendar,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ArrowRight,
  Loader2,
  X,
} from 'lucide-react';

interface OrdersViewProps {
  onOpenOrder: (orderId: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onOpenOrder }) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminApi.getOrders({
        status: statusFilter,
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
  }, [statusFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const statusTabs = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'PAID', label: 'Paid (Fulfill)' },
    { id: 'PROCESSING', label: 'Processing' },
    { id: 'PACKED', label: 'Packed' },
    { id: 'SHIPPED', label: 'Shipped' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'PENDING_PAYMENT', label: 'Pending Payment' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'REFUNDED', label: 'Refunded' },
  ];

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. STATUS TABS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#242424] text-xs font-mono">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold'
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
      <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order #, customer name, email or phone..."
              className="w-full bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F2F0EB] placeholder:text-neutral-600 outline-hidden font-sans"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchOrders();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[#F2F0EB] rounded-lg text-xs font-mono uppercase cursor-pointer"
          >
            SEARCH
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg px-2.5 py-1.5 text-neutral-400">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-[#F2F0EB] outline-hidden text-[11px]"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-[#F2F0EB] outline-hidden text-[11px]"
            />
          </div>

          {(startDate || endDate || search) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearch('');
                setStatusFilter('ALL');
              }}
              className="text-neutral-500 hover:text-white text-xs underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. ORDERS TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199]">
            MATCHING ORDERS ({orders.length})
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#F2F0EB]" />
            <span className="text-xs font-mono text-neutral-400">RETRIEVING ORDERS...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-950/30 border border-red-800 text-red-200 text-xs text-center">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ShoppingBag className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm font-semibold text-[#F2F0EB]">No orders found</p>
            <p className="text-xs text-neutral-500 font-sans">
              No orders matched the selected status or date filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-[10px] font-mono text-[#A3A199] uppercase tracking-wider">
                  <th className="py-3 font-normal">Order ID</th>
                  <th className="py-3 font-normal">Customer</th>
                  <th className="py-3 font-normal">Items</th>
                  <th className="py-3 font-normal">Amount</th>
                  <th className="py-3 font-normal">Payment</th>
                  <th className="py-3 font-normal">Status</th>
                  <th className="py-3 font-normal">Date</th>
                  <th className="py-3 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020]">
                {orders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => onOpenOrder(ord.id)}
                    className="hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 font-mono font-bold text-[#F2F0EB] group-hover:underline">
                      #{ord.orderNumber}
                    </td>

                    <td className="py-3.5">
                      <div className="font-semibold text-[#F2F0EB]">{ord.customerName}</div>
                      <div className="text-[11px] text-neutral-400">{ord.customerPhone}</div>
                      <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">{ord.customerEmail}</div>
                    </td>

                    <td className="py-3.5">
                      <span className="font-mono text-neutral-300 font-bold">
                        {ord.items.reduce((sum, it) => sum + it.quantity, 0)} pcs
                      </span>
                      <p className="text-[10px] text-neutral-500 truncate max-w-[130px]">
                        {ord.items[0]?.productName || 'Garments'}
                      </p>
                    </td>

                    <td className="py-3.5 font-mono font-bold text-[#F2F0EB]">
                      ₦{(ord.totalNGN || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5">
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

                    <td className="py-3.5">
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

                    <td className="py-3.5 text-neutral-400 font-mono text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenOrder(ord.id);
                        }}
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-mono text-[10px] cursor-pointer"
                      >
                        DETAILS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
