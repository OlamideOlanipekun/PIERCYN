-- Migration: Checkout dual payment and delivery quotation system
-- Adds PaymentType, QuoteStatus, RefundReviewStatus enums
-- Adds DeliveryQuote and RefundReview tables
-- Extends Payment and OrderStatus

-- 1. Enums
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_DISPATCH';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DISPATCHED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'VERIFIED';

DO $$ BEGIN
  CREATE TYPE "PaymentType" AS ENUM ('PRODUCT', 'DELIVERY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'REQUOTE_REQUIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RefundReviewStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'PRODUCT_RECEIPT_SUBMITTED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'PRODUCT_PAYMENT_VERIFIED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'PRODUCT_PAYMENT_REJECTED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'DELIVERY_QUOTATION_SENT';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'DELIVERY_QUOTATION_ACCEPTED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'DELIVERY_QUOTATION_REJECTED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'DELIVERY_RECEIPT_SUBMITTED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'DELIVERY_PAYMENT_VERIFIED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'DELIVERY_PAYMENT_REJECTED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'DELIVERY_QUOTATION_REMINDER';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'DELIVERY_QUOTATION_EXPIRED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'ORDER_DISPATCHED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'ORDER_DELIVERED';

-- 2. Alter Payment
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paymentType" "PaymentType" NOT NULL DEFAULT 'PRODUCT';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "amountDueNGN" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "amountReceivedNGN" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Payment_paymentType_idx" ON "Payment"("paymentType");

-- 3. Create DeliveryQuote
CREATE TABLE IF NOT EXISTS "DeliveryQuote" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "amountNGN" INTEGER NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "createdByAdmin" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryQuote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "DeliveryQuote_orderId_idx" ON "DeliveryQuote"("orderId");
CREATE INDEX IF NOT EXISTS "DeliveryQuote_status_idx" ON "DeliveryQuote"("status");
CREATE INDEX IF NOT EXISTS "DeliveryQuote_expiresAt_idx" ON "DeliveryQuote"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "DeliveryQuote" ADD CONSTRAINT "DeliveryQuote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Create RefundReview
CREATE TABLE IF NOT EXISTS "RefundReview" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "reason" TEXT NOT NULL,
    "amountNGN" INTEGER NOT NULL,
    "status" "RefundReviewStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "reviewedByAdmin" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundReview_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RefundReview_orderId_idx" ON "RefundReview"("orderId");
CREATE INDEX IF NOT EXISTS "RefundReview_status_idx" ON "RefundReview"("status");

DO $$ BEGIN
  ALTER TABLE "RefundReview" ADD CONSTRAINT "RefundReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "RefundReview" ADD CONSTRAINT "RefundReview_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

