import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsIn([RequestStatus.APPROVED, RequestStatus.REJECTED], {
    message: 'Status must be APPROVED or REJECTED',
  })
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

  @ValidateIf((o: UpdateStatusDto) => o.status === RequestStatus.REJECTED)
  @IsString()
  @MinLength(3, { message: 'Rejection reason must be at least 3 characters' })
  reviewComment?: string;
}
