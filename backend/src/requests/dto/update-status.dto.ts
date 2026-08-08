import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
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
}
