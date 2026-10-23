-- ============================================================
-- INVENTORY MANAGEMENT UPDATE: NON-NEGATIVE INVARIANTS & AUDIT IDEMPOTENCY
-- PIERCYN Commerce Engine
-- Safe, additive migration preserving all product and order history
-- ============================================================

-- Enforce that stock on hand can never be negative
ALTER TABLE "Inventory"
  ADD CONSTRAINT "Inventory_stock_non_negative_check"
  CHECK ("stockQuantity" >= 0) NOT VALID;

-- Enforce that reserved stock cannot be negative
ALTER TABLE "Inventory"
  ADD CONSTRAINT "Inventory_reserved_non_negative_check"
  CHECK ("reservedQuantity" >= 0) NOT VALID;

-- Enforce that recorded sold quantity cannot be negative
ALTER TABLE "Inventory"
  ADD CONSTRAINT "Inventory_sold_non_negative_check"
  CHECK ("soldQuantity" >= 0) NOT VALID;

-- Idempotency protection: ensure an order cannot produce duplicate SALE ledger entries for the same variant
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryTransaction_order_variant_sale_unique"
  ON "InventoryTransaction"("variantId", "referenceId")
  WHERE "type" = 'SALE' AND "referenceType" = 'ORDER';

-- Fast lookup index for inventory availability calculations
CREATE INDEX IF NOT EXISTS "Inventory_stock_quantity_idx"
  ON "Inventory"("stockQuantity", "reservedQuantity");
