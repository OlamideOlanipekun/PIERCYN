import React, { useState, useEffect } from 'react';
import { AdminOrder } from '../types';
import { AdminApi } from '../api';
import {
  X,
  Clock,
  CheckCircle2,
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
  ExternalLink,
  XCircle,
  MessageSquare,
  Copy,
  Check,
  Bike,
  Sparkles,
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

  // Payment review state
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentAction, setPaymentAction] = useState<'idle' | 'viewing' | 'approving' | 'rejecting'>('idle');
  const [receipt, setReceipt] = useState<{
    receiptUrl: string;
    mimeType: string | null;
    uploadedAt: string | null;
  } | null>(null);

  // Delivery Quote Form State
  const [quoteFee, setQuoteFee] = useState<string>('');
  const [quoteTimeframe, setQuoteTimeframe] = useState<string>('');
  const [quoteInternalNote, setQuoteInternalNote] = useState<string>('');
  const [quoteUpdating, setQuoteUpdating] = useState<boolean>(false);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState<string | null>(null);
  const [copiedQuoteMsg, setCopiedQuoteMsg] = useState(false);

  // Payment instructions WhatsApp state
  const [copiedPaymentMsg, setCopiedPaymentMsg] = useState(false);
  const [paymentInstrSending, setPaymentInstrSending] = useState(false);

  // Reject Quote Dialog
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Manual Rider Assignment State
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');
  const [riderSaving, setRiderSaving] = useState(false);
  const [riderSuccessMsg, setRiderSuccessMsg] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await AdminApi.getOrder(orderId);
      setOrder(data);

      if (data.shipment) {
        setCourier(data.shipment.courier || 'KWIK Express Dispatch');
        setTrackingNumber(data.shipment.trackingNumber || '');
      }

      if (data.quoteDeliveryFeeNGN !== null && data.quoteDeliveryFeeNGN !== undefined) {
        setQuoteFee(String(data.quoteDeliveryFeeNGN));
      } else if (data.deliveryFeeNGN !== null && data.deliveryFeeNGN !== undefined && data.deliveryFeeNGN > 0) {
        setQuoteFee(String(data.deliveryFeeNGN));
      } else {
        setQuoteFee('');
      }

      setQuoteTimeframe(data.quoteEstimatedTimeframe || '');
      setQuoteInternalNote(data.quoteInternalNote || '');
      setRiderName(data.riderName || '');
      setRiderPhone(data.riderPhone || '');
      setDispatchNote(data.dispatchNote || '');
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

  // ── Delivery Quote Handlers ──────────────────────────────────────────────────

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    const parsedFee = parseFloat(quoteFee);
    if (isNaN(parsedFee) || parsedFee < 0) {
      setError('Delivery fee must be a valid non-negative amount in NGN.');
      return;
    }

    try {
      setQuoteUpdating(true);
      setError(null);
      setQuoteSuccessMsg(null);

      const updated = await AdminApi.setDeliveryQuote(order.id, {
        deliveryFeeNGN: parsedFee,
        estimatedDeliveryTimeframe: quoteTimeframe.trim() || undefined,
        internalNote: quoteInternalNote.trim() || undefined,
      });

      setOrder(updated);
      setQuoteSuccessMsg(
        `Quotation v${updated.quoteVersion} set to ₦${parsedFee.toLocaleString()}. You can now contact the customer via WhatsApp.`
      );
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to set delivery quotation.');
    } finally {
      setQuoteUpdating(false);
    }
  };

  const handleOpenWhatsApp = async () => {
    if (!order) return;
    try {
      setError(null);

      // If quote is still PENDING or the fee input has changed, save the delivery fee first
      const parsedFee = parseFloat(quoteFee);
      const isFeeUnsaved = order.quoteStatus === 'PENDING' || (
        !isNaN(parsedFee) && parsedFee !== order.quoteDeliveryFeeNGN
      );

      let currentOrder = order;

      if (isFeeUnsaved) {
        if (isNaN(parsedFee) || parsedFee < 0) {
          setError('Please enter a valid non-negative delivery fee before opening WhatsApp.');
          return;
        }

        setQuoteUpdating(true);
        const updated = await AdminApi.setDeliveryQuote(order.id, {
          deliveryFeeNGN: parsedFee,
          estimatedDeliveryTimeframe: quoteTimeframe.trim() || undefined,
          internalNote: quoteInternalNote.trim() || undefined,
        });
        currentOrder = updated;
        setOrder(updated);
        if (onOrderUpdated) onOrderUpdated();
      }

      const data = await AdminApi.getQuoteWhatsAppMessage(currentOrder.id);

      // Copy text to clipboard
      await navigator.clipboard.writeText(data.message);
      setCopiedQuoteMsg(true);
      setTimeout(() => setCopiedQuoteMsg(false), 4000);

      // Open WhatsApp chat in a new tab
      window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');

      setQuoteSuccessMsg(
        'Delivery fee saved, WhatsApp chat opened, and quotation message copied to clipboard! Remember to mark as sent or record customer acceptance once confirmed.'
      );
    } catch (err: any) {
      setError(err.message || 'Unable to open WhatsApp for this quotation.');
    } finally {
      setQuoteUpdating(false);
    }
  };

  const handleOpenPaymentWhatsApp = async () => {
    if (!order) return;
    try {
      setError(null);
      const data = await AdminApi.getPaymentWhatsAppMessage(order.id);

      // Copy Kuda payment instructions to clipboard
      await navigator.clipboard.writeText(data.message);
      setCopiedPaymentMsg(true);
      setTimeout(() => setCopiedPaymentMsg(false), 4000);

      // Open WhatsApp chat in a new tab — does NOT mark as sent
      window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');

      setQuoteSuccessMsg(
        'Kuda payment instructions copied to clipboard & WhatsApp opened! Remember to click "Mark Payment Instructions Sent" once transmitted.'
      );
    } catch (err: any) {
      setError(err.message || 'Unable to generate Kuda payment instructions.');
    }
  };

  const handleMarkPaymentInstructionsSent = async () => {
    if (!order) return;
    try {
      setPaymentInstrSending(true);
      setError(null);
      await AdminApi.markPaymentInstructionsSent(order.id);
      setQuoteSuccessMsg('Kuda bank transfer payment instructions marked as sent to customer.');
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to mark payment instructions as sent.');
    } finally {
      setPaymentInstrSending(false);
    }
  };

  const handleMarkQuoteSent = async () => {
    if (!order) return;
    try {
      setQuoteUpdating(true);
      setError(null);
      const updated = await AdminApi.markQuoteSent(order.id);
      setOrder(updated);
      setQuoteSuccessMsg('Quote marked as SENT to customer.');
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to mark quote as sent.');
    } finally {
      setQuoteUpdating(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!order) return;
    if (
      !window.confirm(
        `Confirm that customer ${order.customerName} has accepted the quotation of ₦${(order.quoteDeliveryFeeNGN || 0).toLocaleString()} (Total: ₦${(order.quoteTotalNGN || order.totalNGN).toLocaleString()})?`
      )
    ) {
      return;
    }

    try {
      setQuoteUpdating(true);
      setError(null);
      const updated = await AdminApi.markQuoteAccepted(order.id);
      setOrder(updated);
      setQuoteSuccessMsg('Delivery quote ACCEPTED by customer. Order is now unlocked for payment!');
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to mark quote as accepted.');
    } finally {
      setQuoteUpdating(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!order) return;
    try {
      setQuoteUpdating(true);
      setError(null);
      const updated = await AdminApi.markQuoteRejected(order.id, rejectReason.trim() || undefined);
      setOrder(updated);
      setShowRejectPrompt(false);
      setRejectReason('');
      setQuoteSuccessMsg('Quote marked as REJECTED. You can set a revised fee or contact the customer.');
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to reject quote.');
    } finally {
      setQuoteUpdating(false);
    }
  };

  // ── Manual Rider Fulfilment Handlers ─────────────────────────────────────────

  const handleSaveRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!riderName.trim() || !riderPhone.trim()) {
      setError('Rider name and phone number are required.');
      return;
    }

    try {
      setRiderSaving(true);
      setError(null);
      const updated = await AdminApi.assignRider(order.id, {
        riderName: riderName.trim(),
        riderPhone: riderPhone.trim(),
        note: dispatchNote.trim() || undefined,
      });
      setOrder(updated);
      setRiderSuccessMsg(`Rider ${riderName} assigned successfully.`);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to assign rider.');
    } finally {
      setRiderSaving(false);
    }
  };

  const handleDispatchOrder = async () => {
    if (!order) return;
    if (!riderName.trim()) {
      setError('Please provide rider details before dispatching.');
      return;
    }

    if (!window.confirm(`Dispatch order #${order.orderNumber} with rider ${riderName} and mark as SHIPPED?`)) {
      return;
    }

    try {
      setRiderSaving(true);
      setError(null);
      const updated = await AdminApi.dispatchOrder(order.id, {
        riderName: riderName.trim(),
        riderPhone: riderPhone.trim(),
        note: dispatchNote.trim() || undefined,
      });
      setOrder(updated);
      setRiderSuccessMsg(`Order #${order.orderNumber} dispatched with ${riderName} and marked SHIPPED.`);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch order.');
    } finally {
      setRiderSaving(false);
    }
  };

  const handleWhatsAppRider = () => {
    if (!order || !riderPhone.trim()) return;

    // Build comprehensive pickup & delivery dispatch sheet for rider
    const cleanPhone = riderPhone.replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? `234${cleanPhone.slice(1)}` : cleanPhone;

    const itemsSummary = order.items
      .map((it) => `• ${it.quantity}x ${it.productName} (${it.colour}/${it.size})`)
      .join('\n');

    const msg =
      `*PIERCYN ATELIER — DISPATCH ORDER #${order.orderNumber}*\n\n` +
      `Hello ${riderName || 'Rider'},\n` +
      `Here are the delivery details for PIERCYN order #${order.orderNumber}:\n\n` +
      `*PICKUP ATELIER:*\n` +
      `14 Admiralty Way, Lekki Phase 1, Lagos\n\n` +
      `*CUSTOMER DETAILS:*\n` +
      `Recipient: ${order.customerName}\n` +
      `Phone: ${order.customerPhone}\n` +
      `Address: ${order.shippingAddressLine}, ${order.shippingCity}, ${order.shippingState}\n\n` +
      `*ITEMS TO DELIVER:*\n` +
      `${itemsSummary}\n\n` +
      `*DISPATCH NOTE:*\n` +
      `${dispatchNote || 'Handle with luxury atelier care. Call customer 10 mins before arrival.'}\n\n` +
      `Thank you!`;

    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ── Status Updates & Receipts ───────────────────────────────────────────────

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;

    // Guard: Prevent advancing to PAID, PROCESSING, PACKED, SHIPPED if quote not accepted
    if (['PAID', 'PROCESSING', 'PACKED', 'SHIPPED'].includes(newStatus) && order.quoteStatus !== 'ACCEPTED') {
      setError(
        `Cannot transition order to ${newStatus}. The delivery quote has not been accepted by the customer yet (Current quote status: ${order.quoteStatus}). Please set and record quote acceptance first.`
      );
      return;
    }

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

  const handleViewReceipt = async () => {
    if (!order) return;
    try {
      setPaymentAction('viewing');
      setError(null);
      const data = await AdminApi.getPaymentReceipt(order.orderNumber);
      setReceipt(data);
      window.open(data.receiptUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setError(err.message || 'Unable to load the payment receipt.');
    } finally {
      setPaymentAction('idle');
    }
  };

  const handleApprovePayment = async () => {
    if (!order) return;

    if (order.quoteStatus !== 'ACCEPTED') {
      if (
        !window.confirm(
          `Notice: Delivery quotation is currently ${order.quoteStatus}. Are you sure you want to approve payment without accepted quote?`
        )
      ) {
        return;
      }
    } else {
      if (
        !window.confirm(
          'Confirm that the transfer has been received in the verified PIERCYN bank account and approve this payment?'
        )
      ) {
        return;
      }
    }

    try {
      setPaymentAction('approving');
      setError(null);
      await AdminApi.approvePayment(order.orderNumber, paymentNote.trim() || undefined);
      setPaymentNote('');
      await fetchOrder();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Unable to approve this payment.');
    } finally {
      setPaymentAction('idle');
    }
  };

  const handleRejectPayment = async () => {
    if (!order) return;
    const reason = paymentNote.trim();
    if (reason.length < 5) {
      setError('Enter a rejection reason of at least 5 characters before rejecting.');
      return;
    }
    if (!window.confirm('Reject this receipt? The customer will be asked to submit a valid receipt.')) return;
    try {
      setPaymentAction('rejecting');
      setError(null);
      await AdminApi.rejectPayment(order.orderNumber, reason);
      setPaymentNote('');
      await fetchOrder();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Unable to reject this payment.');
    } finally {
      setPaymentAction('idle');
    }
  };

  // State machine next actions
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

  const isQuoteAccepted = order?.quoteStatus === 'ACCEPTED';
  const isPaidOrBeyond = ['PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(
    order?.orderStatus || ''
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs font-sans text-left">
      <div className="w-full max-w-4xl max-h-[94vh] h-[94vh] sm:h-auto bg-[#141414] border border-[#2D2D2D] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#F2F0EB] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-95 duration-200">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-6 border-b border-[#262626] flex items-center justify-between gap-2 bg-[#111] shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-mono text-base sm:text-xl font-bold tracking-tight text-[#F2F0EB]">
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
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
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
              <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
                      className={`flex-1 sm:flex-none px-3.5 py-2.5 sm:py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 min-h-[44px] sm:min-h-[40px] flex items-center justify-center text-center ${
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

              {/* --------------------------------------------------------- */}
              {/* 1. DELIVERY QUOTATION & WHATSAPP COORDINATION PANEL        */}
              {/* --------------------------------------------------------- */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1C1A17] to-[#141414] border border-[#3E3830] space-y-4 shadow-xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-[#F2F0EB]">
                        Manual Delivery Quotation & WhatsApp
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        Version {order.quoteVersion} • Destination: {order.shippingCity}, {order.shippingState}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded border ${
                        order.quoteStatus === 'ACCEPTED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : order.quoteStatus === 'SENT'
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                          : order.quoteStatus === 'SET'
                          ? 'bg-sky-950 text-sky-300 border-sky-700'
                          : order.quoteStatus === 'REJECTED'
                          ? 'bg-red-950 text-red-300 border-red-700'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}
                    >
                      Quote Status: {order.quoteStatus}
                    </span>
                  </div>
                </div>

                {quoteSuccessMsg && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-200 text-xs flex items-center justify-between gap-2">
                    <span>{quoteSuccessMsg}</span>
                    <button
                      type="button"
                      onClick={() => setQuoteSuccessMsg(null)}
                      className="text-emerald-400 hover:text-emerald-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Destination & Contact Snapshot */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block">Client Name</span>
                    <span className="font-semibold text-[#F2F0EB]">{order.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block">WhatsApp / Phone</span>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="font-mono text-amber-300 hover:underline inline-flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {order.customerPhone}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block">Delivery Address</span>
                    <span className="text-neutral-300 truncate block" title={order.shippingAddressLine}>
                      {order.shippingAddressLine}, {order.shippingCity}
                    </span>
                  </div>
                </div>

                {/* Form to Set / Update Delivery Fee */}
                <form onSubmit={handleSaveQuote} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
                        Delivery Fee (NGN ₦) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={quoteFee}
                        onChange={(e) => setQuoteFee(e.target.value)}
                        placeholder="e.g. 3500"
                        required
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-xs text-[#F2F0EB] focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
                        Estimated Delivery Timeframe
                      </label>
                      <input
                        type="text"
                        value={quoteTimeframe}
                        onChange={(e) => setQuoteTimeframe(e.target.value)}
                        placeholder="e.g. Same-day (Lagos) or 2-3 days"
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-[#F2F0EB] focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
                        Internal Admin Note (Private)
                      </label>
                      <input
                        type="text"
                        value={quoteInternalNote}
                        onChange={(e) => setQuoteInternalNote(e.target.value)}
                        placeholder="e.g. KWIK estimated ₦3,200"
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-[#F2F0EB] focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] font-mono text-neutral-400">
                      {order.quoteTotalNGN ? (
                        <span>
                          Quoted Total:{' '}
                          <strong className="text-[#F2F0EB] font-bold">
                            ₦{order.quoteTotalNGN.toLocaleString()}
                          </strong>{' '}
                          (Products: ₦{order.subtotalNGN.toLocaleString()} + Delivery: ₦
                          {(order.quoteDeliveryFeeNGN || 0).toLocaleString()})
                        </span>
                      ) : (
                        <span>Fee changes increment quote version and invalidate prior acceptances.</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={quoteUpdating}
                      className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-50 min-h-[38px] flex items-center gap-1.5"
                    >
                      {quoteUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Save Delivery Fee</span>
                    </button>
                  </div>
                </form>

                {/* WhatsApp & Decision Action Hub */}
                <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Primary WhatsApp Contact Button */}
                    <button
                      type="button"
                      onClick={handleOpenWhatsApp}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors min-h-[38px]"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{copiedQuoteMsg ? 'Quotation Copied! Opening WA...' : 'Open WhatsApp & Copy Quotation'}</span>
                    </button>

                    {/* Mark Sent button */}
                    {order.quoteStatus !== 'PENDING' && order.quoteStatus !== 'SENT' && order.quoteStatus !== 'ACCEPTED' && (
                      <button
                        type="button"
                        onClick={handleMarkQuoteSent}
                        disabled={quoteUpdating}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-mono uppercase tracking-wider text-[#F2F0EB] cursor-pointer min-h-[38px]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Mark Sent</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {order.quoteStatus !== 'ACCEPTED' && (
                      <button
                        type="button"
                        onClick={handleAcceptQuote}
                        disabled={quoteUpdating || order.quoteStatus === 'PENDING'}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900/60 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40 min-h-[38px]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Customer Accepted</span>
                      </button>
                    )}

                    {order.quoteStatus !== 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => setShowRejectPrompt(true)}
                        disabled={quoteUpdating || order.quoteStatus === 'PENDING'}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-950/60 text-red-300 border border-red-800 hover:bg-red-900/60 px-3 py-2 text-xs font-mono uppercase tracking-wider cursor-pointer disabled:opacity-40 min-h-[38px]"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Customer Declined</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Reject Prompt sub-form */}
                {showRejectPrompt && (
                  <div className="p-3 rounded-xl bg-red-950/30 border border-red-800 space-y-2">
                    <span className="text-[11px] font-mono font-bold uppercase text-red-200 block">
                      Record Customer Rejection Reason:
                    </span>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Delivery fee too high, requested pick-up instead"
                      className="w-full rounded-lg border border-red-800 bg-black/60 px-3 py-1.5 text-xs text-red-100 placeholder:text-red-400/50 focus:outline-hidden"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRejectPrompt(false)}
                        className="px-3 py-1 text-xs text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleRejectQuote}
                        className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-mono uppercase cursor-pointer"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Kuda Payment Instructions (after quote accepted) ──── */}
                {isQuoteAccepted && !isPaidOrBeyond && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-950/40 to-indigo-950/30 border border-purple-700/40 space-y-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-purple-300" />
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-200">
                          Step 2 — Send Kuda Bank Transfer Instructions
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-200/70 leading-relaxed">
                        Customer has accepted the delivery quote. Send the official Kuda bank-transfer payment instructions via WhatsApp.
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-purple-700/30 font-mono text-[11px] text-purple-100 space-y-0.5">
                        <div><span className="text-purple-400">Bank:</span> Kuda</div>
                        <div><span className="text-purple-400">Account Name:</span> Adedeji Taiwo</div>
                        <div><span className="text-purple-400">Account No:</span> 2072114942</div>
                        <div><span className="text-purple-400">Total Payable:</span> <strong className="text-white">₦{(order.quoteAcceptedTotalNGN ?? order.quoteTotalNGN ?? order.totalNGN ?? 0).toLocaleString()}</strong></div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenPaymentWhatsApp}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors min-h-[38px]"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{copiedPaymentMsg ? 'Kuda Instructions Copied! Opening WA...' : 'Send Kuda Payment Instructions via WhatsApp'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleMarkPaymentInstructionsSent}
                          disabled={paymentInstrSending}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-600/50 bg-purple-950/50 hover:bg-purple-900/40 px-3 py-2 text-xs font-mono uppercase tracking-wider text-purple-200 cursor-pointer disabled:opacity-50 min-h-[38px]"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{paymentInstrSending ? 'Recording...' : 'Mark Payment Instructions Sent'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* --------------------------------------------------------- */}
              {/* 2. PAYMENT VERIFICATION (FOR BANK TRANSFERS)              */}
              {/* --------------------------------------------------------- */}
              {order.orderStatus === 'AWAITING_PAYMENT_VERIFICATION' && (
                <div className="p-4 rounded-xl bg-amber-950/25 border border-amber-700/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-200">
                      Bank transfer receipt awaiting verification
                    </span>
                  </div>

                  {!isQuoteAccepted && (
                    <div className="p-2.5 rounded bg-amber-900/40 border border-amber-600 text-amber-200 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-300" />
                      <span>
                        Note: Delivery quotation is currently <strong>{order.quoteStatus}</strong>. Verify the quote was accepted before approving this payment.
                      </span>
                    </div>
                  )}

                  {order.paymentReviewDeadlineAt && (
                    <p className="text-[11px] font-mono text-amber-200/80">
                      Review deadline: {new Date(order.paymentReviewDeadlineAt).toLocaleString()}
                    </p>
                  )}
                  {order.needsManualReview && (
                    <p className="text-[11px] text-amber-100 bg-amber-950/50 border border-amber-800 rounded p-2 leading-relaxed">
                      Flagged for manual reconciliation: {order.manualReviewReason}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleViewReceipt}
                      disabled={paymentAction !== 'idle'}
                      className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-white/20 px-3 text-xs font-mono font-bold uppercase tracking-wider text-[#F2F0EB] hover:bg-white/10 disabled:opacity-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {paymentAction === 'viewing' ? 'Opening...' : 'View receipt'}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(event) => setPaymentNote(event.target.value)}
                    placeholder="Verification note or rejection reason"
                    maxLength={500}
                    className="w-full rounded-lg border border-white/15 bg-[#111] px-3 py-2 text-xs text-[#F2F0EB] placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500"
                  />

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleApprovePayment}
                      disabled={paymentAction !== 'idle'}
                      className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {paymentAction === 'approving' ? 'Approving...' : 'Approve payment'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectPayment}
                      disabled={paymentAction !== 'idle'}
                      className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg bg-red-950 border border-red-800 px-3 text-xs font-mono font-bold uppercase tracking-wider text-red-300 hover:bg-red-900/60 disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      {paymentAction === 'rejecting' ? 'Rejecting...' : 'Reject receipt'}
                    </button>
                  </div>
                </div>
              )}

              {/* --------------------------------------------------------- */}
              {/* 3. MANUAL RIDER ASSIGNMENT & DISPATCH PANEL               */}
              {/* --------------------------------------------------------- */}
              {isPaidOrBeyond && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#17171C] border border-[#2B2B38] space-y-3.5 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Bike className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-[#F2F0EB]">
                          Manual Rider Coordination & Dispatch
                        </h3>
                        <p className="text-[11px] text-neutral-400">
                          Coordinate riders manually and send dispatch sheet via WhatsApp
                        </p>
                      </div>
                    </div>

                    {order.dispatchedAt && (
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        Dispatched: {new Date(order.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {riderSuccessMsg && (
                    <div className="p-2.5 rounded bg-emerald-950/50 border border-emerald-700 text-emerald-200 text-xs">
                      {riderSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveRider} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
                          Rider Name / Company *
                        </label>
                        <input
                          type="text"
                          value={riderName}
                          onChange={(e) => setRiderName(e.target.value)}
                          placeholder="e.g. Musa (KWIK Express)"
                          required
                          className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-[#F2F0EB] focus:outline-hidden focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
                          Rider Phone Number *
                        </label>
                        <input
                          type="text"
                          value={riderPhone}
                          onChange={(e) => setRiderPhone(e.target.value)}
                          placeholder="e.g. +2348012345678"
                          required
                          className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-xs text-[#F2F0EB] focus:outline-hidden focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
                          Dispatch Instructions
                        </label>
                        <input
                          type="text"
                          value={dispatchNote}
                          onChange={(e) => setDispatchNote(e.target.value)}
                          placeholder="e.g. Deliver before 4 PM"
                          className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-[#F2F0EB] focus:outline-hidden focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {riderPhone.trim() && (
                          <button
                            type="button"
                            onClick={handleWhatsAppRider}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900/60 text-xs font-mono uppercase font-bold cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp Delivery Info to Rider</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={riderSaving}
                          className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#F2F0EB] font-mono text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 min-h-[38px]"
                        >
                          {riderSaving ? 'Saving...' : 'Save Rider Info'}
                        </button>

                        {order.orderStatus !== 'SHIPPED' && order.orderStatus !== 'DELIVERED' && (
                          <button
                            type="button"
                            onClick={handleDispatchOrder}
                            disabled={riderSaving}
                            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-50 min-h-[38px] flex items-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch & Mark Shipped</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* --------------------------------------------------------- */}
              {/* 4. CUSTOMER & DELIVERY DESTINATION DETAILS                */}
              {/* --------------------------------------------------------- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Customer Info */}
                <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-2 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>CLIENT RECIPIENT</span>
                  </span>
                  <div className="pt-1">
                    <p className="font-bold text-sm text-[#F2F0EB]">{order.customerName}</p>
                    <p className="text-neutral-400 flex items-center gap-1.5 mt-1 truncate">
                      <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="truncate">{order.customerEmail}</span>
                    </p>
                    <p className="text-neutral-400 flex items-center gap-1.5 mt-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
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

              {/* --------------------------------------------------------- */}
              {/* 5. ORDERED PIECES                                         */}
              {/* --------------------------------------------------------- */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#181818] border border-[#262626]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-2 sm:mb-3">
                  ORDERED PIECES ({order.items.reduce((s, it) => s + it.quantity, 0)})
                </span>

                {/* Mobile Pieces Card View (< sm) */}
                <div className="sm:hidden space-y-2.5">
                  {order.items.map((it) => (
                    <div key={it.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex gap-3 items-center">
                      {it.image && (
                        <img
                          src={it.image}
                          alt={it.productName}
                          className="w-14 h-14 object-cover rounded-md bg-neutral-800 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="font-medium text-[#F2F0EB] truncate">{it.productName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
                            {it.colour} / {it.size}
                          </span>
                          <span className="font-mono text-neutral-400 text-[10px]">
                            {it.quantity} × ₦{(it.unitPriceNGN || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="font-mono font-bold text-[#F2F0EB] mt-1">
                          ₦{(it.totalPriceNGN || it.totalNGN || it.unitPriceNGN * it.quantity || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Pieces Table View (>= sm) */}
                <div className="hidden sm:block overflow-x-auto rounded-lg border border-[#2B2B2B]">
                  <table className="w-full text-left text-xs min-w-[520px]">
                    <thead>
                      <tr className="border-b border-[#2B2B2B] text-[10px] font-mono text-neutral-500 uppercase">
                        <th className="py-2 px-2.5">Garment</th>
                        <th className="py-2 px-2.5">SKU</th>
                        <th className="py-2 px-2.5">Variant</th>
                        <th className="py-2 px-2.5">Qty</th>
                        <th className="py-2 px-2.5">Unit Price</th>
                        <th className="py-2 px-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#242424]">
                      {order.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-3 px-2.5">
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
                          <td className="py-3 px-2.5 font-mono text-neutral-400">{it.sku}</td>
                          <td className="py-3 px-2.5">
                            <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-[11px]">
                              {it.colour} / {it.size}
                            </span>
                          </td>
                          <td className="py-3 px-2.5 font-mono font-bold text-[#F2F0EB]">{it.quantity}</td>
                          <td className="py-3 px-2.5 font-mono text-neutral-400">
                            ₦{(it.unitPriceNGN || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-2.5 font-mono font-bold text-right text-[#F2F0EB]">
                            ₦{(it.totalPriceNGN || it.totalNGN || it.unitPriceNGN * it.quantity || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="mt-4 pt-3 border-t border-[#262626] flex justify-end">
                  <div className="w-full sm:w-72 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-neutral-400">
                      <span>Subtotal</span>
                      <span>₦{(order.subtotalNGN || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Delivery Fee ({order.quoteStatus})</span>
                      <span>₦{(order.quoteDeliveryFeeNGN ?? order.deliveryFeeNGN ?? 0).toLocaleString()}</span>
                    </div>
                    {(order.discountNGN || 0) > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount Applied</span>
                        <span>-₦{(order.discountNGN || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-[#F2F0EB] pt-1.5 border-t border-[#262626]">
                      <span>TOTAL NGN</span>
                      <span>₦{(order.quoteTotalNGN || order.totalNGN || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------------- */}
              {/* 6. TIMELINE AUDIT HISTORY                                 */}
              {/* --------------------------------------------------------- */}
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
            PIERCYN MANUAL FULFILLMENT PROTOCOL
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
