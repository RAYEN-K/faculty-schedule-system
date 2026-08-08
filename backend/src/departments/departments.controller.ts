import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { AssignDepartmentDto } from './dto/assign-department.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new department' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HOD, Role.FACULTY)
  @ApiOperation({ summary: 'Get all departments' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.departmentsService.findAll(user.role, user.departmentId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HOD)
  @ApiOperation({ summary: 'Get a department by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.departmentsService.findOne(id, user.role, user.departmentId);
  }

  @Post('assign-user')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a user to a department (ADMIN only)' })
  assignUser(@Body() dto: AssignDepartmentDto) {
    return this.departmentsService.assignUser(dto.userId, dto.departmentId);
  }
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }
}
