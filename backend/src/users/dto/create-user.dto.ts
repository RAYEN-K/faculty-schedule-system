import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @IsString()
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom complet est obligatoire' })
  fullName: string;

  @IsEnum(Role, { message: 'Rôle invalide' })
  role: Role;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
