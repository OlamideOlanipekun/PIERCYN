import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import { formatPrice, formatNumericPrice } from '../utils/currency';
import { Heart, Check, Loader2, X } from 'lucide-react';
import { StarRatingDisplay } from './reviews/StarRating';

export interface ProductCardProps {
  product: Product;
  onViewProduct: (product: Product) => void;
  priority?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewProduct,
  priority = false,
  className = '',
}) => {
  const { currency, toggleWishlist, isWishlisted, addToCart } = useShop();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const colors = product.colors || [];
  const activeColor = colors[selectedColorIdx] || colors[0];
  const wishlisted = isWishlisted(product.id);

  // Garment photography image selection
  const primaryImage = activeColor?.image || product.productShotUrl || product.images?.[0] || '';
  const alternateImage =
    activeColor?.altImage ||
    (product.images && product.images.length > 1 && product.images[1] !== primaryImage
      ? product.images[1]
      : null);

  const objectPosition =
    product.objectPosition || activeColor?.objectPosition || 'center 20%';

  // Determine Badge: ONLY real, appropriate badges (NEW, BESTSELLER, LIMITED, SOLD OUT)
  const getBadgeText = (): string | null => {
    if (product.isSoldOut) return 'SOLD OUT';
    if (product.isNewDrop) return 'NEW';
    if (product.isBestSeller) return 'BESTSELLER';
    if (product.isLimited) return 'LIMITED';

    if (product.tag) {
      const upper = product.tag.toUpperCase();
      if (upper === 'NEW' || upper === 'NEW IN' || upper === 'DROP 26.1') return 'NEW';
      if (upper === 'BESTSELLER' || upper === 'BEST SELLER' || upper === 'POPULAR') return 'BESTSELLER';
      if (upper === 'LIMITED' || upper === 'LIMITED EDITION') return 'LIMITED';
      if (upper === 'SOLD OUT') return 'SOLD OUT';
    }
    return null;
  };

  const badge = getBadgeText();

  // Price formatting and genuine discount calculation
  const originalPriceNGN = (product as any).originalPriceNGN || (product as any).compareAtPriceNGN;
  const hasDiscount = typeof originalPriceNGN === 'number' && originalPriceNGN > product.priceNGN;
  const formattedOriginalPrice = hasDiscount ? formatNumericPrice(originalPriceNGN, currency) : null;

  // Product category / short descriptor
  const descriptor =
    product.category
      ? product.category.replace(/-/g, ' ')
      : product.fit || product.fabric || 'Streetwear';

  // Handle Quick Add click
  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (product.isSoldOut || isAdding) return;

    const availableSizes = product.sizes || [];
    if (availableSizes.length > 1) {
      setShowSizeSelector(true);
      return;
    }

    const singleSize = availableSizes[0] || 'M';
    performAddToCart(singleSize);
  };

  // Perform Add to Cart with size
  const performAddToCart = async (sizeToUse: string) => {
    setIsAdding(true);
    try {
      const success = await addToCart(product, activeColor?.name, sizeToUse, 1);
      if (success) {
        setJustAdded(true);
        setShowSizeSelector(false);
        setTimeout(() => {
          setJustAdded(false);
        }, 2000);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleSizeSelect = (e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    if (isAdding) return;
    performAddToCart(size);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onViewProduct(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      className={`group flex flex-col cursor-pointer select-none text-left bg-transparent ${className}`}
    >
      {/* 2.A Product Image Container (4:5 portrait ratio) */}
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-[6px] sm:rounded-[8px] bg-[#E8E4DA] border border-[#DAD8D1]/40 mb-2.5 sm:mb-3">
        {/* Main Product Image */}
        <img
          src={primaryImage}
          alt={product.name}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{ objectPosition }}
          className={`w-full h-full object-cover transition-all duration-500 ease-out will-change-transform motion-reduce:transition-none ${
            isHovered && alternateImage && alternateImage !== primaryImage
              ? 'opacity-0 scale-[1.02]'
              : 'opacity-100 scale-100 group-hover:scale-[1.02]'
          }`}
        />

        {/* Alternate Image on Desktop Hover */}
        {alternateImage && alternateImage !== primaryImage && (
          <img
            src={alternateImage}
            alt={`${product.name} alternate view`}
            loading="lazy"
            decoding="async"
            style={{ objectPosition }}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out will-change-transform motion-reduce:transition-none ${
              isHovered ? 'opacity-100 scale-[1.02]' : 'opacity-0 scale-100 pointer-events-none'
            }`}
          />
        )}

        {/* Small floating badge in top-left corner */}
        {badge && (
          <div className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 z-10 pointer-events-none">
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-[#141414]/90 text-[#F2F0EB] text-[8.5px] sm:text-[9.5px] font-sans font-bold tracking-[0.14em] uppercase rounded-[3px] backdrop-blur-xs shadow-xs">
              {badge}
            </span>
          </div>
        )}

        {/* Wishlist Button (Top-Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 z-10 w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#F2F0EB]/90 backdrop-blur-md text-[#141414] hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#141414]"
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
              wishlisted ? 'fill-[#141414] text-[#141414]' : 'text-[#141414]'
            }`}
          />
        </button>
      </div>

      {/* 2.B Product Information directly beneath image */}
      <div className="flex flex-col flex-1 justify-between gap-1.5 sm:gap-2 font-sans">
        <div className="space-y-0.5 sm:space-y-1">
          {/* 1. Product Name */}
          <h3 className="text-[12.5px] sm:text-[14px] font-medium text-[#141414] tracking-tight uppercase line-clamp-1 group-hover:text-[#555555] transition-colors">
            {product.name}
          </h3>

          {/* 2. Product Category / Short Descriptor */}
          <p className="text-[10.5px] sm:text-[11.5px] text-[#777777] uppercase tracking-wider line-clamp-1 font-medium">
            {descriptor}
          </p>

          {/* 3. Rating Row */}
          <div className="pt-0.5">
            {(product.ratingSummary?.averageRating ?? product.rating) ? (
              <StarRatingDisplay
                rating={product.ratingSummary?.averageRating ?? product.rating ?? null}
                reviewCount={product.ratingSummary?.totalReviews ?? product.reviewCount ?? 0}
                size="xs"
                showCount
              />
            ) : (
              <span className="text-[9.5px] font-mono text-[#B0ADA7] italic">
                Be the first to review
              </span>
            )}
          </div>

          {/* 4. Price row (Current selling price in bold + Optional strikethrough original price) */}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-[13px] sm:text-[14.5px] font-bold text-[#141414] tracking-tight">
              {formatPrice(product, currency)}
            </span>
            {hasDiscount && formattedOriginalPrice && (
              <span className="text-[11px] sm:text-[12px] text-[#777777] line-through font-normal">
                {formattedOriginalPrice}
              </span>
            )}
          </div>

          {/* 4. Availability Status Indicator */}
          <div className="flex items-center gap-1.5 text-[9.5px] font-mono tracking-wider pt-0.5">
            {product.isSoldOut ? (
              <span className="text-red-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                SOLD OUT
              </span>
            ) : product.availabilityType === 'available_to_order' ? (
              <span className="text-[#8C6D3F] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B89355]" />
                AVAILABLE TO ORDER · 5–7 DAYS
              </span>
            ) : (
              <span className="text-[#3F6E4D] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4E8C5E]" />
                IN STOCK · 24–48H
              </span>
            )}
          </div>
        </div>

        {/* 2.C Color Variants Swatches */}
        {colors.length > 1 && (
          <div
            className="flex items-center gap-1.5 py-0.5 sm:py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {colors.map((c, idx) => {
              const isSelected = selectedColorIdx === idx;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColorIdx(idx)}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#141414] ring-1 ring-[#141414] ring-offset-2 ring-offset-[#F2F0EB] scale-105'
                      : 'border-black/20 opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  aria-label={`Select color ${c.name}`}
                />
              );
            })}
            {colors.length > 4 && (
              <span className="text-[9.5px] font-mono text-[#777777] ml-0.5">
                +{colors.length}
              </span>
            )}
          </div>
        )}

        {/* 2.D Quick Add to Cart Button */}
        <div className="pt-1 mt-auto" onClick={(e) => e.stopPropagation()}>
          {showSizeSelector ? (
            <div className="w-full bg-[#EAE6DD] border border-[#DAD6CC] rounded-[4px] p-2 flex flex-col gap-1.5 transition-all duration-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] sm:text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-[#141414]">
                  Select Size
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizeSelector(false)}
                  className="text-[#777777] hover:text-[#141414] p-0.5 rounded cursor-pointer transition-colors"
                  aria-label="Close size selector"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(product.sizes || []).map((size) => (
                  <button
                    key={size}
                    type="button"
                    disabled={isAdding}
                    onClick={(e) => handleSizeSelect(e, size)}
                    className="flex-1 min-w-[32px] h-7 sm:h-8 rounded-[3px] bg-[#F2F0EB] hover:bg-[#141414] hover:text-[#F2F0EB] text-[#141414] text-[10.5px] sm:text-[11px] font-mono font-medium border border-[#DAD6CC] hover:border-[#141414] transition-colors flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleQuickAddClick}
              disabled={isAdding || product.isSoldOut}
              className={`w-full h-9 sm:h-9.5 px-3 rounded-[4px] text-[10.5px] sm:text-[11.5px] font-sans font-semibold uppercase tracking-[0.14em] transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#141414] ${
                product.isSoldOut
                  ? 'bg-[#E5E0D6] text-[#777777] cursor-not-allowed'
                  : justAdded
                  ? 'bg-[#141414] text-emerald-400'
                  : 'bg-[#141414] text-[#F2F0EB] hover:bg-black active:scale-[0.99]'
              }`}
              aria-label={`Add ${product.name} to cart`}
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Added</span>
                </>
              ) : product.isSoldOut ? (
                <span>Sold Out</span>
              ) : (
                <span>+ Add to Cart</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
