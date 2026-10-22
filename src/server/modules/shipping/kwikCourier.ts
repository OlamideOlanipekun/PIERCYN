/**
 * Manual Fulfilment Adapter
 *
 * Replaces the Kwik Delivery courier integration.
 * PIERCYN V1 uses manual rider coordination — no third-party logistics API.
 *
 * The IShippingCourier interface is preserved so that a real courier adapter
 * can be swapped in later without changing callers.
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
  message?: string;
}

export interface IShippingCourier {
  name: string;
  createShipment(payload: ManualShipmentPayload): Promise<ManualShipmentResult>;
  trackShipment(trackingNumber: string): Promise<{ status: string; history: any[] }>;
  cancelShipment(trackingNumber: string): Promise<boolean>;
}

/**
 * ManualCourierAdapter — generates a local tracking reference only.
 * No external API call is made. Admin coordinates the rider manually.
 */
export class ManualCourierAdapter implements IShippingCourier {
  public name = 'MANUAL';

  public async createShipment(payload: ManualShipmentPayload): Promise<ManualShipmentResult> {
    const trackingNumber = `PCY-RIDER-${payload.orderNumber}`;
    return {
      success: true,
      trackingNumber,
      message: 'Manual dispatch reference created. Assign a rider from the admin dashboard.',
    };
  }

  public async trackShipment(_trackingNumber: string) {
    return {
      status: 'MANUAL',
      history: [
        {
          status: 'MANUAL_DISPATCH',
          timestamp: new Date().toISOString(),
          note: 'Order dispatched manually. Contact admin for status updates.',
        },
      ],
    };
  }

  public async cancelShipment(_trackingNumber: string): Promise<boolean> {
    return true;
  }
}

export const KwikCourierAdapter = ManualCourierAdapter;
