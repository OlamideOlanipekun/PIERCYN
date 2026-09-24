import React, { useState } from 'react';
import { PiercynMonogram } from './PiercynLogo';

export interface ProductImageProps {
  src?: string;
  alt?: string;
  productName?: string;
  colorName?: string;
  aspectRatio?: '4/5' | '3/4' | '1/1' | '16/9';
  objectPosition?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
  isDecorative?: boolean;
  onClick?: () => void;
}

/**
 * Shared ProductImage component enforcing:
 * - Fixed aspect ratio (default 4:5 for products, 3:4 for category tiles)
 * - Garment-focused crop via objectPosition
 * - Warm neutral cream background (#F5F3EE)
 * - Skeleton/blur placeholder during load
 * - Fallback with PIERCYN monogram on error/empty
 * - Accessible descriptive alt text
 */
export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  productName,
  colorName,
  aspectRatio = '4/5',
  objectPosition = 'center top',
  className = '',
  imgClassName = '',
  priority = false,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  isDecorative = false,
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(!src);

  // Generate accessible alt text: e.g. "Oversized hoodie in Pitch Black, front garment view"
  const computedAlt = isDecorative
    ? ''
    : alt
    ? alt
    : productName
    ? `${productName}${colorName ? ` in ${colorName}` : ''}, garment view`
    : 'PIERCYN garment';

  const aspectClass =
    aspectRatio === '4/5'
      ? 'aspect-[4/5]'
      : aspectRatio === '3/4'
      ? 'aspect-[3/4]'
      : aspectRatio === '1/1'
      ? 'aspect-square'
      : 'aspect-[16/9]';

  return (
    <div
      onClick={onClick}
      className={`relative w-full overflow-hidden bg-[#F8F8F8] ${aspectClass} ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Background Skeleton / Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-[#F2F2F2] animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 opacity-20">
            <PiercynMonogram size={32} />
          </div>
        </div>
      )}

      {/* Fallback state when image fails to load or src is missing */}
      {hasError ? (
        <div className="absolute inset-0 bg-[#F2F2F2] flex flex-col items-center justify-center p-4 text-center select-none">
          <div className="w-10 h-10 mb-2 text-[#737069] opacity-40">
            <PiercynMonogram size={40} />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#737069]">
            {productName || 'PIERCYN'}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={computedAlt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{ objectPosition }}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
          } ${imgClassName}`}
        />
      )}
    </div>
  );
};
