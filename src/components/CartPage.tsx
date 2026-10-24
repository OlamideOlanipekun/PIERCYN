import React from 'react';
import { useShop } from '../context/ShopContext';
import { ActivePageView } from '../types';
import { formatPrice } from '../utils/currency';
import { SHIPPING_CONFIG } from '../utils/shipping';
import { usesSizeOnlyOptions } from '../utils/variants';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  Clock, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface CartPageProps {
  onSelectPage: (page: ActivePageView) => void;
  onViewProduct?: (product: any) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onSelectPage, onViewProduct }) => {
  const { 
    cart, 
    cartCount, 
    cartSubtotal, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    appliedPromoCode,
    promoDiscountNGN,
    promoDescription,
    applyPromoCode,
    removePromoCode,
    currency
  } = useShop();

  const [promoInput, setPromoInput] = React.useState('');
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = React.useState<string | null>(null);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoError(null);
    setPromoSuccess(null);
    const result = await applyPromoCode(promoInput.trim());
    if (result.success) {
      setPromoSuccess(result.message);
      setPromoInput('');
    } else {
      setPromoError(result.message);
    }
  };

  const finalTotal = Math.max(0, cartSubtotal - promoDiscountNGN);
  const isFreeDelivery = cartSubtotal >= SHIPPING_CONFIG.freeShippingThresholdNGN;
  const deliveryNote = isFreeDelivery
    ? 'Complimentary Delivery Qualified'
    : `Standard Lagos ₦${SHIPPING_CONFIG.lagosDeliveryFeeNGN.toLocaleString()} / Nationwide ₦${SHIPPING_CONFIG.nationwideDeliveryFeeNGN.toLocaleString()} (Free above ₦${SHIPPING_CONFIG.freeShippingThresholdNGN.toLocaleString()})`;

  if (cart.length === 0) {
    return (
      <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-[75vh] pt-28 sm:pt-36 pb-20 font-sans">
        <div className="piercyn-container max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#E5E0D5] text-[#141414] flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
          </div>
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[#7A7771] block mb-2 font-semibold">
            YOUR SELECTION
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl italic text-[#141414] mb-4">
            Your Bag is Empty
          </h1>
          <p className="text-[14px] text-[#55524D] leading-relaxed mb-8">
            Explore our heavyweight oversized graphic tees, clean essentials, and signature silhouettes tailored for daily movement.
          </p>
          <button
            onClick={() => onSelectPage('shop')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-[0.18em] hover:bg-black transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>DISCOVER THE COLLECTION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-24 sm:pt-28 pb-24 font-sans">
      <div className="piercyn-container max-w-5xl mx-auto">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-6">
          <button onClick={() => onSelectPage('home')} className="hover:text-[#141414] cursor-pointer">
            HOME
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <button onClick={() => onSelectPage('shop')} className="hover:text-[#141414] cursor-pointer">
            SHOP
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <span className="text-[#141414] font-semibold">SHOPPING BAG ({cartCount})</span>
        </nav>

        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[#DAD8D1] pb-6 mb-8 gap-3">
          <div>
            <span className="text-[10px] font-mono tracking-[0.24em] uppercase text-[#7A7771] block mb-1 font-semibold">
              PIERCYN ATELIER · ORDER ASSEMBLY
            </span>
            <h1 className="font-editorial text-4xl sm:text-5xl italic text-[#141414]">
              Shopping Bag
            </h1>
          </div>
          <button
            onClick={() => clearCart()}
            className="text-[11px] font-mono text-[#7A7771] hover:text-[#141414] underline uppercase tracking-wider self-start sm:self-auto cursor-pointer"
          >
            Clear Bag
          </button>
        </header>

        {/* Main Grid: Cart Items (Col 7) + Order Summary (Col 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Cart Items List */}
          <div className="lg:col-span-7 space-y-4">
            {cart.map((item) => {
              const p = item.product;
              const isAvailableToOrder = p.availabilityType === 'available_to_order';
              const fulfillmentTimeline = p.fulfillmentTimeline || (
                isAvailableToOrder
                  ? 'Sourced on order · Dispatched in 5–7 business days'
                  : 'Physical stock · Dispatched in 24–48 hours from Lagos'
              );

              return (
                <div
                  key={`${item.variantId || item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                  className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-xl p-4 sm:p-5 flex gap-4 transition-all"
                >
                  {/* Thumbnail Image */}
                  <div
                    onClick={() => onViewProduct && onViewProduct(p)}
                    className="w-20 sm:w-24 aspect-[3/4] bg-[#D7D2C5] rounded-md overflow-hidden shrink-0 cursor-pointer"
                  >
                    <img
                      src={item.product.images?.[0] || ''}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3
                          onClick={() => onViewProduct && onViewProduct(p)}
                          className="font-medium text-sm sm:text-base text-[#141414] tracking-tight uppercase hover:text-[#555] cursor-pointer transition-colors"
                        >
                          {item.product.name}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.variantId, item.selectedColor, item.selectedSize)}
                          className="text-[#7A7771] hover:text-red-700 p-1 cursor-pointer transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Variant Attributes */}
                      <div className="flex items-center gap-3 text-xs text-[#55524D] mt-1 font-sans">
                        {!usesSizeOnlyOptions(item.product) && <><span>Color: <strong>{item.selectedColor}</strong></span><span>•</span></>}
                        <span>Size: <strong>{item.selectedSize}</strong></span>
                      </div>

                      {/* Availability Tag */}
                      <div className="mt-2 flex items-center gap-1.5 text-[10.5px] font-mono">
                        {isAvailableToOrder ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold tracking-wider">
                            <Clock className="w-3 h-3" />
                            AVAILABLE TO ORDER
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold tracking-wider">
                            <Truck className="w-3 h-3" />
                            IN STOCK
                          </span>
                        )}
                        <span className="text-[#6E6B65] hidden sm:inline">
                          — {fulfillmentTimeline}
                        </span>
                      </div>
                    </div>

                    {/* Quantity + Unit / Line Price */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#DAD6CC]/70">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[#141414] rounded-full bg-transparent overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1, item.selectedColor, undefined)}
                          className="w-7 h-7 flex items-center justify-center text-[#141414] hover:bg-[#141414]/10 cursor-pointer transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-mono text-xs font-bold text-[#141414]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1, item.selectedColor, undefined)}
                          className="w-7 h-7 flex items-center justify-center text-[#141414] hover:bg-[#141414]/10 cursor-pointer transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Price */}
                      <div className="text-right">
                        <span className="font-mono text-base font-bold text-[#141414]">
                          ₦{(item.product.priceNGN * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}

            {/* Back to Shop */}
            <div className="pt-2">
              <button
                onClick={() => onSelectPage('shop')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-[#141414] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Shopping</span>
              </button>
            </div>
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-5 bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-7 sticky top-24">
            <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] block mb-1 font-semibold">
              SUMMARY
            </span>
            <h2 className="font-editorial text-2xl italic text-[#141414] mb-5">
              Order Details
            </h2>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="mb-5">
              <label htmlFor="promo-input" className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1.5 font-semibold">
                Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  id="promo-input"
                  type="text"
                  placeholder="e.g. LAGOS10"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="flex-1 bg-white/70 border border-[#DAD6CC] rounded-full px-4 py-2 text-xs uppercase font-mono text-[#141414] focus:outline-none focus:border-[#141414]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {promoError && (
                <p className="text-[11px] font-mono text-red-700 mt-1.5">{promoError}</p>
              )}
              {promoSuccess && (
                <p className="text-[11px] font-mono text-emerald-800 mt-1.5">{promoSuccess}</p>
              )}
              {appliedPromoCode && (
                <div className="flex items-center justify-between text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-md mt-2 border border-emerald-200">
                  <span>Code <strong>{appliedPromoCode}</strong> applied ({promoDescription})</span>
                  <button
                    type="button"
                    onClick={removePromoCode}
                    className="text-red-700 hover:underline font-sans cursor-pointer text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              )}
            </form>

            {/* Calculation Lines */}
            <div className="space-y-3 text-xs sm:text-sm text-[#4A4844] border-t border-[#DAD6CC] pt-4 mb-5 font-sans">
              <div className="flex justify-between">
                <span>Items Subtotal ({cartCount} {cartCount === 1 ? 'piece' : 'pieces'})</span>
                <span className="font-mono font-bold text-[#141414]">₦{cartSubtotal.toLocaleString()}</span>
              </div>

              {promoDiscountNGN > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Promotion Discount</span>
                  <span className="font-mono font-bold">-₦{promoDiscountNGN.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-start">
                <div>
                  <span>Delivery Estimate</span>
                  <p className="text-[10.5px] text-[#7A7771]">{deliveryNote}</p>
                </div>
                <span className="font-mono font-semibold text-[#141414]">
                  {isFreeDelivery ? 'FREE' : 'Calculated at checkout'}
                </span>
              </div>

              <div className="border-t border-[#DAD6CC] pt-3 flex justify-between items-baseline">
                <span className="font-bold text-base text-[#141414] uppercase tracking-wider">Estimated Total</span>
                <span className="font-mono text-2xl font-bold text-[#141414]">₦{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              id="cart-proceed-checkout-btn"
              onClick={() => onSelectPage('checkout')}
              className="w-full py-4 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-all cursor-pointer shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Trust Badges */}
            <div className="mt-6 pt-5 border-t border-[#DAD6CC] space-y-2 text-[11px] text-[#6E6B65]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#141414] shrink-0" />
                <span>Guest checkout · No customer account required</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#141414] shrink-0" />
                <span>Dispatched directly from our Lagos atelier</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
};
