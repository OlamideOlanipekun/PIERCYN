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
  ShieldCheck,
  UploadCloud,
  XCircle
} from 'lucide-react';
import { api } from '../services/apiClient';

interface OrderPageProps {
  orderId?: string;
  mode?: 'success' | 'tracking';
  onShop: () => void;
}

export const OrderPage: React.FC<OrderPageProps> = ({ orderId: propOrderId, mode = 'tracking', onShop }) => {
  const [order, setOrder] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [copiedBank, setCopiedBank] = useState(false);

  // Product receipt upload state
  const [productReceiptFile, setProductReceiptFile] = useState<File | null>(null);
  const [productReceiptState, setProductReceiptState] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [productReceiptError, setProductReceiptError] = useState('');

  // Delivery receipt upload state
  const [deliveryReceiptFile, setDeliveryReceiptFile] = useState<File | null>(null);
  const [deliveryReceiptState, setDeliveryReceiptState] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [deliveryReceiptError, setDeliveryReceiptError] = useState('');

  // Delivery quotation decision state
  const [isAcceptingQuote, setIsAcceptingQuote] = useState(false);
  const [isRejectingQuote, setIsRejectingQuote] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [quoteActionError, setQuoteActionError] = useState('');

  // Resolve actual order ID from prop or URL
  const getEffectiveOrderId = (): string | null => {
    if (propOrderId) return propOrderId;
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('orderId') || urlParams.get('id');
    if (fromParam) return fromParam;

    const path = window.location.pathname;
    if (path.startsWith('/account/orders/')) {
      return path.replace('/account/orders/', '').split('/')[0] || null;
    }
    if (path.startsWith('/orders/')) {
      return path.replace('/orders/', '').split('/')[0] || null;
    }
    if (path.startsWith('/order/success/')) {
      return path.replace('/order/success/', '').split('/')[0] || null;
    }

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

    try {
      const token = localStorage.getItem(`piercyn_order_access_${effectiveOrderId}`) || undefined;
      const result = await api.getOrder(effectiveOrderId, token);
      if (result.success && result.data) {
        setOrder(result.data);
        setState('ready');
      } else if (!isBackgroundPoll) {
        setState('error');
      }
    } catch {
      if (!isBackgroundPoll) setState('error');
    }
  };

  useEffect(() => {
    loadOrder();

    // Auto-poll order status every 10s
    const pollInterval = setInterval(() => {
      loadOrder(true);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [effectiveOrderId]);

  const bank = {
    bankName: 'Kuda Bank',
    accountName: 'Adedeji Taiwo',
    accountNumber: '2072114942',
    narration: order?.orderNumber || '',
  };

  const handleCopyAccount = () => {
    if (!bank?.accountNumber) return;
    navigator.clipboard.writeText(bank.accountNumber);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleProductReceiptUpload = async () => {
    if (!productReceiptFile || !order) return;

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(productReceiptFile.type)) {
      setProductReceiptError('Upload a JPEG, PNG or PDF receipt.');
      setProductReceiptState('error');
      return;
    }
    if (productReceiptFile.size > 3 * 1024 * 1024) {
      setProductReceiptError('Receipt must be 3 MB or smaller.');
      setProductReceiptState('error');
      return;
    }

    setProductReceiptState('uploading');
    setProductReceiptError('');

    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Unable to read the selected file.'));
        reader.readAsDataURL(productReceiptFile);
      });

      const result = await api.uploadProductReceipt(order.id, {
        fileBase64,
        mimeType: productReceiptFile.type as 'image/jpeg' | 'image/png' | 'application/pdf',
      });

      if (!result.success) {
        throw new Error(result.error || 'Receipt submission failed.');
      }

      setProductReceiptFile(null);
      setProductReceiptState('idle');
      await loadOrder();
    } catch (err: any) {
      setProductReceiptState('error');
      setProductReceiptError(err?.message || 'Receipt submission failed. Please try again.');
    }
  };

  const handleDeliveryReceiptUpload = async () => {
    if (!deliveryReceiptFile || !order) return;

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(deliveryReceiptFile.type)) {
      setDeliveryReceiptError('Upload a JPEG, PNG or PDF receipt.');
      setDeliveryReceiptState('error');
      return;
    }
    if (deliveryReceiptFile.size > 3 * 1024 * 1024) {
      setDeliveryReceiptError('Receipt must be 3 MB or smaller.');
      setDeliveryReceiptState('error');
      return;
    }

    setDeliveryReceiptState('uploading');
    setDeliveryReceiptError('');

    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Unable to read the selected file.'));
        reader.readAsDataURL(deliveryReceiptFile);
      });

      const result = await api.uploadDeliveryReceipt(order.id, {
        fileBase64,
        mimeType: deliveryReceiptFile.type as 'image/jpeg' | 'image/png' | 'application/pdf',
      });

      if (!result.success) {
        throw new Error(result.error || 'Delivery receipt submission failed.');
      }

      setDeliveryReceiptFile(null);
      setDeliveryReceiptState('idle');
      await loadOrder();
    } catch (err: any) {
      setDeliveryReceiptState('error');
      setDeliveryReceiptError(err?.message || 'Delivery receipt submission failed. Please try again.');
    }
  };

  const handleAcceptQuote = async () => {
    if (!order) return;
    setIsAcceptingQuote(true);
    setQuoteActionError('');
    try {
      const result = await api.acceptDeliveryQuote(order.id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to accept quotation.');
      }
      await loadOrder();
    } catch (err: any) {
      setQuoteActionError(err?.message || 'Failed to accept quotation. Please try again.');
    } finally {
      setIsAcceptingQuote(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!order) return;
    setIsRejectingQuote(true);
    setQuoteActionError('');
    try {
      const result = await api.rejectDeliveryQuote(order.id, rejectReason);
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject quotation.');
      }
      setShowRejectModal(false);
      setRejectReason('');
      await loadOrder();
    } catch (err: any) {
      setQuoteActionError(err?.message || 'Failed to reject quotation. Please try again.');
    } finally {
      setIsRejectingQuote(false);
    }
  };

  if (state === 'loading') {
    return (
      <main className="min-h-[70vh] bg-[#F2F0EB] pt-32 text-center text-sm text-[#6E6B65] font-sans">
        <div className="piercyn-container max-w-md mx-auto">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-[#141414]" />
          <p className="font-mono text-xs uppercase tracking-wider">Loading order details…</p>
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
            ORDER LOOKUP
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl italic mb-3">Order Details Unavailable</h1>
          <p className="text-xs sm:text-sm text-[#6E6B65] leading-relaxed mb-6">
            Please make sure you are signed in with the Google account used to place this order.
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
  const payments = Array.isArray(order.payments) ? order.payments : [];
  const productPayment = payments.find((p: any) => p.paymentType === 'PRODUCT') || payments[0] || null;
  const deliveryPayment = payments.find((p: any) => p.paymentType === 'DELIVERY') || null;

  const quotes = Array.isArray(order.deliveryQuotes) ? order.deliveryQuotes : [];
  const activeQuote = quotes[0] || null;

  const quoteStatus = activeQuote ? String(activeQuote.status) : String(order.quoteStatus || 'PENDING');
  const orderStatus = String(order.status || 'PENDING_PAYMENT');

  const isProductPaymentVerified = productPayment?.status === 'VERIFIED' || order.paymentStatus === 'PAID';
  const isProductPaymentSubmitted = productPayment?.status === 'SUBMITTED' || order.status === 'AWAITING_PAYMENT_VERIFICATION';
  const isProductPaymentRejected = productPayment?.status === 'REJECTED';

  const isQuotePending = quoteStatus === 'PENDING';
  const isQuoteSent = quoteStatus === 'SENT';
  const isQuoteAccepted = quoteStatus === 'ACCEPTED';
  const isQuoteRejected = quoteStatus === 'REJECTED';
  const isQuoteExpired = quoteStatus === 'EXPIRED';

  const isDeliveryPaymentVerified = deliveryPayment?.status === 'VERIFIED';
  const isDeliveryPaymentSubmitted = deliveryPayment?.status === 'SUBMITTED';
  const isDeliveryPaymentRejected = deliveryPayment?.status === 'REJECTED';

  const isReadyForDispatch = ['READY_FOR_DISPATCH', 'PROCESSING', 'DISPATCHED', 'DELIVERED'].includes(orderStatus);

  const getHeroBadge = () => {
    if (orderStatus === 'DELIVERED') return 'ORDER DELIVERED';
    if (orderStatus === 'DISPATCHED') return 'DISPATCHED WITH COURIER';
    if (isReadyForDispatch) return 'AUTHORIZED FOR DISPATCH';
    if (isDeliveryPaymentSubmitted) return 'DELIVERY RECEIPT UNDER REVIEW';
    if (isQuoteAccepted && !isDeliveryPaymentVerified) return 'DELIVERY PAYMENT PENDING';
    if (isQuoteSent) return 'DELIVERY QUOTATION READY';
    if (isQuoteRejected) return 'DELIVERY QUOTATION DECLINED';
    if (isProductPaymentVerified) return 'PRODUCT PAYMENT VERIFIED';
    if (isProductPaymentSubmitted) return 'PRODUCT RECEIPT UNDER REVIEW';
    if (isProductPaymentRejected) return 'PRODUCT RECEIPT REJECTED';
    return 'AWAITING PRODUCT PAYMENT';
  };

  const whatsappMessage = encodeURIComponent(
    `Hello PIERCYN! I'm following up on order ${order.orderNumber}.`
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
            ORDER LIFECYCLE
          </span>
        </nav>

        {/* Hero Card */}
        <header className="rounded-2xl bg-[#141414] p-6 sm:p-8 text-[#F2F0EB]">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <span className="text-[10px] font-mono tracking-[0.24em] uppercase text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {getHeroBadge()}
            </span>
            <span className="font-mono text-xs text-[#DAD8D1]/70">
              Placed: {new Date(order.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <h1 className="mt-1 font-editorial text-3xl sm:text-5xl italic tracking-tight">
            #{order.orderNumber}
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-white/70 max-w-xl leading-relaxed">
            {orderStatus === 'DELIVERED'
              ? 'Your order has been delivered. Thank you for choosing PIERCYN.'
              : orderStatus === 'DISPATCHED'
              ? 'Your package has been dispatched. Delivery timeframe is communicated separately by staff.'
              : isReadyForDispatch
              ? 'All payments are verified and quotation accepted. Your order is authorized for packaging and courier dispatch.'
              : isDeliveryPaymentSubmitted
              ? 'Your delivery fee receipt has been submitted and is currently being verified by our finance team.'
              : isQuoteAccepted
              ? 'You have accepted the delivery quotation. Please complete the separate delivery payment below to authorize dispatch.'
              : isQuoteSent
              ? 'Your delivery fee quotation is ready. Please review the confirmed fee below to accept or reject.'
              : isProductPaymentVerified
              ? 'Your merchandise payment has been verified. PIERCYN staff is calculating your delivery fee.'
              : isProductPaymentSubmitted
              ? 'Your merchandise payment receipt has been received and is awaiting admin verification.'
              : 'Please transfer your merchandise subtotal and upload your receipt below to begin order processing.'}
          </p>
        </header>

        {/* ── STEP 1: PRODUCT PAYMENT ────────────────────────────────────── */}
        <section className="mt-6 rounded-2xl bg-[#EAE6DD] border border-[#DAD6CC] p-5 sm:p-7">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#141414] text-white flex items-center justify-center font-mono text-[11px] font-bold">1</span>
              <h2 className="font-editorial text-2xl italic text-[#141414]">
                Product Payment (Merchandise Subtotal)
              </h2>
            </div>
            <span className="font-mono text-sm font-bold text-[#141414]">
              ₦{(order.subtotalNGN || 0).toLocaleString()}
            </span>
          </div>

          {isProductPaymentVerified ? (
            <div className="rounded-xl border border-emerald-700/20 bg-emerald-50 p-4 text-xs text-emerald-950 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <strong className="block text-emerald-900 font-semibold">Merchandise Payment Verified</strong>
                <span>Amount: ₦{(order.subtotalNGN || 0).toLocaleString()} • Verified by PIERCYN staff</span>
              </div>
            </div>
          ) : isProductPaymentSubmitted ? (
            <div className="rounded-xl border border-amber-600/30 bg-amber-50 p-4 text-xs text-amber-950 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <strong className="block text-amber-900 font-semibold">Payment Receipt Under Review</strong>
                <span>Our team is verifying your merchandise payment receipt. Once verified, your delivery fee will be calculated.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isProductPaymentRejected && (
                <div className="rounded-xl border border-red-700/20 bg-red-50 p-4 text-xs text-red-900 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Previous Receipt Rejected</strong>
                    <span>{productPayment?.rejectionReason || 'Please upload a clear, matching payment receipt.'}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-[#55524D] leading-relaxed">
                Transfer the exact merchandise subtotal of{' '}
                <strong className="text-[#141414] font-mono font-bold">
                  ₦{(order.subtotalNGN || 0).toLocaleString()}
                </strong>{' '}
                to our verified account below using your order reference:
              </p>

              {/* Bank Details Card */}
              <div className="bg-white/80 border border-[#DAD6CC] rounded-xl p-4 sm:p-5 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#7A7771]">BANK NAME:</span>
                  <strong className="text-[#141414]">{bank.bankName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7A7771]">ACCOUNT NAME:</span>
                  <strong className="text-[#141414]">{bank.accountName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7A7771]">ACCOUNT NUMBER:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-base text-[#141414] font-bold">{bank.accountNumber}</strong>
                    <button
                      onClick={handleCopyAccount}
                      className="p-1 rounded bg-[#EAE6DD] hover:bg-[#DAD6CC] cursor-pointer"
                      title="Copy"
                      type="button"
                    >
                      {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-[#141414]" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#DAD6CC]">
                  <span className="text-[#7A7771]">NARRATION / REF:</span>
                  <strong className="text-[#141414]">{order.orderNumber}</strong>
                </div>
              </div>

              {/* Receipt Upload Box */}
              <div className="rounded-xl border border-[#DAD6CC] bg-white/60 p-4">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7A7771] mb-1">
                  Upload Merchandise Payment Receipt
                </p>
                <p className="text-[11px] text-[#6E6B65] mb-3">
                  JPEG, PNG or PDF up to 3 MB.
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => {
                    setProductReceiptFile(e.target.files?.[0] || null);
                    setProductReceiptError('');
                  }}
                  className="block w-full text-xs text-[#55524D] file:mr-3 file:rounded-full file:border-0 file:bg-[#141414] file:px-4 file:py-2 file:text-[10px] file:font-bold file:uppercase file:text-white hover:file:bg-black file:cursor-pointer"
                />
                {productReceiptError && (
                  <p className="mt-2 text-[11px] text-red-800">{productReceiptError}</p>
                )}
                <button
                  type="button"
                  onClick={handleProductReceiptUpload}
                  disabled={!productReceiptFile || productReceiptState === 'uploading'}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#141414] px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-black transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{productReceiptState === 'uploading' ? 'Uploading…' : 'Submit Product Receipt'}</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── STEP 2: DELIVERY QUOTATION ──────────────────────────────────── */}
        {isProductPaymentVerified && (
          <section className="mt-6 rounded-2xl bg-[#EAE6DD] border border-[#DAD6CC] p-5 sm:p-7">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#141414] text-white flex items-center justify-center font-mono text-[11px] font-bold">2</span>
                <h2 className="font-editorial text-2xl italic text-[#141414]">
                  Delivery Fee Quotation
                </h2>
              </div>
              {isQuoteAccepted && (
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                  ACCEPTED: ₦{(order.deliveryFeeNGN || activeQuote?.amountNGN || 0).toLocaleString()}
                </span>
              )}
            </div>

            {isQuotePending && (
              <div className="rounded-xl border border-sky-300/40 bg-sky-50 p-4 text-xs text-sky-950 flex items-center gap-3">
                <Clock className="w-5 h-5 text-sky-700 shrink-0" />
                <div>
                  <strong className="block text-sky-900 font-semibold">Delivery Fee Being Calculated</strong>
                  <span>PIERCYN staff is calculating your delivery fee based on your destination ({order.deliveryCity || order.shippingCity}, {order.deliveryState || order.shippingState}). Quotation will appear here and be sent to your WhatsApp.</span>
                </div>
              </div>
            )}

            {isQuoteSent && (
              <div className="space-y-4">
                <div className="bg-white/90 border border-sky-200 rounded-xl p-5 text-xs font-sans space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-sky-950 font-bold">
                      Confirmed Delivery Quotation
                    </span>
                    <span className="font-mono text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-semibold">
                      Expires after 48 hours
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline border-y border-[#DAD6CC] py-3">
                    <span className="text-sm font-semibold text-[#141414]">Quoted Delivery Fee:</span>
                    <strong className="font-editorial italic text-3xl font-bold text-[#141414]">
                      ₦{(activeQuote?.amountNGN || 0).toLocaleString()}
                    </strong>
                  </div>

                  <p className="text-[11px] text-[#7A7771] italic">
                    Delivery timeframe is communicated separately by staff.
                  </p>

                  {quoteActionError && (
                    <p className="text-xs text-red-800">{quoteActionError}</p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isAcceptingQuote}
                      onClick={handleAcceptQuote}
                      className="flex-1 py-3 rounded-full bg-[#141414] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50 cursor-pointer text-center"
                    >
                      {isAcceptingQuote ? 'Processing…' : 'Accept Delivery Quotation'}
                    </button>
                    <button
                      type="button"
                      disabled={isRejectingQuote}
                      onClick={() => setShowRejectModal(true)}
                      className="py-3 px-6 rounded-full border border-red-700 text-red-800 text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Reject Quotation
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isQuoteRejected && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-red-950 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-red-900 font-semibold">Quotation Declined</strong>
                  <span>You declined the delivery quotation. PIERCYN staff has been notified and will review alternative delivery arrangements.</span>
                </div>
              </div>
            )}

            {isQuoteExpired && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-900 font-semibold">Quotation Expired</strong>
                  <span>This delivery quotation expired after 48 hours. A staff member is reviewing your order and refund obligations.</span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── STEP 3: SEPARATE DELIVERY PAYMENT ──────────────────────────── */}
        {isQuoteAccepted && (
          <section className="mt-6 rounded-2xl bg-[#EAE6DD] border border-[#DAD6CC] p-5 sm:p-7">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#141414] text-white flex items-center justify-center font-mono text-[11px] font-bold">3</span>
                <h2 className="font-editorial text-2xl italic text-[#141414]">
                  Separate Delivery Payment
                </h2>
              </div>
              <span className="font-mono text-sm font-bold text-[#141414]">
                ₦{(order.deliveryFeeNGN || activeQuote?.amountNGN || 0).toLocaleString()}
              </span>
            </div>

            {isDeliveryPaymentVerified ? (
              <div className="rounded-xl border border-emerald-700/20 bg-emerald-50 p-4 text-xs text-emerald-950 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <strong className="block text-emerald-900 font-semibold">Delivery Payment Verified</strong>
                  <span>Both product and delivery payments are satisfied. Order is approved for dispatch.</span>
                </div>
              </div>
            ) : isDeliveryPaymentSubmitted ? (
              <div className="rounded-xl border border-amber-600/30 bg-amber-50 p-4 text-xs text-amber-950 flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <strong className="block text-amber-900 font-semibold">Delivery Receipt Under Review</strong>
                  <span>Our finance team is verifying your delivery payment. Dispatch will be authorized immediately upon verification.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {isDeliveryPaymentRejected && (
                  <div className="rounded-xl border border-red-700/20 bg-red-50 p-4 text-xs text-red-900 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Delivery Receipt Rejected</strong>
                      <span>{deliveryPayment?.rejectionReason || 'Please upload a clear receipt of your delivery fee transfer.'}</span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-[#55524D] leading-relaxed">
                  Transfer the accepted delivery fee of{' '}
                  <strong className="text-[#141414] font-mono font-bold">
                    ₦{(order.deliveryFeeNGN || activeQuote?.amountNGN || 0).toLocaleString()}
                  </strong>{' '}
                  to our verified account below and upload your delivery receipt:
                </p>

                {/* Bank Details Card */}
                <div className="bg-white/80 border border-[#DAD6CC] rounded-xl p-4 sm:p-5 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#7A7771]">BANK NAME:</span>
                    <strong className="text-[#141414]">{bank.bankName}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7A7771]">ACCOUNT NUMBER:</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-base text-[#141414] font-bold">{bank.accountNumber}</strong>
                      <button
                        onClick={handleCopyAccount}
                        className="p-1 rounded bg-[#EAE6DD] hover:bg-[#DAD6CC] cursor-pointer"
                        title="Copy"
                        type="button"
                      >
                        {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-[#141414]" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#DAD6CC]">
                    <span className="text-[#7A7771]">NARRATION / REF:</span>
                    <strong className="text-[#141414]">{order.orderNumber} (Delivery)</strong>
                  </div>
                </div>

                {/* Upload Delivery Receipt */}
                <div className="rounded-xl border border-[#DAD6CC] bg-white/60 p-4">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7A7771] mb-1">
                    Upload Delivery Payment Receipt
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => {
                      setDeliveryReceiptFile(e.target.files?.[0] || null);
                      setDeliveryReceiptError('');
                    }}
                    className="block w-full text-xs text-[#55524D] file:mr-3 file:rounded-full file:border-0 file:bg-[#141414] file:px-4 file:py-2 file:text-[10px] file:font-bold file:uppercase file:text-white hover:file:bg-black file:cursor-pointer"
                  />
                  {deliveryReceiptError && (
                    <p className="mt-2 text-[11px] text-red-800">{deliveryReceiptError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleDeliveryReceiptUpload}
                    disabled={!deliveryReceiptFile || deliveryReceiptState === 'uploading'}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#141414] px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-black transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{deliveryReceiptState === 'uploading' ? 'Uploading…' : 'Submit Delivery Receipt'}</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── STEP 4: FULFILMENT & DISPATCH ──────────────────────────────── */}
        {isProductPaymentVerified && isDeliveryPaymentVerified && (
          <section className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200/90 p-5 sm:p-7 text-emerald-950 font-sans">
            <div className="flex items-center gap-2.5 mb-3">
              <Truck className="w-5 h-5 text-emerald-800" />
              <h2 className="font-editorial text-2xl italic text-emerald-950">
                Dispatch & Fulfilment
              </h2>
            </div>

            <div className="space-y-2 text-xs leading-relaxed">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold uppercase text-[11px] px-2.5 py-0.5 rounded bg-emerald-200/70 text-emerald-950">
                  STATUS: {orderStatus.replaceAll('_', ' ')}
                </span>
                {order.riderName && (
                  <span className="text-emerald-900 font-mono text-[11px]">
                    Logistics: {order.riderName}
                  </span>
                )}
              </div>
              <p className="text-emerald-900/90 text-[12px] pt-1">
                Both merchandise and delivery fee payments are satisfied. Delivery timeframe will be communicated directly by PIERCYN staff.
              </p>
            </div>
          </section>
        )}

        {/* 2-Column Items & Delivery Summary */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Items Summary */}
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
                    ₦{(item.totalNGN ?? (item.unitPriceNGN * item.quantity) ?? 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-[#DAD8D1] pt-4 space-y-1.5 text-xs font-sans">
              <div className="flex justify-between text-[#55524D]">
                <span>Product Subtotal:</span>
                <span className="font-mono">₦{(order.subtotalNGN || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[#55524D]">
                <span>Delivery Fee:</span>
                <span className="font-mono text-xs font-semibold">
                  {isQuoteAccepted ? (
                    `₦${(order.deliveryFeeNGN || activeQuote?.amountNGN || 0).toLocaleString()}`
                  ) : isQuoteSent ? (
                    `₦${(activeQuote?.amountNGN || 0).toLocaleString()} (Quoted)`
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
                  {isQuoteAccepted ? (
                    `₦${((order.subtotalNGN || 0) + (order.deliveryFeeNGN || 0)).toLocaleString()}`
                  ) : (
                    `₦${(order.subtotalNGN || 0).toLocaleString()} + Delivery`
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Destination Details */}
          <div className="rounded-2xl border border-[#DAD8D1] bg-[#EAE6DD] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-editorial text-xl italic text-[#141414] mb-4">
                Delivery Destination
              </h2>
              <div className="space-y-3 text-xs text-[#55524D] font-sans">
                <div>
                  <span className="block text-[10px] font-mono uppercase text-[#7A7771] font-semibold">CUSTOMER:</span>
                  <span className="font-semibold text-[#141414]">{order.customerFirstName} {order.customerLastName}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase text-[#7A7771] font-semibold">DESTINATION:</span>
                  <span className="text-[#141414]">
                    {order.deliveryAddress || order.shippingAddressLine}, {order.deliveryCity || order.shippingCity}, {order.deliveryState || order.shippingState}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase text-[#7A7771] font-semibold">PHONE:</span>
                  <span className="text-[#141414] font-mono">{order.customerPhone}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DAD8D1] mt-4 flex items-center gap-2 text-[11px] text-[#6E6B65]">
              <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>Questions? Concierge support available Monday–Saturday.</span>
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

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#F2F0EB] border border-[#DAD6CC] rounded-2xl p-6 max-w-md w-full shadow-2xl font-sans">
            <h3 className="font-editorial text-2xl italic text-[#141414] mb-2">
              Decline Quotation
            </h3>
            <p className="text-xs text-[#55524D] mb-4 leading-relaxed">
              Please share why this quotation does not work for you so our team can provide an alternative:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Delivery fee is higher than expected, alternative address preferred..."
              className="w-full bg-white border border-[#DAD6CC] rounded-xl p-3 text-xs text-[#141414] focus:outline-none focus:border-[#141414] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-5 py-2.5 rounded-full border border-[#DAD6CC] text-xs font-bold uppercase text-[#55524D] hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRejectingQuote}
                onClick={handleRejectQuote}
                className="px-5 py-2.5 rounded-full bg-red-700 text-white text-xs font-bold uppercase hover:bg-red-800 disabled:opacity-50"
              >
                {isRejectingQuote ? 'Declining…' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
