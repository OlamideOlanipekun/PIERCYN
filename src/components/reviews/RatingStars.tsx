import React, { useState } from 'react';
import { Star } from 'lucide-react';

export interface RatingStarsProps {
  rating: number; // 0 to 5 (e.g. 4.8)
  maxStars?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showScore?: boolean;
  reviewCount?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = 'sm',
  showScore = false,
  reviewCount,
  interactive = false,
  onChange,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Size mappings
  const starSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    xs: 'text-[10px]',
    sm: 'text-[11.5px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const activeRating = interactive && hoverRating !== null ? hoverRating : rating;

  const accessibleLabel =
    reviewCount !== undefined && reviewCount > 0
      ? `Rated ${rating.toFixed(1)} out of 5 stars based on ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`
      : rating > 0
      ? `Rated ${rating.toFixed(1)} out of 5 stars`
      : 'No reviews yet';

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label={accessibleLabel}
      role={interactive ? 'radiogroup' : 'img'}
    >
      <div className="flex items-center gap-0.5" onMouseLeave={() => interactive && setHoverRating(null)}>
        {Array.from({ length: maxStars }).map((_, idx) => {
          const starValue = idx + 1;
          const fillPercentage = Math.max(0, Math.min(100, (activeRating - idx) * 100));

          if (interactive) {
            const isSelected = activeRating >= starValue;
            return (
              <button
                key={idx}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                onClick={() => onChange && onChange(starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                onFocus={() => setHoverRating(starValue)}
                onBlur={() => setHoverRating(null)}
                className="p-1 -m-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#141414] rounded-sm transition-transform hover:scale-115 active:scale-95 cursor-pointer"
              >
                <Star
                  className={`${starSizes[size]} transition-colors duration-150 ${
                    isSelected
                      ? 'fill-[#141414] text-[#141414]'
                      : 'fill-transparent text-[#7A7771] hover:text-[#141414]'
                  }`}
                />
              </button>
            );
          }

          // Read-only star with precise fractional filling
          return (
            <div key={idx} className="relative inline-block select-none">
              {/* Background empty star */}
              <Star className={`${starSizes[size]} text-[#C8C5BC] fill-transparent`} />

              {/* Foreground filled clip */}
              {fillPercentage > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star className={`${starSizes[size]} text-[#141414] fill-[#141414]`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Numerical score & review count if requested */}
      {showScore && rating > 0 && (
        <span className={`font-mono font-bold tracking-tight text-[#141414] ${textSizes[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && reviewCount > 0 && (
        <span className={`font-mono text-[#7A7771] ${textSizes[size]}`}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
};
