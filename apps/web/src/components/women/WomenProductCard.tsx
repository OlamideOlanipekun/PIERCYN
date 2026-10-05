import React, { useState } from 'react';
import { Product } from '../../types';
import { useShop } from '../../context/ShopContext';
import { formatPrice } from '../../utils/currency';
import { Heart, ArrowUpRight } from 'lucide-react';

interface WomenProductCardProps {
  product: Product;
  onViewProduct: (product: Product) => void;
}

export const WomenProductCard: React.FC<WomenProductCardProps> = ({
  product,
  onViewProduct
}) => {
  const { currency, toggleWishlist, isWishlisted } = useShop();
  const [isHovered, setIsHovered] = useState(false);
  const wishlisted = isWishlisted(product.id);

  const primaryImage = product.colors[0]?.image || product.images[0];
  const alternateImage = product.colors[0]?.altImage || product.images[1] || primaryImage;

  return (
    <div
      id={`women-product-card-${product.id}`}
      className="group relative flex flex-col cursor-pointer select-none"
      onClick={() => onViewProduct(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 4:5 Aspect Ratio Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E2DDD3] rounded-xs">
        {/* Main Product Image */}
        <img
          src={primaryImage}
          alt={product.name}
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out will-change-transform ${
            isHovered && alternateImage !== primaryImage ? 'opacity-0 scale-[1.025]' : 'opacity-100 scale-100'
          }`}
          loading="lazy"
          decoding="async"
        />

        {/* Alternate Image on Hover */}
        {alternateImage && alternateImage !== primaryImage && (
          <img
            src={alternateImage}
            alt={`${product.name} alternate view`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out will-change-transform ${
              isHovered ? 'opacity-100 scale-[1.025]' : 'opacity-0 scale-100 pointer-events-none'
            }`}
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Status / Badge Overlays */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
          {product.tag ? (
            <span className="px-2.5 py-1 bg-[#141414]/90 text-[#F2F0EB] text-[10px] font-mono tracking-[0.18em] uppercase font-semibold backdrop-blur-xs shadow-xs">
              {product.tag}
            </span>
          ) : product.isNewDrop ? (
            <span className="px-2.5 py-1 bg-[#141414]/90 text-[#F2F0EB] text-[10px] font-mono tracking-[0.18em] uppercase font-semibold backdrop-blur-xs shadow-xs">
              DROP 26.1
            </span>
          ) : null}

          {product.gsm && (
            <span className="px-2 py-0.5 bg-[#F2F0EB]/90 text-[#141414] text-[9px] font-mono tracking-[0.14em] uppercase font-medium backdrop-blur-xs hidden sm:inline-block">
              {product.gsm}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F2F0EB]/90 backdrop-blur-md flex items-center justify-center text-[#141414] hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-xs"
          aria-label={wishlisted ? 'Remove from Saved' : 'Save to Archive'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${wishlisted ? 'fill-[#141414] text-[#141414]' : 'text-[#141414]'}`} />
        </button>

        {/* Desktop Hover Quick View Overlay Action */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-between pointer-events-none">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#F2F0EB] font-medium flex items-center gap-1.5">
            VIEW PIECE <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
          <span className="text-[10px] font-mono text-[#D8D4CA] uppercase">
            {product.sizes.length} SIZES
          </span>
        </div>
      </div>

      {/* Product Metadata & Details */}
      <div className="pt-3 pb-1 space-y-1.5">
        {/* Color Swatch Dots */}
        {product.colors && product.colors.length > 1 && (
          <div className="flex items-center gap-1.5 py-0.5">
            {product.colors.map((c, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-2xs"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
            <span className="text-[10px] font-mono text-[#8C887B] pl-0.5">
              +{product.colors.length}
            </span>
          </div>
        )}

        {/* Title & Price Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] sm:text-[14px] font-sans font-medium text-[#141414] tracking-[-0.01em] line-clamp-1 group-hover:text-[#635E55] transition-colors">
            {product.name}
          </h3>
          <span className="text-[13px] sm:text-[14px] font-bold text-[#141414] font-sans tracking-tight shrink-0">
            {formatPrice(product, currency)}
          </span>
        </div>

        {/* Subtitle / Fit & Fabric Description */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#706E6B]">
          <span className="truncate max-w-[70%]">{product.fit}</span>
          <span className="shrink-0 uppercase text-[10px] tracking-wider font-semibold text-[#141414]">
            {product.collection}
          </span>
        </div>
      </div>
    </div>
  );
};
