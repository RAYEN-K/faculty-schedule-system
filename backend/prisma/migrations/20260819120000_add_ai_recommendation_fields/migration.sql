-- AlterTable
ALTER TABLE "ModificationRequest" ADD COLUMN IF NOT EXISTS "aiRecommendation" TEXT;
ALTER TABLE "ModificationRequest" ADD COLUMN IF NOT EXISTS "aiConfidenceScore" DOUBLE PRECISION;
ALTER TABLE "ModificationRequest" ADD COLUMN IF NOT EXISTS "aiReason" TEXT;
