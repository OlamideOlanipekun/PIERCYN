import React, { useState, useEffect } from 'react';
import { AdminCustomer } from '../types';
import { AdminApi } from '../api';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  ArrowRight,
  Loader2,
  X,
  Calendar,
  CreditCard,
} from 'lucide-react';

interface CustomersViewProps {
  onOpenOrder: (orderId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onOpenOrder }) => {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Selected customer profile modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<AdminCustomer | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminApi.getCustomers(search.trim() || undefined);
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load customer directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleOpenCustomer = async (id: string) => {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    try {
      const data = await AdminApi.getCustomer(id);
      setCustomerDetail(data);
    } catch {
      setCustomerDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & SEARCH */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-0.5">
            CLIENT RELATIONSHIP
          </span>
          <h2 className="text-xl font-bold text-[#F2F0EB]">Customer Directory</h2>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, email, phone..."
            className="w-full bg-[#141414] border border-[#2D2D2D] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F2F0EB] placeholder:text-neutral-600 outline-hidden font-sans"
          />
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CUSTOMERS TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199]">
            RECORDED CLIENTS ({customers.length})
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#F2F0EB]" />
            <span className="text-xs font-mono text-neutral-400">RETRIEVING CLIENT LIST...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-950/30 border border-red-800 text-red-200 text-xs text-center">
            {error}
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm font-semibold text-[#F2F0EB]">No customers found</p>
            <p className="text-xs text-neutral-500 font-sans">
              Customer profiles are automatically synthesized when orders are placed.
            </p>
          </div>
        ) : (
          <div>
            {/* MOBILE CUSTOMER CARDS (< md) */}
            <div className="md:hidden space-y-3">
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleOpenCustomer(c.id)}
                  className="p-4 rounded-xl bg-[#181818] border border-[#262626] hover:border-neutral-500 active:bg-white/5 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-[#F2F0EB] truncate">
                        {c.fullName}
                      </h3>
                      <p className="text-[11px] font-mono text-neutral-400 truncate mt-0.5">
                        {c.email}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-neutral-300 shrink-0">
                      {c.orderCount || 0} {(c.orderCount || 0) === 1 ? 'order' : 'orders'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase block">Total Spent</span>
                      <span className="font-bold text-[#F2F0EB] text-sm">
                        ₦{(c.totalSpentNGN || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase block">Last Order</span>
                      <span className="text-neutral-300 text-[11px]">
                        {c.lastOrderDate
                          ? new Date(c.lastOrderDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'No orders'}
                      </span>
                    </div>
                  </div>

                  {c.phone && (
                    <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCustomer(c.id);
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/20 text-[#F2F0EB] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors min-h-[42px]"
                  >
                    <span>View Client Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW (>= md) */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-[#202020]">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead>
                  <tr className="border-b border-[#262626] bg-[#0E0E0E] text-[10px] font-mono text-[#A3A199] uppercase tracking-wider">
                    <th className="py-3 px-3 font-normal">Customer Name</th>
                    <th className="py-3 px-3 font-normal">Email</th>
                    <th className="py-3 px-3 font-normal">Phone</th>
                    <th className="py-3 px-3 font-normal">Orders</th>
                    <th className="py-3 px-3 font-normal">Total Spent</th>
                    <th className="py-3 px-3 font-normal">Last Order</th>
                    <th className="py-3 px-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020]">
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleOpenCustomer(c.id)}
                      className="hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-[#F2F0EB] group-hover:underline">
                          {c.fullName}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-neutral-400 font-mono text-[11px]">
                        {c.email}
                      </td>

                      <td className="py-3.5 px-3 text-neutral-400 font-mono text-[11px]">
                        {c.phone || '—'}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-[#F2F0EB]">
                        {c.orderCount || 0}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-[#F2F0EB]">
                        ₦{(c.totalSpentNGN || 0).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 text-neutral-400 font-mono text-[11px]">
                        {c.lastOrderDate
                          ? new Date(c.lastOrderDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCustomer(c.id);
                          }}
                          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-mono text-[10px] cursor-pointer"
                        >
                          PROFILE
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

      {/* ------------------------------------------------------------- */}
      {/* 3. CUSTOMER PROFILE MODAL / DRAWER */}
      {/* ------------------------------------------------------------- */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-2xl bg-[#141414] border border-[#2D2D2D] rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 text-[#F2F0EB] max-h-[92vh] sm:max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#242424] pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#A3A199] uppercase tracking-widest block">
                  CLIENT DOSSIER
                </span>
                <h3 className="font-bold text-lg text-[#F2F0EB]">
                  {customerDetail?.fullName || 'Loading Client Profile...'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#F2F0EB]" />
                <span className="text-xs font-mono text-neutral-400">RETRIEVING HISTORY...</span>
              </div>
            ) : customerDetail ? (
              <div className="space-y-6 text-xs">
                {/* Contact & Lifetime Metrics Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
                      TOTAL ORDERS
                    </span>
                    <span className="text-xl font-bold font-mono text-[#F2F0EB]">
                      {customerDetail.totalOrders || customerDetail.orders?.length || 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
                      LIFETIME SPENT
                    </span>
                    <span className="text-xl font-bold font-mono text-[#F2F0EB]">
                      ₦{(customerDetail.totalSpentNGN || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
                      AVERAGE SPEND
                    </span>
                    <span className="text-xl font-bold font-mono text-[#F2F0EB]">
                      ₦
                      {customerDetail.totalOrders && customerDetail.totalOrders > 0
                        ? Math.round(
                            (customerDetail.totalSpentNGN || 0) / customerDetail.totalOrders
                          ).toLocaleString()
                        : '0'}
                    </span>
                  </div>
                </div>

                {/* Contact Details Card */}
                <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-1">
                    CONTACT DETAILS
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-neutral-500" />
                      <span className="font-mono text-neutral-300">{customerDetail.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-neutral-500" />
                      <span className="font-mono text-neutral-300">{customerDetail.phone || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Saved Delivery Addresses */}
                {customerDetail.addresses && customerDetail.addresses.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-1">
                      SAVED DELIVERY DESTINATIONS
                    </span>
                    <div className="space-y-2">
                      {customerDetail.addresses.map((addr) => (
                        <div key={addr.id} className="flex items-start gap-2 text-neutral-300">
                          <MapPin className="w-3.5 h-3.5 text-neutral-500 mt-0.5 shrink-0" />
                          <span>
                            {addr.addressLine}, {addr.city}, {addr.state}, {addr.country}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Order History */}
                <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-1">
                    ORDER HISTORY ({customerDetail.orders?.length || 0})
                  </span>

                  {customerDetail.orders && customerDetail.orders.length > 0 ? (
                    <div className="space-y-2">
                      {customerDetail.orders.map((ord) => (
                        <div
                          key={ord.id}
                          onClick={() => {
                            setSelectedCustomerId(null);
                            onOpenOrder(ord.id);
                          }}
                          className="p-3 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors font-mono"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#F2F0EB]">#{ord.orderNumber}</span>
                              <span
                                className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                                  ord.paymentStatus === 'PAID'
                                    ? 'bg-emerald-950 text-emerald-300'
                                    : 'bg-amber-950 text-amber-300'
                                }`}
                              >
                                {ord.orderStatus}
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-400">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#F2F0EB]">
                              ₦{ord.totalNGN.toLocaleString()}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 font-mono py-2 text-center">
                      No linked orders yet.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
