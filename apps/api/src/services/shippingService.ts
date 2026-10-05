import { COMMERCE_CONFIG } from '../config/constants';

export interface ShippingRateResult {
  regionKey: 'lagos' | 'nationwide';
  name: string;
  feeNGN: number;
  isFree: boolean;
  freeShippingThresholdNGN: number;
  estimatedTimeframe: string;
  description: string;
}

export class ShippingService {
  /**
   * Get all active shipping configurations
   */
  public static getShippingOptions(subtotalNGN: number = 0): ShippingRateResult[] {
    const isFree = subtotalNGN >= COMMERCE_CONFIG.SHIPPING.FREE_THRESHOLD_NGN;

    return [
      {
        regionKey: 'lagos',
        name: 'Lagos Doorstep Delivery',
        feeNGN: isFree ? 0 : COMMERCE_CONFIG.SHIPPING.LAGOS_FEE_NGN,
        isFree,
        freeShippingThresholdNGN: COMMERCE_CONFIG.SHIPPING.FREE_THRESHOLD_NGN,
        estimatedTimeframe: COMMERCE_CONFIG.SHIPPING.LAGOS_TIMEFRAME,
        description: COMMERCE_CONFIG.SHIPPING.LAGOS_DESCRIPTION,
      },
      {
        regionKey: 'nationwide',
        name: 'Nationwide Delivery',
        feeNGN: isFree ? 0 : COMMERCE_CONFIG.SHIPPING.NATIONWIDE_FEE_NGN,
        isFree,
        freeShippingThresholdNGN: COMMERCE_CONFIG.SHIPPING.FREE_THRESHOLD_NGN,
        estimatedTimeframe: COMMERCE_CONFIG.SHIPPING.NATIONWIDE_TIMEFRAME,
        description: COMMERCE_CONFIG.SHIPPING.NATIONWIDE_DESCRIPTION,
      },
    ];
  }

  /**
   * Calculate exact delivery fee server-side
   */
  public static calculateFee(regionKey: 'lagos' | 'nationwide', subtotalNGN: number): number {
    if (subtotalNGN >= COMMERCE_CONFIG.SHIPPING.FREE_THRESHOLD_NGN) {
      return 0;
    }
    return regionKey === 'lagos'
      ? COMMERCE_CONFIG.SHIPPING.LAGOS_FEE_NGN
      : COMMERCE_CONFIG.SHIPPING.NATIONWIDE_FEE_NGN;
  }
}
