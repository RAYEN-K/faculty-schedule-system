-- AlterTable
ALTER TABLE "ModificationRequest" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;
