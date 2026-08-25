import React, { useState } from 'react';
import { Product } from '../../types';
import { useShop } from '../../context/ShopContext';
import { formatPrice } from '../../utils/currency';
import { Heart, ArrowUpRight } from 'lucide-react';

interface MenProductCardProps {
  product: Product;
  onViewProduct: (product: Product) => void;
}

export const MenProductCard: React.FC<MenProductCardProps> = ({
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
      id={`men-product-card-${product.id}`}
      className="group relative flex flex-col cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewProduct(product)}
    >
      {/* 4:5 Aspect Ratio Image Container with 8-10px border radius */}
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-[8px] sm:rounded-[10px] bg-[#E8E4DA] border border-[#DAD8D1]/40">
        
        {/* Primary Image with Subtle Scale (1 -> 1.025) and Alternate Image Swap */}
        <img
          src={isHovered && alternateImage ? alternateImage : primaryImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] will-change-transform"
          loading="lazy"
          decoding="async"
        />

        {/* Optional Status Badge (Sparingly used: NEW, BESTSELLER, LIMITED, SOLD OUT) */}
        {product.isSoldOut ? (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-[#141414]/90 text-[#F2F0EB] text-[9.5px] sm:text-[10px] font-sans font-bold tracking-[0.14em] uppercase px-2.5 py-1 rounded-full backdrop-blur-xs">
              SOLD OUT
            </span>
          </div>
        ) : product.tag ? (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-[#141414]/90 text-[#F2F0EB] text-[9.5px] sm:text-[10px] font-sans font-bold tracking-[0.14em] uppercase px-2.5 py-1 rounded-full backdrop-blur-xs">
              {product.tag}
            </span>
          </div>
        ) : product.isNewDrop ? (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-[#141414]/90 text-[#F2F0EB] text-[9.5px] sm:text-[10px] font-sans font-bold tracking-[0.14em] uppercase px-2.5 py-1 rounded-full backdrop-blur-xs">
              NEW
            </span>
          </div>
        ) : product.isBestSeller ? (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-[#E3DEC3] text-[#141414] text-[9.5px] sm:text-[10px] font-sans font-bold tracking-[0.14em] uppercase px-2.5 py-1 rounded-full shadow-xs">
              BESTSELLER
            </span>
          </div>
        ) : null}

        {/* Wishlist Icon Button */}
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
        <div className="absolute inset-x-3 bottom-3 hidden lg:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="w-full h-11 bg-[#141414]/95 text-[#F2F0EB] backdrop-blur-md rounded-full flex items-center justify-center gap-1.5 text-[11px] font-sans font-semibold uppercase tracking-[0.16em] shadow-lg pointer-events-auto cursor-pointer hover:bg-black transition-colors">
            <span>QUICK VIEW</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>

      </div>

      {/* Product Card Typography & Information (Clean Manrope, single-line consistent heights) */}
      <div className="pt-3 pb-1 flex flex-col font-sans">
        
        {/* Row 1: Product Name & Price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] sm:text-[14px] font-semibold text-[#141414] uppercase tracking-[0.06em] leading-snug line-clamp-1 group-hover:opacity-70 transition-opacity">
            {product.name}
          </h3>
          <span className="text-[13px] sm:text-[14px] font-bold text-[#141414] font-sans tracking-tight shrink-0">
            {formatPrice(product, currency)}
          </span>
        </div>

        {/* Row 2: Metadata / Primary Color / GSM / Origin */}
        <div className="flex items-center justify-between gap-2 mt-1 text-[11px] sm:text-[12px] text-[#6E6B65] tracking-[0.04em] uppercase font-medium">
          <span className="truncate">
            {product.colors[0]?.name || 'CLASSIC'}
          </span>
          {product.gsm && (
            <span className="text-[10px] font-mono tracking-wider text-[#8C8A84] shrink-0">
              {product.gsm}
            </span>
          )}
        </div>

        {/* Color Swatch Dots */}
        {product.colors.length > 1 && (
          <div className="flex items-center gap-1.5 mt-2">
            {product.colors.map((c, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
            <span className="text-[9.5px] font-sans tracking-wider text-[#8C8A84] ml-1">
              +{product.colors.length} COLORS
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
