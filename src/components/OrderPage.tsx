import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  ArrowRight, 
  AlertCircle, 
  Clock, 
  MessageCircle, 
  Copy, 
  Check, 
  Building2, 
  ChevronRight,
  ShieldCheck 
} from 'lucide-react';
import { api } from '../services/apiClient';

interface OrderPageProps {
  orderId?: string;
  mode: 'success' | 'tracking';
  onShop: () => void;
}

export const OrderPage: React.FC<OrderPageProps> = ({ orderId: propOrderId, mode, onShop }) => {
  const [order, setOrder] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [copiedBank, setCopiedBank] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptState, setReceiptState] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [receiptError, setReceiptError] = useState('');

  // Resolve actual order ID from prop, search param, or latest localStorage key
  const getEffectiveOrderId = (): string | null => {
    if (propOrderId) return propOrderId;
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('orderId') || urlParams.get('id');
    if (fromParam) return fromParam;

    // Scan localStorage for any recent order token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('piercyn_order_access_')) {
        return key.replace('piercyn_order_access_', '');
      }
    }
    return null;
  };

  const effectiveOrderId = getEffectiveOrderId();

  const loadOrder = async (isBackgroundPoll = false) => {
    if (!effectiveOrderId) {
      if (!isBackgroundPoll) setState('error');
      return;
    }

    if (!isBackgroundPoll) setState('loading');
    const token = localStorage.getItem(`piercyn_order_access_${effectiveOrderId}`);
    if (!token) {
      if (!isBackgroundPoll) setState('error');
      return;
    }

    try {
      const result = await api.getOrder(effectiveOrderId, token);
      if (result.success && result.data) {
        setOrder(result.data);
        setState('ready');

        const method = String(result.data.paymentMethod || '').toLowerCase();
        const paymentStatus = result.data.paymentStatus;
        const quoteStatus = result.data.quoteStatus;
        if (
          quoteStatus === 'ACCEPTED' &&
          method.includes('transfer') &&
          ['PENDING', 'REJECTED'].includes(paymentStatus)
        ) {
          const initialized = await api.initializePayment(result.data.orderNumber, token);
          if (initialized.success) setPaymentInfo(initialized.data);
        }
      } else if (!isBackgroundPoll) {
        setState('error');
      }
    } catch {
      if (!isBackgroundPoll) setState('error');
    }
  };

  useEffect(() => {
    loadOrder();

    // Auto-poll public order details every 10s so customer page dynamically updates
    // when delivery quote is calculated, sent, or accepted by admin.
    const pollInterval = setInterval(() => {
      loadOrder(true);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [effectiveOrderId]);

  const bank = paymentInfo?.bankTransfer || {
    bankName: 'Kuda Bank',
    accountName: 'Adedeji Taiwo',
    accountNumber: '2072114942',
    narration: order?.orderNumber || '',
    reviewWindowHours: 48,
  };

  const handleCopyAccount = () => {
    if (!bank?.accountNumber) return;
    navigator.clipboard.writeText(bank.accountNumber);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleReceiptUpload = async () => {
    if (!receiptFile || !order) return;

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(receiptFile.type)) {
      setReceiptError('Upload a JPEG, PNG or PDF receipt.');
      setReceiptState('error');
      return;
    }
    if (receiptFile.size > 3 * 1024 * 1024) {
      setReceiptError('Receipt must be 3 MB or smaller.');
      setReceiptState('error');
      return;
    }

    setReceiptState('uploading');
    setReceiptError('');

    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Unable to read the selected file.'));
        reader.readAsDataURL(receiptFile);
      });

      const token = localStorage.getItem(`piercyn_order_access_${order.id}`);
      if (!token) throw new Error('Order session expired. Please reopen this order from the device used at checkout.');

      const result = await api.uploadPaymentReceipt(order.id, token, {
        fileBase64,
        mimeType: receiptFile.type as 'image/jpeg' | 'image/png' | 'application/pdf',
      });

      if (!result.success) {
        throw new Error(result.error || 'Receipt upload failed.');
      }

      setReceiptFile(null);
      setReceiptState('idle');
      await loadOrder();
    } catch (err: any) {
      setReceiptState('error');
      setReceiptError(err?.message || 'Receipt upload failed. Please try again.');
    }
  };

  if (state === 'loading') {
    return (
      <main className="min-h-[70vh] bg-[#F2F0EB] pt-32 text-center text-sm text-[#6E6B65] font-sans">
        <div className="piercyn-container max-w-md mx-auto">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-[#141414]" />
          <p className="font-mono text-xs uppercase tracking-wider">Verifying and loading order securely…</p>
        </div>
      </main>
    );
  }

  if (state === 'error' || !order) {
    return (
      <main className="min-h-[70vh] bg-[#F2F0EB] pt-28 pb-20 font-sans text-[#141414]">
        <div className="piercyn-container mx-auto max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-[#EAE6DD] text-[#7A7771] flex items-center justify-center mx-auto mb-4 border border-[#DAD8D1]">
            <AlertCircle className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] block mb-1 font-semibold">
            SECURE LOOKUP
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl italic mb-3">Order Details Unavailable</h1>
          <p className="text-xs sm:text-sm text-[#6E6B65] leading-relaxed mb-6">
            For privacy and customer security, orders can only be viewed from the confirmed session or device used during checkout.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onShop}
              className="rounded-full bg-[#141414] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-black transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
            <a
              href="https://wa.me/2348076431059?text=Hello%20PIERCYN!%20I'd%20like%20to%20inquire%20about%20my%20recent%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#141414] px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#141414] hover:text-[#F2F0EB] transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </main>
    );
  }

  const items = order.items || [];
  const status = order.orderStatus || order.status || 'PENDING_PAYMENT';
  const paymentStatus = String(order.paymentStatus || 'PENDING');
  const quoteStatus = String(order.quoteStatus || 'PENDING');

  const isQuoteAccepted = quoteStatus === 'ACCEPTED';
  const isQuotePending = quoteStatus === 'PENDING';
  const isQuoteSetOrSent = ['SET', 'SENT'].includes(quoteStatus);
  const isQuoteRejected = quoteStatus === 'REJECTED';

  const isPaid = paymentStatus === 'PAID';
  const pendingPayment = ['PENDING', 'REJECTED'].includes(paymentStatus);
  const awaitingVerification =
    paymentStatus === 'AWAITING_VERIFICATION' || status === 'AWAITING_PAYMENT_VERIFICATION';
  const isBankTransfer = (order.paymentMethod || '').toLowerCase().includes('transfer');
  const latestPayment = Array.isArray(order.payments) ? order.payments[0] : null;
  const rejectionReason = latestPayment?.rejectionReason || null;

  const getHeroBadge = () => {
    if (isPaid) return 'ORDER PAID & CONFIRMED';
    if (awaitingVerification) return 'RECEIPT RECEIVED - UNDER REVIEW';
    if (isQuoteAccepted) return 'DELIVERY ACCEPTED - AWAITING PAYMENT';
    if (isQuoteSetOrSent) return 'DELIVERY QUOTE READY';
    if (isQuoteRejected) return 'DELIVERY QUOTE DECLINED';
    return 'ORDER RECEIVED - AWAITING DELIVERY QUOTE';
  };

  const getHeroDescription = () => {
    if (isPaid) {
      return 'Thank you for your payment. We are preparing your pieces for dispatch from our Lagos studio.';
    }
    if (awaitingVerification) {
      return 'Your payment receipt has been received and is awaiting verification by our finance team. We will confirm your order once the transfer is matched.';
    }
    if (isQuoteAccepted) {
      return `Your delivery quotation was accepted. Please transfer the agreed total of ₦${(order.quoteAcceptedTotalNGN || order.totalNGN || 0).toLocaleString()} using the details below and upload your receipt.`;
    }
    if (isQuoteSetOrSent) {
      return `Your delivery quotation has been calculated and communicated to ${order.customerPhone}. Please review the fee and reply YES on WhatsApp to confirm.`;
    }
    if (isQuoteRejected) {
      return 'You indicated that you do not accept the quoted delivery arrangement. A PIERCYN concierge will reach out via WhatsApp to assist.';
    }
    return 'Your order has been received. PIERCYN will calculate your delivery fee and contact you through WhatsApp. You will receive your final order total before proceeding with payment.';
  };

  const whatsappMessage = encodeURIComponent(
    `Hello PIERCYN Atelier! I'm following up on order ${order.orderNumber}. My delivery location is ${order.shippingCity}, ${order.shippingState}.`
  );

  return (
    <main className="min-h-screen bg-[#F2F0EB] pt-24 sm:pt-28 pb-20 text-[#141414] font-sans">
      <div className="piercyn-container mx-auto max-w-3xl">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-6">
          <button onClick={onShop} className="hover:text-[#141414] cursor-pointer">
            SHOP
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <span className="text-[#141414] font-semibold">
            {mode === 'success' ? 'ORDER CONFIRMATION' : 'ORDER STATUS'}
          </span>
        </nav>

        {/* Hero Card */}
        <header className="rounded-2xl bg-[#141414] p-6 sm:p-9 text-[#F2F0EB]">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
            <span className="text-[10px] font-mono tracking-[0.24em] uppercase text-[#DAD8D1]/80">
              {getHeroBadge()}
            </span>
          </div>

          <h1 className="mt-2 font-editorial text-3xl sm:text-5xl italic tracking-tight">
            {order.orderNumber}
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-white/70 max-w-xl leading-relaxed">
            {getHeroDescription()}
          </p>
        </header>

        {/* ── Quotation Lifecycle Callout ─────────────────────────────────── */}
        {isQuotePending && !isPaid && (
          <section className="mt-6 rounded-2xl bg-amber-50 border border-amber-200/80 p-5 sm:p-6 text-amber-950 font-sans">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <strong className="block font-mono text-[11px] uppercase tracking-wider text-amber-900">
                  Delivery Fee: To be confirmed
                </strong>
                <p className="text-amber-900/90 leading-relaxed text-[12px]">
                  Your order has been received. PIERCYN will calculate your delivery fee and contact you through WhatsApp. You will receive your final order total before proceeding with payment.
                </p>
                <p className="text-[11px] text-amber-800/80 font-mono pt-1">
                  Contact phone: {order.customerPhone} • Destination: {order.shippingCity}, {order.shippingState}
                </p>
              </div>
            </div>
          </section>
        )}

        {isQuoteSetOrSent && (
          <section className="mt-6 rounded-2xl bg-sky-50 border border-sky-200/80 p-5 sm:p-6 text-sky-950 font-sans">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
              <div className="space-y-2 text-xs flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="font-mono text-[11px] uppercase tracking-wider text-sky-900">
                    Delivery Quotation Ready
                  </strong>
                  <span className="font-mono text-xs font-bold text-sky-900 bg-sky-100 px-2.5 py-0.5 rounded">
                    Awaiting WhatsApp Confirmation
                  </span>
                </div>
                <p className="text-sky-900/90 leading-relaxed text-[12px]">
                  We have calculated your delivery fee and contacted your WhatsApp ({order.customerPhone}).
                </p>
                <div className="bg-white/80 border border-sky-200 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] font-mono">
                  <div>
                    <span className="text-neutral-500 block">DELIVERY FEE</span>
                    <strong className="text-sky-950 text-xs">₦{(order.quoteDeliveryFeeNGN ?? order.deliveryFeeNGN ?? 0).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">ESTIMATED TIMEFRAME</span>
                    <span className="text-sky-950 font-semibold">{order.quoteEstimatedTimeframe || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">FINAL TOTAL</span>
                    <strong className="text-sky-950 text-xs">₦{(order.quoteTotalNGN ?? order.totalNGN ?? 0).toLocaleString()}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-sky-800">
                  Please reply <strong>YES</strong> to our WhatsApp message to accept the quotation and receive bank payment instructions.
                </p>
              </div>
            </div>
          </section>
        )}

        {isQuoteRejected && (
          <section className="mt-6 rounded-2xl bg-red-50 border border-red-200/80 p-5 sm:p-6 text-red-950 font-sans">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <strong className="block font-mono text-[11px] uppercase tracking-wider text-red-900">
                  Delivery Quotation Declined
                </strong>
                <p className="text-red-900/90 leading-relaxed text-[12px]">
                  You indicated that you do not accept the quoted delivery arrangement. A PIERCYN concierge will reach out via WhatsApp to assist with alternative delivery options.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Bank Transfer Instructions (ONLY when quote is accepted) ────── */}
        {isQuoteAccepted && isBankTransfer && (pendingPayment || awaitingVerification) && (
          <section className="mt-6 rounded-2xl bg-[#EAE6DD] border border-[#DAD6CC] p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-[#141414]" />
              <h2 className="font-editorial text-2xl italic text-[#141414]">
                Direct Bank Transfer
              </h2>
            </div>

            {awaitingVerification ? (
              <div className="rounded-xl border border-emerald-700/20 bg-emerald-50 p-4 text-xs text-emerald-950 leading-relaxed">
                <strong className="block mb-1">Receipt received. Payment verification is in progress.</strong>
                We are matching your transfer against order {order.orderNumber}. Keep your receipt until the order is confirmed. Reviews usually complete within 48 hours.
              </div>
            ) : (
              <>
                {rejectionReason && (
                  <div className="mb-4 rounded-xl border border-red-700/20 bg-red-50 p-4 text-xs text-red-900 leading-relaxed">
                    <strong className="block mb-1">Your previous receipt was not accepted.</strong>
                    {rejectionReason}
                  </div>
                )}

                <p className="text-xs text-[#55524D] leading-relaxed mb-4">
                  Transfer the exact agreed order total of{' '}
                  <strong className="text-[#141414] font-mono font-bold">
                    {'₦'}{(order.quoteAcceptedTotalNGN || order.totalNGN || 0).toLocaleString()}
                  </strong>{' '}
                  to the verified account below, using your order number as the narration.
                </p>

                {bank ? (
                  <div className="bg-white/80 border border-[#DAD6CC] rounded-xl p-4 sm:p-5 space-y-3 font-mono text-xs mb-4">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[#7A7771]">BANK NAME:</span>
                      <strong className="text-[#141414] text-right">{bank.bankName}</strong>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[#7A7771]">ACCOUNT NAME:</span>
                      <strong className="text-[#141414] text-right">{bank.accountName}</strong>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[#7A7771]">ACCOUNT NUMBER:</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-base text-[#141414] font-bold">{bank.accountNumber}</strong>
                        <button
                          onClick={handleCopyAccount}
                          className="p-1 rounded bg-[#EAE6DD] hover:bg-[#DAD6CC] cursor-pointer transition-colors"
                          title="Copy Account Number"
                          type="button"
                        >
                          {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-[#141414]" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-4 pt-2 border-t border-[#DAD6CC]">
                      <span className="text-[#7A7771]">NARRATION:</span>
                      <strong className="text-[#141414] text-right">{bank.narration || order.orderNumber}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#DAD6CC] bg-white/60 p-4 text-xs text-[#55524D] mb-4">
                    Loading verified bank details… Please refresh this page if details do not appear.
                  </div>
                )}

                <div className="rounded-xl border border-[#DAD6CC] bg-white/60 p-4 mb-4">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7A7771] mb-2">
                    Upload payment receipt
                  </p>
                  <p className="text-[11px] text-[#6E6B65] leading-relaxed mb-3">
                    JPEG, PNG or PDF up to 3 MB. Your receipt is stored privately and is only visible to authorised PIERCYN staff.
                  </p>
                  <input
                    id="payment-receipt"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(event) => {
                      setReceiptFile(event.target.files?.[0] || null);
                      setReceiptError('');
                      setReceiptState('idle');
                    }}
                    className="block w-full text-xs text-[#55524D] file:mr-3 file:rounded-full file:border-0 file:bg-[#141414] file:px-4 file:py-2 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:text-white hover:file:bg-black file:cursor-pointer"
                  />
                  {receiptError && (
                    <p className="mt-2 text-[11px] text-red-800" role="alert">{receiptError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleReceiptUpload}
                    disabled={!receiptFile || receiptState === 'uploading'}
                    className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-[#141414] px-5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-black transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {receiptState === 'uploading' ? 'Uploading receipt...' : 'Submit receipt for verification'}
                  </button>
                </div>

                <p className="text-[11px] text-[#6E6B65] leading-relaxed">
                  Stock remains reserved while your receipt is reviewed. Once payment is confirmed by our team, fulfilment begins immediately.
                </p>
              </>
            )}
          </section>
        )}

        {/* 2-Column Summary */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          
          {/* Order Summary */}
          <div className="rounded-2xl border border-[#DAD8D1] bg-[#EAE6DD] p-5 sm:p-6">
            <h2 className="font-editorial text-xl italic text-[#141414] mb-4">
              Items Ordered
            </h2>
            <div className="space-y-3">
              {items.map((item: any) => (
                <div key={item.id || item.productId} className="flex justify-between items-start gap-4 text-xs font-sans">
                  <div>
                    <span className="font-semibold text-[#141414] block uppercase">
                      {item.productName}
                    </span>
                    <span className="text-[#7A7771] text-[11px]">
                      {item.size || 'M'} · {item.colour || 'Standard'} × {item.quantity}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#141414] shrink-0">
                    ₦{(item.totalNGN ?? item.totalPriceNGN ?? (item.unitPriceNGN * item.quantity) ?? 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-[#DAD8D1] pt-4 space-y-1.5 text-xs font-sans">
              <div className="flex justify-between text-[#55524D]">
                <span>Product Subtotal:</span>
                <span className="font-mono">₦{(order.subtotalNGN || 0).toLocaleString()}</span>
              </div>
              {order.discountNGN > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Discount:</span>
                  <span className="font-mono">-₦{order.discountNGN.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[#55524D]">
                <span>Delivery Fee:</span>
                <span className="font-mono text-xs font-semibold">
                  {isQuoteAccepted || isPaid ? (
                    `₦${(order.quoteAcceptedFeeNGN ?? order.quoteDeliveryFeeNGN ?? order.deliveryFeeNGN ?? 0).toLocaleString()}`
                  ) : isQuoteSetOrSent ? (
                    `₦${(order.quoteDeliveryFeeNGN ?? order.deliveryFeeNGN ?? 0).toLocaleString()} (Quoted)`
                  ) : (
                    <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                      To be confirmed
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between font-mono font-bold text-sm text-[#141414] pt-2 border-t border-[#DAD8D1]">
                <span>TOTAL:</span>
                <span>
                  {isQuoteAccepted || isPaid ? (
                    `₦${(order.quoteAcceptedTotalNGN ?? order.quoteTotalNGN ?? order.totalNGN ?? 0).toLocaleString()}`
                  ) : isQuoteSetOrSent ? (
                    `₦${(order.quoteTotalNGN ?? order.totalNGN ?? 0).toLocaleString()} (Pending Acceptance)`
                  ) : (
                    <span className="text-xs text-[#7A7771] font-normal">
                      To be determined (Products ₦{(order.subtotalNGN || 0).toLocaleString()})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery & Status Details */}
          <div className="rounded-2xl border border-[#DAD8D1] bg-[#EAE6DD] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-editorial text-xl italic text-[#141414] mb-4">
                Delivery Details
              </h2>
              <div className="space-y-3 text-xs text-[#55524D] font-sans">
                <div>
                  <span className="block text-[10px] font-mono uppercase text-[#7A7771] font-semibold">CUSTOMER:</span>
                  <span className="font-semibold text-[#141414]">{order.customerName}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase text-[#7A7771] font-semibold">DESTINATION:</span>
                  <span className="text-[#141414]">
                    {order.shippingAddressLine}, {order.shippingCity}, {order.shippingState}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase text-[#7A7771] font-semibold">DELIVERY METHOD:</span>
                  <span className="text-[#141414]">{order.shippingMethodName || 'Direct Delivery'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase text-[#7A7771] font-semibold">DELIVERY QUOTE STATUS:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/10 text-[#141414] font-mono text-[11px] font-bold uppercase mt-1">
                    <Package className="w-3 h-3" />
                    {isPaid && isQuotePending ? 'CONFIRMED' : quoteStatus.replaceAll('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DAD8D1] mt-4 flex items-center gap-2 text-[11px] text-[#6E6B65]">
              <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>Questions? WhatsApp concierge available Monday–Saturday 9am–6pm WAT.</span>
            </div>
          </div>

        </section>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onShop}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#141414] px-7 text-xs font-bold uppercase tracking-wider text-white hover:bg-black transition-colors cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <a
            href={`https://wa.me/2348076431059?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#141414] px-7 text-xs font-bold uppercase tracking-wider hover:bg-[#141414] hover:text-[#F2F0EB] transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-700" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

      </div>
    </main>
  );
};
