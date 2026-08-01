import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  last_name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'mobile must be exactly 10 digits' })
  mobile: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsUrl({ require_protocol: true })
  business_website?: string;

  @IsOptional()
  @IsString()
  company_type?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message:
      'password must contain uppercase, lowercase, digit and special character',
  })
  password?: string;

  @IsOptional()
  @IsString()
  custom_role?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissions?: string[];
}
