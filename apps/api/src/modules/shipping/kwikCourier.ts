/**
 * Manual Fulfilment Adapter
 *
 * Replaces automated third-party courier integrations (Kwik, etc.).
 * PIERCYN V1 uses manual rider coordination — no third-party logistics company integrations.
 *
 * The IShippingCourier interface is preserved for architectural cleanliness.
 */

export interface ManualShipmentPayload {
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  itemDescription: string;
}

export interface ManualShipmentResult {
  success: boolean;
  trackingNumber: string;
  courierTaskId?: string;
  estimatedDeliveryDate?: string;
  message?: string;
  rawResponse?: any;
}

export type KwikShipmentPayload = ManualShipmentPayload;
export type KwikShipmentResult = ManualShipmentResult;

export interface IShippingCourier {
  name: string;
  createShipment(payload: ManualShipmentPayload): Promise<ManualShipmentResult>;
  trackShipment(trackingNumber: string): Promise<{ status: string; history: any[] }>;
  cancelShipment(trackingNumber: string): Promise<boolean>;
}

export class ManualCourierAdapter implements IShippingCourier {
  public name = 'MANUAL';

  public async createShipment(payload: ManualShipmentPayload): Promise<ManualShipmentResult> {
    const trackingNumber = `PCY-RIDER-${payload.orderNumber}`;
    return {
      success: true,
      trackingNumber,
      message: 'Manual dispatch reference recorded. Rider coordinated via admin dashboard.',
    };
  }

  public async trackShipment(_trackingNumber: string) {
    return {
      status: 'MANUAL',
      history: [
        {
          status: 'MANUAL_COORDINATION',
          timestamp: new Date().toISOString(),
          note: 'Order managed directly by PIERCYN logistics team.',
        },
      ],
    };
  }

  public async cancelShipment(_trackingNumber: string): Promise<boolean> {
    return true;
  }
}

// Preserve alias for backward compatibility
export const KwikCourierAdapter = ManualCourierAdapter;
