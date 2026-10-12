export const COMMERCE_CONFIG = {
  // App Base URL
  APP_URL: process.env.APP_URL || 'https://piercyn.vercel.app',

  // Shipping defaults (Single Source of Truth)
  SHIPPING: {
    FREE_THRESHOLD_NGN: 100000,
    LAGOS_FEE_NGN: 2500,
    NATIONWIDE_FEE_NGN: 4500,
    LAGOS_TIMEFRAME: '24–48 Hours',
    NATIONWIDE_TIMEFRAME: '3–5 Business Days',
    LAGOS_DESCRIPTION: 'Orders within Lagos usually arrive in 24–48 hours via direct dispatch.',
    NATIONWIDE_DESCRIPTION: 'Nationwide delivery across Nigeria: 3–5 business days.',
  },

  // Checkout & Inventory Reservation
  INVENTORY: {
    RESERVATION_TTL_MINUTES: 15, // Temporary checkout lock to prevent overselling
    LOW_STOCK_THRESHOLD: 5,
  },

  // Payment Providers
  PAYMENT: {
    DEFAULT_PROVIDER: process.env.PAYMENT_PROVIDER || 'direct_transfer',
    PAYSTACK: {
      SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
      PUBLIC_KEY: process.env.VITE_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || '',
      WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || '',
      BASE_URL: 'https://api.paystack.co',
    },
  },

  // Security & Limits
  LIMITS: {
    MAX_CART_QUANTITY_PER_ITEM: 10,
    CART_EXPIRY_DAYS: 30,
  },

  // Active Promotions (Single Source of Truth)
  PROMOTIONS: [
    { code: 'STANDOUT', discountPercent: 15, description: '15% Editorial Discount' },
    { code: 'LAGOS26', discountPercent: 15, description: '15% Lagos Launch Discount' },
    { code: 'PIERCYN10', discountPercent: 10, description: '10% Welcome Discount' },
  ],

  // Affiliate System Configuration (Single Source of Truth)
  AFFILIATE: {
    COMMISSION_PER_ORDER_KOBO: 50000, // ₦500 = 50,000 kobo per qualifying delivered order
    ATTRIBUTION_WINDOW_DAYS: 30,         // Days an affiliate click is valid for attribution
    MIN_PAYOUT_KOBO: 50000,              // ₦500 minimum payout threshold (50,000 kobo)
    RETURN_WINDOW_DAYS: 7,               // Days after delivery before commission becomes AVAILABLE
    REFERRAL_CODE_PREFIX_LENGTH: 4,      // How many chars from name to use in code prefix
  },
};
