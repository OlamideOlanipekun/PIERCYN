import React, { useState, useEffect } from 'react';
import { Product, ActivePageView } from '../../types';
import { useShop } from '../../context/ShopContext';
import { formatPrice, formatNumericPrice } from '../../utils/currency';
import { SHIPPING_CONFIG } from '../../utils/shipping';
import { eventTracker } from '../../services/eventTracker';
import { ProductGallery } from './ProductGallery';
import { ProductDetailsAccordion } from './ProductDetailsAccordion';
import { ProductCard } from '../ProductCard';
import {
  Plus,
  Heart,
  Ruler,
  Truck,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface ProductDetailsPageProps {
  product: Product | null;
  onSelectPage: (page: ActivePageView) => void;
  onViewProduct: (product: Product) => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  product,
  onSelectPage,
  onViewProduct,
}) => {
  const {
    products,
    currency,
    addToCart,
    toggleWishlist,
    isWishlisted,
    setIsSizeGuideOpen,
    setIsCheckoutOpen,
    showToast,
  } = useShop();

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sizeError, setSizeError] = useState(false);

  // Initialize variant selection & analytics
  useEffect(() => {
    if (product) {
      setSelectedColorIdx(0);
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      } else {
        setSelectedSize('');
      }
      setSizeError(false);

      // Dynamic Title & SEO
      document.title = `${product.name} — PIERCYN Lagos`;

      // Track analytics
      eventTracker.track('product_view', {
        productId: product.id,
        productName: product.name,
        priceNGN: product.priceNGN,
        category: product.category,
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product?.id]);

  if (!product) {
    return (
      <main className="w-full min-h-[70vh] bg-[#F2F0EB] text-[#141414] pt-28 pb-20 flex items-center justify-center font-sans">
        <div className="piercyn-container text-center space-y-4 max-w-md mx-auto">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7771]">
            CATALOG DISPATCH
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl uppercase tracking-tight text-[#141414]">
            PIECE NOT FOUND
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6B65] leading-relaxed">
            The piece you are looking for might have been archived or moved to another drop.
          </p>
          <div className="pt-3">
            <button
              onClick={() => onSelectPage('shop')}
              className="btn-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>EXPLORE THE COLLECTION</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentColor = product.colors[selectedColorIdx] || product.colors[0];

  // Stock status determination
  const isSoldOut = product.isSoldOut || product.stock === 0;
  const isAlmostGone = product.stock !== undefined && product.stock > 0 && product.stock <= 5;

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      setSizeError(true);
      showToast('Please select your size before adding to bag');
      return;
    }

    addToCart(product, currentColor?.name, selectedSize, 1);
    eventTracker.track('add_to_cart', {
      productId: product.id,
      productName: product.name,
      color: currentColor?.name,
      size: selectedSize,
      priceNGN: product.priceNGN,
    });
  };

  const handleBuyNow = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      setSizeError(true);
      showToast('Please select your size to proceed to checkout');
      return;
    }

    addToCart(product, currentColor?.name, selectedSize, 1);
    setIsCheckoutOpen(true);
    eventTracker.track('buy_now_clicked', {
      productId: product.id,
      productName: product.name,
      color: currentColor?.name,
      size: selectedSize,
      priceNGN: product.priceNGN,
    });
  };

  const whatsappInquiryMessage = encodeURIComponent(
    `Hello PIERCYN! I'm interested in the "${product.name}" (${formatPrice(product, 'NGN')}). Could you advise on fit and dispatch time?`
  );

  // Related products from real backend catalog
  const relatedProducts = products.filter(
    (p) => p.id !== product.id && (p.category === product.category || p.collection === product.collection)
  ).slice(0, 4);

  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-20 sm:pt-24 pb-20 font-sans">
      <div className="piercyn-container">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-6 sm:mb-8 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => onSelectPage('home')}
            className="hover:text-[#141414] transition-colors cursor-pointer shrink-0"
          >
            HOME
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1] shrink-0" />
          <button
            onClick={() => onSelectPage('shop')}
            className="hover:text-[#141414] transition-colors cursor-pointer shrink-0"
          >
            SHOP
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1] shrink-0" />
          <span className="text-[#7A7771] shrink-0">{product.category.toUpperCase()}</span>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1] shrink-0" />
          <span className="text-[#141414] font-bold truncate max-w-[220px]">{product.name}</span>
        </nav>

        {/* Primary 2-Column Product Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start mb-16 sm:mb-24">
          
          {/* LEFT: Product Gallery (Col 7) */}
          <div className="lg:col-span-7 w-full">
            <ProductGallery
              images={product.images}
              productName={product.name}
              activeColor={currentColor}
              gsm={product.gsm}
            />
          </div>

          {/* RIGHT: Product Information & Purchase Area (Col 5) */}
          <div className="lg:col-span-5 flex flex-col space-y-5 sm:space-y-6 text-left sticky top-24">
            
            {/* Header / Brand & Collection Tag */}
            <div>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase text-[#7A7771] mb-1.5 font-semibold">
                <span>PIERCYN / {product.collection.toUpperCase()}</span>
                <span>{product.origin.toUpperCase()}</span>
              </div>

              <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#141414] leading-[0.96]">
                {product.name}
              </h1>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[#141414]">
                  {formatPrice(product, currency)}
                </span>
                {isSoldOut ? (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                    SOLD OUT
                  </span>
                ) : isAlmostGone ? (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    ALMOST GONE
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                    IN STOCK
                  </span>
                )}
              </div>

              <p className="mt-3 text-[13px] sm:text-[14px] text-[#4A4844] font-normal leading-[1.6]">
                {product.description}
              </p>
            </div>

            {/* COLOR SELECTOR */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#DAD8D1]">
                <div className="flex items-center justify-between text-[11px] font-sans uppercase tracking-[0.14em] font-semibold text-[#141414]">
                  <span>COLOR: <strong className="font-bold">{currentColor?.name}</strong></span>
                  <span className="text-[10px] font-mono text-[#7A7771]">{selectedColorIdx + 1} of {product.colors.length}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  {product.colors.map((color, idx) => (
                    <button
                      key={color.name}
                      onClick={() => {
                        setSelectedColorIdx(idx);
                        eventTracker.track('color_selected', {
                          productId: product.id,
                          color: color.name,
                        });
                      }}
                      className={`min-w-[44px] min-h-[44px] rounded-full border-2 p-1 transition-all cursor-pointer flex items-center justify-center ${
                        selectedColorIdx === idx
                          ? 'border-[#141414] scale-105 ring-1 ring-[#141414]'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                      title={color.name}
                      aria-label={`Select color ${color.name}`}
                    >
                      <span
                        className="w-6 h-6 rounded-full block border border-black/15 shadow-2xs"
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}


            {/* PURCHASE ACTION BUTTONS */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleAddToCart}
                  disabled={isSoldOut}
                  className="flex-1 h-12 min-h-[48px] px-6 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-[0.16em] hover:bg-black transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD TO BAG</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full border border-[#141414]/60 hover:bg-[#141414] hover:text-[#F2F0EB] transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  aria-label="Save to Wishlist"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isWishlisted(product.id) ? 'fill-[#141414] text-[#141414]' : 'text-[#141414]'
                    }`}
                  />
                </button>
              </div>

              {!isSoldOut && (
                <button
                  onClick={handleBuyNow}
                  className="w-full h-12 min-h-[48px] px-6 rounded-full border border-[#141414] bg-transparent text-[#141414] hover:bg-[#141414] hover:text-[#F2F0EB] text-xs font-bold uppercase tracking-[0.16em] transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>BUY NOW</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* WHATSAPP CONSULTATION LINK */}
            <div className="pt-1">
              <a
                href={`https://wa.me/2348076431059?text=${whatsappInquiryMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-sans font-medium text-[#141414] hover:text-emerald-800 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="underline">Questions about this piece? Chat with us on WhatsApp</span>
              </a>
            </div>

            {/* PRODUCT SPECIFICATIONS ACCORDION */}
            <div className="pt-2">
              <ProductDetailsAccordion product={product} />
            </div>

            {/* REASSURANCE PILLARS */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono uppercase tracking-wider text-[#7A7771] pt-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#141414]" />
                <span>100% AUTHENTIC LAGOS DROP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#141414]" />
                <span>DISPATCH IN 24 HOURS</span>
              </div>
            </div>

          </div>
        </div>

        {/* RELATED PRODUCTS SECTION ("YOU MIGHT LIKE") */}
        {relatedProducts.length > 0 && (
          <section className="pt-12 sm:pt-16 border-t border-[#DAD8D1]">
            <div className="flex items-end justify-between mb-6 sm:mb-8 pb-3 border-b border-[#DAD8D1]/60">
              <div>
                <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] block mb-1">
                  COMPLETE THE LOOK
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl uppercase tracking-tight text-[#141414]">
                  YOU MIGHT ALSO LIKE
                </h2>
              </div>
              <button
                onClick={() => onSelectPage('shop')}
                className="text-xs font-sans font-bold uppercase tracking-wider text-[#141414] hover:opacity-70 transition-opacity cursor-pointer"
              >
                EXPLORE ALL →
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onViewProduct={onViewProduct}
                />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* MOBILE STICKY PURCHASE BAR */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#F2F0EB]/95 backdrop-blur-md border-t border-[#DAD8D1] p-3 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono text-[#7A7771] uppercase block leading-none">TOTAL</span>
          <span className="font-mono text-base font-bold text-[#141414]">
            {formatPrice(product, currency)}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isSoldOut}
          className="flex-1 h-11 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-wider hover:bg-black transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isSoldOut ? 'SOLD OUT' : selectedSize ? `ADD TO BAG (${selectedSize})` : 'CHOOSE SIZE'}</span>
        </button>
      </div>

    </main>
  );
};
