import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS } from '../data/products';
import { X, Package, ShoppingCart, Users, DollarSign, CheckCircle2, Clock, Truck } from 'lucide-react';

export const AdminDrawer: React.FC = () => {
  const { isAdminOpen, setIsAdminOpen, orders } = useShop();
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');

  if (!isAdminOpen) return null;

  const totalRevenue = orders.reduce((acc, ord) => acc + ord.totalNGN, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs font-sans text-left">
      <div className="w-full max-w-2xl bg-[#F2F0EB] h-full text-[#141414] shadow-2xl flex flex-col justify-between border-l border-[#DAD8D1] animate-in slide-in-from-right duration-300">
        {/* ADMIN HEADER */}
        <div className="bg-[#141414] text-[#F2F0EB] p-4 sm:p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-[#E8E6E1]/70 uppercase tracking-widest block">
              PIERCYN CYCLE 1 FOUNDATION
            </span>
            <h2 className="font-editorial italic text-2xl">ATELIER OPERATIONAL DASHBOARD</h2>
          </div>
          <button
            onClick={() => setIsAdminOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* METRICS SUMMARY */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-[#E8E6E1] border-b border-[#DAD8D1] text-xs font-mono">
          <div className="bg-[#F2F0EB] p-3 rounded-lg border border-[#DAD8D1]">
            <span className="text-[10px] text-[#141414]/60 uppercase block">TOTAL ORDERS</span>
            <span className="text-lg font-bold">{orders.length}</span>
          </div>
          <div className="bg-[#F2F0EB] p-3 rounded-lg border border-[#DAD8D1]">
            <span className="text-[10px] text-[#141414]/60 uppercase block">REVENUE (NGN)</span>
            <span className="text-base font-bold truncate">₦{totalRevenue.toLocaleString()}</span>
          </div>
          <div className="bg-[#F2F0EB] p-3 rounded-lg border border-[#DAD8D1]">
            <span className="text-[10px] text-[#141414]/60 uppercase block">INVENTORY PIECES</span>
            <span className="text-lg font-bold">{PRODUCTS.reduce((acc, p) => acc + (p.stock || 20), 0)}</span>
          </div>
        </div>

        {/* TAB CONTROL */}
        <div className="flex border-b border-[#DAD8D1] bg-[#E8E6E1]/50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'orders' ? 'border-[#141414] text-[#141414]' : 'border-transparent text-[#141414]/60'
            }`}
          >
            CUSTOMER ORDERS ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'inventory' ? 'border-[#141414] text-[#141414]' : 'border-transparent text-[#141414]/60'
            }`}
          >
            INVENTORY STOCK ({PRODUCTS.length})
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'orders' ? (
            orders.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#141414]/60 font-mono">
                NO ORDERS CREATED YET IN THIS SESSION.
                <br />
                GO THROUGH THE CHECKOUT FLOW TO CREATE A CYCLE 1 ORDER.
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-[#E8E6E1]/60 p-4 rounded-xl border border-[#DAD8D1] space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-[#DAD8D1] pb-2 font-mono">
                    <span className="font-bold text-[#141414]">#{ord.orderNumber}</span>
                    <span className="px-2 py-0.5 bg-emerald-800 text-white rounded text-[10px] uppercase font-bold">
                      {ord.paymentStatus} • {ord.orderStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#141414]/60 uppercase text-[9px] block">CUSTOMER</span>
                      <p className="font-bold">{ord.customer.fullName}</p>
                      <p className="text-[#141414]/70">{ord.customer.phone}</p>
                      <p className="text-[#141414]/70 truncate">{ord.customer.email}</p>
                    </div>
                    <div>
                      <span className="text-[#141414]/60 uppercase text-[9px] block">DELIVERY DESTINATION</span>
                      <p className="font-semibold">{ord.customer.city}, {ord.customer.state}</p>
                      <p className="text-[#141414]/70 line-clamp-2">{ord.customer.address}</p>
                    </div>
                  </div>

                  {/* ITEMS SUMMARY */}
                  <div className="pt-2 border-t border-[#DAD8D1]/60 space-y-1">
                    <span className="text-[#141414]/60 uppercase text-[9px] block">ORDERED PIECES</span>
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[#141414] font-mono text-[11px]">
                        <span>{it.quantity}x {it.productName} ({it.size}, {it.color})</span>
                        <span>₦{it.totalPriceNGN.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-2 border-t border-[#DAD8D1] font-mono font-bold text-sm">
                    <span>TOTAL ORDER VALUE</span>
                    <span>₦{ord.totalNGN.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="space-y-3">
              {PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-[#E8E6E1]/60 p-3 rounded-xl border border-[#DAD8D1] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img src={prod.images[0]} alt={prod.name} className="w-10 h-10 object-cover rounded bg-neutral-300" />
                    <div>
                      <h4 className="font-bold truncate max-w-[220px]">{prod.name}</h4>
                      <span className="text-[10px] font-mono text-[#141414]/60 uppercase">{prod.category} • ₦{prod.priceNGN.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-[#141414]/60 uppercase block">STOCK</span>
                    <span className="font-bold text-sm">{prod.stock || 25} UNITS</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-[#E8E6E1] border-t border-[#DAD8D1] text-[10px] font-mono text-center text-[#141414]/60">
          PIERCYN V1 COMMERCE DATA ARCHITECTURE READY FOR PRODUCTION BACKEND
        </div>
      </div>
    </div>
  );
};
