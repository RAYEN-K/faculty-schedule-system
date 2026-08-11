import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @ApiOperation({ summary: 'submit a new request' })
  create(@Body() dto: CreateRequestDto, @CurrentUser() user: AuthUser) {
    return this.requestsService.create(user.id, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HOD)
  @ApiOperation({ summary: 'get all requests' })
  findAll(
    @Query() { page, pageSize }: PaginationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.requestsService.findAll(
      page,
      pageSize,
      user.role,
      user.departmentId,
    );
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'get requests by user' })
  findMyRequests(@CurrentUser() user: AuthUser) {
    return this.requestsService.findMyRequests(user.id);
  }

  @Get('department')
  @ApiOperation({ summary: 'get requests by department' })
  @Roles(Role.HOD, Role.ADMIN)
  findDepartmentRequests(@CurrentUser() user: AuthUser) {
    return this.requestsService.findDepartmentRequests(
      user.departmentId,
      user.role,
    );
  }

  @Patch(':id/status')
  @Roles(Role.HOD, Role.ADMIN)
  @ApiOperation({ summary: 'approve or reject a request' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.requestsService.updateStatus(
      id,
      dto,
      user.id,
      user.role,
      user.departmentId,
    );
  }
}
