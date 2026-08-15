import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class SendScheduleReminderDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  facultyIds: string[];

  @IsOptional()
  @IsString()
  message?: string;
}
