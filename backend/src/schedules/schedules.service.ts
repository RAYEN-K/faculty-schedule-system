import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { startOfWeek } from '../common/utils/date.util';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateScheduleDto,
    callerRole?: Role,
    callerDepartmentId?: string | null,
  ) {
    if (callerRole === Role.HOD) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (!targetUser || targetUser.departmentId !== callerDepartmentId) {
        throw new ForbiddenException(
          'You can only create schedules for your own department',
        );
      }
    }
    await this.assertNoOverlap(
      dto.userId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    );
    return this.prisma.schedule.create({ data: dto });
  }

  async findAll(
    page = 1,
    pageSize = 20,
    callerRole?: Role,
    callerDepartmentId?: string | null,
  ) {
    return this.prisma.schedule.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where:
        callerRole === Role.HOD
          ? { user: { departmentId: callerDepartmentId ?? undefined } }
          : undefined,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, departmentId: true },
        },
      },
    });
  }

  async assertHodCanAccessUser(
    userId: string,
    callerRole?: Role,
    callerDepartmentId?: string | null,
  ) {
    if (callerRole !== Role.HOD) {
      return;
    }
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!targetUser || targetUser.departmentId !== callerDepartmentId) {
      throw new ForbiddenException(
        'You can only access schedules for your own department',
      );
    }
  }

  findByUser(userId: string) {
    return this.prisma.schedule.findMany({ where: { userId } });
  }

  findByDepartment(
    departmentId: string,
    callerRole?: Role,
    callerDepartmentId?: string | null,
  ) {
    if (callerRole === Role.HOD && departmentId !== callerDepartmentId) {
      throw new ForbiddenException('You can only view your own department');
    }
    return this.prisma.schedule.findMany({
      where: { user: { departmentId } },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  async findOne(
    id: string,
    callerRole?: Role,
    callerDepartmentId?: string | null,
  ) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Schedule ${id} not found`);
    }
    if (callerRole === Role.HOD) {
      const owner = await this.prisma.user.findUnique({
        where: { id: schedule.userId },
      });
      if (!owner || owner.departmentId !== callerDepartmentId) {
        throw new ForbiddenException(
          'You can only view schedules in your own department',
        );
      }
    }
    return schedule;
  }
  async getScheduleForWeek(userId: string, weekStartDate: Date) {
    const normalizedWeekStart = startOfWeek(weekStartDate);

    const recurring = await this.prisma.schedule.findMany({
      where: { userId },
    });
    const exceptions = await this.prisma.scheduleException.findMany({
      where: {
        schedule: { userId },
        weekStartDate: normalizedWeekStart,
      },
    });

    return recurring
      .map((slot) => {
        const override = exceptions.find((e) => e.scheduleId === slot.id);
        if (!override) return slot;
        if (override.isSkipped) return null; // compensation day off — remove from this week
        return {
          ...slot,
          dayOfWeek: override.newDayOfWeek,
          startTime: override.newStartTime,
          endTime: override.newEndTime,
          isException: true,
        };
      })
      .filter((slot) => slot !== null);
  }

  async update(
    id: string,
    dto: UpdateScheduleDto,
    callerRole?: Role,
    callerDepartmentId?: string | null,
  ) {
    const existing = await this.findOne(id, callerRole, callerDepartmentId);
    if (callerRole === Role.HOD) {
      const owner = await this.prisma.user.findUnique({
        where: { id: existing.userId },
      });
      if (!owner || owner.departmentId !== callerDepartmentId) {
        throw new ForbiddenException(
          'You can only edit schedules in your own department',
        );
      }
    }
    await this.assertNoOverlap(
      dto.userId ?? existing.userId,
      dto.dayOfWeek ?? existing.dayOfWeek,
      dto.startTime ?? existing.startTime,
      dto.endTime ?? existing.endTime,
      id,
    );
    return this.prisma.schedule.update({ where: { id }, data: dto });
  }

  async remove(
    id: string,
    callerRole?: Role,
    callerDepartmentId?: string | null,
  ) {
    await this.findOne(id, callerRole, callerDepartmentId);
    try {
      return await this.prisma.schedule.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete this schedule slot because it is associated with existing requests or exceptions.',
        );
      }
      throw error;
    }
  }

  private async assertNoOverlap(
    userId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ) {
    const sameDaySlots = await this.prisma.schedule.findMany({
      where: {
        userId,
        dayOfWeek,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    const overlaps = sameDaySlots.some(
      (slot) => startTime < slot.endTime && endTime > slot.startTime,
    );

    if (overlaps) {
      throw new BadRequestException(
        'Ce créneau chevauche un créneau existant pour cet enseignant',
      );
    }
  }
}
