import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { paginate } from '../common/utils/pagination.util';
import * as bcrypt from 'bcrypt';

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  departmentId: true,
  createdAt: true,
  department: { select: { id: true, name: true, code: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private assertDepartmentRequired(role: Role, departmentId?: string | null) {
    if ((role === Role.HOD || role === Role.FACULTY) && !departmentId) {
      throw new BadRequestException(
        'HOD and Faculty users must be assigned to a department',
      );
    }
  }

  async create(dto: CreateUserDto) {
    this.assertDepartmentRequired(dto.role, dto.departmentId);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!dept) {
        throw new BadRequestException('Department not found');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
      select: userSelect,
    });
  }

  async findAll(page = 1, pageSize = 20) {
    return paginate(
      page,
      pageSize,
      (skip, take) =>
        this.prisma.user.findMany({
          skip,
          take,
          select: userSelect,
          orderBy: { createdAt: 'desc' },
        }),
      () => this.prisma.user.count(),
    );
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.findOne(id);
    const nextRole = dto.role ?? existing.role;
    const nextDepartmentId =
      dto.departmentId !== undefined ? dto.departmentId : existing.departmentId;

    this.assertDepartmentRequired(nextRole, nextDepartmentId);

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailTaken) {
        throw new ConflictException(
          'Un utilisateur avec cet email existe déjà',
        );
      }
    }

    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!dept) {
        throw new BadRequestException('Department not found');
      }
    }

    const data: UpdateUserDto & { password?: string } = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      const requestIds = (
        await tx.modificationRequest.findMany({
          where: { userId: id },
          select: { id: true },
        })
      ).map((r) => r.id);

      if (requestIds.length) {
        await tx.scheduleException.deleteMany({
          where: { requestId: { in: requestIds } },
        });
      }

      await tx.modificationRequest.deleteMany({ where: { userId: id } });
      await tx.schedule.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    return { deleted: true };
  }
}
