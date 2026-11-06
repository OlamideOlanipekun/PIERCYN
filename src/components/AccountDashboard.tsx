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
      <div className="flex min-h-[80vh] min-h-[100svh] items-center justify-center bg-[#0A0A0A] px-4 py-8 text-[#F2F0EB] sm:py-16">
        <div className="w-full max-w-md border border-[#262626] bg-[#121212] p-5 text-center shadow-2xl min-[360px]:p-6 sm:p-10">
          <span className="mb-2 block text-[10px] font-mono uppercase tracking-[0.22em] text-[#A8A59D] min-[360px]:tracking-[0.3em]">
            CLIENT PORTAL
          </span>
          <h1 className="mb-3 break-words font-sans text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            SIGN IN TO PIERCYN
          </h1>
          <p className="mb-6 text-xs leading-relaxed text-[#8E8B82] sm:mb-8">
            Access your order history, delivery tracking, saved atelier addresses, and private VIP collection drops.
          </p>

          <GoogleSignInButton
            redirectTo="/account"
            label="Sign in with Google"
          />

          <div className="mt-6 space-y-3 border-t border-[#222222] pt-6 text-left sm:mt-8 sm:pt-8">
            <div className="flex items-start gap-3 sm:items-center">
              <ShieldCheck className="w-4 h-4 text-[#A8A59D] flex-shrink-0" />
              <span className="text-[11px] text-[#A8A59D]">Instant login via Google OAuth — no password needed</span>
            </div>
            <div className="flex items-start gap-3 sm:items-center">
              <Package className="w-4 h-4 text-[#A8A59D] flex-shrink-0" />
              <span className="text-[11px] text-[#A8A59D]">Automatic sync with past purchases under your email</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] overflow-x-hidden bg-[#F5F3EE] py-7 text-[#111111] sm:py-10 lg:py-16">
      <div className="piercyn-container max-w-6xl">
        {/* Welcome Header */}
        <div className="flex flex-col gap-4 border-b border-[#E2DFD7] pb-6 sm:flex-row sm:items-center sm:justify-between sm:pb-8">
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-12 w-12 flex-shrink-0 rounded-full border-2 border-[#111111]/10 object-cover shadow-sm sm:h-14 sm:w-14"
              />
            ) : (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#111111] font-mono text-lg font-bold text-[#F5F3EE] sm:h-14 sm:w-14">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-mono tracking-widest uppercase text-[#737069] block mb-1">
                ATELIER CLIENT • GOOGLE VERIFIED
              </span>
              <h1 className="break-words font-sans text-xl font-extrabold tracking-tight text-[#111111] min-[380px]:text-2xl sm:text-3xl">
                Welcome, {displayName}!
              </h1>
              <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 break-words text-[11px] font-mono text-[#737069] sm:text-xs">
                {displayEmail} • {userCity}
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-[1fr_auto] items-center gap-2 sm:flex sm:w-auto sm:gap-3">
            <button
              onClick={() => onSelectPage('shop')}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[#111111] px-3 text-[10px] font-bold uppercase tracking-wider text-[#F5F3EE] transition-colors hover:bg-black cursor-pointer min-[380px]:px-5 min-[380px]:text-xs sm:h-10 sm:px-5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>SHOP DROPS</span>
            </button>
            <button
              onClick={() => signOut()}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-[#E2DFD7] px-3 text-xs font-semibold text-[#737069] transition-colors hover:border-[#111111] hover:text-[#111111] cursor-pointer sm:h-10 sm:px-4"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="mt-6 grid min-w-0 grid-cols-1 gap-5 sm:mt-8 sm:gap-8 lg:grid-cols-12">
          {/* Main Content Area (Tabs) */}
          <div className="min-w-0 space-y-5 lg:col-span-8 sm:space-y-6">
            {/* Tabs Navigation */}
            <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#ECE8E1] p-1.5 sm:grid-cols-4 sm:gap-2">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[9px] font-bold uppercase leading-tight tracking-wide transition-all cursor-pointer min-[400px]:flex-row min-[400px]:gap-2 min-[400px]:text-[10px] sm:px-2 sm:py-2.5 sm:text-xs sm:tracking-wider ${
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
                className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[9px] font-bold uppercase leading-tight tracking-wide transition-all cursor-pointer min-[400px]:flex-row min-[400px]:gap-2 min-[400px]:text-[10px] sm:px-2 sm:py-2.5 sm:text-xs sm:tracking-wider ${
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
                className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[9px] font-bold uppercase leading-tight tracking-wide transition-all cursor-pointer min-[400px]:flex-row min-[400px]:gap-2 min-[400px]:text-[10px] sm:px-2 sm:py-2.5 sm:text-xs sm:tracking-wider ${
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
                className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[9px] font-bold uppercase leading-tight tracking-wide transition-all cursor-pointer min-[400px]:flex-row min-[400px]:gap-2 min-[400px]:text-[10px] sm:px-2 sm:py-2.5 sm:text-xs sm:tracking-wider ${
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
                  <div className="rounded-2xl border border-[#E2DFD7] bg-white p-6 text-center sm:p-12">
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
                      className="min-w-0 space-y-4 rounded-2xl border border-[#E2DFD7] bg-[#FFFFFF] p-4 transition-all hover:border-[#111111]/30 sm:p-6"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0ECE1] gap-2">
                        <div className="min-w-0 break-words">
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
                        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
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
                          <div key={idx} className="flex min-w-0 items-start justify-between gap-3 py-3 sm:items-center sm:gap-4">
                            <div className="flex min-w-0 items-start gap-3 sm:items-center">
                              {it.image && (
                                <img
                                  src={it.image}
                                  alt={it.productName}
                                  className="h-14 w-12 flex-shrink-0 rounded object-cover bg-[#F5F3EE]"
                                />
                              )}
                              <div className="min-w-0">
                                <h4 className="break-words font-sans text-xs font-bold text-[#111111]">
                                  {it.productName}
                                </h4>
                                <span className="text-[11px] text-[#737069] font-mono">
                                  Size: {it.size} • Qty: {it.quantity}
                                </span>
                              </div>
                            </div>
                            <span className="flex-shrink-0 text-right font-mono text-xs text-[#111111]">
                              {formatNGN(it.totalPriceNGN || it.unitPriceNGN * it.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {ord.quoteStatus && ord.quoteStatus !== 'ACCEPTED' && (
                        <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-800 font-bold">
                          Delivery Quote: {ord.quoteStatus}
                        </div>
                      )}
                      <div className="flex flex-col gap-2 pt-2 text-xs text-[#737069] sm:flex-row sm:items-center sm:justify-between">
                        <span className="break-words font-mono text-[11px]">
                          Delivery: {ord.deliveryState || ord.customer?.city || 'Nationwide Express'}
                        </span>
                        <button
                          onClick={() => {
                            window.history.pushState({}, '', '/account/orders/' + ord.id);
                            window.dispatchEvent(new PopStateEvent('popstate'));
                          }}
                          className="inline-flex min-h-11 items-center gap-1 self-start font-mono text-[11px] font-bold text-[#111111] hover:underline cursor-pointer sm:min-h-0 sm:self-auto"
                        >
                          View Order Details <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: ACTIVE TRACKING */}
            {activeTab === 'tracking' && (
              <div className="space-y-5 rounded-2xl border border-[#E2DFD7] bg-[#FFFFFF] p-4 sm:space-y-6 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0ECE1] pb-4">
                  <div className="min-w-0">
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
              <div className="space-y-5 rounded-2xl border border-[#E2DFD7] bg-[#FFFFFF] p-4 sm:p-6">
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
                    <span className="min-w-0 break-words">{claimStatus.message}</span>
                  </div>
                )}

                <form onSubmit={handleClaimOrder} className="flex min-w-0 flex-col gap-2.5 sm:flex-row">
                  <input
                    type="text"
                    value={claimOrderNumber}
                    onChange={(e) => setClaimOrderNumber(e.target.value)}
                    placeholder="e.g. PC-000123"
                    className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#E2DFD7] bg-white px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-[#111111] focus:border-[#111111] focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isClaiming}
                    className="min-h-11 rounded-xl bg-[#111111] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#F5F3EE] transition-colors hover:bg-black disabled:opacity-60 cursor-pointer"
                  >
                    {isClaiming ? 'Claiming…' : 'Link Order'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: SAVED WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="rounded-2xl border border-[#E2DFD7] bg-[#FFFFFF] p-4 sm:p-6">
                <h3 className="font-sans text-base font-bold text-[#111111] mb-4">
                  Saved Pieces ({wishlist.length})
                </h3>
                {wishlistedProducts.length === 0 ? (
                  <p className="text-xs text-[#737069]">No saved pieces yet. Browse drops and click the heart icon to save.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 min-[400px]:gap-4 sm:grid-cols-3">
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
              <div className="space-y-1.5 break-words text-xs text-[#737069] [overflow-wrap:anywhere]">
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
                <div className="break-words text-xs leading-relaxed text-[#737069] [overflow-wrap:anywhere]">
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

              <div className="grid min-w-0 grid-cols-2 gap-2.5">
                {recentlyViewedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => onViewProduct(prod)}
                    className="group min-w-0 cursor-pointer"
                  >
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#ECE8E1] mb-1.5 relative">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <h4 className="truncate font-sans text-[11px] font-bold text-[#111111] group-hover:underline">
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
