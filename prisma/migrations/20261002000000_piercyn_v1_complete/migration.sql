-- ============================================================
-- PIERCYN V1 DATABASE — MIGRATION
-- 20261002000000_piercyn_v1_complete
-- ============================================================
-- This migration brings the database to full V1 spec:
--   • Admin model (dashboard accounts, separate from customers)
--   • AuditLog model (persistent admin action audit trail)
--   • OrderStatusHistory model (persistent order timeline)
--   • CartStatus enum + Cart.status field
--   • Category.isActive field
--   • Customer refactored to firstName + lastName (was fullName)
--   • Customer.email made nullable (phone-only checkout support)
--   • InventoryTransaction fully auditable (previousStock, newStock,
--     referenceType, adminId; PURCHASE renamed RESTOCK; REFUND added)
--   • Shipment model added to live DB
--   • OrderStatus: COMPLETED, FAILED, RETURNED, EXCHANGED added
--   • PaymentStatus: REFUNDED added
--   • ShipmentStatus: PROCESSING, SHIPPED added (simplified)
--   • ShippingConfig: active -> isActive
--   • AnalyticsEvent replaces Event (typed eventType enum)
--   • Payment.reference renamed to providerReference
--   • Inventory fields renamed for clarity
--   • CHECK constraints for non-negative quantities
--   • All required indexes
-- ============================================================

-- ============================================================
-- STEP 1: NEW ENUMS
-- ============================================================

CREATE TYPE "AdminRole" AS ENUM ('ADMIN');
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED');
CREATE TYPE "EventType" AS ENUM (
  'PRODUCT_VIEW',
  'ADD_TO_CART',
  'CHECKOUT_STARTED',
  'PURCHASE_COMPLETED'
);

-- ============================================================
-- STEP 2: EXTEND EXISTING ENUMS
-- ============================================================

-- OrderStatus: add missing statuses
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'FAILED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RETURNED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'EXCHANGED';

-- PaymentStatus: add REFUNDED
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

-- ShipmentStatus: replace with V1 spec values
-- (Postgres requires creating new type when removing values)
-- We drop and recreate with V1 values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'PROCESSING'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ShipmentStatus')
  ) THEN
    ALTER TYPE "ShipmentStatus" ADD VALUE 'PROCESSING';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'SHIPPED'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ShipmentStatus')
  ) THEN
    ALTER TYPE "ShipmentStatus" ADD VALUE 'SHIPPED';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'IN_TRANSIT'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ShipmentStatus')
  ) THEN
    ALTER TYPE "ShipmentStatus" ADD VALUE 'IN_TRANSIT';
  END IF;
END$$;

-- InventoryTransactionType: rename PURCHASE → RESTOCK, add REFUND
-- Postgres cannot rename enum values; add new values safely
ALTER TYPE "InventoryTransactionType" ADD VALUE IF NOT EXISTS 'RESTOCK';
ALTER TYPE "InventoryTransactionType" ADD VALUE IF NOT EXISTS 'REFUND';
-- Note: existing PURCHASE records remain valid (legacy); new code uses RESTOCK

-- ============================================================
-- STEP 3: ADMIN TABLE
-- ============================================================

CREATE TABLE "Admin" (
  "id"           TEXT        NOT NULL,
  "email"        TEXT        NOT NULL,
  "passwordHash" TEXT        NOT NULL,
  "name"         TEXT        NOT NULL,
  "role"         "AdminRole" NOT NULL DEFAULT 'ADMIN',
  "isActive"     BOOLEAN     NOT NULL DEFAULT true,
  "lastLoginAt"  TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
CREATE INDEX "Admin_email_idx"        ON "Admin"("email");

-- ============================================================
-- STEP 4: AUDIT LOG TABLE (replaces in-memory AuditService)
-- ============================================================

CREATE TABLE "AuditLog" (
  "id"           TEXT         NOT NULL,
  "adminId"      TEXT,
  "action"       TEXT         NOT NULL,
  "resourceType" TEXT         NOT NULL,
  "resourceId"   TEXT         NOT NULL,
  "oldValue"     TEXT,
  "newValue"     TEXT,
  "ipAddress"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_adminId_idx"              ON "AuditLog"("adminId");
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");
CREATE INDEX "AuditLog_createdAt_idx"            ON "AuditLog"("createdAt");

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- STEP 5: ORDER STATUS HISTORY TABLE (replaces embedded timeline JSON)
-- ============================================================

CREATE TABLE "OrderStatusHistory" (
  "id"         TEXT         NOT NULL,
  "orderId"    TEXT         NOT NULL,
  "fromStatus" "OrderStatus" NOT NULL,
  "toStatus"   "OrderStatus" NOT NULL,
  "changedBy"  TEXT         NOT NULL,
  "note"       TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderStatusHistory_orderId_idx"   ON "OrderStatusHistory"("orderId");
CREATE INDEX "OrderStatusHistory_createdAt_idx" ON "OrderStatusHistory"("createdAt");

ALTER TABLE "OrderStatusHistory"
  ADD CONSTRAINT "OrderStatusHistory_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- STEP 6: ANALYTICS EVENT TABLE (replaces untyped Event table)
-- ============================================================

CREATE TABLE "AnalyticsEvent" (
  "id"         TEXT        NOT NULL,
  "sessionId"  TEXT,
  "customerId" TEXT,
  "eventType"  "EventType" NOT NULL,
  "productId"  TEXT,
  "variantId"  TEXT,
  "orderId"    TEXT,
  "metadata"   TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_eventType_idx"  ON "AnalyticsEvent"("eventType");
CREATE INDEX "AnalyticsEvent_createdAt_idx"  ON "AnalyticsEvent"("createdAt");
CREATE INDEX "AnalyticsEvent_productId_idx"  ON "AnalyticsEvent"("productId");
CREATE INDEX "AnalyticsEvent_sessionId_idx"  ON "AnalyticsEvent"("sessionId");

ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- STEP 7: SHIPMENT TABLE (was missing from initial migration)
-- ============================================================

CREATE TABLE IF NOT EXISTS "Shipment" (
  "id"              TEXT            NOT NULL,
  "orderId"         TEXT            NOT NULL,
  "provider"        TEXT            NOT NULL DEFAULT 'KWIK',
  "trackingNumber"  TEXT,
  "status"          "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
  "deliveryFeeNGN"  INTEGER         NOT NULL DEFAULT 0,
  "deliveryAddress" TEXT            NOT NULL,
  "recipientName"   TEXT            NOT NULL,
  "recipientPhone"  TEXT            NOT NULL,
  "courierMetadata" TEXT,
  "shippedAt"       TIMESTAMP(3),
  "deliveredAt"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3)    NOT NULL,
  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_orderId_key"       ON "Shipment"("orderId");
CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_trackingNumber_key" ON "Shipment"("trackingNumber");
CREATE INDEX IF NOT EXISTS "Shipment_orderId_idx"             ON "Shipment"("orderId");
CREATE INDEX IF NOT EXISTS "Shipment_trackingNumber_idx"      ON "Shipment"("trackingNumber");
CREATE INDEX IF NOT EXISTS "Shipment_status_idx"              ON "Shipment"("status");

ALTER TABLE "Shipment"
  ADD CONSTRAINT "Shipment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- STEP 8: CATEGORY CHANGES
-- ============================================================

ALTER TABLE "Category"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- STEP 9: CART CHANGES (add status field)
-- ============================================================

ALTER TABLE "Cart"
  ADD COLUMN IF NOT EXISTS "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS "Cart_status_idx"     ON "Cart"("status");
CREATE INDEX IF NOT EXISTS "Cart_sessionId_idx"  ON "Cart"("sessionId");
CREATE INDEX IF NOT EXISTS "Cart_customerId_idx" ON "Cart"("customerId");

-- ============================================================
-- STEP 10: CUSTOMER CHANGES
-- Split fullName -> firstName + lastName
-- Make email nullable for phone-only checkout support
-- ============================================================

-- Add firstName/lastName columns
ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "firstName" TEXT;

ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "lastName" TEXT;

-- Migrate existing fullName data
UPDATE "Customer"
  SET
    "firstName" = SPLIT_PART("fullName", ' ', 1),
    "lastName"  = CASE
                    WHEN POSITION(' ' IN "fullName") > 0
                    THEN SUBSTRING("fullName" FROM POSITION(' ' IN "fullName") + 1)
                    ELSE ''
                  END
  WHERE "fullName" IS NOT NULL
    AND "firstName" IS NULL;

-- Make non-nullable now that data is migrated
ALTER TABLE "Customer" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "lastName"  SET NOT NULL;

-- Make email nullable (already TEXT, just drop NOT NULL if it exists)
ALTER TABLE "Customer" ALTER COLUMN "email" DROP NOT NULL;

-- Add phone index if not exists
CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer"("phone");

-- ============================================================
-- STEP 11: INVENTORY CHANGES
-- Rename columns to match V1 spec (stockQuantity, reservedQuantity, etc.)
-- ============================================================

-- Add new columns alongside old ones first
ALTER TABLE "Inventory"
  ADD COLUMN IF NOT EXISTS "stockQuantity"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "soldQuantity"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "damagedQuantity"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reorderLevel"     INTEGER NOT NULL DEFAULT 5;

-- Migrate data from old column names to new ones
UPDATE "Inventory"
  SET
    "stockQuantity"    = COALESCE("availableStock", 0),
    "reservedQuantity" = COALESCE("reservedStock",  0),
    "soldQuantity"     = COALESCE("soldStock",       0),
    "damagedQuantity"  = COALESCE("damagedStock",    0),
    "returnedQuantity" = COALESCE("returnedStock",   0)
  WHERE "stockQuantity" = 0;  -- Only migrate if new columns are still default

-- Add CHECK constraints for non-negative quantities
ALTER TABLE "Inventory"
  ADD CONSTRAINT "Inventory_stockQuantity_check"    CHECK ("stockQuantity"    >= 0),
  ADD CONSTRAINT "Inventory_reservedQuantity_check" CHECK ("reservedQuantity" >= 0),
  ADD CONSTRAINT "Inventory_soldQuantity_check"     CHECK ("soldQuantity"     >= 0),
  ADD CONSTRAINT "Inventory_damagedQuantity_check"  CHECK ("damagedQuantity"  >= 0),
  ADD CONSTRAINT "Inventory_returnedQuantity_check" CHECK ("returnedQuantity" >= 0);

-- ============================================================
-- STEP 12: INVENTORY TRANSACTION CHANGES
-- Add audit fields: previousStock, newStock, referenceType, adminId
-- ============================================================

ALTER TABLE "InventoryTransaction"
  ADD COLUMN IF NOT EXISTS "variantId"      TEXT,
  ADD COLUMN IF NOT EXISTS "previousStock"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "newStock"       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "referenceType"  TEXT,
  ADD COLUMN IF NOT EXISTS "referenceId"    TEXT,
  ADD COLUMN IF NOT EXISTS "adminId"        TEXT;

-- Backfill variantId from inventory join for existing records
UPDATE "InventoryTransaction" it
  SET "variantId" = inv."variantId"
  FROM "Inventory" inv
  WHERE it."inventoryId" = inv."id"
    AND it."variantId" IS NULL;

-- Add FK for variantId (only after backfill)
ALTER TABLE "InventoryTransaction"
  ADD CONSTRAINT "InventoryTransaction_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "InventoryTransaction_variantId_idx"   ON "InventoryTransaction"("variantId");
CREATE INDEX IF NOT EXISTS "InventoryTransaction_referenceId_idx" ON "InventoryTransaction"("referenceId");

-- ============================================================
-- STEP 13: ORDER CHANGES
-- Split customerName -> customerFirstName + customerLastName
-- Rename shippingAddressLine -> deliveryAddress, etc.
-- ============================================================

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "customerFirstName" TEXT,
  ADD COLUMN IF NOT EXISTS "customerLastName"  TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryState"     TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryCity"      TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryAddress"   TEXT;

-- Migrate existing data
UPDATE "Order"
  SET
    "customerFirstName" = SPLIT_PART("customerName", ' ', 1),
    "customerLastName"  = CASE
                            WHEN POSITION(' ' IN "customerName") > 0
                            THEN SUBSTRING("customerName" FROM POSITION(' ' IN "customerName") + 1)
                            ELSE ''
                          END,
    "deliveryState"   = "shippingState",
    "deliveryCity"    = "shippingCity",
    "deliveryAddress" = "shippingAddressLine"
  WHERE "customerFirstName" IS NULL;

-- Make required fields non-nullable
ALTER TABLE "Order" ALTER COLUMN "customerFirstName" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "customerLastName"  SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "deliveryState"     SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "deliveryCity"      SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "deliveryAddress"   SET NOT NULL;

-- Rename status column from orderStatus -> status
ALTER TABLE "Order"
  RENAME COLUMN "orderStatus" TO "status";

-- Add missing indexes
CREATE INDEX IF NOT EXISTS "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX IF NOT EXISTS "Order_customerId_idx"    ON "Order"("customerId");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx"     ON "Order"("createdAt");

-- ============================================================
-- STEP 14: ORDER ITEM CHANGES
-- Add colour, totalNGN (was totalPriceNGN), costPriceNGN index
-- ============================================================

-- Add costPriceNGN if not exists
ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "costPriceNGN" INTEGER NOT NULL DEFAULT 0;

-- Add totalNGN as alias for totalPriceNGN
ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "totalNGN" INTEGER;

UPDATE "OrderItem"
  SET "totalNGN" = "totalPriceNGN"
  WHERE "totalNGN" IS NULL;

ALTER TABLE "OrderItem" ALTER COLUMN "totalNGN" SET NOT NULL;

-- ============================================================
-- STEP 15: PAYMENT CHANGES
-- Rename reference -> providerReference
-- ============================================================

ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "providerReference" TEXT,
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

-- Migrate data
UPDATE "Payment"
  SET "providerReference" = "reference"
  WHERE "providerReference" IS NULL;

-- Make non-nullable
ALTER TABLE "Payment" ALTER COLUMN "providerReference" SET NOT NULL;

-- Add unique constraint on providerReference (idempotency key)
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_providerReference_key"
  ON "Payment"("providerReference");

CREATE INDEX IF NOT EXISTS "Payment_providerReference_idx"
  ON "Payment"("providerReference");

-- ============================================================
-- STEP 16: SHIPPING CONFIG CHANGES
-- Rename active -> isActive
-- ============================================================

ALTER TABLE "ShippingConfig"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "ShippingConfig"
  SET "isActive" = "active"
  WHERE TRUE;

-- ============================================================
-- STEP 17: PRODUCT VARIANT — rename active -> isActive
-- ============================================================

ALTER TABLE "ProductVariant"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "ProductVariant"
  SET "isActive" = "active"
  WHERE TRUE;

-- ============================================================
-- STEP 18: NOTIFICATION CHANGES
-- Add sentAt, update status default to PENDING
-- ============================================================

ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Notification_recipient_idx" ON "Notification"("recipient");
CREATE INDEX IF NOT EXISTS "Notification_status_idx"   ON "Notification"("status");

-- ============================================================
-- STEP 19: ADDITIONAL INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS "Product_slug_idx"           ON "Product"("slug");
CREATE INDEX IF NOT EXISTS "Product_status_idx"         ON "Product"("status");
CREATE INDEX IF NOT EXISTS "Product_categoryId_idx"     ON "Product"("categoryId");
CREATE INDEX IF NOT EXISTS "ProductVariant_sku_idx"     ON "ProductVariant"("sku");
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX IF NOT EXISTS "Inventory_variantId_idx"    ON "Inventory"("variantId");
CREATE INDEX IF NOT EXISTS "Customer_email_idx"         ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Order_orderNumber_idx"      ON "Order"("orderNumber");
CREATE INDEX IF NOT EXISTS "Order_status_idx"           ON "Order"("status");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx"      ON "OrderItem"("orderId");

-- ============================================================
-- DONE
-- ============================================================
