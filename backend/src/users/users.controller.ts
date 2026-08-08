import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @ApiOperation({ summary: 'Get all users with pagination' })
  @Roles('ADMIN')
  @Get()
  findAll(@Query() { page, pageSize }: PaginationDto) {
    return this.usersService.findAll(page, pageSize);
  }
}
