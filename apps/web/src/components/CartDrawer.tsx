import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { formatNumericPrice } from '../utils/currency';
import { SHIPPING_CONFIG } from '../utils/shipping';
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
    appliedPromoCode,
    promoDiscountNGN,
    promoDescription,
    applyPromoCode,
    removePromoCode,
  } = useShop();

  const [promoCode, setPromoCode] = useState(appliedPromoCode || '');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const freeShippingThreshold = SHIPPING_CONFIG.freeShippingThresholdNGN;
  const currentTotalNGN = cart.reduce((acc, item) => acc + item.product.priceNGN * item.quantity, 0);
  const progressPercent = Math.min(100, (currentTotalNGN / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - currentTotalNGN);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCartOpen, setIsCartOpen]);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    await applyPromoCode(promoCode.trim());
    setIsApplyingPromo(false);
  };

  const finalSubtotal = Math.max(0, cartSubtotal - (promoDiscountNGN || 0));

  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Bag">
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
                  <span>FREE DELIVERY AT {formatNumericPrice(freeShippingThreshold, currency)}</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#D5CFBF] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#141414] rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#6E6B65] font-medium lowercase">
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
            {cart.length === 0 ? (
              <div className="py-16 sm:py-20 text-center space-y-4">
                <ShoppingBag className="w-8 h-8 opacity-40 mx-auto text-[#141414]" />
                <p className="font-editorial text-xl sm:text-2xl uppercase tracking-[-0.02em] text-[#141414]">
                  YOUR BAG IS EMPTY
                </p>
                <p className="text-xs text-[#6E6B65] max-w-xs mx-auto">
                  Explore our latest drops and heavyweight essentials designed in Lagos.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors"
                >
                  START SHOPPING
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                  className="flex gap-4 pb-4 border-b border-[#E3DEC3]/60 items-start"
                >
                  <div className="w-20 h-24 sm:w-24 sm:h-28 bg-[#E7E2D6] rounded-md overflow-hidden shrink-0">
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between h-24 sm:h-28 py-0.5">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-editorial text-base sm:text-lg font-semibold uppercase leading-tight truncate">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedColor, item.selectedSize)}
                          className="text-[#6E6B65] hover:text-[#141414] p-1 cursor-pointer transition-colors"
                          aria-label="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#6E6B65] uppercase font-mono mt-1">
                        <span>SIZE: {item.selectedSize}</span>
                        <span>•</span>
                        <span>COLOR: {item.selectedColor}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-[#141414]/20 rounded-full h-7">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedColor, item.selectedSize, -1)}
                          className="w-7 h-full flex items-center justify-center text-[#141414] hover:bg-[#141414]/10 rounded-l-full cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-mono font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedColor, item.selectedSize, 1)}
                          className="w-7 h-full flex items-center justify-center text-[#141414] hover:bg-[#141414]/10 rounded-r-full cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="font-mono text-xs sm:text-sm font-bold text-[#141414]">
                        {formatNumericPrice(item.product.priceNGN * item.quantity, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Checkout Actions */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-[#E3DEC3] bg-[#EAE5D9]/50 space-y-3.5 shrink-0">
              
              {/* Promo Code Input */}
              {appliedPromoCode ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-900 uppercase">PROMO: {appliedPromoCode}</span>
                    <span className="text-[11px] text-emerald-700">(-{formatNumericPrice(promoDiscountNGN, currency)})</span>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-[11px] text-emerald-800 hover:text-red-700 font-semibold underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="PROMO CODE (e.g. STANDOUT)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 h-9 px-3 bg-[#F2F0EB] border border-[#141414]/20 rounded-full text-[11px] font-mono uppercase tracking-wider focus:outline-hidden focus:border-[#141414]"
                  />
                  <button
                    type="submit"
                    disabled={isApplyingPromo}
                    className="h-9 px-4 rounded-full bg-[#141414]/10 hover:bg-[#141414] hover:text-[#F2F0EB] text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isApplyingPromo ? '...' : 'APPLY'}
                  </button>
                </form>
              )}

              {/* Subtotals */}
              <div className="space-y-1.5 text-[11px] sm:text-[12px] uppercase tracking-[0.15em] font-sans">
                {promoDiscountNGN > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>DISCOUNT ({appliedPromoCode})</span>
                    <span>- {formatNumericPrice(promoDiscountNGN, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#141414] font-bold text-[14px] sm:text-[15px] pt-1">
                  <span>ESTIMATED TOTAL</span>
                  <span>{formatNumericPrice(finalSubtotal, currency)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedCheckout}
                className="group w-full h-12 min-h-[48px] px-6 rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] sm:text-[13px] uppercase tracking-[0.16em] font-bold hover:bg-black transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[#6E6B65] font-sans pt-0.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <span>LAGOS: 24–48H • NATIONWIDE: 3–5 DAYS</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
