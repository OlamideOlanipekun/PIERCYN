-- Payment review workflow, manual reconciliation flags and inventory invariants.
-- Additive only: no existing rows are deleted or rewritten.

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AWAITING_PAYMENT_VERIFICATION';

ALTER TYPE "OrderPaymentStatus" ADD VALUE IF NOT EXISTS 'AWAITING_VERIFICATION';
ALTER TYPE "OrderPaymentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "paymentSubmittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paymentReviewDeadlineAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "needsManualReview" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "manualReviewReason" TEXT;

CREATE INDEX IF NOT EXISTS "Order_paymentReviewDeadlineAt_idx" ON "Order"("paymentReviewDeadlineAt");
CREATE INDEX IF NOT EXISTS "Order_needsManualReview_idx" ON "Order"("needsManualReview");

ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "receiptPath" TEXT,
  ADD COLUMN IF NOT EXISTS "receiptMimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "receiptUploadedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reviewDeadlineAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verificationNote" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

-- Defense in depth: reserved units can never exceed physical units.
-- NOT VALID avoids blocking on legacy rows while enforcing the rule for all new writes.
ALTER TABLE "Inventory"
  ADD CONSTRAINT "Inventory_reserved_lte_stock_check"
  CHECK ("reservedQuantity" <= "stockQuantity") NOT VALID;
