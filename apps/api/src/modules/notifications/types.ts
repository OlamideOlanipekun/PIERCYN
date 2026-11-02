export interface OrderCreatedItem {
  name: string;
  sku: string;
  size: string;
  colour: string;
  quantity: number;
  unitPriceNGN: number;
  totalNGN: number;
}

export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  orderNote?: string | null;
  items: OrderCreatedItem[];
  subtotalNGN: number;
  deliveryFeeNGN: number;
  discountNGN: number;
  totalNGN: number;
  paymentMethod: string;
  createdAt: string;
}

export interface ReceiptUploadedPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalNGN: number;
  providerReference: string;
  receiptPath: string;
  receiptMimeType?: string | null;
  uploadedAt: string;
  reviewDeadlineAt: string;
}

export interface PaymentVerifiedPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amountNGN: number;
  paymentMethod: string;
  providerReference: string;
  verifiedAt: string;
  verificationSource: 'PAYSTACK_WEBHOOK' | 'PAYSTACK_VERIFY' | 'ADMIN_APPROVAL' | 'MOCK';
  verifiedBy?: string | null;
}

export interface ProductOutOfStockPayload {
  productId: string;
  productName: string;
  variantId: string;
  sku: string;
  size: string;
  colour: string;
  depletedAt: string;
  triggerReference?: string | null;
  reason?: string | null;
}

export interface QuoteNotificationPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryFeeNGN: number;
  subtotalNGN: number;
  totalNGN: number;
  quoteId: string;
  expiresAt: string;
  decisionUrl: string;
  rejectionReason?: string | null;
}

export interface PaymentDecisionPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentType: 'PRODUCT' | 'DELIVERY';
  amountNGN: number;
  providerReference: string;
  rejectionReason?: string | null;
  verifiedBy?: string | null;
  timestamp: string;
}

export interface FulfilmentNotificationPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  logisticsProvider?: string | null;
  dispatchReference?: string | null;
  timestamp: string;
}

export type AnyNotificationPayload =
  | OrderCreatedPayload
  | ReceiptUploadedPayload
  | PaymentVerifiedPayload
  | ProductOutOfStockPayload
  | QuoteNotificationPayload
  | PaymentDecisionPayload
  | FulfilmentNotificationPayload;
