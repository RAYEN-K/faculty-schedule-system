import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RequestStatus, RequestType, Role, Prisma } from '@prisma/client';
import { assertNoScheduleOverlap } from '../common/utils/schedule-overlap.util';
import { startOfWeek } from '../common/utils/date.util';
import { paginate } from '../common/utils/pagination.util';

const DEFAULT_SLOT_START = '08:30';
const DEFAULT_SLOT_END = '10:00';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRequestDto) {
    if (dto.type === RequestType.MODIFICATION) {
      if (!dto.scheduleId) {
        throw new BadRequestException(
          'scheduleId is required for a MODIFICATION request type',
        );
      }
      if (!dto.proposedDate || !dto.originalDate) {
        throw new BadRequestException(
          'originalDate and proposedDate are required for MODIFICATION',
        );
      }

      const schedule = await this.prisma.schedule.findUnique({
        where: { id: dto.scheduleId },
      });
      if (!schedule || schedule.userId !== userId) {
        throw new BadRequestException(
          'This slot does not exist or does not belong to you',
        );
      }

      const originalDate = new Date(dto.originalDate);
      const proposedDate = new Date(dto.proposedDate);

      if (
        startOfWeek(originalDate).getTime() !==
        startOfWeek(proposedDate).getTime()
      ) {
        throw new BadRequestException(
          'The replacement day must fall within the same week as the original slot',
        );
      }

      const proposedDay = proposedDate.getUTCDay();
      if (proposedDay === schedule.dayOfWeek) {
        throw new BadRequestException(
          'The target day must be different from the day being replaced',
        );
      }

      const existingOnTargetDay = await this.prisma.schedule.findFirst({
        where: { userId, dayOfWeek: proposedDay },
      });
      if (existingOnTargetDay) {
        throw new BadRequestException(
          'The target day is already a scheduled working day',
        );
      }
    }

    if (
      dto.type === RequestType.ADDITIONAL ||
      dto.type === RequestType.COMPENSATION
    ) {
      if (!dto.proposedDate) {
        throw new BadRequestException('proposedDate is required for this request type');
      }

      const proposedDate = new Date(dto.proposedDate);
      const proposedDay = proposedDate.getUTCDay();
      const recurringOnDay = await this.prisma.schedule.findFirst({
        where: { userId, dayOfWeek: proposedDay, weekSpecificOnly: false },
      });
      if (recurringOnDay) {
        throw new BadRequestException(
          'The proposed day is already a regular working day in your schedule',
        );
      }
    }

    return this.prisma.modificationRequest.create({
      data: { ...dto, userId },
    });
  }

  async findMyRequests(userId: string) {
    return this.prisma.modificationRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDepartmentRequests(
    departmentId: string | null,
    callerRole?: Role,
  ) {
    // HoD has global visibility — all faculty requests across the system
    const where =
      callerRole === Role.HOD
        ? {}
        : departmentId
          ? { user: { departmentId } }
          : {};

    return this.prisma.modificationRequest.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(
    page = 1,
    pageSize = 20,
    callerRole?: Role,
    callerDepartmentId?: string | null,
  ) {
    const where =
      callerRole === Role.HOD
        ? {}
        : undefined;

    return paginate(
      page,
      pageSize,
      (skip, take) =>
        this.prisma.modificationRequest.findMany({
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
          orderBy: { createdAt: 'desc' },
        }),
      () => this.prisma.modificationRequest.count({ where }),
    );
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    reviewerId: string,
    callerRole: Role,
    callerDepartmentId: string | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.modificationRequest.findUnique({
        where: { id },
        include: { user: true, schedule: true },
      });

      if (!request) {
        throw new NotFoundException(`Request #${id} not found`);
      }

      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException(
          'This request has already been processed',
        );
      }

      // HoD has global approval rights for demo/unified setup
      if (
        dto.status === RequestStatus.REJECTED &&
        !dto.reviewComment?.trim()
      ) {
        throw new BadRequestException('A rejection reason is required');
      }

      const updatedRequest = await tx.modificationRequest.update({
        where: { id },
        data: {
          status: dto.status,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          reviewComment:
            dto.status === RequestStatus.REJECTED
              ? dto.reviewComment?.trim()
              : null,
        },
      });

      if (dto.status !== RequestStatus.APPROVED) {
        return updatedRequest;
      }

      if (request.type === RequestType.MODIFICATION && request.scheduleId) {
        await this.applyModificationApproval(tx, request);
      } else if (request.type === RequestType.ADDITIONAL) {
        await this.applyAdditionalApproval(tx, request);
      } else if (request.type === RequestType.COMPENSATION) {
        await this.applyCompensationApproval(tx, request, dto);
      }

      return updatedRequest;
    });
  }

  private async applyModificationApproval(
    tx: Prisma.TransactionClient,
    request: Prisma.ModificationRequestGetPayload<{
      include: { schedule: true };
    }>,
  ) {
    if (!request.proposedDate || !request.schedule) {
      throw new BadRequestException(
        'Modification request must have a proposedDate and associated schedule.',
      );
    }

    const proposedDate = new Date(request.proposedDate);
    const newDayOfWeek = proposedDate.getUTCDay();
    const weekStartDate = startOfWeek(proposedDate);

    if (request.originalDate) {
      const originalWeek = startOfWeek(new Date(request.originalDate));
      if (originalWeek.getTime() !== weekStartDate.getTime()) {
        throw new BadRequestException(
          'Original and proposed dates must fall in the same week',
        );
      }
    }

    try {
      await tx.scheduleException.create({
        data: {
          scheduleId: request.scheduleId!,
          weekStartDate,
          newDayOfWeek,
          newStartTime: request.schedule.startTime,
          newEndTime: request.schedule.endTime,
          isSkipped: false,
          requestId: request.id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This week already has a scheduling exception for this slot',
        );
      }
      throw error;
    }
  }

  private async applyAdditionalApproval(
    tx: Prisma.TransactionClient,
    request: Prisma.ModificationRequestGetPayload<{
      include: { schedule: true };
    }>,
  ) {
    if (!request.proposedDate) {
      throw new BadRequestException(
        'Proposed date is required for this request type',
      );
    }

    const proposedDate = new Date(request.proposedDate);
    const dayOfWeek = proposedDate.getUTCDay();
    const startTime = request.schedule?.startTime ?? DEFAULT_SLOT_START;
    const endTime = request.schedule?.endTime ?? DEFAULT_SLOT_END;
    const weekStart = startOfWeek(proposedDate);

    const existingUserSchedules = await tx.schedule.findMany({
      where: { userId: request.userId, dayOfWeek, weekSpecificOnly: false },
    });

    if (existingUserSchedules.length > 0) {
      throw new BadRequestException(
        'Cannot approve: the proposed day is already a regular working day for this faculty member',
      );
    }

    assertNoScheduleOverlap(
      { dayOfWeek, startTime, endTime },
      existingUserSchedules,
    );

    const weekSlot = await tx.schedule.create({
      data: {
        userId: request.userId,
        dayOfWeek,
        startTime,
        endTime,
        weekSpecificOnly: true,
      },
    });

    try {
      await tx.scheduleException.create({
        data: {
          scheduleId: weekSlot.id,
          weekStartDate: weekStart,
          newDayOfWeek: dayOfWeek,
          newStartTime: startTime,
          newEndTime: endTime,
          isSkipped: false,
          requestId: request.id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This week already has a scheduling exception for this slot',
        );
      }
      throw error;
    }
  }

  private async applyCompensationApproval(
    tx: Prisma.TransactionClient,
    request: Prisma.ModificationRequestGetPayload<{
      include: { schedule: true };
    }>,
    dto: UpdateStatusDto,
  ) {
    if (!dto.compensationScheduleId || !dto.compensationWeekStartDate) {
      throw new BadRequestException(
        'Compensation approval requires compensationScheduleId and compensationWeekStartDate',
      );
    }

    const skipSlot = await tx.schedule.findUnique({
      where: { id: dto.compensationScheduleId },
    });

    if (!skipSlot || skipSlot.userId !== request.userId) {
      throw new BadRequestException(
        'Invalid compensation slot for this faculty member',
      );
    }

    try {
      await tx.scheduleException.create({
        data: {
          scheduleId: dto.compensationScheduleId,
          weekStartDate: startOfWeek(new Date(dto.compensationWeekStartDate)),
          newDayOfWeek: skipSlot.dayOfWeek,
          newStartTime: skipSlot.startTime,
          newEndTime: skipSlot.endTime,
          isSkipped: true,
          requestId: request.id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This week already has a scheduling exception for this slot',
        );
      }
      throw error;
    }

    if (request.proposedDate) {
      await this.applyAdditionalWeekSlot(tx, request);
    }
  }

  /** Extra working day in the request's proposed week only (Scenario B / compensation extra day). */
  private async applyAdditionalWeekSlot(
    tx: Prisma.TransactionClient,
    request: Prisma.ModificationRequestGetPayload<{
      include: { schedule: true };
    }>,
  ) {
    if (!request.proposedDate) return;

    const proposedDate = new Date(request.proposedDate);
    const dayOfWeek = proposedDate.getUTCDay();
    const startTime = request.schedule?.startTime ?? DEFAULT_SLOT_START;
    const endTime = request.schedule?.endTime ?? DEFAULT_SLOT_END;
    const weekStart = startOfWeek(proposedDate);

    const weekSlot = await tx.schedule.create({
      data: {
        userId: request.userId,
        dayOfWeek,
        startTime,
        endTime,
        weekSpecificOnly: true,
      },
    });

    await tx.scheduleException.create({
      data: {
        scheduleId: weekSlot.id,
        weekStartDate: weekStart,
        newDayOfWeek: dayOfWeek,
        newStartTime: startTime,
        newEndTime: endTime,
        isSkipped: false,
        requestId: null,
      },
    });
  }
}
