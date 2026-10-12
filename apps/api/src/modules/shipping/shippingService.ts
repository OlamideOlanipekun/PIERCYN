import { COMMERCE_CONFIG } from '../../config/constants';
import { prisma } from '../../db/prisma';
import { KwikCourierAdapter, IShippingCourier } from './kwikCourier';
import { OrderService } from '../orders/orderService';

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

  public static async calculateFee(region: 'lagos' | 'nationwide', subtotalNGN: number): Promise<number> {
    try {
      const config = await prisma.shippingConfig.findUnique({
        where: { regionKey: region },
      });
      if (config) {
        if (subtotalNGN >= config.freeShippingThresholdNGN) return 0;
        return config.feeNGN;
      }
    } catch {
      // fallback
    }

    const isFree = subtotalNGN >= COMMERCE_CONFIG.SHIPPING.FREE_THRESHOLD_NGN;
    if (isFree) return 0;
    return region === 'lagos'
      ? COMMERCE_CONFIG.SHIPPING.LAGOS_FEE_NGN
      : COMMERCE_CONFIG.SHIPPING.NATIONWIDE_FEE_NGN;
  }

  public static async getShippingOptions(subtotalNGN: number): Promise<ShippingOption[]> {
    try {
      const configs = await prisma.shippingConfig.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      if (configs.length > 0) {
        return configs.map((c) => ({
          key: c.regionKey as 'lagos' | 'nationwide',
          name: c.name,
          feeNGN: subtotalNGN >= c.freeShippingThresholdNGN ? 0 : c.feeNGN,
          timeframe: c.estimatedTimeframe,
          description: c.description,
          isFree: subtotalNGN >= c.freeShippingThresholdNGN,
        }));
      }
    } catch {
      // fallback
    }

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

  public static async createShipment(data: {
    orderId: string;
    courier?: string;
    trackingNumber?: string;
    deliveryFeeNGN?: number;
    deliveryAddress: string;
    recipientName: string;
    recipientPhone: string;
    itemDescription?: string;
  }) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) {
      throw new Error(`Order ${data.orderId} not found`);
    }

    let trackingNumber = data.trackingNumber;
    let courierMetadata: string | undefined;

    if (!trackingNumber) {
      if (data.courier && data.courier.toUpperCase() !== this.courierAdapter.name) {
        throw new Error(`Automated booking for ${data.courier} is not configured. Book with that courier manually and supply its real tracking number.`);
      }
      const courierResult = await this.courierAdapter.createShipment({
        orderNumber: order.orderNumber,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        deliveryAddress: data.deliveryAddress,
        deliveryCity: order.deliveryCity,
        deliveryState: order.deliveryState,
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

    const shipment = await prisma.shipment.upsert({
      where: { orderId: order.id },
      update: {
        provider: data.courier || this.courierAdapter.name,
        trackingNumber: trackingNumber!,
        deliveryFeeNGN: data.deliveryFeeNGN ?? order.deliveryFeeNGN,
        deliveryAddress: data.deliveryAddress,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        courierMetadata,
        status: 'PENDING',
      },
      create: {
        orderId: order.id,
        provider: data.courier || this.courierAdapter.name,
        trackingNumber,
        deliveryFeeNGN: data.deliveryFeeNGN ?? order.deliveryFeeNGN,
        deliveryAddress: data.deliveryAddress,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        courierMetadata,
        status: 'PENDING',
      },
    });

    return shipment;
  }

  public static async getShipment(identifier: string) {
    return prisma.shipment.findFirst({
      where: {
        OR: [{ id: identifier }, { orderId: identifier }, { trackingNumber: identifier }],
      },
    });
  }

  public static async updateShipmentStatus(shipmentId: string, status: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found`);
    }

    const allowedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid shipment status: ${status}`);
    }

    const orderForDelivery = status === 'DELIVERED'
      ? await prisma.order.findUnique({ where: { id: shipment.orderId } })
      : null;
    if (status === 'DELIVERED' && orderForDelivery && !['SHIPPED', 'DELIVERED'].includes(orderForDelivery.status)) {
      throw new Error(`Order must be SHIPPED before it can be marked delivered (current status: ${orderForDelivery.status}).`);
    }

    const now = new Date();
    const updateData: any = { status };

    if (status === 'IN_TRANSIT' && !shipment.shippedAt) {
      updateData.shippedAt = now;
    }
    if (status === 'DELIVERED') {
      updateData.deliveredAt = now;
    }

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
    });

    if (status === 'DELIVERED' && orderForDelivery?.status === 'SHIPPED') {
      await OrderService.updateStatus(
        orderForDelivery.orderNumber,
        'DELIVERED',
        'Shipment marked delivered',
        'COURIER'
      );
    }

    return updated;
  }
}
