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

  const loadOrder = async () => {
    if (!effectiveOrderId) {
      setState('error');
      return;
    }

    setState('loading');
    const token = localStorage.getItem(`piercyn_order_access_${effectiveOrderId}`);
    if (!token) {
      setState('error');
      return;
    }

    try {
      const result = await api.getOrder(effectiveOrderId, token);
      if (result.success && result.data) {
        setOrder(result.data);
        setState('ready');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  useEffect(() => {
    loadOrder();
  }, [effectiveOrderId]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('0123456789');
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
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
              href="https://wa.me/2348000000000?text=Hello%20PIERCYN!%20I'd%20like%20to%20inquire%20about%20my%20recent%20order."
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
  const pendingPayment = order.paymentStatus === 'PENDING';
  const isBankTransfer = (order.paymentMethod || '').toLowerCase().includes('transfer');

  const whatsappMessage = encodeURIComponent(
    `Hello PIERCYN Atelier! I've placed order ${order.orderNumber} (₦${(order.totalNGN || 0).toLocaleString()}). Here is my inquiry / proof of payment.`
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
              {mode === 'success' ? (pendingPayment ? 'ORDER RESERVED & LOGGED' : 'ORDER CONFIRMED') : 'ORDER TRACKING'}
            </span>
          </div>

          <h1 className="mt-2 font-editorial text-3xl sm:text-5xl italic tracking-tight">
            {order.orderNumber}
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-white/70 max-w-xl leading-relaxed">
            {pendingPayment
              ? 'Your inventory has been reserved. Please complete payment using the details below to initiate dispatch.'
              : 'Thank you for your order. We are preparing your pieces for dispatch from our Lagos studio.'}
          </p>
        </header>

        {/* Bank Transfer Instructions (When Payment is Pending) */}
        {pendingPayment && isBankTransfer && (
          <section className="mt-6 rounded-2xl bg-[#EAE6DD] border border-[#DAD6CC] p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-[#141414]" />
              <h2 className="font-editorial text-2xl italic text-[#141414]">
                Payment Instructions — Direct Bank Transfer
              </h2>
            </div>
            <p className="text-xs text-[#55524D] leading-relaxed mb-4">
              Transfer the exact order total of <strong className="text-[#141414] font-mono font-bold">₦{(order.totalNGN || 0).toLocaleString()}</strong> to our verified Lagos business account. Your pieces are reserved.
            </p>

            <div className="bg-white/80 border border-[#DAD6CC] rounded-xl p-4 sm:p-5 space-y-3 font-mono text-xs mb-4">
              <div className="flex justify-between items-center">
                <span className="text-[#7A7771]">BANK NAME:</span>
                <strong className="text-[#141414]">Guaranty Trust Bank (GTBank)</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7A7771]">ACCOUNT NAME:</span>
                <strong className="text-[#141414]">PIERCYN APPAREL NIG LTD</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7A7771]">ACCOUNT NUMBER:</span>
                <div className="flex items-center gap-2">
                  <strong className="text-base text-[#141414] font-bold">0123456789</strong>
                  <button
                    onClick={handleCopyAccount}
                    className="p-1 rounded bg-[#EAE6DD] hover:bg-[#DAD6CC] cursor-pointer transition-colors"
                    title="Copy Account Number"
                  >
                    {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-[#141414]" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#DAD6CC]">
                <span className="text-[#7A7771]">PAYMENT REFERENCE:</span>
                <strong className="text-[#141414]">{order.orderNumber}</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-[#6E6B65]">
                Send your payment receipt via WhatsApp for immediate courier clearance.
              </span>
              <a
                href={`https://wa.me/2348000000000?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-900 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Submit Receipt on WhatsApp</span>
              </a>
            </div>
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
                <span>Subtotal:</span>
                <span className="font-mono">₦{(order.subtotalNGN || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#55524D]">
                <span>Delivery:</span>
                <span className="font-mono">
                  {(order.deliveryFeeNGN || 0) === 0 ? 'FREE' : `₦${order.deliveryFeeNGN.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between font-mono font-bold text-sm text-[#141414] pt-2 border-t border-[#DAD8D1]">
                <span>TOTAL:</span>
                <span>₦{(order.totalNGN || 0).toLocaleString()}</span>
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
                  <span className="text-[#141414]">{order.shippingMethodName || 'Lagos Doorstep'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase text-[#7A7771] font-semibold">ORDER STATUS:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/10 text-[#141414] font-mono text-[11px] font-bold uppercase mt-1">
                    <Package className="w-3 h-3" />
                    {status.replaceAll('_', ' ')}
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
            href={`https://wa.me/2348000000000?text=${whatsappMessage}`}
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
