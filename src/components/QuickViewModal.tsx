import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { formatPrice } from '../utils/currency';
import { SHIPPING_CONFIG } from '../utils/shipping';
import { X, Plus, Heart, Ruler, Truck, ShieldCheck } from 'lucide-react';

export const QuickViewModal: React.FC = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    currency,
    addToCart,
    toggleWishlist,
    isWishlisted,
    setIsSizeGuideOpen
  } = useShop();

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && quickViewProduct) {
        setQuickViewProduct(null);
      }
    };
    if (quickViewProduct) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quickViewProduct, setQuickViewProduct]);

  useEffect(() => {
    if (quickViewProduct) {
      setSelectedColorIdx(0);
      setActiveImageIdx(0);
      if (quickViewProduct.sizes && quickViewProduct.sizes.length > 0) {
        setSelectedSize(quickViewProduct.sizes[0]);
      }
    }
  }, [quickViewProduct?.id]);

  if (!quickViewProduct) return null;

  const currentColor = quickViewProduct.colors[selectedColorIdx] || quickViewProduct.colors[0];
  const galleryImages = [
    currentColor?.image || quickViewProduct.images[0],
    currentColor?.altImage || quickViewProduct.images[1] || quickViewProduct.images[0],
    ...quickViewProduct.images.slice(2)
  ].filter(Boolean);

  const displayImage = galleryImages[activeImageIdx] || galleryImages[0];

  const handleAddToCart = () => {
    addToCart(quickViewProduct, currentColor.name, selectedSize);
    setQuickViewProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label={quickViewProduct.name}>
      {/* Backdrop */}
      <div
        onClick={() => setQuickViewProduct(null)}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-6 lg:p-10">
        <div className="relative w-full max-w-5xl bg-[#F2F0EB] text-[#141414] shadow-2xl border-t sm:border border-[#E3DEC3] rounded-t-2xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 max-h-[92svh] sm:max-h-none flex flex-col">
          
          {/* Close Button */}
          <button
            onClick={() => setQuickViewProduct(null)}
            className="absolute top-3.5 right-3.5 z-30 min-w-[44px] min-h-[44px] rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-[#141414] transition-all border border-[#141414]/10 cursor-pointer shadow-xs flex items-center justify-center"
            aria-label="Close Quick View"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto">
            
            {/* Left: Gallery Column */}
            <div className="relative bg-[#E7E2D6] p-4 sm:p-8 flex flex-col justify-between">
              {/* Main Image with strict 4:5 editorial ratio */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#DED9CE] mb-3 sm:mb-4 rounded-xl shadow-xs">
                <img
                  src={displayImage}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover object-center"
                />

                {/* Micro Tag */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-[9px] font-mono tracking-[0.25em] uppercase px-2.5 py-0.5 rounded-full bg-[#141414]/90 text-[#F2F0EB]">
                    {quickViewProduct.gsm || 'LAGOS ATELIER'}
                  </span>
                </div>
              </div>

              {/* Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-2.5">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIdx(i)}
                      className={`w-12 sm:w-14 aspect-[4/5] overflow-hidden rounded-md border-2 transition-all cursor-pointer ${
                        activeImageIdx === i ? 'border-[#141414] scale-105 shadow-xs' : 'border-transparent opacity-60'
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Editorial Specs & Action */}
            <div className="p-5 sm:p-8 lg:p-10 flex flex-col justify-between space-y-5 sm:space-y-6 font-sans pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              
              <div>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[#6E6B65] font-semibold mb-1.5 sm:mb-2">
                  <span>PIERCYN / {quickViewProduct.collection.toUpperCase()}</span>
                  <span>{quickViewProduct.origin}</span>
                </div>

                <h2 className="font-editorial text-3xl sm:text-4xl uppercase tracking-[-0.025em] text-[#141414] leading-[0.95]">
                  {quickViewProduct.name}
                </h2>

                <div className="mt-2.5 sm:mt-3 font-sans text-xl sm:text-2xl text-[#141414] font-bold">
                  {formatPrice(quickViewProduct, currency)}
                </div>

                <p className="mt-3 text-[14px] text-[#4A4844] font-normal leading-[1.6]">
                  {quickViewProduct.description}
                </p>
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-2 gap-2.5 py-3 sm:py-4 border-y border-[#E3DEC3] text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#4A4844]">
                <div>
                  <span className="text-[#8C8A84] block text-[9px] sm:text-[10px] font-semibold">FABRIC DENSITY:</span>
                  <span className="font-bold text-[#141414]">{quickViewProduct.gsm || 'HEAVYWEIGHT'}</span>
                </div>
                <div>
                  <span className="text-[#8C8A84] block text-[9px] sm:text-[10px] font-semibold">SILHOUETTE:</span>
                  <span className="font-bold text-[#141414]">{quickViewProduct.fit}</span>
                </div>
                <div>
                  <span className="text-[#8C8A84] block text-[9px] sm:text-[10px] font-semibold">COMPOSITION:</span>
                  <span className="font-bold text-[#141414]">{quickViewProduct.fabric}</span>
                </div>
                <div>
                  <span className="text-[#8C8A84] block text-[9px] sm:text-[10px] font-semibold">FIT ADVICE:</span>
                  <span className="font-bold text-[#141414]">TRUE TO SIZE</span>
                </div>
              </div>

              {/* Select Color with 44px touch targets */}
              <div>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.15em] font-semibold mb-1.5">
                  <span>COLOR: <strong className="text-[#141414] font-bold">{currentColor.name}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  {quickViewProduct.colors.map((c, idx) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setSelectedColorIdx(idx);
                        setActiveImageIdx(0);
                      }}
                      className={`min-w-[44px] min-h-[44px] rounded-full border-2 p-1 transition-all cursor-pointer flex items-center justify-center ${
                        selectedColorIdx === idx ? 'border-[#141414] scale-105 ring-1 ring-[#141414]' : 'border-transparent opacity-75'
                      }`}
                      title={c.name}
                    >
                      <span
                        className="w-6 h-6 rounded-full block border border-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>



              {/* Add to Bag Action with 48px height Pill Button */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 h-12 min-h-[48px] px-6 rounded-full bg-[#141414] text-[#F2F0EB] text-[12px] sm:text-[13px] uppercase tracking-[0.16em] font-semibold hover:bg-black transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>ADD TO BAG</span>
                </button>

                <button
                  onClick={() => toggleWishlist(quickViewProduct.id)}
                  className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full border border-[#141414]/70 hover:bg-[#141414] hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
                  aria-label="Wishlist"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isWishlisted(quickViewProduct.id) ? 'fill-current' : ''
                    }`}
                  />
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
