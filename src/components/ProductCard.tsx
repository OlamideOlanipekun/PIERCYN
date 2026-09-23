import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import { formatPrice } from '../utils/currency';
import { ProductImage } from './ProductImage';
import { Heart, Plus, Eye, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewProduct: (product: Product) => void;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewProduct,
  priority = false,
}) => {
  const { currency, toggleWishlist, isWishlisted, addToCart } = useShop();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  const activeColor = product.colors[selectedColorIdx] || product.colors[0];
  
  // Prefer garment-first photography if available
  const displayImage =
    isHovered && activeColor?.altImage
      ? activeColor.altImage
      : product.productShotUrl || activeColor?.image || product.images[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, activeColor?.name, product.sizes[0] || 'M');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div
      onClick={() => onViewProduct(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col cursor-pointer select-none text-left"
    >
      {/* Product Image Container with 4:5 Ratio */}
      <div className="relative w-full overflow-hidden rounded-xl mb-2.5 sm:mb-3 shadow-2xs">
        <ProductImage
          src={displayImage}
          productName={product.name}
          colorName={activeColor?.name}
          aspectRatio="4/5"
          objectPosition={product.objectPosition || activeColor?.objectPosition || 'center 20%'}
          priority={priority}
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 backdrop-blur-xs text-[#141414] hover:bg-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-90"
          aria-label={`Save ${product.name} to wishlist`}
        >
          <Heart
            className={`w-4 h-4 ${
              isWishlisted(product.id) ? 'fill-[#141414] text-[#141414]' : 'text-[#141414]'
            }`}
          />
        </button>

        {/* Quick View Button for Desktop */}
        <div className="hidden sm:flex absolute inset-x-2.5 bottom-2.5 z-10 items-center gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProduct(product);
            }}
            className="flex-1 h-9 rounded-full bg-[#F2F0EB]/95 backdrop-blur-md text-[#141414] hover:bg-[#141414] hover:text-[#F2F0EB] text-[10px] font-sans font-bold tracking-[0.14em] uppercase transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>QUICK VIEW</span>
          </button>
          <button
            onClick={handleQuickAdd}
            className="w-9 h-9 rounded-full bg-[#141414] text-[#F2F0EB] hover:bg-black flex items-center justify-center transition-colors shadow-sm cursor-pointer shrink-0"
            title="Quick add to bag"
            aria-label="Add to bag"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* GSM / Fabric or Tag */}
        {(product.tag || product.gsm) && (
          <div className="absolute bottom-2.5 left-2.5 sm:group-hover:opacity-0 transition-opacity z-10">
            <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#141414]/85 text-[#F2F0EB] backdrop-blur-xs">
              {product.tag || product.gsm}
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 justify-between gap-1">
        {/* Colors row if multiple */}
        {product.colors.length > 1 && (
          <div className="flex items-center gap-1.5 mb-0.5">
            {product.colors.map((c, idx) => (
              <button
                key={c.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedColorIdx(idx);
                }}
                className={`w-3.5 h-3.5 rounded-full border transition-transform cursor-pointer ${
                  selectedColorIdx === idx ? 'scale-110 border-[#141414] ring-1 ring-[#141414]' : 'border-black/20'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
            <span className="text-[10px] font-mono text-[#7A7771] ml-1">
              +{product.colors.length}
            </span>
          </div>
        )}

        <h3 className="font-sans text-[12px] sm:text-[13px] font-semibold text-[#141414] tracking-tight line-clamp-1 group-hover:text-[#6E6B65] transition-colors">
          {product.name}
        </h3>

        {/* Show ratings only if genuine reviews exist */}
        {product.rating && product.reviewCount ? (
          <div className="flex items-center gap-1 text-[11px] text-[#7A7771]">
            <Star className="w-3 h-3 fill-[#141414] text-[#141414]" />
            <span className="font-mono text-[#141414] font-medium">{product.rating}</span>
            <span className="font-mono">({product.reviewCount})</span>
          </div>
        ) : null}

        <div className="flex items-baseline justify-between mt-0.5">
          <span className="font-mono text-xs sm:text-sm font-bold text-[#141414]">
            {formatPrice(product, currency)}
          </span>
          <span className="text-[10px] font-mono text-[#7A7771] uppercase">
            {product.origin && product.origin.includes('Lagos') ? 'LAGOS' : 'ATELIER'}
          </span>
        </div>
      </div>
    </div>
  );
};
