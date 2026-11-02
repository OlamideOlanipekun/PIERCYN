-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "supabaseUserId" TEXT,
ADD COLUMN "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "OrderClaim" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "claimToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "previousOwner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_supabaseUserId_key" ON "Customer"("supabaseUserId");

-- CreateIndex
CREATE INDEX "Customer_supabaseUserId_idx" ON "Customer"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderClaim_orderId_key" ON "OrderClaim"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderClaim_claimToken_key" ON "OrderClaim"("claimToken");

-- CreateIndex
CREATE INDEX "OrderClaim_claimToken_idx" ON "OrderClaim"("claimToken");

-- CreateIndex
CREATE INDEX "OrderClaim_orderId_idx" ON "OrderClaim"("orderId");

-- CreateIndex
CREATE INDEX "OrderClaim_customerId_idx" ON "OrderClaim"("customerId");

-- AddForeignKey
ALTER TABLE "OrderClaim" ADD CONSTRAINT "OrderClaim_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderClaim" ADD CONSTRAINT "OrderClaim_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

