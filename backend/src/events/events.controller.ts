import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('Events')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Create a department event' })
  create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.create(
      createEventDto,
      user.role,
      user.departmentId,
    );
  }

  @Get()
  @Roles(Role.ADMIN, Role.HOD, Role.FACULTY)
  @ApiOperation({ summary: 'List events (scoped by department for non-admins)' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.eventsService.findAll(user.role, user.departmentId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HOD, Role.FACULTY)
  @ApiOperation({ summary: 'Get event by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.eventsService.findOne(id, user.role, user.departmentId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Update an event' })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.update(
      id,
      updateEventDto,
      user.role,
      user.departmentId,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Delete an event' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.eventsService.remove(id, user.role, user.departmentId);
  }
}
