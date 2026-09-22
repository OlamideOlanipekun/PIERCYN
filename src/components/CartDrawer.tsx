import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { formatNumericPrice } from '../utils/currency';
import { X, Minus, Plus, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartCount,
    cartSubtotal,
    currency,
    clearCart,
    showToast,
    setIsCheckoutOpen,
  } = useShop();

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  const freeShippingThreshold = 100000;
  const currentTotalNGN = cart.reduce((acc, item) => acc + item.product.priceNGN * item.quantity, 0);
  const progressPercent = Math.min(100, (currentTotalNGN / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - currentTotalNGN);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'LAGOS26' || promoCode.trim().toUpperCase() === 'STANDOUT') {
      setDiscountPercent(15);
      showToast('15% Private Editorial Discount Applied');
    } else {
      showToast('Invalid promo code. Try "STANDOUT" for 15% off.');
    }
  };

  const finalSubtotal = cartSubtotal * (1 - discountPercent / 100);

  const handleSimulatedCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-[#F2F0EB] text-[#141414] shadow-2xl flex flex-col justify-between border-l border-[#E3DEC3] animate-in slide-in-from-right duration-300">
          
          {/* Top Header */}
          <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-[#E3DEC3] flex items-center justify-between font-sans shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-editorial text-2xl sm:text-3xl uppercase tracking-[-0.02em]">SHOPPING BAG</span>
              <span className="text-[10px] font-sans font-bold tracking-wider bg-[#141414] text-[#F2F0EB] px-2.5 sm:px-3 py-1 rounded-full">
                {cartCount} {cartCount === 1 ? 'PIECE' : 'PIECES'}
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border border-[#141414]/20 hover:bg-[#141414]/10 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Close Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-4 sm:px-6 py-3 bg-[#EAE5D9] border-b border-[#E3DEC3] text-[10px] sm:text-[11px] uppercase tracking-[0.14em] font-sans">
            {remainingForFreeShipping > 0 ? (
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between text-[#4A4844] font-semibold">
                  <span>FREE DELIVERY</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#D5CFBF] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#141414] rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#6E6B65] lowercase font-medium">
                  add {formatNumericPrice(remainingForFreeShipping, currency)} more for free delivery
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <Truck className="w-3.5 h-3.5 shrink-0" />
                <span>YOU QUALIFY FOR FREE DELIVERY</span>
              </div>
            )}
          </div>

          {/* Bag Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {checkoutComplete ? (
              <div className="py-12 sm:py-16 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#141414] flex items-center justify-center mx-auto text-[#141414]">
                  ✓
                </div>
                <h3 className="font-editorial text-2xl sm:text-3xl uppercase tracking-[-0.02em]">
                  ORDER RECEIVED
                </h3>
                <p className="text-[12px] sm:text-[13px] text-[#5C5954] font-light max-w-xs mx-auto leading-relaxed">
                  Thank you for entering the world of PIERCYN. A private confirmation has been dispatched.
                </p>
                <button
                  onClick={() => {
                    setCheckoutComplete(false);
                    setIsCartOpen(false);
                  }}
                  className="mt-4 sm:mt-6 min-h-[44px] px-7 py-3 rounded-full bg-[#141414] text-[#F2F0EB] text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-black transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  CONTINUE EXPLORING
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="py-16 sm:py-20 text-center space-y-4">
                <ShoppingBag className="w-8 h-8 opacity-40 mx-auto text-[#141414]" />
                <p className="font-editorial text-xl sm:text-2xl uppercase tracking-[-0.02em] text-[#141414]">
                  YOUR BAG IS EMPTY
                </p>
                <p className="text-[12px] sm:text-[13px] text-[#7A7771] font-normal max-w-xs mx-auto">
                  Let's find you something good.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 min-h-[44px] px-7 py-3 rounded-full border border-[#141414] bg-[#141414] text-[#F2F0EB] text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-black transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  SHOP NOW
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const colorObj = item.product.colors.find((c) => c.name === item.selectedColor) || item.product.colors[0];
                const itemImg = colorObj?.image || item.product.images[0];
                const itemPrice = currency === 'NGN' ? item.product.priceNGN : currency === 'USD' ? item.product.priceUSD : currency === 'GBP' ? item.product.priceGBP : item.product.priceEUR;

                return (
                  <div 
                    key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                    className="flex gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-[#E3DEC3]/80"
                  >
                    {/* Thumbnail with strict 4:5 ratio */}
                    <div className="w-18 sm:w-20 aspect-[4/5] bg-[#E7E2D6] rounded-md overflow-hidden shrink-0 shadow-2xs">
                      <img
                        src={itemImg}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between font-sans">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-[13px] uppercase tracking-[0.06em] font-semibold text-[#141414] leading-snug">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.selectedColor, item.selectedSize)}
                            className="min-w-[40px] min-h-[40px] text-[#8C8A84] hover:text-[#141414] rounded-full hover:bg-black/5 flex items-center justify-center cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] uppercase tracking-[0.14em] text-[#6E6B65] mt-1 font-semibold">
                          <span>{item.selectedColor}</span>
                          <span>•</span>
                          <span>SIZE {item.selectedSize}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 sm:mt-3">
                        {/* Quantity adjuster pill with 40px touch targets */}
                        <div className="flex items-center border border-[#D5CFBF] bg-[#FAF8F5] rounded-full overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedColor, item.selectedSize, -1)}
                            className="min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-[#EAE5D9] transition-colors cursor-pointer font-bold"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-[12px] font-sans font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedColor, item.selectedSize, 1)}
                            className="min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-[#EAE5D9] transition-colors cursor-pointer font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="font-sans text-[13px] sm:text-[14px] font-bold text-[#141414]">
                          {formatNumericPrice(itemPrice * item.quantity, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Summary & Checkout with safe area bottom padding */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 bg-[#EBE7DF] border-t border-[#E3DEC3] space-y-3 sm:space-y-4 font-sans pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              
              {/* Promo Code Form */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="PROMO (e.g. STANDOUT)"
                  className="flex-1 h-11 min-h-[44px] bg-[#FAF8F5] border border-[#D5CFBF] px-4 rounded-full text-[11px] uppercase font-sans tracking-wider focus:outline-none focus:border-[#141414]"
                />
                <button
                  type="submit"
                  className="h-11 min-h-[44px] px-5 rounded-full border border-[#141414] text-[11px] font-sans font-bold uppercase tracking-wider hover:bg-[#141414] hover:text-[#F2F0EB] transition-colors cursor-pointer"
                >
                  APPLY
                </button>
              </form>

              {/* Subtotals */}
              <div className="space-y-1.5 text-[11px] sm:text-[12px] uppercase tracking-[0.15em] font-sans">
                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>EDITORIAL DISCOUNT (15%)</span>
                    <span>- {formatNumericPrice(cartSubtotal * 0.15, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#141414] font-bold text-[14px] sm:text-[15px] pt-1">
                  <span>ESTIMATED TOTAL</span>
                  <span>{formatNumericPrice(finalSubtotal, currency)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleSimulatedCheckout}
                className="group w-full h-12 min-h-[48px] px-6 rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] sm:text-[13px] uppercase tracking-[0.16em] font-bold hover:bg-black transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span>CHECKOUT</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[#6E6B65] font-sans pt-0.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 opacity-70" />
                <span>SECURE CHECKOUT • FAST & RELIABLE DELIVERY</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
