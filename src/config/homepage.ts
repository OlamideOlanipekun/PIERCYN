import { Currency } from '../types';

/**
 * PIERCYN Homepage & Storefront Master Configuration
 * All section ordering, feature flags, trust items, and media slots are centralized here.
 */

// Feature flag: Menswear focus (Womenswear hidden when false)
export const ENABLE_WOMENSWEAR = false;

// Store Tagline & Brand Identity
export const BRAND_TAGLINE = 'Look Expensive. Spend Smart.';

// Hero Banner Configuration (Menswear garment-focused)
export const HERO_CONFIG = {
  headline: 'LOOK EXPENSIVE. SPEND SMART.',
  subhead: 'Engineered menswear from Lagos. Heavyweight textiles, sharp tailoring, accessible luxury.',
  // Garment-forward menswear hero imagery
  image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1600&auto=format&fit=crop',
  mobileImage: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=900&auto=format&fit=crop',
  altText: 'Model wearing PIERCYN structured black heavyweight blazer and relaxed trousers in Lagos studio',
  primaryCtaText: 'SHOP THE DROP',
  primaryCtaLink: 'shop',
  secondaryCtaText: 'DISCOVER LOOKS',
  secondaryCtaLink: 'build-the-look',
};

// Category Tiles Configuration (Garment-led images)
export interface CategoryTileConfig {
  id: string;
  name: string;
  slug: string;
  itemCountText: string;
  startingPriceNGN: number;
  image: string;
  altText: string;
  tag?: string;
}

export const CATEGORY_TILES: CategoryTileConfig[] = [
  {
    id: 'hoodies',
    name: 'HOODIES & FLEECE',
    slug: 'hoodies',
    itemCountText: '6 Styles',
    startingPriceNGN: 32000,
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop',
    altText: 'Heavyweight loopback fleece hoodie in charcoal black, front product view',
    tag: 'POPULAR',
  },
  {
    id: 'tees',
    name: 'HEAVYWEIGHT TEES',
    slug: 't-shirts',
    itemCountText: '8 Styles',
    startingPriceNGN: 14500,
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop',
    altText: 'Relaxed 280GSM cotton t-shirt in washed obsidian, front product view',
    tag: 'ESSENTIAL',
  },
  {
    id: 'trousers',
    name: 'TROUSERS & CARGOS',
    slug: 'trousers',
    itemCountText: '5 Styles',
    startingPriceNGN: 35000,
    image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=800&auto=format&fit=crop',
    altText: 'Structured wide-leg cargo pants in deep olive cotton twill, product view',
    tag: 'NEW CUT',
  },
  {
    id: 'jackets',
    name: 'JACKETS & OVERSHIRTS',
    slug: 'jackets',
    itemCountText: '4 Styles',
    startingPriceNGN: 42000,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop',
    altText: 'Utility bomber jacket with matte black hardware, front garment view',
    tag: 'DROP 01',
  },
];

// Trust Reassurance Configuration
export interface TrustItemConfig {
  id: string;
  iconName: 'truck' | 'rotate-ccw' | 'shield-check' | 'message-circle';
  title: string;
  description: string;
}

export const TRUST_CONFIG: TrustItemConfig[] = [
  {
    id: 'delivery',
    iconName: 'truck',
    title: 'Nationwide Delivery',
    // Lagos 24-48hrs, interstate 3-5 days
    description: 'Fast dispatch from Lagos. 24 to 48 hours within Lagos, nationwide tracking.',
  },
  {
    id: 'returns',
    iconName: 'rotate-ccw',
    title: 'Easy 7-Day Exchanges',
    // Policy details
    description: 'Hassle-free size and fit exchanges within 7 days of receipt.',
  },
  {
    id: 'payment',
    iconName: 'shield-check',
    title: 'Secure Checkout',
    // Verified payment channels
    description: 'Paystack, bank transfer, debit cards, and Apple Pay protected.',
  },
  {
    id: 'support',
    iconName: 'message-circle',
    title: 'Direct WhatsApp Concierge',
    // Real time support
    description: 'Talk directly to our Lagos styling and sizing team on WhatsApp.',
  },
];

// Customer Photos / "Worn By" Social Proof Slot
// Data-driven: Empty array means component renders nothing (no fake UGC)
export interface CustomerPhotoItem {
  id: string;
  imageUrl: string;
  customerHandle: string;
  location: string;
  productName: string;
  productId: string;
}

// Placeholder slots for real customer photos (empty initially)
export const REAL_CUSTOMER_PHOTOS: CustomerPhotoItem[] = [];

// Verified Reviews Slot
// Data-driven: Empty array means component renders nothing (no fake reviews)
export interface CustomerReviewItem {
  id: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  productName?: string;
  verifiedPurchase: boolean;
}

export const REAL_CUSTOMER_REVIEWS: CustomerReviewItem[] = [];

// Section Display Thresholds
export const SECTION_LIMITS = {
  justDropped: 4,
  trendingNow: 4,
  mensFashion: 4,
  affordableUnder15kMin: 4,
  lookbookMobileLimit: 4,
};
