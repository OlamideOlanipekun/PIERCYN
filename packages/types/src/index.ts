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

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'RETURNED'
  | 'REFUNDED'
  | 'EXCHANGED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type ShippingRegion = 'lagos' | 'nationwide';

export interface ProductColor {
  name: string;
  hex: string;
  image: string;
  altImage?: string;
  imageType?: 'product' | 'model' | 'lifestyle';
  objectPosition?: string;
}

export interface ProductVariantDto {
  id: string;
  productId: string;
  sku: string;
  size: string;
  colour: string;
  colourHex: string;
  priceNGN?: number;
  costPriceNGN?: number;
  image?: string;
  altImage?: string;
  active?: boolean;
  availableStock?: number;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  category: string;
  collection: string;
  priceNGN: number;
  costPriceNGN?: number;
  priceUSD?: number;
  priceGBP?: number;
  priceEUR?: number;
  description: string;
  shortDescription?: string;
  gsm?: string;
  fit?: string;
  fabric?: string;
  origin?: string;
  careInstructions?: string;
  productStory?: string;
  tag?: string;
  colors?: ProductColor[];
  sizes?: string[];
  images: string[];
  videoUrl?: string;
  isNewDrop?: boolean;
  isBestSeller?: boolean;
  isSoldOut?: boolean;
  isLimited?: boolean;
  variants?: ProductVariantDto[];
  totalAvailableStock?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartLineItemDto {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  colour: string;
  size: string;
  image: string;
  unitPriceNGN: number;
  costPriceNGN?: number;
  quantity: number;
  lineTotalNGN: number;
  isAvailable: boolean;
  availableStock: number;
  errorMessage?: string;
}

export interface CartDto {
  sessionId: string;
  items: CartLineItemDto[];
  itemCount: number;
  subtotalNGN: number;
  currency: string;
  isValid: boolean;
  validationErrors: string[];
}

export interface CheckoutQuoteDto {
  cart: CartDto;
  shippingRegion: ShippingRegion;
  shippingMethodName: string;
  subtotalNGN: number;
  deliveryFeeNGN: number;
  discountNGN: number;
  discountDescription?: string;
  totalNGN: number;
  isEligibleForCheckout: boolean;
  errors: string[];
}
