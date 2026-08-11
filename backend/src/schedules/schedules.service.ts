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
import { paginate } from '../common/utils/pagination.util';

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
    const where =
      callerRole === Role.HOD
        ? { user: { departmentId: callerDepartmentId ?? undefined } }
        : undefined;

    return paginate(
      page,
      pageSize,
      (skip, take) =>
        this.prisma.schedule.findMany({
          skip,
          take,
          where,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                departmentId: true,
              },
            },
          },
        }),
      () => this.prisma.schedule.count({ where }),
    );
  }

  async assertHodCanAccessUser(
    userId: string,
    callerRole?: Role,
    callerDepartmentId?: string | null,
  ) {
    if (callerRole === Role.HOD) {
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
    if (
      callerRole === Role.HOD &&
      callerDepartmentId &&
      departmentId !== callerDepartmentId
    ) {
      throw new ForbiddenException('You can only view your own department');
    }

    // HoD without a department filter sees all faculty schedules globally
    const where =
      callerRole === Role.HOD && !callerDepartmentId
        ? { user: { role: { in: [Role.FACULTY, Role.HOD] } } }
        : { user: { departmentId } };

    return this.prisma.schedule.findMany({
      where,
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
      include: {
        exceptions: {
          where: { weekStartDate: normalizedWeekStart },
          take: 1,
        },
      },
    });

    return recurring.flatMap(({ exceptions, weekSpecificOnly, ...slot }) => {
      const override = exceptions[0];

      if (weekSpecificOnly) {
        if (!override || override.isSkipped) return [];
        return [
          {
            ...slot,
            dayOfWeek: override.newDayOfWeek,
            startTime: override.newStartTime,
            endTime: override.newEndTime,
            isException: true,
          },
        ];
      }

      if (!override) return [slot];
      if (override.isSkipped) return [];
      return [
        {
          ...slot,
          dayOfWeek: override.newDayOfWeek,
          startTime: override.newStartTime,
          endTime: override.newEndTime,
          isException: true,
        },
      ];
    });
  }

  async findByDepartmentForWeek(
    departmentId: string | null,
    weekStartDate: Date,
    callerRole?: Role,
  ) {
    const userWhere =
      callerRole === Role.HOD && !departmentId
        ? { role: { in: [Role.FACULTY, Role.HOD] as Role[] } }
        : { departmentId: departmentId ?? undefined };

    const users = await this.prisma.user.findMany({
      where: userWhere,
      select: { id: true, fullName: true, email: true },
    });

    const weekStart = startOfWeek(weekStartDate);
    const rows: Array<{
      id: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      subject: string | null;
      isException?: boolean;
      userId: string;
      user: { id: string; fullName: string; email: string };
    }> = [];

    for (const user of users) {
      const slots = await this.getScheduleForWeek(user.id, weekStart);
      for (const slot of slots) {
        rows.push({
          ...slot,
          userId: user.id,
          user,
        });
      }
    }

    return rows;
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
