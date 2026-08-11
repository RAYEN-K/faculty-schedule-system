import { PrismaClient, RequestStatus, RequestType } from '@prisma/client';
import { startOfWeek } from '../src/common/utils/date.util';

const prisma = new PrismaClient();

function dateForDayInWeek(dayOfWeek: number, weekStart: Date): Date {
  const monday = startOfWeek(weekStart);
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const result = new Date(monday);
  result.setUTCDate(result.getUTCDate() + offset);
  result.setUTCHours(9, 0, 0, 0);
  return result;
}

function pickNonWorkingDay(recurringDays: number[], weekAnchor: Date): Date {
  const weekStart = startOfWeek(weekAnchor);
  for (const day of [1, 2, 3, 4, 5, 6, 0]) {
    if (!recurringDays.includes(day)) {
      return dateForDayInWeek(day, weekStart);
    }
  }
  throw new Error('No non-working day available');
}

async function main() {
  const pending = await prisma.modificationRequest.findMany({
    where: { status: RequestStatus.PENDING },
    include: { schedule: true },
  });

  for (const req of pending) {
    const recurring = await prisma.schedule.findMany({
      where: { userId: req.userId, weekSpecificOnly: false },
    });
    const recurringDays = recurring.map((s) => s.dayOfWeek);
    const proposedDay = req.proposedDate?.getUTCDay();

    let needsFix = false;
    let newProposed = req.proposedDate;
    let newOriginal = req.originalDate;

    if (
      req.type === RequestType.ADDITIONAL ||
      req.type === RequestType.COMPENSATION
    ) {
      if (proposedDay !== undefined && recurringDays.includes(proposedDay)) {
        needsFix = true;
        newProposed = pickNonWorkingDay(recurringDays, req.proposedDate ?? new Date());
      }
    }

    if (req.type === RequestType.MODIFICATION && req.schedule && req.proposedDate) {
      const weekStart = startOfWeek(req.proposedDate);
      const expectedOriginal = dateForDayInWeek(req.schedule.dayOfWeek, weekStart);
      const sameWeek =
        req.originalDate &&
        startOfWeek(req.originalDate).getTime() === weekStart.getTime();
      const validTarget =
        proposedDay !== undefined && !recurringDays.includes(proposedDay);

      if (!sameWeek || !validTarget || proposedDay === req.schedule.dayOfWeek) {
        needsFix = true;
        newOriginal = expectedOriginal;
        newProposed = pickNonWorkingDay(recurringDays, weekStart);
        if (newProposed.getUTCDay() === req.schedule.dayOfWeek) {
          newProposed = pickNonWorkingDay(
            [...recurringDays, req.schedule.dayOfWeek],
            weekStart,
          );
        }
      }
    }

    if (needsFix && newProposed) {
      await prisma.modificationRequest.update({
        where: { id: req.id },
        data: {
          proposedDate: newProposed,
          originalDate: newOriginal,
        },
      });
      console.log(`Fixed request ${req.id} (${req.type})`);
      console.log(`  proposedDate -> ${newProposed.toISOString()}`);
    } else {
      console.log(`OK request ${req.id} (${req.type})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
