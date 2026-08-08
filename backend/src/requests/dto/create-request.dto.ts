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

  @ValidateIf((o: CreateRequestDto) => o.type === RequestType.MODIFICATION)
  @IsNotEmpty({ message: 'scheduleId is required for MODIFICATION requests' })
  scheduleId?: string;

  @ValidateIf((o: CreateRequestDto) => o.type === RequestType.MODIFICATION)
  @IsOptional()
  @IsDateString()
  originalDate?: string;

  @ValidateIf(
    (o: CreateRequestDto) =>
      o.type === RequestType.MODIFICATION ||
      o.type === RequestType.ADDITIONAL ||
      o.type === RequestType.COMPENSATION,
  )
  @IsNotEmpty({ message: 'proposedDate is required for this request type' })
  @IsDateString()
  proposedDate?: string;

  @IsNotEmpty({ message: 'Reason is required' })
  reason: string;
}
