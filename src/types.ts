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
  | 'PRICE: LOW TO HIGH' 
  | 'PRICE: HIGH TO LOW' 
  | 'BEST SELLING';

export type ActivePageView = 
  | 'home' 
  | 'shop' 
  | 'men' 
  | 'women' 
  | 'new' 
  | 'accessories' 
  | 'collections' 
  | 'lookbook' 
  | 'about' 
  | 'account' 
  | 'product' 
  | 'collection' 
  | 'orderSuccess' 
  | 'orderTracking' 
  | 'notFound' 
  | 'affiliate'
  | 'cart'
  | 'checkout'
  | 'orderConfirmation'
  | 'shipping'
  | 'returns'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'search'
  | 'sizeGuide'
  | 'faq'
  | 'trackOrder';

export interface ProductColor {
  name: string;
  hex: string;
  image: string;
  altImage?: string;
  imageType?: 'product' | 'model' | 'lifestyle';
  objectPosition?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  colour: string;
  colourHex: string;
  image?: string;
  altImage?: string;
  active?: boolean;
  availableStock?: number;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
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
  colors: ProductColor[];
  sizes: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[];
  images: string[];
  // Garment photography metadata
  imageType?: 'product' | 'model' | 'lifestyle';
  objectPosition?: string;
  productShotUrl?: string;
  stock?: number;
  variants?: ProductVariant[];
  status?: 'active' | 'draft' | 'archived';
  createdAt?: string;
  isNewDrop?: boolean;
  isBestSeller?: boolean;
  isSoldOut?: boolean;
  isLimited?: boolean;
  tag?: string;
  rating?: number;
  reviewCount?: number;
  availabilityType?: 'in_stock' | 'available_to_order';
  fulfillmentTimeline?: string;
  supplierVerified?: boolean;
}

export interface CartItem {
  product: Product;
  variantId: string;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  address: string;
  orderNote?: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  priceNGN: number;
  estimatedTime: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  sku?: string;
  productName: string;
  category: string;
  color: string;
  size: string;
  quantity: number;
  unitPriceNGN: number;
  totalPriceNGN: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotalNGN: number;
  deliveryFeeNGN: number;
  discountNGN?: number;
  totalNGN: number;
  shippingMethod: string;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  orderStatus: 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  orderAccessToken?: string;
}

export interface PaymentDetails {
  orderNumber: string;
  amountNGN: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
}

export interface PaymentResult {
  success: boolean;
  transactionReference: string;
  message?: string;
  paidAt?: string;
}

export interface AnalyticsEvent {
  eventName: 
    | 'page_view'
    | 'product_view'
    | 'search'
    | 'filter_used'
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'checkout_started'
    | 'payment_started'
    | 'purchase'
    | 'size_selected'
    | 'color_selected'
    | 'buy_now_clicked'
    | 'size_guide_opened'
    | 'whatsapp_clicked';
  data: Record<string, any>;
  timestamp: string;
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




