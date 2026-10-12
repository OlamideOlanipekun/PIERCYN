/**
 * Kwik Delivery Courier Adapter
 * Server-side integration with Kwik delivery infrastructure.
 * Safe fallback when environment credentials are not configured.
 */

export interface KwikShipmentPayload {
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  itemDescription: string;
}

export interface KwikShipmentResult {
  success: boolean;
  trackingNumber: string;
  courierTaskId?: string;
  estimatedDeliveryDate?: string;
  message?: string;
  rawResponse?: any;
}

export interface IShippingCourier {
  name: string;
  createShipment(payload: KwikShipmentPayload): Promise<KwikShipmentResult>;
  trackShipment(trackingNumber: string): Promise<{ status: string; history: any[] }>;
  cancelShipment(trackingNumber: string): Promise<boolean>;
}

export class KwikCourierAdapter implements IShippingCourier {
  public name = 'KWIK';
  private apiKey: string;
  private apiSecret: string;
  private apiDomain: string;

  constructor() {
    this.apiKey = process.env.KWIK_API_KEY || '';
    this.apiSecret = process.env.KWIK_API_SECRET || '';
    this.apiDomain = process.env.KWIK_DOMAIN || 'https://api.kwik.delivery';
  }

  public async createShipment(payload: KwikShipmentPayload): Promise<KwikShipmentResult> {
    const trackingNumber = `KWIK-${payload.orderNumber}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!this.apiKey || !this.apiSecret) {
      // Never fabricate a courier booking or tracking number in production.
      return {
        success: false,
        trackingNumber: '',
        message: 'Kwik credentials are not configured. Configure KWIK_API_KEY and KWIK_API_SECRET, or enter a manually booked tracking number.',
      };
    }

    try {
      const response = await fetch(`${this.apiDomain}/v1/deliveries`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-Kwik-Secret': this.apiSecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup_address: 'PIERCYN Atelier, Victoria Island, Lagos',
          delivery_address: payload.deliveryAddress,
          recipient_name: payload.recipientName,
          recipient_phone: payload.recipientPhone,
          parcel_description: payload.itemDescription,
          merchant_order_ref: payload.orderNumber,
        }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        trackingNumber: data.tracking_number || trackingNumber,
        courierTaskId: data.task_id,
        rawResponse: data,
        message: response.ok ? 'Kwik delivery booked' : data.message || 'Kwik API error',
      };
    } catch (err: any) {
      console.error('[KWIK_COURIER_ERROR]', err);
      return {
        success: false,
        trackingNumber,
        message: err.message || 'Failed to dispatch via Kwik Courier',
      };
    }
  }

  public async trackShipment(_trackingNumber: string) {
    throw new Error('Live Kwik tracking is not implemented in this adapter; do not display simulated tracking data.');
  }

  public async cancelShipment(_trackingNumber: string): Promise<boolean> {
    throw new Error('Live Kwik cancellation is not implemented in this adapter.');
  }
}
