import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Create a new schedule slot' })
  create(
    @Body() createScheduleDto: CreateScheduleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schedulesService.create(
      createScheduleDto,
      user.role,
      user.departmentId,
    );
  }

  @Get()
  @Roles(Role.ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Get all schedule slots' })
  findAll(
    @Query() { page, pageSize }: PaginationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schedulesService.findAll(
      page,
      pageSize,
      user.role,
      user.departmentId,
    );
  }

  @Get('user/:userId/week/:weekStartDate')
  @ApiOperation({
    summary:
      'Get the actual schedule for a specific week, including exceptions',
  })
  async findByUserForWeek(
    @Param('userId') userId: string,
    @Param('weekStartDate') weekStartDate: string,
    @CurrentUser() user: AuthUser,
  ) {
    const isSelf = user.id === userId;
    const isPrivileged = user.role === Role.ADMIN || user.role === Role.HOD;

    if (!isSelf && !isPrivileged) {
      throw new ForbiddenException('You can only view your own timetable');
    }
    if (user.role === Role.HOD && !isSelf) {
      await this.schedulesService.assertHodCanAccessUser(
        userId,
        user.role,
        user.departmentId,
      );
    }
    return this.schedulesService.getScheduleForWeek(
      userId,
      new Date(weekStartDate),
    );
  }

  @Get('department/:departmentId/week/:weekStartDate')
  @Roles(Role.ADMIN, Role.HOD)
  @ApiOperation({
    summary:
      'Get department timetable for a specific week (with exceptions applied)',
  })
  findByDepartmentForWeek(
    @Param('departmentId') departmentId: string,
    @Param('weekStartDate') weekStartDate: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schedulesService.findByDepartmentForWeek(
      departmentId,
      new Date(weekStartDate),
      user.role,
    );
  }

  @Get('department/:departmentId')
  @Roles(Role.ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Get timetable for a specific department' })
  findByDepartment(
    @Param('departmentId') departmentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schedulesService.findByDepartment(
      departmentId,
      user.role,
      user.departmentId,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all schedule slots for a specific user' })
  async findByUser(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const isSelf = user.id === userId;
    const isPrivileged = user.role === Role.ADMIN || user.role === Role.HOD;

    if (!isSelf && !isPrivileged) {
      throw new ForbiddenException('You can only view your own timetable');
    }
    if (user.role === Role.HOD && !isSelf) {
      await this.schedulesService.assertHodCanAccessUser(
        userId,
        user.role,
        user.departmentId,
      );
    }

    return this.schedulesService.findByUser(userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Get a specific schedule slot by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.schedulesService.findOne(id, user.role, user.departmentId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Update a schedule slot' })
  update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schedulesService.update(
      id,
      updateScheduleDto,
      user.role,
      user.departmentId,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Delete a schedule slot' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.schedulesService.remove(id, user.role, user.departmentId);
  }
}
