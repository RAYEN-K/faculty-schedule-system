import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  eventDate: string;

  @IsNotEmpty()
  @IsString()
  departmentId: string;
}
