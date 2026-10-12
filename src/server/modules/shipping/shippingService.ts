import { COMMERCE_CONFIG } from '../../config/constants';
import { dbStore, DbShipment, ShipmentStatusType } from '../../db/store';
import { KwikCourierAdapter, IShippingCourier } from './kwikCourier';

export interface ShippingOption {
  key: 'lagos' | 'nationwide';
  name: string;
  feeNGN: number;
  timeframe: string;
  description: string;
  isFree: boolean;
}

export class ShippingService {
  private static courierAdapter: IShippingCourier = new KwikCourierAdapter();

  public static setCourierAdapter(adapter: IShippingCourier) {
    this.courierAdapter = adapter;
  }

  public static getCourierAdapter(): IShippingCourier {
    return this.courierAdapter;
  }

  /**
   * Authoritatively calculate delivery fee based on region and subtotal
   */
  public static calculateFee(region: 'lagos' | 'nationwide', subtotalNGN: number): number {
    const isFree = subtotalNGN >= COMMERCE_CONFIG.SHIPPING.FREE_THRESHOLD_NGN;
    if (isFree) return 0;
    return region === 'lagos'
      ? COMMERCE_CONFIG.SHIPPING.LAGOS_FEE_NGN
      : COMMERCE_CONFIG.SHIPPING.NATIONWIDE_FEE_NGN;
  }

  /**
   * Return formatted shipping options for checkout drawer
   */
  public static getShippingOptions(subtotalNGN: number): ShippingOption[] {
    const isFree = subtotalNGN >= COMMERCE_CONFIG.SHIPPING.FREE_THRESHOLD_NGN;

    return [
      {
        key: 'lagos',
        name: 'Lagos Doorstep (24–48 Hours)',
        feeNGN: isFree ? 0 : COMMERCE_CONFIG.SHIPPING.LAGOS_FEE_NGN,
        timeframe: COMMERCE_CONFIG.SHIPPING.LAGOS_TIMEFRAME,
        description: COMMERCE_CONFIG.SHIPPING.LAGOS_DESCRIPTION,
        isFree,
      },
      {
        key: 'nationwide',
        name: 'Nationwide Nigeria (3–5 Business Days)',
        feeNGN: isFree ? 0 : COMMERCE_CONFIG.SHIPPING.NATIONWIDE_FEE_NGN,
        timeframe: COMMERCE_CONFIG.SHIPPING.NATIONWIDE_TIMEFRAME,
        description: COMMERCE_CONFIG.SHIPPING.NATIONWIDE_DESCRIPTION,
        isFree,
      },
    ];
  }

  /**
   * Create shipment record attached to order
   */
  public static async createShipment(data: {
    orderId: string;
    courier?: string;
    trackingNumber?: string;
    deliveryFeeNGN?: number;
    deliveryAddress: string;
    recipientName: string;
    recipientPhone: string;
    itemDescription?: string;
  }): Promise<DbShipment> {
    const order = dbStore.orders.get(data.orderId);
    if (!order) {
      throw new Error(`Order ${data.orderId} not found`);
    }

    let trackingNumber = data.trackingNumber;
    let courierMetadata: string | undefined;

    // Use Kwik adapter if no custom tracking provided
    if (!trackingNumber) {
      const courierResult = await this.courierAdapter.createShipment({
        orderNumber: order.orderNumber,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        deliveryAddress: data.deliveryAddress,
        deliveryCity: order.shippingCity,
        deliveryState: order.shippingState,
        itemDescription: data.itemDescription || `PIERCYN Order ${order.orderNumber}`,
      });
      if (!courierResult.success || !courierResult.trackingNumber) {
        throw new Error(courierResult.message || 'Courier booking failed; no shipment was created.');
      }
      trackingNumber = courierResult.trackingNumber;
      courierMetadata = JSON.stringify(courierResult);
    }

    if (!trackingNumber) {
      throw new Error('Shipment requires a real courier tracking number or a manually supplied tracking number.');
    }

    return dbStore.createShipment({
      orderId: order.id,
      courier: data.courier || this.courierAdapter.name,
      trackingNumber,
      deliveryFeeNGN: data.deliveryFeeNGN ?? order.deliveryFeeNGN,
      deliveryAddress: data.deliveryAddress,
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      courierMetadata,
    });
  }

  /**
   * Get shipment by orderId or shipmentId
   */
  public static getShipment(identifier: string): DbShipment | null {
    let shp = dbStore.shipments.get(identifier);
    if (!shp) {
      const id = dbStore.orderShipmentIndex.get(identifier);
      if (id) shp = dbStore.shipments.get(id);
    }
    return shp || null;
  }

  /**
   * Update shipment state with validation
   */
  public static updateShipmentStatus(shipmentId: string, status: ShipmentStatusType): DbShipment {
    const shipment = dbStore.shipments.get(shipmentId);
    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found`);
    }

    const now = new Date().toISOString();
    shipment.status = status;
    shipment.updatedAt = now;

    if (status === 'IN_TRANSIT' && !shipment.shippedAt) {
      shipment.shippedAt = now;
    }
    if (status === 'DELIVERED') {
      shipment.deliveredAt = now;
      const order = dbStore.orders.get(shipment.orderId);
      if (order && order.orderStatus === 'SHIPPED') {
        order.orderStatus = 'DELIVERED';
        order.timeline.push({ status: 'DELIVERED', timestamp: now, note: 'Package marked delivered by courier' });
        order.updatedAt = now;
      }
    }

    return shipment;
  }
}
