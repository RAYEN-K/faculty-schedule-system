import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { RequestType } from '@prisma/client';

export class CreateRequestDto {
  @IsEnum(RequestType, {
    message: 'Type is required and must be a valid RequestType',
  })
  type: RequestType;

  @IsOptional()
  scheduleId?: string;

  // proposedDate is required for ADDITIONAL and COMPENSATION, but optional for MODIFICATION
  @ValidateIf((o: CreateRequestDto) => o.type === RequestType.COMPENSATION)
  @IsNotEmpty({ message: 'proposedDate is required for this request type' })
  @IsDateString()
  proposedDate?: string;

  @IsNotEmpty({ message: 'Reason is required' })
  reason: string;
}
