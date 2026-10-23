import React, { useState } from 'react';
import { ActivePageView } from '../types';
import { api } from '../services/apiClient';
import { 
  Package, 
  Search, 
  ChevronRight, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageCircle, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface TrackOrderPageProps {
  onSelectPage: (page: ActivePageView) => void;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ onSelectPage }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setTrackedOrder(null);

    const cleanNumber = orderNumber.trim().toUpperCase();
    const cleanContact = emailOrPhone.trim().toLowerCase();

    if (!cleanNumber || !cleanContact) {
      setErrorMessage('Please enter both your Order Number and Email or Phone Number.');
      return;
    }

    setIsLoading(true);

    // Check localStorage for tokens matching this device
    let matchingToken: string | null = null;
    let matchingOrderId: string | null = null;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('piercyn_order_access_')) {
        const potentialOrderId = key.replace('piercyn_order_access_', '');
        const token = localStorage.getItem(key);
        if (token) {
          try {
            const res = await api.getOrder(potentialOrderId, token);
            if (res.success && res.data) {
              const o = res.data;
              const matchesNumber = (o.orderNumber || '').toUpperCase() === cleanNumber;
              const matchesEmail = (o.customerEmail || '').toLowerCase() === cleanContact;
              const matchesPhone = (o.customerPhone || '').includes(cleanContact);
              if (matchesNumber && (matchesEmail || matchesPhone)) {
                matchingToken = token;
                matchingOrderId = potentialOrderId;
                setTrackedOrder(o);
                setIsLoading(false);
                return;
              }
            }
          } catch {
            // continue checking
          }
        }
      }
    }

    setIsLoading(false);
    // If not found in current browser cache, explain secure verification
    setErrorMessage(
      `We could not find active checkout credentials on this device for order "${cleanNumber}". For customer privacy, orders are encrypted. You can verify your tracking status instantly with our WhatsApp concierge.`
    );
  };

  const whatsappTrackingMessage = encodeURIComponent(
    `Hello PIERCYN! I would like to track my order ${orderNumber ? `(${orderNumber})` : ''}. Could you provide the latest dispatch status?`
  );

  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-24 sm:pt-28 pb-20 font-sans">
      <div className="piercyn-container max-w-4xl mx-auto">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-8">
          <button onClick={() => onSelectPage('home')} className="hover:text-[#141414] cursor-pointer">
            HOME
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <span className="text-[#141414] font-semibold">TRACK ORDER</span>
        </nav>

        {/* Page Header */}
        <header className="mb-10 border-b border-[#DAD8D1] pb-8">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#7A7771] block mb-2 font-semibold">
            DISPATCH LOGISTICS & STATUS
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#141414] italic font-normal tracking-tight">
            Order Tracking
          </h1>
          <p className="mt-4 text-[14px] sm:text-[15px] text-[#4A4844] max-w-2xl leading-relaxed">
            Enter your order reference and the contact info provided at checkout to retrieve verified dispatch progress from our Lagos atelier.
          </p>
        </header>

        {/* Lookup Box */}
        <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8 mb-10">
          <form onSubmit={handleTrackSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                  Order Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PCY-123456-789"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-white/80 border border-[#DAD6CC] rounded-xl px-4 py-3 text-xs sm:text-sm font-mono uppercase text-[#141414] focus:outline-none focus:border-[#141414]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                  Email or Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tunde@example.com or 08012345678"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full bg-white/80 border border-[#DAD6CC] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#141414] focus:outline-none focus:border-[#141414]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <span>SEARCHING DISPATCH RECORDS…</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>TRACK ORDER</span>
                </>
              )}
            </button>
          </form>

          {/* Error / Concierge Fallback */}
          {errorMessage && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <p>{errorMessage}</p>
                  <a
                    href={`https://wa.me/2348076431059?text=${whatsappTrackingMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-800 text-white font-bold uppercase tracking-wider text-[11px] hover:bg-emerald-900 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Track with WhatsApp Concierge</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Found Order Timeline */}
        {trackedOrder && (
          <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-8 animate-in fade-in duration-300 mb-10">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[#DAD6CC] pb-4 mb-6 gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7771]">
                  ORDER FOUND
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl italic text-[#141414]">
                  {trackedOrder.orderNumber}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141414] text-[#F2F0EB] font-mono text-xs font-bold uppercase">
                <Package className="w-3.5 h-3.5" />
                {(trackedOrder.orderStatus || 'PROCESSING').replaceAll('_', ' ')}
              </span>
            </div>

            {/* Timeline Milestones */}
            <div className="space-y-4 mb-6">
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-xs font-semibold text-[#141414]">Order Created & Logged</strong>
                  <span className="text-[11px] text-[#6E6B65]">Inventory reserved in our Lagos studio</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${trackedOrder.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-[#DAD6CC]'}`} />
                <div>
                  <strong className="block text-xs font-semibold text-[#141414]">Payment Status</strong>
                  <span className="text-[11px] text-[#6E6B65]">
                    {trackedOrder.paymentStatus === 'PAID' ? 'Verified & Approved' : 'Pending Authorization'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Truck className="w-5 h-5 text-[#141414] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-xs font-semibold text-[#141414]">Delivery Method</strong>
                  <span className="text-[11px] text-[#6E6B65]">{trackedOrder.shippingMethodName || 'Lagos Doorstep Delivery'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => {
                window.history.pushState({}, '', `/order/success/${trackedOrder.id}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="px-6 py-2.5 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
            >
              View Full Order Breakdown
            </button>
          </div>
        )}

      </div>
    </main>
  );
};
