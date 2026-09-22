import React from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS } from '../data/products';
import { formatPrice } from '../utils/currency';
import { X, Heart, ShoppingBag, Plus, Trash2, ArrowRight } from 'lucide-react';

export const WishlistDrawer: React.FC = () => {
  const {
    wishlist,
    isWishlistOpen,
    setIsWishlistOpen,
    toggleWishlist,
    addToCart,
    currency,
    setQuickViewProduct
  } = useShop();

  if (!isWishlistOpen) return null;

  const wishlistedProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));

  const handleMoveAllToBag = () => {
    wishlistedProducts.forEach((p) => {
      addToCart(p);
    });
    setIsWishlistOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsWishlistOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-[#F2F0EB] text-[#141414] shadow-2xl flex flex-col justify-between border-l border-[#E3DEC3] animate-in slide-in-from-right duration-300">
          
          {/* Top Header */}
          <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-[#E3DEC3] flex items-center justify-between font-sans shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-editorial text-xl sm:text-2xl uppercase tracking-tight">SAVED PIECES</span>
              <span className="text-[10px] font-sans font-bold tracking-wider bg-[#141414] text-[#F2F0EB] px-2.5 sm:px-3 py-1 rounded-full">
                {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'PIECE' : 'PIECES'}
              </span>
            </div>

            <button
              onClick={() => setIsWishlistOpen(false)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border border-[#141414]/20 hover:bg-[#141414]/10 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Close Wishlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {wishlistedProducts.length === 0 ? (
              <div className="py-16 sm:py-20 text-center space-y-4 font-sans">
                <Heart className="w-8 h-8 opacity-40 mx-auto text-[#141414]" />
                <p className="font-editorial text-xl sm:text-2xl uppercase tracking-[-0.02em] text-[#141414]">
                  YOUR WISHLIST IS EMPTY
                </p>
                <p className="text-[12px] sm:text-[13px] text-[#7A7771] font-normal max-w-xs mx-auto leading-relaxed">
                  Click the heart on any item to save it for later.
                </p>
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="mt-4 h-11 min-h-[44px] px-7 rounded-full border border-[#141414] bg-[#141414] text-[#F2F0EB] text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-black transition-all cursor-pointer shadow-xs active:scale-95 inline-flex items-center justify-center"
                >
                  SHOP NOW
                </button>
              </div>
            ) : (
              wishlistedProducts.map((product) => {
                const colorObj = product.colors[0];
                const itemImg = colorObj?.image || product.images[0];

                return (
                  <div 
                    key={product.id}
                    className="flex gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-[#E3DEC3]/80 group"
                  >
                    {/* Thumbnail with strict 4:5 ratio */}
                    <div 
                      onClick={() => {
                        setIsWishlistOpen(false);
                        setQuickViewProduct(product);
                      }}
                      className="w-20 sm:w-24 aspect-[4/5] bg-[#E7E2D6] rounded-md overflow-hidden shrink-0 cursor-pointer shadow-2xs"
                    >
                      <img
                        src={itemImg}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between font-sans">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 
                            onClick={() => {
                              setIsWishlistOpen(false);
                              setQuickViewProduct(product);
                            }}
                            className="text-[12px] sm:text-[13px] uppercase tracking-[0.06em] font-semibold text-[#141414] leading-snug cursor-pointer hover:underline"
                          >
                            {product.name}
                          </h4>
                          <button
                            onClick={() => toggleWishlist(product.id)}
                            className="min-w-[40px] min-h-[40px] text-[#8C8A84] hover:text-red-600 rounded-full hover:bg-black/5 flex items-center justify-center cursor-pointer transition-colors"
                            title="Remove from saved"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#7A7771] mt-1 font-semibold">
                          <span>{product.gsm || 'HEAVYWEIGHT'}</span>
                          <span>•</span>
                          <span>{product.colors.length} COLORWAYS</span>
                        </div>

                        <div className="font-sans text-[13px] font-bold text-[#141414] mt-1">
                          {formatPrice(product, currency)}
                        </div>
                      </div>

                      {/* Quick Add To Bag Action */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => {
                            addToCart(product);
                          }}
                          className="flex-1 h-10 min-h-[40px] px-4 rounded-full bg-[#141414] text-[#F2F0EB] text-[10px] uppercase tracking-[0.16em] font-semibold hover:bg-black transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>MOVE TO BAG</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Actions with safe-area padding */}
          {wishlistedProducts.length > 0 && (
            <div className="p-4 sm:p-6 bg-[#EBE7DF] border-t border-[#E3DEC3] space-y-3 font-sans pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <button
                onClick={handleMoveAllToBag}
                className="group w-full h-12 min-h-[48px] px-6 rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] sm:text-[13px] uppercase tracking-[0.16em] font-bold hover:bg-black transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span>MOVE ALL ({wishlistedProducts.length}) TO BAG</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
