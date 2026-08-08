import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(RequestStatus)
  @IsNotEmpty()
  status: RequestStatus;

  @ValidateIf((o: UpdateStatusDto) => o.status === RequestStatus.APPROVED)
  @IsOptional()
  @IsString()
  compensationScheduleId?: string;

  @ValidateIf((o: UpdateStatusDto) => o.status === RequestStatus.APPROVED)
  @IsOptional()
  @IsString()
  compensationWeekStartDate?: string;
}
