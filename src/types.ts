export type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR';

export type ProductCategory = 
  | 'hoodies' 
  | 'sweatshirts' 
  | 't-shirts' 
  | 'tees' 
  | 'polos' 
  | 'jackets' 
  | 'outerwear' 
  | 'trousers' 
  | 'jeans' 
  | 'accessories';

export type MenCategory = 
  | 'ALL' 
  | 'HOODIES' 
  | 'SWEATSHIRTS' 
  | 'T-SHIRTS' 
  | 'POLOS' 
  | 'JACKETS' 
  | 'TROUSERS' 
  | 'JEANS' 
  | 'ACCESSORIES';

export type WomenCategory = 
  | 'ALL' 
  | 'HOODIES & FLEECE' 
  | 'CROPPED & TOPS' 
  | 'TEES' 
  | 'DRESSES & SETS' 
  | 'TROUSERS & SKIRTS' 
  | 'OUTERWEAR' 
  | 'ACCESSORIES';

export type SortOption = 
  | 'FEATURED' 
  | 'NEWEST' 
  | 'PRICE — LOW TO HIGH' 
  | 'PRICE — HIGH TO LOW' 
  | 'BEST SELLING';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  collection: 'everyday' | 'after-dark' | 'essentials' | 'the-drop';
  priceNGN: number;
  priceUSD: number;
  priceGBP: number;
  priceEUR: number;
  description: string;
  gsm?: string;
  fit: string;
  fabric: string;
  origin: string;
  colors: {
    name: string;
    hex: string;
    image: string;
    altImage?: string;
  }[];
  sizes: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[];
  images: string[];
  isNewDrop?: boolean;
  isBestSeller?: boolean;
  isSoldOut?: boolean;
  isLimited?: boolean;
  tag?: string;
}

export interface CartItem {
  product: Product;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
}

export interface LookbookLook {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  image: string;
  detailImage: string;
  aspectRatio: 'portrait' | 'landscape' | 'square';
  location: string;
  model: string;
  pieces: string[]; // Product IDs
}

export interface CommunityPost {
  id: string;
  handle: string;
  city: string;
  image: string;
  productName: string;
  taggedPieceId: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  editorialSubhead?: string;
  heroImage: string;
  mobileHeroImage?: string;
  secondaryImages: string[];
  featuredProductIds: string[];
  category: string;
  season: string;
  year: string;
  status: 'active' | 'archived' | 'upcoming';
  ctaLabel: string;
  sortOrder: number;
  theme?: 'light' | 'dark' | 'studio' | 'vibrant';
  detailStory?: string;
  detailQuotes?: string[];
}

export interface ArchiveCollection {
  id: string;
  name: string;
  year: string;
  season: string;
  image: string;
  slug: string;
  pieceCount: number;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  city?: string;
  ordersCount?: number;
}



