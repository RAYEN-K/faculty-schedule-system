import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignDepartmentDto {
  @ApiProperty({ example: 'user-uuid-here', description: 'معرف الأستاذ' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'department-uuid-here', description: 'معرف القسم' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;
}
