import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../hooks/useAuth';
import { Product } from '../types';
import { formatNGN } from '../utils/currency';
import { GoogleSignInButton } from './auth/GoogleSignInButton';
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
  MapPin,
  ShieldCheck,
  PlusCircle,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface AccountDashboardProps {
  onSelectPage: (page: any) => void;
  onViewProduct: (product: Product) => void;
}

export const AccountDashboard: React.FC<AccountDashboardProps> = ({
  onSelectPage,
  onViewProduct,
}) => {
  const { products, wishlist, orders: localOrders, addToCart } = useShop();
  const { user, customer, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'tracking' | 'wishlist' | 'claim'>('orders');
  
  // Real orders loaded from server for authenticated user
  const [serverOrders, setServerOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [claimOrderNumber, setClaimOrderNumber] = useState('');
  const [claimStatus, setClaimStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const token = localStorage.getItem('piercyn_auth_token');

  // Fetch real authenticated customer orders
  const fetchCustomerOrders = async () => {
    if (!token) return;
    setIsLoadingOrders(true);
    try {
      const res = await fetch('/api/auth/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setServerOrders(data.data);
      }
    } catch (err) {
      console.warn('[AccountDashboard] Failed to fetch customer orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomerOrders();
    }
  }, [isAuthenticated]);

  const handleClaimOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimOrderNumber.trim() || !token) return;

    setIsClaiming(true);
    setClaimStatus(null);
    try {
      const res = await fetch('/api/auth/claim-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderNumber: claimOrderNumber.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setClaimStatus({ success: true, message: data.message || 'Order successfully linked to your account!' });
        setClaimOrderNumber('');
        fetchCustomerOrders();
      } else {
        setClaimStatus({ success: false, message: data.error || 'Could not claim order.' });
      }
    } catch {
      setClaimStatus({ success: false, message: 'Network error claiming order. Please retry.' });
    } finally {
      setIsClaiming(false);
    }
  };

  const displayName = customer?.firstName || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Atelier Client';
  const displayEmail = customer?.email || user?.email || '';
  const avatarUrl = customer?.avatarUrl || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const defaultAddress = customer?.addresses?.find((a) => a.isDefault) || customer?.addresses?.[0];
  const userCity = defaultAddress ? `${defaultAddress.city}, ${defaultAddress.state}` : 'Lagos, Nigeria';

  // Combine server orders with any locally-created orders in the active session
  const combinedOrders = serverOrders.length > 0 ? serverOrders : localOrders;
  const currentTrackingOrder = combinedOrders[0];

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));
  const recentlyViewedProducts = products.slice(0, 4);

  // If user is not authenticated, show welcoming Google Sign-In state
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="py-16 sm:py-24 bg-[#0A0A0A] text-[#F2F0EB] min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-[#121212] border border-[#262626] p-8 sm:p-10 shadow-2xl text-center">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#A8A59D] block mb-2">
            CLIENT PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-white mb-3">
            SIGN IN TO PIERCYN
          </h1>
          <p className="text-xs text-[#8E8B82] leading-relaxed mb-8">
            Access your order history, delivery tracking, saved atelier addresses, and private VIP collection drops.
          </p>

          <GoogleSignInButton
            redirectTo="/account"
            label="Sign in with Google"
          />

          <div className="mt-8 pt-8 border-t border-[#222222] space-y-3 text-left">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-[#A8A59D] flex-shrink-0" />
              <span className="text-[11px] text-[#A8A59D]">Instant login via Google OAuth — no password needed</span>
            </div>
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-[#A8A59D] flex-shrink-0" />
              <span className="text-[11px] text-[#A8A59D]">Automatic sync with past purchases under your email</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-16 bg-[#F5F3EE] text-[#111111] min-h-[80vh]">
      <div className="piercyn-container max-w-6xl">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-[#E2DFD7] gap-4">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#111111]/10 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#111111] text-[#F5F3EE] font-mono font-bold text-lg flex items-center justify-center">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-[#737069] block mb-1">
                ATELIER CLIENT • GOOGLE VERIFIED
              </span>
              <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                Welcome, {displayName}!
              </h1>
              <p className="text-xs text-[#737069] mt-0.5 flex items-center gap-1.5 font-mono">
                {displayEmail} • {userCity}
              </p>
            </div>
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
              onClick={() => signOut()}
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
            <div className="flex items-center gap-2 p-1.5 bg-[#ECE8E1] rounded-2xl flex-wrap">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#FFFFFF] text-[#111111] shadow-xs'
                    : 'text-[#737069] hover:text-[#111111]'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Orders ({combinedOrders.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'tracking'
                    ? 'bg-[#FFFFFF] text-[#111111] shadow-xs'
                    : 'text-[#737069] hover:text-[#111111]'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Active Track</span>
              </button>
              <button
                onClick={() => setActiveTab('claim')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'claim'
                    ? 'bg-[#FFFFFF] text-[#111111] shadow-xs'
                    : 'text-[#737069] hover:text-[#111111]'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Claim Past Order</span>
              </button>
              <button
                onClick={() => setActiveTab('wishlist')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'wishlist'
                    ? 'bg-[#FFFFFF] text-[#111111] shadow-xs'
                    : 'text-[#737069] hover:text-[#111111]'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Saved ({wishlist.length})</span>
              </button>
            </div>

            {/* TAB 1: ORDER HISTORY */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {isLoadingOrders ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-[#E2DFD7] text-xs font-mono text-[#737069]">
                    Loading verified orders…
                  </div>
                ) : combinedOrders.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-[#E2DFD7]">
                    <Package className="w-10 h-10 text-[#A8A59D] mx-auto mb-3" />
                    <h3 className="font-sans text-base font-bold text-[#111111]">No purchases yet</h3>
                    <p className="text-xs text-[#737069] max-w-sm mx-auto mt-1 mb-6">
                      Pieces you purchase will automatically show up here with live status tracking and invoices.
                    </p>
                    <button
                      onClick={() => onSelectPage('shop')}
                      className="px-6 py-2.5 rounded-full bg-[#111111] text-[#F5F3EE] text-xs font-bold uppercase tracking-wider hover:bg-black"
                    >
                      Explore New Arrivals
                    </button>
                  </div>
                ) : (
                  combinedOrders.map((ord: any) => (
                    <div
                      key={ord.id || ord.orderNumber}
                      className="p-5 sm:p-6 bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7] space-y-4 hover:border-[#111111]/30 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0ECE1] gap-2">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-[#111111]">
                            ORDER #{ord.orderNumber}
                          </span>
                          <span className="text-[11px] text-[#737069] ml-2 font-mono">
                            {new Date(ord.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {ord.status || ord.orderStatus || 'CONFIRMED'}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#111111]">
                            {formatNGN(ord.totalNGN)}
                          </span>
                        </div>
                      </div>

                      <div className="divide-y divide-[#F0ECE1]">
                        {ord.items?.map((it: any, idx: number) => (
                          <div key={idx} className="py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {it.image && (
                                <img
                                  src={it.image}
                                  alt={it.productName}
                                  className="w-12 h-14 object-cover rounded bg-[#F5F3EE]"
                                />
                              )}
                              <div>
                                <h4 className="font-sans text-xs font-bold text-[#111111]">
                                  {it.productName}
                                </h4>
                                <span className="text-[11px] text-[#737069] font-mono">
                                  Size: {it.size} • Qty: {it.quantity}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-xs text-[#111111]">
                              {formatNGN(it.totalPriceNGN || it.unitPriceNGN * it.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs text-[#737069]">
                        <span className="font-mono text-[11px]">
                          Delivery: {ord.deliveryState || ord.customer?.city || 'Nationwide Express'}
                        </span>
                        <a
                          href={`/track-order?orderNumber=${ord.orderNumber}`}
                          className="font-mono text-[11px] font-bold text-[#111111] hover:underline flex items-center gap-1"
                        >
                          Track Shipment <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: ACTIVE TRACKING */}
            {activeTab === 'tracking' && (
              <div className="p-6 bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7] space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE1]">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#737069]">Active Shipment</span>
                    <h3 className="font-sans text-base font-bold text-[#111111]">
                      Order #{currentTrackingOrder?.orderNumber || 'PCY-RECENT'}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#111111] text-[#F5F3EE] text-[10px] font-mono uppercase tracking-widest font-bold">
                    IN TRANSIT
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#111111]">Order Verified & Atelier Prepared</p>
                      <p className="text-[11px] text-[#737069]">Handcrafted and inspected by PIERCYN Quality Team</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-[#111111] mt-0.5 animate-bounce" />
                    <div>
                      <p className="text-xs font-bold text-[#111111]">Dispatch via Dedicated Courier</p>
                      <p className="text-[11px] text-[#737069]">En route to {userCity}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CLAIM PAST ORDER */}
            {activeTab === 'claim' && (
              <div className="p-6 bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7] space-y-5">
                <div>
                  <h3 className="font-sans text-base font-bold text-[#111111]">
                    Claim Past Guest Purchase
                  </h3>
                  <p className="text-xs text-[#737069] mt-1">
                    Did you place an order before signing into Google? Enter your Order Number (e.g., PC-000001) to link it to your verified account.
                  </p>
                </div>

                {claimStatus && (
                  <div
                    className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs ${
                      claimStatus.success
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-red-50 text-red-900 border border-red-200'
                    }`}
                  >
                    {claimStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{claimStatus.message}</span>
                  </div>
                )}

                <form onSubmit={handleClaimOrder} className="flex gap-2.5">
                  <input
                    type="text"
                    value={claimOrderNumber}
                    onChange={(e) => setClaimOrderNumber(e.target.value)}
                    placeholder="e.g. PC-000123"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2DFD7] text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-[#111111] bg-white text-[#111111]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isClaiming}
                    className="px-5 py-2.5 bg-[#111111] hover:bg-black text-[#F5F3EE] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isClaiming ? 'Claiming…' : 'Link Order'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: SAVED WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="p-6 bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7]">
                <h3 className="font-sans text-base font-bold text-[#111111] mb-4">
                  Saved Pieces ({wishlist.length})
                </h3>
                {wishlistedProducts.length === 0 ? (
                  <p className="text-xs text-[#737069]">No saved pieces yet. Browse drops and click the heart icon to save.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {wishlistedProducts.map((p) => (
                      <div key={p.id} className="group relative">
                        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#ECE8E1] mb-2">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h4 className="font-sans text-xs font-bold text-[#111111] truncate">{p.name}</h4>
                        <span className="font-mono text-xs font-bold text-[#737069]">{formatNGN(p.priceNGN)}</span>
                        <button
                          onClick={() => addToCart(p)}
                          className="w-full mt-2 py-1.5 bg-[#111111] text-[#F5F3EE] text-[10px] font-bold uppercase rounded-lg hover:bg-black"
                        >
                          Add to Bag
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Customer Details & Preferences */}
          <div className="lg:col-span-4 space-y-6">
            {/* Account Profile Card */}
            <div className="p-5 bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7] space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#111111]" />
                <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#111111]">
                  CLIENT PROFILE
                </h3>
              </div>
              <div className="space-y-1.5 text-xs text-[#737069]">
                <p><strong className="text-[#111111]">Name:</strong> {displayName}</p>
                <p><strong className="text-[#111111]">Email:</strong> {displayEmail}</p>
                {customer?.phone && <p><strong className="text-[#111111]">Phone:</strong> {customer.phone}</p>}
                <p><strong className="text-[#111111]">Status:</strong> VIP Atelier Access</p>
              </div>
            </div>

            {/* Saved Delivery Address Card */}
            <div className="p-5 bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7] space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#111111]" />
                <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#111111]">
                  PRIMARY ADDRESS
                </h3>
              </div>
              {defaultAddress ? (
                <div className="text-xs text-[#737069] leading-relaxed">
                  <p className="font-bold text-[#111111]">{defaultAddress.fullName}</p>
                  <p>{defaultAddress.addressLine}</p>
                  <p>{defaultAddress.city}, {defaultAddress.state}</p>
                  <p>{defaultAddress.phone}</p>
                </div>
              ) : (
                <p className="text-xs text-[#737069]">
                  Your shipping address will be saved here automatically during your next checkout.
                </p>
              )}
            </div>

            {/* RECENTLY VIEWED Grid */}
            <div className="p-5 bg-[#FFFFFF] rounded-2xl border border-[#E2DFD7]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#111111]" />
                  <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#111111]">
                    FEATURED PIECES
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
export default AccountDashboard;
