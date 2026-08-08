import { ConflictException } from '@nestjs/common';

export interface ScheduleSlotTime {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function assertNoScheduleOverlap(
  newSlot: ScheduleSlotTime,
  existingSlots: ScheduleSlotTime[],
) {
  for (const slot of existingSlots) {
    if (slot.dayOfWeek === newSlot.dayOfWeek) {
      if (
        newSlot.startTime < slot.endTime &&
        newSlot.endTime > slot.startTime
      ) {
        throw new ConflictException(
          `Schedule overlap detected with existing slot (${slot.startTime} - ${slot.endTime})`,
        );
      }
    }
  }
}
