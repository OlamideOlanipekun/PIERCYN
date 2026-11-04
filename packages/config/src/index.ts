// Central Authoritative Affiliate System Configuration
export const AFFILIATE_CONFIG = {
  enabled:
    typeof process !== 'undefined' && process.env?.AFFILIATE_PROGRAM_ENABLED !== undefined
      ? process.env.AFFILIATE_PROGRAM_ENABLED === 'true'
      : true,
  commissionPerOrderKobo: 80_000, // ₦800 per qualifying order (in kobo)
  attributionWindowDays: 30, // 30-day last-valid-click attribution
  minimumWithdrawalKobo: 0, // ₦0 minimum withdrawal restriction
  returnWindowDays: 7, // 7-day post-delivery cooling window
  referralCodePrefixLength: 4,
  currency: 'NGN',
} as const;

export function validateAffiliateConfig(): void {
  if (
    !Number.isInteger(AFFILIATE_CONFIG.commissionPerOrderKobo) ||
    AFFILIATE_CONFIG.commissionPerOrderKobo !== 80_000
  ) {
    throw new Error(
      `[CONFIG_ERROR] Invalid affiliate commission rate. Must be 80,000 kobo (₦800), got: ${AFFILIATE_CONFIG.commissionPerOrderKobo}`
    );
  }
  if (AFFILIATE_CONFIG.attributionWindowDays <= 0) {
    throw new Error('[CONFIG_ERROR] Affiliate attribution window must be positive.');
  }
  if (AFFILIATE_CONFIG.minimumWithdrawalKobo < 0) {
    throw new Error('[CONFIG_ERROR] Minimum withdrawal amount cannot be negative.');
  }
}

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
    RESERVATION_TTL_MINUTES: 30, // Checkout + bank-transfer window before expiry
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
    BANK_TRANSFER: {
      BANK_NAME: process.env.BANK_NAME || 'Kuda',
      ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME || 'Adedeji Taiwo',
      ACCOUNT_NUMBER: process.env.BANK_ACCOUNT_NUMBER || '2072114942',
      REVIEW_WINDOW_HOURS: 48,
    },
  },

  // Security & Limits
  LIMITS: {
    MAX_CART_QUANTITY_PER_ITEM: 10,
    CART_EXPIRY_DAYS: 30,
    // Vercel caps serverless request bodies at 4.5 MB once base64 overhead is included.
    MAX_RECEIPT_BYTES: 3 * 1024 * 1024,
  },

  // Active Promotions (Single Source of Truth)
  PROMOTIONS: [
    { code: 'STANDOUT', discountPercent: 15, description: '15% Editorial Discount' },
    { code: 'LAGOS26', discountPercent: 15, description: '15% Lagos Launch Discount' },
    { code: 'PIERCYN10', discountPercent: 10, description: '10% Welcome Discount' },
  ],

  // Affiliate System Configuration (Aliased to Authoritative AFFILIATE_CONFIG)
  AFFILIATE: {
    get ENABLED() {
      return AFFILIATE_CONFIG.enabled;
    },
    get COMMISSION_PER_ORDER_KOBO() {
      return AFFILIATE_CONFIG.commissionPerOrderKobo;
    },
    // Backwards compatibility alias
    get COMMISSION_PER_PRODUCT_KOBO() {
      return AFFILIATE_CONFIG.commissionPerOrderKobo;
    },
    get ATTRIBUTION_WINDOW_DAYS() {
      return AFFILIATE_CONFIG.attributionWindowDays;
    },
    get MIN_PAYOUT_KOBO() {
      return AFFILIATE_CONFIG.minimumWithdrawalKobo;
    },
    get RETURN_WINDOW_DAYS() {
      return AFFILIATE_CONFIG.returnWindowDays;
    },
    get REFERRAL_CODE_PREFIX_LENGTH() {
      return AFFILIATE_CONFIG.referralCodePrefixLength;
    },
    get CURRENCY() {
      return AFFILIATE_CONFIG.currency;
    },
  },
};
