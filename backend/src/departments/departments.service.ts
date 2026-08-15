import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    const existingCode = await this.prisma.department.findUnique({
      where: { code: dto.code },
    });

    if (existingCode) {
      throw new ConflictException('Un département avec ce code existe déjà');
    }

    return this.prisma.department.create({
      data: dto,
    });
  }

  async findAll(callerRole: Role, callerDepartmentId: string | null) {
    if (callerRole === Role.FACULTY) {
      return this.prisma.department.findMany({
        select: { id: true, name: true, code: true },
      });
    }

    if (callerRole === Role.HOD) {
      if (!callerDepartmentId) {
        return [];
      }
      return this.prisma.department.findMany({
        where: { id: callerDepartmentId },
        include: {
          users: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
        },
      });
    }

    return this.prisma.department.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });
  }

  async findOne(
    id: string,
    callerRole: Role,
    callerDepartmentId: string | null,
  ) {
    if (callerRole === Role.HOD && id !== callerDepartmentId) {
      throw new ForbiddenException('You can only view your own department');
    }

    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Département non trouvé');
    }

    return department;
  }
  async assignUser(userId: string, departmentId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const dept = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!dept) throw new NotFoundException('القسم غير موجود');

    return this.prisma.user.update({
      where: { id: userId },
      data: { departmentId },
    });
  }
  async update(id: string, dto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException('Département non trouvé');
    }

    return this.prisma.department.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { users: true, events: true } } },
    });
    if (!department) {
      throw new NotFoundException('Département non trouvé');
    }

    if (department._count.users > 0 || department._count.events > 0) {
      throw new ConflictException(
        'Cannot delete a department that still has users or events',
      );
    }

    return this.prisma.department.delete({ where: { id } });
  }
}
