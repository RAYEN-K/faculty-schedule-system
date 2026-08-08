/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Department` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ModificationRequest" ADD COLUMN     "scheduleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- AddForeignKey
ALTER TABLE "ModificationRequest" ADD CONSTRAINT "ModificationRequest_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
