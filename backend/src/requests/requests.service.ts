import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RequestStatus, RequestType, Role, Prisma } from '@prisma/client';
import { assertNoScheduleOverlap } from '../common/utils/schedule-overlap.util';
import { SchedulesService } from '../schedules/schedules.service';
import { CreateScheduleDto } from '../schedules/dto/create-schedule.dto';

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulesService: SchedulesService,
  ) {}

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
      // 1. Fetch Request within Transaction
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

      // 2. Department Check for HOD
      if (
        callerRole === Role.HOD &&
        request.user.departmentId !== callerDepartmentId
      ) {
        throw new BadRequestException(
          'You can only manage requests from your own department',
        );
      }

      // 3. Update Request Status
      const updatedRequest = await tx.modificationRequest.update({
        where: { id },
        data: {
          status: dto.status,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });

      // If not approved, stop here
      if (dto.status !== RequestStatus.APPROVED) {
        return updatedRequest;
      }

      // 4. Handle Schedule Changes on Approval
      if (request.type === RequestType.MODIFICATION && request.scheduleId) {
        if (!request.proposedDate || !request.schedule) {
          throw new BadRequestException(
            'Modification request must have a proposedDate and associated schedule.',
          );
        }

        const proposedDate = new Date(request.proposedDate);
        const newDayOfWeek = proposedDate.getUTCDay();

        try {
          await tx.scheduleException.create({
            data: {
              scheduleId: request.scheduleId,
              weekStartDate: request.originalDate ?? proposedDate,
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
      } else if (
        request.type === RequestType.ADDITIONAL ||
        request.type === RequestType.COMPENSATION
      ) {
        if (!request.proposedDate) {
          throw new BadRequestException(
            'Proposed date is required for this request type',
          );
        }

        const proposedDate = new Date(request.proposedDate);
        const dayOfWeek = proposedDate.getUTCDay();

        // Check for overlap before creating schedule
        const existingUserSchedules = await tx.schedule.findMany({
          where: { userId: request.userId, dayOfWeek },
        });

        assertNoScheduleOverlap(
          {
            dayOfWeek,
            startTime: '08:30',
            endTime: '10:00',
          },
          existingUserSchedules,
        );

        const newSlot: CreateScheduleDto = {
          userId: request.userId,
          dayOfWeek,
          startTime: '08:30',
          endTime: '10:00',
        };

        await this.schedulesService.create(newSlot);
      }

      return updatedRequest;
    });
  }
}
