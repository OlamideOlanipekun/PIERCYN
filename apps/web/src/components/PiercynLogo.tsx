import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  showWordmark?: boolean;
  className?: string;
}

/**
 * Official PIERCYN Monogram SVG Icon
 * Featuring the iconic geometric 'P' pierced with an upward diagonal arrow.
 */
export const PiercynMonogram: React.FC<{ size?: number | string; className?: string; color?: string }> = ({
  size = 32,
  className = '',
  color = 'currentColor'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PIERCYN Monogram"
    >
      {/* P Stem (Vertical line) */}
      <line
        x1="36"
        y1="20"
        x2="36"
        y2="82"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="square"
      />

      {/* P Bowl (Top Curved Loop) */}
      <path
        d="M 36 20 H 62 C 74 20 74 54 62 54 H 36"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Piercing Arrow Line (Diagonal from bottom-left to top-right) */}
      <line
        x1="28"
        y1="72"
        x2="78"
        y2="28"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Arrowhead Head (Pointing top-right) */}
      <path
        d="M 64 28 H 78 V 42"
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Full PIERCYN Brand Logo (Monogram + Wordmark or Monogram only)
 */
export const PiercynLogo: React.FC<LogoProps> = ({
  size = 28,
  showWordmark = true,
  className = '',
  ...props
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <PiercynMonogram size={size} />
      {showWordmark && (
        <span className="font-editorial text-[22px] sm:text-[25px] tracking-[0.08em] font-normal uppercase leading-none">
          PIERCYN
        </span>
      )}
    </div>
  );
};
