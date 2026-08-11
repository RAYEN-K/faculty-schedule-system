import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Event, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateEventDto,
    callerRole: Role,
    callerDepartmentId: string | null,
  ) {
    if (
      callerRole === Role.HOD &&
      callerDepartmentId &&
      dto.departmentId !== callerDepartmentId
    ) {
      throw new ForbiddenException(
        'You can only create events for your own department',
      );
    }
    return this.prisma.event.create({
      data: dto,
    });
  }

  async findAll(callerRole: Role, callerDepartmentId: string | null) {
    if (callerRole === Role.ADMIN || callerRole === Role.HOD) {
      return this.prisma.event.findMany({
        orderBy: { eventDate: 'asc' },
      });
    }

    if (callerDepartmentId) {
      return this.prisma.event.findMany({
        where: { departmentId: callerDepartmentId },
        orderBy: { eventDate: 'asc' },
      });
    }

    // Faculty without a department assignment still see all published events
    return this.prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
    });
  }

  async findOne(
    id: string,
    callerRole: Role,
    callerDepartmentId: string | null,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    this.assertCanAccessEvent(event, callerRole, callerDepartmentId);
    return event;
  }

  async update(
    id: string,
    dto: UpdateEventDto,
    callerRole: Role,
    callerDepartmentId: string | null,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    if (
      callerRole === Role.HOD &&
      callerDepartmentId &&
      event.departmentId !== callerDepartmentId
    ) {
      throw new ForbiddenException(
        'You can only update events belonging to your department',
      );
    }

    return this.prisma.event.update({ where: { id }, data: dto });
  }

  async remove(
    id: string,
    callerRole: Role,
    callerDepartmentId: string | null,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    if (
      callerRole === Role.HOD &&
      callerDepartmentId &&
      event.departmentId !== callerDepartmentId
    ) {
      throw new ForbiddenException(
        'You can only delete events belonging to your department',
      );
    }

    return this.prisma.event.delete({ where: { id } });
  }

  private assertCanAccessEvent(
    event: Event,
    callerRole: Role,
    callerDepartmentId: string | null,
  ) {
    if (callerRole === Role.ADMIN || callerRole === Role.HOD) {
      return;
    }
    if (!callerDepartmentId || event.departmentId === callerDepartmentId) {
      return;
    }
    throw new ForbiddenException('You cannot access this event');
  }
}
