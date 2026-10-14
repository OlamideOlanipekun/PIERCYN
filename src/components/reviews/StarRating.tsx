import React from 'react';

// ============================================================
// StarRating — Display Component (read-only)
// Renders filled/partial/empty stars with accessible labels.
// ============================================================

interface StarRatingDisplayProps {
  rating: number | null;
  reviewCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

function StarIcon({ filled, partial, size }: { filled: boolean; partial?: number; size: string }) {
  const sizeClass =
    size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';

  if (filled) {
    return (
      <svg viewBox="0 0 20 20" className={`${sizeClass} text-[#C9A84C] fill-current shrink-0`} aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }

  if (partial !== undefined && partial > 0) {
    const id = `partial-${Math.round(partial * 100)}`;
    const pct = `${Math.round(partial * 100)}%`;
    return (
      <svg viewBox="0 0 20 20" className={`${sizeClass} shrink-0`} aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
            <stop offset={pct} stopColor="#C9A84C" />
            <stop offset={pct} stopColor="#D5D5D5" />
          </linearGradient>
        </defs>
        <path
          fill={`url(#${id})`}
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" className={`${sizeClass} text-[#D5D5D5] fill-current shrink-0`} aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  reviewCount,
  size = 'sm',
  showCount = true,
  className = '',
}) => {
  if (rating === null || rating === undefined) {
    if (showCount) {
      return (
        <span className={`text-[10px] font-mono text-[#9E9B95] ${className}`}>
          No reviews yet
        </span>
      );
    }
    return null;
  }

  const clampedRating = Math.min(5, Math.max(0, rating));
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (clampedRating >= i) {
      stars.push(<StarIcon key={i} filled size={size} />);
    } else if (clampedRating >= i - 1 && clampedRating < i) {
      const partial = clampedRating - (i - 1);
      stars.push(<StarIcon key={i} filled={false} partial={partial} size={size} />);
    } else {
      stars.push(<StarIcon key={i} filled={false} size={size} />);
    }
  }

  const countLabel =
    typeof reviewCount === 'number'
      ? ` based on ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`
      : '';
  const ariaLabel = `Rated ${clampedRating.toFixed(1)} out of 5${countLabel}.`;

  const textSize =
    size === 'xs'
      ? 'text-[9.5px]'
      : size === 'sm'
      ? 'text-[10.5px]'
      : size === 'md'
      ? 'text-[11.5px]'
      : 'text-[13px]';

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      aria-label={ariaLabel}
      role="img"
    >
      <div className="flex items-center gap-0.5">{stars}</div>
      {showCount && (
        <span className={`${textSize} font-mono text-[#7A7771] font-medium`} aria-hidden="true">
          {clampedRating.toFixed(1)}
          {typeof reviewCount === 'number' && (
            <span className="ml-0.5 text-[#9E9B95]">({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  );
};

// ============================================================
// StarRatingSelector — Interactive picker (submit form)
// ============================================================

interface StarRatingSelectorProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  className?: string;
}

export const StarRatingSelector: React.FC<StarRatingSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const [hovered, setHovered] = React.useState(0);

  const labels = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Star rating selector"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = hovered > 0 ? star <= hovered : star <= value;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} ${star === 1 ? 'star' : 'stars'} — ${labels[star - 1]}`}
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive ? 'scale-110' : 'scale-100 hover:scale-105'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' && value < 5) onChange(value + 1);
                if (e.key === 'ArrowLeft' && value > 1) onChange(value - 1);
              }}
            >
              <svg
                viewBox="0 0 20 20"
                className={`w-7 h-7 transition-colors duration-150 ${
                  isActive ? 'text-[#C9A84C] fill-current' : 'text-[#D5D5D5] fill-current hover:text-[#E8C97D]'
                }`}
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>
      {(hovered > 0 || value > 0) && (
        <span className="text-[11px] font-sans text-[#7A7771] font-medium pl-1" aria-live="polite">
          {labels[(hovered || value) - 1]}
        </span>
      )}
    </div>
  );
};
