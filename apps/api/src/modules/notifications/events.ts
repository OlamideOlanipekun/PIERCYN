import { Prisma } from '@prisma/client';

export const PIERCYN_EVENTS = {
  // Authentication & Customer
  CUSTOMER_REGISTERED: 'CUSTOMER_REGISTERED',
  
  // Order & Payment
  ORDER_CREATED: 'ORDER_CREATED',
  RECEIPT_UPLOADED: 'RECEIPT_UPLOADED',
  PAYMENT_VERIFIED: 'PAYMENT_VERIFIED',
  PAYMENT_REJECTED: 'PAYMENT_REJECTED',
  
  // Delivery Quotation & Fulfilment
  DELIVERY_QUOTE_CREATED: 'DELIVERY_QUOTE_CREATED',
  DELIVERY_QUOTE_ACCEPTED: 'DELIVERY_QUOTE_ACCEPTED',
  DELIVERY_QUOTE_DECLINED: 'DELIVERY_QUOTE_DECLINED',
  DELIVERY_QUOTE_EXPIRED: 'DELIVERY_QUOTE_EXPIRED',
  DELIVERY_PAYMENT_VERIFIED: 'DELIVERY_PAYMENT_VERIFIED',
  ORDER_DISPATCHED: 'ORDER_DISPATCHED',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  
  // Affiliates
  AFFILIATE_REGISTERED: 'AFFILIATE_REGISTERED',
  COMMISSION_APPROVED: 'COMMISSION_APPROVED',
  WITHDRAWAL_REQUESTED: 'WITHDRAWAL_REQUESTED',
  WITHDRAWAL_PAID: 'WITHDRAWAL_PAID',
  WITHDRAWAL_REJECTED: 'WITHDRAWAL_REJECTED',
} as const;

export type PiercynEventType = (typeof PIERCYN_EVENTS)[keyof typeof PIERCYN_EVENTS];

export interface CustomerRegisteredPayload {
  customerId: string;
  supabaseUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  registeredAt: string;
}

export interface EventRecordInput {
  eventKey: string;
  eventType: PiercynEventType | string;
  version?: number;
  payload: Record<string, unknown>;
}

/**
 * Persists a notification event inside an existing Prisma transaction.
 * Guarantees domain change and notification intent are committed atomically.
 */
export async function recordEvent(
  tx: Prisma.TransactionClient,
  input: EventRecordInput
) {
  return tx.notificationEvent.create({
    data: {
      eventKey: input.eventKey,
      eventType: input.eventType,
      version: input.version ?? 1,
      payload: input.payload as Prisma.InputJsonValue,
    },
  });
}
