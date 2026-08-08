import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  endTime!: string;
}
