import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { SendScheduleReminderDto } from './dto/send-schedule-reminder.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.HOD, Role.FACULTY)
  @ApiOperation({ summary: 'Get notifications for the logged-in user' })
  getMyNotifications(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getMyNotifications(user.id);
  }

  @Post('schedule-reminder')
  @Roles(Role.HOD)
  @ApiOperation({
    summary: 'Send schedule assignment reminders to department faculty',
  })
  sendScheduleReminder(
    @CurrentUser() user: AuthUser,
    @Body() dto: SendScheduleReminderDto,
  ) {
    return this.notificationsService.sendScheduleReminder(
      user.id,
      user.role,
      user.departmentId,
      dto,
    );
  }
}
