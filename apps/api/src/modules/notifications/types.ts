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

export type AnyNotificationPayload =
  | OrderCreatedPayload
  | ReceiptUploadedPayload
  | PaymentVerifiedPayload
  | ProductOutOfStockPayload;
