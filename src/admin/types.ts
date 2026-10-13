export type AdminNavTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'media'
  | 'variants'
  | 'categories'
  | 'inventory'
  | 'customers'
  | 'affiliates'
  | 'analytics'
  | 'audit'
  | 'settings';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN';
  createdAt: string;
}

export interface AdminOrderItem {
  id: string;
  orderId: string;
  variantId?: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  colour: string;
  size: string;
  unitPriceNGN: number;
  costPriceNGN: number;
  totalPriceNGN: number;
  image: string;
  quantity: number;
  createdAt: string;
}

export interface AdminOrderTimelineEntry {
  status: string;
  timestamp: string;
  note?: string;
}

export interface AdminShipment {
  id: string;
  orderId: string;
  courier: string;
  trackingNumber: string;
  status: string;
  deliveryFeeNGN: number;
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  courierMetadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPayment {
  id: string;
  orderId: string;
  provider: string;
  reference: string;
  amountNGN: number;
  currency: string;
  status: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  shippingAddressLine: string;
  shippingCity: string;
  shippingState: string;
  shippingCountry: string;
  orderNote?: string;
  subtotalNGN: number;
  deliveryFeeNGN: number;
  discountNGN: number;
  totalNGN: number;
  currency: string;
  shippingMethodKey: string;
  shippingMethodName: string;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  orderStatus:
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
  shipmentId?: string;
  shipment?: AdminShipment;
  payments?: AdminPayment[];
  paidAt?: string;
  timeline: AdminOrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
}

export interface AdminVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  colour: string;
  colourHex?: string;
  priceNGN?: number;
  costPriceNGN?: number;
  image?: string;
  active: boolean;
  stock?: {
    availableStock: number;
    reservedStock: number;
    soldStock: number;
    damagedStock: number;
    returnedStock: number;
  };
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  priceNGN: number;
  costPriceNGN: number;
  priceUSD?: number;
  priceGBP?: number;
  priceEUR?: number;
  categoryId: string;
  collection: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  images: string[];
  videoUrl?: string;
  gsm?: string;
  fit?: string;
  fabric?: string;
  origin?: string;
  careInstructions?: string;
  productStory?: string;
  tag?: string;
  isNewDrop: boolean;
  isBestSeller: boolean;
  isSoldOut: boolean;
  isLimited: boolean;
  createdAt: string;
  updatedAt: string;
  variants: AdminVariant[];
}

export interface AdminInventoryItem {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  productId: string;
  colour: string;
  colourHex?: string;
  size: string;
  category: string;
  unitPriceNGN: number;
  costPriceNGN: number;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  damagedStock: number;
  returnedStock: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updatedAt: string;
}

export interface AdminInventoryLedgerEntry {
  id: string;
  inventoryId: string;
  variantId: string;
  sku?: string;
  productName?: string;
  quantity: number;
  type: 'PURCHASE' | 'SALE' | 'RESERVATION' | 'RELEASE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE';
  reference: string;
  reason?: string;
  createdAt: string;
}

export interface AdminCustomer {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  orderCount?: number;
  totalOrders?: number;
  totalSpentNGN?: number;
  lastOrderDate?: string | null;
  createdAt: string;
  updatedAt: string;
  addresses?: Array<{
    id: string;
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    country: string;
    isDefault: boolean;
  }>;
  orders?: AdminOrder[];
}

export interface AdminAnalyticsSummary {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  unitsSold: number;
  revenueNGN: number;
  cogsNGN: number;
  grossProfitNGN: number;
  grossMarginPercent: number;
  averageOrderValueNGN: number;
  deliveryRevenueNGN: number;
  discountTotalNGN: number;
  inventoryValuationAtCostNGN: number;
  inventoryValuationAtRetailNGN: number;
  totalAvailableStock: number;
  lowStockVariantsCount: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    unitsSold: number;
    revenueNGN: number;
    grossProfitNGN: number;
  }>;
  topSellingSizes: Array<{
    size: string;
    unitsSold: number;
    percentage: number;
  }>;
  topSellingColors: Array<{
    colour: string;
    unitsSold: number;
    percentage: number;
  }>;
  topVariants: Array<{
    variantId: string;
    sku: string;
    productName: string;
    size: string;
    colour: string;
    unitsSold: number;
    revenueNGN: number;
  }>;
  productPerformance: Array<{
    productId: string;
    productName: string;
    category: string;
    unitsSold: number;
    revenueNGN: number;
    grossProfitNGN: number;
    currentStock: number;
    ordersCount: number;
    returnCount: number;
  }>;
  lowStockItems: Array<{
    variantId: string;
    productName: string;
    sku: string;
    colour: string;
    size: string;
    availableStock: number;
  }>;
  salesTrends: {
    today: { revenueNGN: number; orders: number; unitsSold: number };
    last7Days: Array<{ date: string; label: string; revenueNGN: number; orders: number; unitsSold: number }>;
    last30Days: Array<{ date: string; label: string; revenueNGN: number; orders: number; unitsSold: number }>;
  };
  funnel: {
    productViews: number;
    addToCart: number;
    checkoutStarted: number;
    purchases: number;
    viewToCartPercent: number;
    cartToCheckoutPercent: number;
    checkoutToPurchasePercent: number;
  };
}

export interface AdminAlerts {
  totalAlertsCount: number;
  lowStockVariants: Array<{
    variantId: string;
    sku: string;
    productName: string;
    colour: string;
    size: string;
    availableStock: number;
  }>;
  outOfStockVariants: Array<{
    variantId: string;
    sku: string;
    productName: string;
    colour: string;
    size: string;
    availableStock: number;
  }>;
  ordersNeedingAttention: AdminOrder[];
  pendingPaymentOrders: AdminOrder[];
}

export interface AdminAuditEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resource: 'ORDER' | 'PRODUCT' | 'INVENTORY' | 'SHIPMENT' | 'SETTINGS';
  resourceId: string;
  previousValue?: string;
  newValue?: string;
  note?: string;
  createdAt: string;
}

export interface AdminSettingsData {
  storeName: string;
  tagline: string;
  atelierAddress: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  freeShippingThresholdNGN: number;
  lagosDeliveryFeeNGN: number;
  nationwideDeliveryFeeNGN: number;
  lowStockThreshold: number;
  reservationTtlMinutes: number;
  paymentGatewayConfigured: boolean;
  paymentEnvironment: string;
  shippingProviders: string[];
}

export interface AdminMediaAsset {
  name: string;
  path: string;
  publicUrl: string;
  createdAt: string | null;
  updatedAt: string | null;
  sizeBytes: number | null;
  contentType: string | null;
}

export interface AdminVariantRecord {
  id: string;
  productId: string;
  productName: string;
  productStatus: string;
  sku: string;
  size: string;
  colour: string;
  colourHex: string;
  priceNGN: number | null;
  priceUSD: number | null;
  priceGBP: number | null;
  priceEUR: number | null;
  costPriceNGN: number | null;
  image: string | null;
  altImage: string | null;
  active: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  availableStock: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { products: number };
}
