import React, { useState, useEffect } from 'react';
import { AdminOrder } from '../types';
import { AdminApi } from '../api';
import {
  X,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  CreditCard,
  User,
  MapPin,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  orderId,
  onClose,
  onOrderUpdated,
}) => {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  // Shipping form state for dispatch
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [courier, setCourier] = useState('KWIK Express Dispatch');
  const [trackingNumber, setTrackingNumber] = useState('');

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await AdminApi.getOrder(orderId);
      setOrder(data);
      if (data.shipment) {
        setCourier(data.shipment.courier);
        setTrackingNumber(data.shipment.trackingNumber);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  if (!orderId) return null;

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;
    try {
      setUpdatingStatus(true);
      setError(null);

      // If transition is to SHIPPED and tracking info provided, save shipment first
      if (newStatus === 'SHIPPED' && trackingNumber.trim()) {
        await AdminApi.createShipment(order.id, {
          courier,
          trackingNumber: trackingNumber.trim(),
          deliveryAddress: `${order.shippingAddressLine}, ${order.shippingCity}, ${order.shippingState}`,
          recipientName: order.customerName,
          recipientPhone: order.customerPhone,
        });
      }

      await AdminApi.updateOrderStatus(order.id, newStatus, statusNote.trim() || undefined);
      setStatusNote('');
      setShowShippingForm(false);
      await fetchOrder();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Valid status transitions allowed by backend state machine
  const getNextActions = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return [
          { label: 'Confirm Payment Received', targetStatus: 'PAID', variant: 'primary' },
          { label: 'Cancel Order', targetStatus: 'CANCELLED', variant: 'danger' },
        ];
      case 'PAID':
        return [
          { label: 'Mark as Processing', targetStatus: 'PROCESSING', variant: 'primary' },
          { label: 'Cancel & Refund', targetStatus: 'REFUNDED', variant: 'danger' },
        ];
      case 'PROCESSING':
        return [
          { label: 'Mark as Packed', targetStatus: 'PACKED', variant: 'primary' },
          { label: 'Cancel & Refund', targetStatus: 'REFUNDED', variant: 'danger' },
        ];
      case 'PACKED':
        return [
          { label: 'Dispatch & Mark as Shipped', targetStatus: 'SHIPPED', variant: 'primary', requiresShipment: true },
          { label: 'Cancel & Refund', targetStatus: 'REFUNDED', variant: 'danger' },
        ];
      case 'SHIPPED':
        return [
          { label: 'Mark as Delivered', targetStatus: 'DELIVERED', variant: 'primary' },
          { label: 'Delivery Failed', targetStatus: 'FAILED', variant: 'warning' },
        ];
      case 'DELIVERED':
        return [
          { label: 'Mark as Completed', targetStatus: 'COMPLETED', variant: 'primary' },
          { label: 'Client Returned', targetStatus: 'RETURNED', variant: 'warning' },
        ];
      case 'RETURNED':
        return [
          { label: 'Process Refund', targetStatus: 'REFUNDED', variant: 'danger' },
          { label: 'Process Exchange', targetStatus: 'EXCHANGED', variant: 'primary' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs font-sans text-left">
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#F2F0EB] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[#262626] flex items-center justify-between bg-[#111]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg sm:text-xl font-bold tracking-tight text-[#F2F0EB]">
              {order ? `#${order.orderNumber}` : 'Loading order...'}
            </span>
            {order && (
              <span
                className={`text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded ${
                  order.orderStatus === 'DELIVERED' || order.orderStatus === 'COMPLETED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                    : order.orderStatus === 'SHIPPED'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800/40'
                    : order.orderStatus === 'PAID' || order.orderStatus === 'PROCESSING' || order.orderStatus === 'PACKED'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                    : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                {order.orderStatus.replace('_', ' ')}
              </span>
            )}
            {order && (
              <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">
                {new Date(order.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#F2F0EB]" />
              <span className="text-xs font-mono text-neutral-400">RETRIEVING ORDER FILE...</span>
            </div>
          ) : error && !order ? (
            <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-200 text-xs text-center">
              {error}
            </div>
          ) : order ? (
            <>
              {error && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ACTION TOOLBAR: Transition state buttons */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A199] block">
                    CURRENT FULFILLMENT STATE
                  </span>
                  <div className="font-semibold text-sm text-[#F2F0EB] mt-0.5">
                    {order.orderStatus.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {getNextActions(order.orderStatus).map((act, idx) => (
                    <button
                      key={idx}
                      disabled={updatingStatus}
                      onClick={() => {
                        if (act.requiresShipment && !order.shipment) {
                          setShowShippingForm(true);
                        } else {
                          handleUpdateStatus(act.targetStatus);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 ${
                        act.variant === 'primary'
                          ? 'bg-[#F2F0EB] text-[#0A0A0A] hover:bg-white'
                          : act.variant === 'warning'
                          ? 'bg-amber-800 text-white hover:bg-amber-700'
                          : 'bg-red-950 text-red-300 border border-red-800 hover:bg-red-900/60'
                      }`}
                    >
                      {updatingStatus ? 'UPDATING...' : act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form popup for entering dispatch shipping details */}
              {showShippingForm && (
                <div className="p-4 rounded-xl bg-[#1C1C1C] border border-amber-600/60 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      <span>DISPATCH & COURIER TRACKING RECORD</span>
                    </span>
                    <button
                      onClick={() => setShowShippingForm(false)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                        Courier Partner
                      </label>
                      <select
                        value={courier}
                        onChange={(e) => setCourier(e.target.value)}
                        className="w-full bg-[#0E0E0E] border border-[#333] rounded px-3 py-2 text-[#F2F0EB] outline-hidden"
                      >
                        <option value="KWIK Express Dispatch">KWIK Express Dispatch (Lagos)</option>
                        <option value="GIG Logistics">GIG Logistics (Nationwide)</option>
                        <option value="DHL Express">DHL Express (Global)</option>
                        <option value="Internal Atelier Driver">Internal Atelier Dispatch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                        Tracking / Waybill Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g. KWK-LAG-99214"
                        className="w-full bg-[#0E0E0E] border border-[#333] rounded px-3 py-2 text-[#F2F0EB] outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowShippingForm(false)}
                      className="px-3 py-1.5 rounded text-xs text-neutral-400 hover:text-white font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('SHIPPED')}
                      className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs uppercase"
                    >
                      CONFIRM DISPATCH & MARK SHIPPED
                    </button>
                  </div>
                </div>
              )}

              {/* 2-COLUMN OPERATIONAL SUMMARY: Customer & Delivery Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Info */}
                <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-2 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>CLIENT RECIPIENT</span>
                  </span>
                  <div className="pt-1">
                    <p className="font-bold text-sm text-[#F2F0EB]">{order.customerName}</p>
                    <p className="text-neutral-400 flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{order.customerEmail}</span>
                    </p>
                    <p className="text-neutral-400 flex items-center gap-1.5 mt-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{order.customerPhone}</span>
                    </p>
                  </div>
                </div>

                {/* Delivery Destination */}
                <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-2 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>DELIVERY DESTINATION</span>
                  </span>
                  <div className="pt-1">
                    <p className="font-semibold text-[#F2F0EB]">
                      {order.shippingCity}, {order.shippingState}
                    </p>
                    <p className="text-neutral-400 mt-1 leading-relaxed">
                      {order.shippingAddressLine}
                    </p>
                    <p className="text-[10px] font-mono text-neutral-500 mt-1">
                      Region Method: {order.shippingMethodName}
                    </p>
                  </div>
                </div>
              </div>

              {/* ORDERED ITEMS TABLE */}
              <div className="p-4 rounded-xl bg-[#181818] border border-[#262626]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-3">
                  ORDERED PIECES ({order.items.reduce((s, it) => s + it.quantity, 0)})
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#2B2B2B] text-[10px] font-mono text-neutral-500 uppercase">
                        <th className="py-2">Garment</th>
                        <th className="py-2">SKU</th>
                        <th className="py-2">Variant</th>
                        <th className="py-2">Qty</th>
                        <th className="py-2">Unit Price</th>
                        <th className="py-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#242424]">
                      {order.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              {it.image && (
                                <img
                                  src={it.image}
                                  alt={it.productName}
                                  className="w-10 h-10 object-cover rounded bg-neutral-800"
                                />
                              )}
                              <span className="font-medium text-[#F2F0EB]">{it.productName}</span>
                            </div>
                          </td>
                          <td className="py-3 font-mono text-neutral-400">{it.sku}</td>
                          <td className="py-3">
                            <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-[11px]">
                              {it.colour} / {it.size}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-bold text-[#F2F0EB]">{it.quantity}</td>
                          <td className="py-3 font-mono text-neutral-400">
                            ₦{(it.unitPriceNGN || 0).toLocaleString()}
                          </td>
                          <td className="py-3 font-mono font-bold text-right text-[#F2F0EB]">
                            ₦{(it.totalPriceNGN || (it.unitPriceNGN * it.quantity) || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="mt-4 pt-3 border-t border-[#262626] flex justify-end">
                  <div className="w-full sm:w-64 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-neutral-400">
                      <span>Subtotal</span>
                      <span>₦{(order.subtotalNGN || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Delivery Fee</span>
                      <span>₦{(order.deliveryFeeNGN || 0).toLocaleString()}</span>
                    </div>
                    {(order.discountNGN || 0) > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount Applied</span>
                        <span>-₦{(order.discountNGN || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-[#F2F0EB] pt-1.5 border-t border-[#262626]">
                      <span>TOTAL NGN</span>
                      <span>₦{(order.totalNGN || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAYMENT & COURIER DISPATCH METADATA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Breakdown */}
                <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-2 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>PAYMENT STATUS</span>
                  </span>
                  <div className="pt-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                      <span className="text-neutral-400 font-mono text-[11px]">{order.paymentMethod}</span>
                    </div>
                    {order.paidAt && (
                      <p className="text-[10px] font-mono text-neutral-500">
                        Paid at: {new Date(order.paidAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Courier Dispatch Record */}
                <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-2 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>SHIPPING & DISPATCH</span>
                  </span>
                  <div className="pt-1">
                    {order.shipment ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-[#F2F0EB]">{order.shipment.courier}</p>
                        <p className="font-mono text-neutral-300">
                          Tracking: {order.shipment.trackingNumber}
                        </p>
                        <p className="text-[10px] font-mono text-neutral-500">
                          Status: {order.shipment.status}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-neutral-400 py-1">
                        <span>No tracking recorded yet</span>
                        <button
                          onClick={() => setShowShippingForm(true)}
                          className="text-xs font-mono text-amber-400 hover:underline cursor-pointer"
                        >
                          + Record Dispatch
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TIMELINE AUDIT HISTORY */}
              <div className="p-4 rounded-xl bg-[#181818] border border-[#262626]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-3">
                  ORDER LIFECYCLE TIMELINE
                </span>

                <div className="space-y-3">
                  {order.timeline?.map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#F2F0EB]">
                            {entry.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-neutral-400 text-[11px] mt-0.5">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#262626] flex items-center justify-between text-xs bg-[#111]">
          <span className="font-mono text-neutral-500 text-[11px]">
            PIERCYN FULFILLMENT PROTOCOL
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[#F2F0EB] rounded-lg font-mono text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
