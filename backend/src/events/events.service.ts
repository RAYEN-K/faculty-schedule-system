import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateEventDto,
    callerRole?: Role,
    callerDepartmentId?: string | null,
  ) {
    if (callerRole === Role.HOD && dto.departmentId !== callerDepartmentId) {
      throw new ForbiddenException(
        'You can only create events for your own department',
      );
    }
    return this.prisma.event.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(
    id: string,
    dto: UpdateEventDto,
    callerRole?: Role,
    callerDepartmentId?: string | null,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    if (callerRole === Role.HOD && event.departmentId !== callerDepartmentId) {
      throw new ForbiddenException(
        'You can only update events belonging to your department',
      );
    }

    return this.prisma.event.update({ where: { id }, data: dto });
  }

  async remove(
    id: string,
    callerRole?: Role,
    callerDepartmentId?: string | null,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    if (callerRole === Role.HOD && event.departmentId !== callerDepartmentId) {
      throw new ForbiddenException(
        'You can only delete events belonging to your department',
      );
    }

    return this.prisma.event.delete({ where: { id } });
  }
}
