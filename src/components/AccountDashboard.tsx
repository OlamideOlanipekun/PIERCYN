import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { ALL_PRODUCTS } from '../data/allProducts';
import { Product } from '../types';
import { formatNGN } from '../utils/currency';
import { 
  Package, 
  Truck, 
  Heart, 
  Sparkles, 
  Clock, 
  ShoppingBag, 
  CheckCircle2, 
  ChevronRight, 
  LogOut, 
  User, 
  MapPin 
} from 'lucide-react';

interface AccountDashboardProps {
  onSelectPage: (page: any) => void;
  onViewProduct: (product: Product) => void;
}

export const AccountDashboard: React.FC<AccountDashboardProps> = ({
  onSelectPage,
  onViewProduct,
}) => {
  const { user, logout, wishlist, orders, addToCart, isWishlisted, toggleWishlist } = useShop();
  const [activeTab, setActiveTab] = useState<'orders' | 'tracking' | 'wishlist'>('orders');

  const displayName = user?.firstName || 'Tunde';

  // Mock initial tracking order if none in state
  const currentTrackingOrder = orders[0] || {
    id: 'ord-mock-01',
    orderNumber: 'PCY-849201',
    orderStatus: 'PROCESSING',
    createdAt: new Date().toISOString(),
    totalNGN: 68200,
    items: [
      {
        productId: 'cargo-pant',
        productName: 'CARGO PANT',
        color: 'Pitch Black',
        size: '32L',
        quantity: 1,
        unitPriceNGN: 35000,
        totalPriceNGN: 35000,
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop',
      },
      {
        productId: 'oversized-tee',
        productName: 'OVERSIZED TEE',
        color: 'Pitch Black',
        size: 'L',
        quantity: 1,
        unitPriceNGN: 23200,
        totalPriceNGN: 23200,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop',
      }
    ],
    customer: {
      fullName: 'Tunde Adeleke',
      email: 'tunde.adeleke@example.com',
      city: 'Victoria Island, Lagos',
      address: '14 Admiralty Way, Lekki Phase 1',
    }
  };

  const wishlistedProducts = ALL_PRODUCTS.filter((p) => wishlist.includes(p.id));
  const recentlyViewedProducts = ALL_PRODUCTS.slice(0, 4);

  return (
    <div className="py-10 sm:py-16 bg-[#F5F3EE] text-[#111111] min-h-[80vh]">
      <div className="piercyn-container max-w-6xl">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-[#E2DFD7] gap-4">
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#737069] block mb-1">
              CUSTOMER ACCOUNT
            </span>
            <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
              Welcome, {displayName}!
            </h1>
            <p className="text-xs sm:text-sm text-[#737069] mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Victoria Island, Lagos • VIP Atelier Member
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectPage('shop')}
              className="h-10 px-5 rounded-full bg-[#111111] text-[#F5F3EE] text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>SHOP DROPS</span>
            </button>
            <button
              onClick={logout}
              className="h-10 px-4 rounded-full border border-[#E2DFD7] hover:border-[#111111] text-xs font-semibold text-[#737069] hover:text-[#111111] transition-colors cursor-pointer flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Main Content Area (Tabs) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 p-1.5 bg-[#ECE8E1] rounded-2xl">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#FFFFFF] text-[#111111] shadow-xs'
                    : 'text-[#737069] hover:text-[#111111]'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Order History ({orders.length || 1})</span>
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'tracking'
                    ? 'bg-[#FFFFFF] text-[#111111] shadow-xs'
                    : 'text-[#737069] hover:text-[#111111]'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Tracking</span>
              </button>
              <button
                onClick={() => setActiveTab('wishlist')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'wishlist'
                    ? 'bg-[#FFFFFF] text-[#111111] shadow-xs'
                    : 'text-[#737069] hover:text-[#111111]'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Wishlist ({wishlist.length})</span>
              </button>
            </div>

            {/* Tab 1: Order History */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="p-5 bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7]">
                  <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E2DFD7] gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#111111]">
                        Order #{currentTrackingOrder.orderNumber}
                      </span>
                      <span className="text-[11px] text-[#737069] block">
                        Placed on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold tracking-wider uppercase">
                        {currentTrackingOrder.orderStatus}
                      </span>
                      <span className="font-mono text-sm font-bold text-[#111111]">
                        {formatNGN(currentTrackingOrder.totalNGN)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="divide-y divide-[#F5F3EE] my-3">
                    {currentTrackingOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-12 h-14 object-cover rounded-lg bg-[#ECE8E1]"
                          />
                          <div>
                            <h4 className="font-sans text-xs font-bold text-[#111111]">
                              {item.productName}
                            </h4>
                            <p className="text-[11px] font-mono text-[#737069]">
                              {item.color} • Size {item.size} • Qty {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-semibold text-[#111111]">
                          {formatNGN(item.totalPriceNGN)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#E2DFD7] flex items-center justify-between text-xs">
                    <span className="text-[#737069]">Shipping to: {currentTrackingOrder.customer?.address || 'Lekki Phase 1, Lagos'}</span>
                    <button
                      onClick={() => setActiveTab('tracking')}
                      className="font-bold text-[#111111] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Track Shipment <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Live Tracking */}
            {activeTab === 'tracking' && (
              <div className="p-6 bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7] space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2DFD7]">
                  <div>
                    <h3 className="font-sans text-sm font-bold uppercase text-[#111111]">
                      Live Dispatch Tracking
                    </h3>
                    <p className="text-xs font-mono text-[#737069] mt-0.5">
                      Tracking ID: NG-PCY-98234-LAGOS
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase">
                    On Schedule
                  </span>
                </div>

                {/* Timeline */}
                <div className="space-y-6 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2DFD7]">
                  <div className="relative">
                    <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white text-[8px]">
                      ✓
                    </span>
                    <h4 className="font-sans text-xs font-bold text-[#111111]">
                      Order Confirmed & Atelier Handcrafted
                    </h4>
                    <p className="text-[11px] text-[#737069] mt-0.5">
                      Pieces inspected and packaged at Lagos HQ.
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white text-[8px]">
                      ✓
                    </span>
                    <h4 className="font-sans text-xs font-bold text-[#111111]">
                      Handed over to Express Courier
                    </h4>
                    <p className="text-[11px] text-[#737069] mt-0.5">
                      Dispatch Rider assigned • Contact: +234 812 000 9999
                    </p>
                  </div>

                  <div className="relative opacity-60">
                    <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#E2DFD7] border-2 border-white" />
                    <h4 className="font-sans text-xs font-bold text-[#111111]">
                      Out for Delivery (Victoria Island / Lekki)
                    </h4>
                    <p className="text-[11px] text-[#737069] mt-0.5">
                      Estimated Arrival: Today, before 5:00 PM
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Wishlist */}
            {activeTab === 'wishlist' && (
              <div className="space-y-4">
                {wishlistedProducts.length === 0 ? (
                  <div className="p-10 bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7] text-center">
                    <Heart className="w-8 h-8 text-[#737069] mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-[#111111]">Your wishlist is currently empty</p>
                    <p className="text-xs text-[#737069] mt-1 mb-4">Tap the heart on any piece to save for later.</p>
                    <button
                      onClick={() => onSelectPage('shop')}
                      className="px-5 py-2.5 rounded-full bg-[#111111] text-[#F5F3EE] text-xs font-bold uppercase tracking-wider"
                    >
                      EXPLORE NEW DROPS
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {wishlistedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="bg-[#FFFFFF] rounded-xl border border-[#E2DFD7] p-3 flex flex-col justify-between"
                      >
                        <div
                          onClick={() => onViewProduct(p)}
                          className="aspect-[3/4] rounded-lg overflow-hidden bg-[#ECE8E1] mb-2.5 cursor-pointer"
                        >
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4
                            onClick={() => onViewProduct(p)}
                            className="font-sans text-xs font-bold text-[#111111] truncate cursor-pointer hover:underline"
                          >
                            {p.name}
                          </h4>
                          <span className="font-mono text-xs font-bold text-[#111111] mt-0.5 block">
                            {formatNGN(p.priceNGN)}
                          </span>
                          <button
                            onClick={() => addToCart(p)}
                            className="w-full mt-2 py-1.5 bg-[#111111] text-[#F5F3EE] text-[10px] font-bold uppercase rounded-lg hover:bg-black transition-colors"
                          >
                            Add to Bag
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Style Preferences & Recently Viewed */}
          <div className="lg:col-span-4 space-y-6">
            {/* YOUR STYLE Card */}
            <div className="p-5 bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7]">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#111111]" />
                <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#111111]">
                  YOUR STYLE PROFILE
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-3 py-1 rounded-full bg-[#111111] text-[#F5F3EE] text-[11px] font-mono">
                    Trending
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#ECE8E1] text-[#111111] text-[11px] font-mono">
                    Minimalist
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#ECE8E1] text-[#111111] text-[11px] font-mono">
                    Streetwear Heavyweight
                  </span>
                </div>
                <p className="text-[11px] text-[#737069] leading-relaxed">
                  Tailored recommendations based on your preferences: Heavy cotton tees, dark oversized hoodies, and cargo cuts.
                </p>
              </div>
            </div>

            {/* RECENTLY VIEWED Grid */}
            <div className="p-5 bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#111111]" />
                  <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#111111]">
                    RECENTLY VIEWED
                  </h3>
                </div>
                <button
                  onClick={() => onSelectPage('shop')}
                  className="text-[10px] font-mono text-[#737069] hover:underline"
                >
                  See all
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {recentlyViewedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => onViewProduct(prod)}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#ECE8E1] mb-1.5 relative">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <h4 className="font-sans text-[11px] font-bold text-[#111111] truncate group-hover:underline">
                      {prod.name}
                    </h4>
                    <span className="font-mono text-[11px] font-bold text-[#737069]">
                      {formatNGN(prod.priceNGN)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
