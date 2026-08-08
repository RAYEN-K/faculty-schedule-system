import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  departmentId?: string | null;
}

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.create(
      createEventDto,
      user?.role,
      user?.departmentId ?? null,
    );
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.update(
      id,
      updateEventDto,
      user?.role,
      user?.departmentId ?? null,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.eventsService.remove(
      id,
      user?.role,
      user?.departmentId ?? null,
    );
  }
}
