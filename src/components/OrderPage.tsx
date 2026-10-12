import React, { useEffect, useState } from 'react';
import { CheckCircle2, Package, Truck, ArrowRight, AlertCircle, MessageCircle } from 'lucide-react';
import { api } from '../services/apiClient';

interface OrderPageProps { orderId: string; mode: 'success' | 'tracking'; onShop: () => void; }

export const OrderPage: React.FC<OrderPageProps> = ({ orderId, mode, onShop }) => {
  const [order, setOrder] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');

  const loadOrder = async () => {
    setState('loading');
    const token = localStorage.getItem(`piercyn_order_access_${orderId}`);
    if (!token) { setState('error'); return; }
    try {
      const result = await api.getOrder(orderId, token);
      if (result.success && result.data) { setOrder(result.data); setState('ready'); } else setState('error');
    } catch { setState('error'); }
  };

  useEffect(() => { loadOrder(); }, [orderId]);

  if (state === 'loading') return <main className="min-h-screen bg-[#F2F0EB] pt-32 text-center text-sm text-[#6E6B65]">Loading your order securely…</main>;
  if (state === 'error') return <main className="min-h-screen bg-[#F2F0EB] pt-32"><div className="piercyn-container mx-auto max-w-xl text-center"><AlertCircle className="mx-auto h-9 w-9" /><h1 className="mt-4 font-editorial text-3xl italic">ORDER NOT AVAILABLE</h1><p className="mt-3 text-sm text-[#6E6B65]">For your security, this order can only be viewed from the confirmation link on the device used at checkout.</p><button onClick={onShop} className="mt-6 rounded-full bg-[#141414] px-6 py-3 text-xs font-semibold text-white">CONTINUE SHOPPING</button></div></main>;

  const items = order.items || [];
  const status = order.orderStatus || order.status || 'PENDING_PAYMENT';
  const pendingPayment = order.paymentStatus === 'PENDING';
  return <main className="min-h-screen bg-[#F2F0EB] pt-24 pb-20 text-[#141414]"><div className="piercyn-container mx-auto max-w-3xl">
    <header className="rounded-2xl bg-[#141414] p-6 text-[#F2F0EB] sm:p-9"><CheckCircle2 className="h-9 w-9" /><p className="mt-5 text-[10px] font-mono tracking-[.2em]">{mode === 'success' ? (pendingPayment ? 'ORDER RESERVED' : 'ORDER CONFIRMED') : 'ORDER TRACKING'}</p><h1 className="mt-2 font-editorial text-3xl italic sm:text-5xl">{order.orderNumber}</h1><p className="mt-3 text-sm text-white/70">{pendingPayment ? 'Complete payment to begin processing your pieces.' : 'We will keep you updated as your order moves through the atelier.'}</p></header>
    <section className="mt-6 grid gap-6 md:grid-cols-2"><div className="rounded-xl border border-[#DAD8D1] p-5"><h2 className="font-semibold">Order summary</h2><div className="mt-4 space-y-3">{items.map((item: any) => <div key={item.id || item.productId} className="flex justify-between gap-4 text-sm"><span>{item.productName} × {item.quantity}</span><span>₦{(item.totalNGN ?? item.totalPriceNGN ?? 0).toLocaleString()}</span></div>)}</div><div className="mt-5 border-t border-[#DAD8D1] pt-4 font-mono font-bold">TOTAL <span className="float-right">₦{(order.totalNGN || 0).toLocaleString()}</span></div></div>
      <div className="rounded-xl border border-[#DAD8D1] p-5"><h2 className="font-semibold">Delivery & status</h2><div className="mt-4 space-y-3 text-sm text-[#5F5C56]"><p><Package className="mr-2 inline h-4 w-4" />{status.replaceAll('_', ' ')}</p><p><Truck className="mr-2 inline h-4 w-4" />{order.shippingMethodName || order.shippingMethod || 'Delivery details pending'}</p>{order.shipment?.trackingNumber && <p>Tracking: {order.shipment.trackingNumber}</p>}</div></div></section>
    <div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={onShop} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#141414] px-6 text-xs font-semibold text-white">CONTINUE SHOPPING <ArrowRight className="h-4 w-4" /></button>{mode === 'success' && <button onClick={() => { window.history.pushState({}, '', `/orders/${order.id}`); window.dispatchEvent(new PopStateEvent('popstate')); }} className="min-h-12 rounded-full border border-[#141414] px-6 text-xs font-semibold">TRACK THIS ORDER</button>}{pendingPayment && <a href={`https://wa.me/2349129997137?text=${encodeURIComponent(`Hello PIERCYN, I need verified payment instructions for order ${order.orderNumber}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#141414]/25 px-6 text-xs font-semibold"><MessageCircle className="h-4 w-4" /> GET VERIFIED PAYMENT INSTRUCTIONS</a>}</div>
  </div></main>;
};
