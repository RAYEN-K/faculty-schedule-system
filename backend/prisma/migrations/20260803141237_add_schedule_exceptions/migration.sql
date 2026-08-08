-- CreateTable
CREATE TABLE "ScheduleException" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "newDayOfWeek" INTEGER NOT NULL,
    "newStartTime" TEXT NOT NULL,
    "newEndTime" TEXT NOT NULL,
    "isSkipped" BOOLEAN NOT NULL DEFAULT false,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleException_requestId_key" ON "ScheduleException"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleException_scheduleId_weekStartDate_key" ON "ScheduleException"("scheduleId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ModificationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
