-- ============================================================
-- PIERCYN V1 DATABASE — PRODUCT REVIEWS MIGRATION
-- 20261014100000_add_product_reviews
-- ============================================================
-- Production-ready, non-destructive migration adding:
--   • ReviewStatus enum (PENDING, PUBLISHED, HIDDEN, REJECTED)
--   • ProductReview table with foreign keys to Product, Order, OrderItem, Customer
--   • Unique constraint on orderItemId (one review per eligible order item)
--   • Check constraint enforcing 1 <= rating <= 5
--   • Indexes for fast retrieval by product, moderation status, and date
-- ============================================================

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'REJECTED');

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT,
    "orderItemId" TEXT,
    "customerId" TEXT,
    "reviewerDisplayName" TEXT NOT NULL,
    "reviewerEmail" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "moderatedBy" TEXT,
    "moderationNote" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductReview_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_orderItemId_key" ON "ProductReview"("orderItemId");

-- CreateIndex
CREATE INDEX "ProductReview_productId_status_idx" ON "ProductReview"("productId", "status");

-- CreateIndex
CREATE INDEX "ProductReview_status_idx" ON "ProductReview"("status");

-- CreateIndex
CREATE INDEX "ProductReview_createdAt_idx" ON "ProductReview"("createdAt");

-- CreateIndex
CREATE INDEX "ProductReview_orderId_idx" ON "ProductReview"("orderId");

-- CreateIndex
CREATE INDEX "ProductReview_customerId_idx" ON "ProductReview"("customerId");

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
