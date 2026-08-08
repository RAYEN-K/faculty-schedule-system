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
      const schedule = await this.prisma.schedule.findUnique({
        where: { id: dto.scheduleId },
      });
      if (!schedule || schedule.userId !== userId) {
        throw new BadRequestException(
          'This slot does not exist or does not belong to you',
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

  async findDepartmentRequests(departmentId: string) {
    return this.prisma.modificationRequest.findMany({
      where: { user: { departmentId } },
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
    return this.prisma.modificationRequest.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where:
        callerRole === Role.HOD
          ? { user: { departmentId: callerDepartmentId } }
          : undefined,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, departmentId: true },
        },
      },
    });
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

      if (
        callerRole === Role.HOD &&
        request.user.departmentId !== callerDepartmentId
      ) {
        throw new ForbiddenException(
          'You can only manage requests from your own department',
        );
      }

      const updatedRequest = await tx.modificationRequest.update({
        where: { id },
        data: {
          status: dto.status,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
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
    const weekAnchor = request.originalDate ?? request.proposedDate;

    try {
      await tx.scheduleException.create({
        data: {
          scheduleId: request.scheduleId!,
          weekStartDate: startOfWeek(new Date(weekAnchor)),
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

    const existingUserSchedules = await tx.schedule.findMany({
      where: { userId: request.userId, dayOfWeek },
    });

    assertNoScheduleOverlap(
      { dayOfWeek, startTime, endTime },
      existingUserSchedules,
    );

    await tx.schedule.create({
      data: {
        userId: request.userId,
        dayOfWeek,
        startTime,
        endTime,
      },
    });
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
      await this.applyAdditionalApproval(tx, request);
    }
  }
}
