import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SendScheduleReminderDto } from './dto/send-schedule-reminder.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        User_Notification_senderIdToUser: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  async sendScheduleReminder(
    senderId: string,
    senderRole: Role,
    senderDepartmentId: string | null,
    dto: SendScheduleReminderDto,
  ) {
    if (senderRole !== Role.HOD) {
      throw new ForbiddenException(
        'Only department heads can send schedule reminders',
      );
    }

    if (!senderDepartmentId) {
      throw new BadRequestException(
        'Your account is not assigned to a department',
      );
    }

    const facultyMembers = await this.prisma.user.findMany({
      where: {
        id: { in: dto.facultyIds },
        role: Role.FACULTY,
        departmentId: senderDepartmentId,
      },
      select: { id: true, fullName: true },
    });

    if (facultyMembers.length !== dto.facultyIds.length) {
      throw new NotFoundException(
        'One or more faculty members were not found in your department',
      );
    }

    const message =
      dto.message?.trim() ||
      'Please review and confirm your assigned work schedule for this week.';

    const notifications = facultyMembers.map((faculty) => ({
      userId: faculty.id,
      senderId,
      title: 'Schedule assignment reminder',
      message,
      type: NotificationType.SCHEDULE_REMINDER,
    }));

    await this.prisma.notification.createMany({ data: notifications });

    return {
      sent: notifications.length,
      recipients: facultyMembers.map((f) => ({
        id: f.id,
        fullName: f.fullName,
      })),
    };
  }
}
