export interface ShippingConfig {
  freeShippingThresholdNGN: number;
  lagosDeliveryFeeNGN: number;
  nationwideDeliveryFeeNGN: number;
  lagosTimeframe: string;
  nationwideTimeframe: string;
  lagosDescription: string;
  nationwideDescription: string;
}

export const SHIPPING_CONFIG: ShippingConfig = {
  freeShippingThresholdNGN: 100000,
  lagosDeliveryFeeNGN: 2500,
  nationwideDeliveryFeeNGN: 4500,
  lagosTimeframe: '24–48 Hours',
  nationwideTimeframe: '3–5 Business Days',
  lagosDescription: 'Orders within Lagos usually arrive in 24–48 hours.',
  nationwideDescription: 'Nationwide delivery across Nigeria: 3–5 business days.',
};

export const getDeliveryFee = (subtotalNGN: number, method: 'lagos' | 'nationwide'): number => {
  if (subtotalNGN >= SHIPPING_CONFIG.freeShippingThresholdNGN) {
    return 0;
  }
  return method === 'lagos'
    ? SHIPPING_CONFIG.lagosDeliveryFeeNGN
    : SHIPPING_CONFIG.nationwideDeliveryFeeNGN;
};
