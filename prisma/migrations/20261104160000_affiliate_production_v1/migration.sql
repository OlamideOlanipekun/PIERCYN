-- AlterTable Affiliate
ALTER TABLE "Affiliate" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "supabaseUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Affiliate_supabaseUserId_key" ON "Affiliate"("supabaseUserId");
CREATE INDEX IF NOT EXISTS "Affiliate_supabaseUserId_idx" ON "Affiliate"("supabaseUserId");

-- AlterTable AffiliateCommission: support order-level commissions alongside historical item commissions
ALTER TABLE "AffiliateCommission" ALTER COLUMN "orderItemId" DROP NOT NULL;
ALTER TABLE "AffiliateCommission" ADD COLUMN IF NOT EXISTS "isOrderLevel" BOOLEAN NOT NULL DEFAULT true;

-- Unique constraint for order-level commissions (at most one order-level commission per order)
CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateCommission_order_level_idx" ON "AffiliateCommission"("orderId") WHERE "orderItemId" IS NULL;

-- AlterEnum PayoutStatus
ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'FAILED';

-- CreateEnum LedgerEntryType
DO $$ BEGIN
  CREATE TYPE "LedgerEntryType" AS ENUM (
    'COMMISSION_PENDING',
    'COMMISSION_AVAILABLE',
    'COMMISSION_REVERSED',
    'WITHDRAWAL_RESERVED',
    'WITHDRAWAL_PAID',
    'WITHDRAWAL_RELEASED',
    'ADJUSTMENT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable AffiliateWallet
CREATE TABLE IF NOT EXISTS "AffiliateWallet" (
  "id" TEXT NOT NULL,
  "affiliateId" TEXT NOT NULL,
  "pendingKobo" INTEGER NOT NULL DEFAULT 0,
  "availableKobo" INTEGER NOT NULL DEFAULT 0,
  "reservedKobo" INTEGER NOT NULL DEFAULT 0,
  "paidKobo" INTEGER NOT NULL DEFAULT 0,
  "lifetimeEarnedKobo" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AffiliateWallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateWallet_affiliateId_key" ON "AffiliateWallet"("affiliateId");
CREATE INDEX IF NOT EXISTS "AffiliateWallet_affiliateId_idx" ON "AffiliateWallet"("affiliateId");

DO $$ BEGIN
  ALTER TABLE "AffiliateWallet" ADD CONSTRAINT "AffiliateWallet_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable AffiliateLedger
CREATE TABLE IF NOT EXISTS "AffiliateLedger" (
  "id" TEXT NOT NULL,
  "affiliateId" TEXT NOT NULL,
  "type" "LedgerEntryType" NOT NULL,
  "amountKobo" INTEGER NOT NULL,
  "balanceBeforeKobo" INTEGER NOT NULL,
  "balanceAfterKobo" INTEGER NOT NULL,
  "referenceType" TEXT NOT NULL,
  "referenceId" TEXT,
  "description" TEXT NOT NULL,
  "adminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AffiliateLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AffiliateLedger_affiliateId_idx" ON "AffiliateLedger"("affiliateId");
CREATE INDEX IF NOT EXISTS "AffiliateLedger_referenceType_referenceId_idx" ON "AffiliateLedger"("referenceType", "referenceId");
CREATE INDEX IF NOT EXISTS "AffiliateLedger_createdAt_idx" ON "AffiliateLedger"("createdAt");

DO $$ BEGIN
  ALTER TABLE "AffiliateLedger" ADD CONSTRAINT "AffiliateLedger_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable AffiliateMedia
CREATE TABLE IF NOT EXISTS "AffiliateMedia" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "downloadUrl" TEXT,
  "dimensions" TEXT,
  "fileSize" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AffiliateMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AffiliateMedia_category_idx" ON "AffiliateMedia"("category");
CREATE INDEX IF NOT EXISTS "AffiliateMedia_isActive_idx" ON "AffiliateMedia"("isActive");

-- CreateTable AffiliateAuditLog
CREATE TABLE IF NOT EXISTS "AffiliateAuditLog" (
  "id" TEXT NOT NULL,
  "affiliateId" TEXT,
  "adminId" TEXT,
  "adminEmail" TEXT,
  "action" TEXT NOT NULL,
  "details" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AffiliateAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AffiliateAuditLog_affiliateId_idx" ON "AffiliateAuditLog"("affiliateId");
CREATE INDEX IF NOT EXISTS "AffiliateAuditLog_action_idx" ON "AffiliateAuditLog"("action");
CREATE INDEX IF NOT EXISTS "AffiliateAuditLog_createdAt_idx" ON "AffiliateAuditLog"("createdAt");

DO $$ BEGIN
  ALTER TABLE "AffiliateAuditLog" ADD CONSTRAINT "AffiliateAuditLog_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
