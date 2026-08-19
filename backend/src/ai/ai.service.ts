import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from '../requests/dto/create-request.dto';
import {
  AI_FALLBACK,
  AiPredictPayload,
  AiPredictResult,
  AiReasonType,
} from './ai.types';

const DEFAULT_SLOT_START = '08:30';
const DEFAULT_SLOT_END = '10:00';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async recommendForRequest(
    userId: string,
    dto: CreateRequestDto,
    excludeRequestId?: string,
  ): Promise<AiPredictResult> {
    try {
      const payload = await this.buildPredictPayload(
        userId,
        dto,
        excludeRequestId,
      );
      return await this.predict(payload);
    } catch (error) {
      this.logger.warn(
        `AI feature mapping failed; storing Pending. ${this.stringifyError(error)}`,
      );
      return AI_FALLBACK;
    }
  }

  async predict(payload: AiPredictPayload): Promise<AiPredictResult> {
    const baseUrl = String(
      this.config.get('AI_SERVICE_URL') ?? 'http://localhost:8000',
    ).replace(/\/$/, '');
    const timeoutMs = Number(this.config.get('AI_SERVICE_TIMEOUT_MS') ?? 4000);
    const safeTimeout = Number.isFinite(timeoutMs)
      ? Math.max(500, timeoutMs)
      : 4000;

    try {
      const response = await fetch(`${baseUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(this.clampPayload(payload)),
        signal: AbortSignal.timeout(safeTimeout),
      });

      if (!response.ok) {
        this.logger.warn(`AI service responded with HTTP ${response.status}`);
        return AI_FALLBACK;
      }

      const raw = await response.text();
      let body: {
        recommendation?: string;
        confidence_score?: number;
        reason?: string;
      };
      try {
        body = JSON.parse(raw) as typeof body;
      } catch {
        this.logger.warn('AI service returned non-JSON payload');
        return AI_FALLBACK;
      }

      const recommendation =
        body.recommendation === 'Approve' || body.recommendation === 'Reject'
          ? body.recommendation
          : null;

      if (!recommendation) {
        return AI_FALLBACK;
      }

      const confidence = Number(body.confidence_score);
      return {
        recommendation,
        confidence_score: Number.isFinite(confidence)
          ? Math.min(1, Math.max(0, confidence))
          : null,
        reason: body.reason?.trim() || null,
      };
    } catch (error) {
      this.logger.warn(
        `AI service unreachable; storing Pending. ${this.stringifyError(error)}`,
      );
      return AI_FALLBACK;
    }
  }

  async buildPredictPayload(
    userId: string,
    dto: CreateRequestDto,
    excludeRequestId?: string,
  ): Promise<AiPredictPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { schedules: true },
    });

    if (!user) {
      return {
        working_days_count: 0,
        has_schedule_conflict: 0,
        institutional_event_conflict: 0,
        previous_requests_count: 0,
        department_coverage: 1,
        reason_type: this.mapReasonType(dto.reason),
      };
    }

    const regularDays = new Set(
      user.schedules
        .filter((slot) => !slot.weekSpecificOnly)
        .map((slot) => slot.dayOfWeek),
    );

    const proposedDate = this.parseUtcDate(dto.proposedDate);
    const proposedDay = proposedDate ? proposedDate.getUTCDay() : 0;
    const linkedSchedule = dto.scheduleId
      ? user.schedules.find((slot) => slot.id === dto.scheduleId)
      : undefined;
    const startTime = linkedSchedule?.startTime ?? DEFAULT_SLOT_START;
    const endTime = linkedSchedule?.endTime ?? DEFAULT_SLOT_END;

    const [peerSlots, eventConflict, previousRequests, coverage] =
      await Promise.all([
        this.findPeerSlotsOnDay(user.departmentId, userId, proposedDay),
        this.hasInstitutionalEvent(user.departmentId, proposedDate),
        this.prisma.modificationRequest.count({
          where: {
            userId,
            ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
          },
        }),
        this.computeDepartmentCoverage(
          user.departmentId,
          dto.type === 'MODIFICATION'
            ? (linkedSchedule?.dayOfWeek ?? proposedDay)
            : proposedDay,
          dto.type === 'MODIFICATION' ? userId : undefined,
        ),
      ]);

    const hasConflict = peerSlots.some(
      (slot) => startTime < slot.endTime && endTime > slot.startTime,
    );

    return {
      working_days_count: Math.min(7, Math.max(0, regularDays.size)),
      has_schedule_conflict: hasConflict ? 1 : 0,
      institutional_event_conflict: eventConflict ? 1 : 0,
      previous_requests_count: previousRequests,
      department_coverage: coverage,
      reason_type: this.mapReasonType(dto.reason),
    };
  }

  mapReasonType(reason?: string): AiReasonType {
    const text = (reason ?? '').toLowerCase();
    if (
      /(medical|sick|health|doctor|hospital|clinic|illness|appointment)/.test(
        text,
      )
    ) {
      return 'Medical';
    }
    if (
      /(research|conference|paper|publication|journal|symposium|workshop|thesis)/.test(
        text,
      )
    ) {
      return 'Research';
    }
    return 'Personal';
  }

  private async findPeerSlotsOnDay(
    departmentId: string | null,
    userId: string,
    dayOfWeek: number,
  ) {
    if (!departmentId) return [];
    return this.prisma.schedule.findMany({
      where: {
        dayOfWeek,
        userId: { not: userId },
        user: { departmentId, role: Role.FACULTY },
      },
      select: { startTime: true, endTime: true },
    });
  }

  private async hasInstitutionalEvent(
    departmentId: string | null,
    proposedDate: Date | null,
  ): Promise<boolean> {
    if (!departmentId || !proposedDate) return false;
    const dayStart = new Date(
      Date.UTC(
        proposedDate.getUTCFullYear(),
        proposedDate.getUTCMonth(),
        proposedDate.getUTCDate(),
      ),
    );
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const event = await this.prisma.event.findFirst({
      where: {
        departmentId,
        eventDate: { gte: dayStart, lt: dayEnd },
      },
      select: { id: true },
    });
    return Boolean(event);
  }

  private async computeDepartmentCoverage(
    departmentId: string | null,
    dayOfWeek: number,
    excludingUserId?: string,
  ): Promise<number> {
    if (!departmentId) return 1;

    const facultyWhere = { departmentId, role: Role.FACULTY };
    const [facultyCount, workingCount] = await Promise.all([
      this.prisma.user.count({ where: facultyWhere }),
      this.prisma.user.count({
        where: {
          ...facultyWhere,
          ...(excludingUserId ? { id: { not: excludingUserId } } : {}),
          schedules: {
            some: { dayOfWeek, weekSpecificOnly: false },
          },
        },
      }),
    ]);

    if (facultyCount === 0) return 1;
    return Number(
      Math.min(1, Math.max(0, workingCount / facultyCount)).toFixed(4),
    );
  }

  private clampPayload(payload: AiPredictPayload): AiPredictPayload {
    return {
      working_days_count: Math.min(
        7,
        Math.max(0, Math.round(payload.working_days_count)),
      ),
      has_schedule_conflict: payload.has_schedule_conflict === 1 ? 1 : 0,
      institutional_event_conflict:
        payload.institutional_event_conflict === 1 ? 1 : 0,
      previous_requests_count: Math.max(
        0,
        Math.round(payload.previous_requests_count),
      ),
      department_coverage: Math.min(
        1,
        Math.max(0, payload.department_coverage),
      ),
      reason_type: payload.reason_type,
    };
  }

  private parseUtcDate(value?: string | Date | null): Date | null {
    if (!value) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private stringifyError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
