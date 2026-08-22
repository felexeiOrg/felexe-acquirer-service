import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePersonDto {
  @IsOptional()
  @IsString()
  din?: string | null;

  @IsOptional()
  @IsString()
  pan?: string | null;

  @IsOptional()
  @IsString()
  firstName?: string | null;

  @IsOptional()
  @IsString()
  middleName?: string | null;

  @IsOptional()
  @IsString()
  lastName?: string | null;

  @IsOptional()
  @IsString()
  fullName?: string | null;

  @IsOptional()
  @IsString()
  dateOfAppointment?: string | null;

  @IsOptional()
  @IsBoolean()
  disqualified?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsString()
  videoKycUrl?: string | null;

  @IsOptional()
  @IsString()
  videoKycStatus?: string | null;

  @IsOptional()
  @IsBoolean()
  isVkycVerified?: boolean;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  din?: string | null;

  @IsOptional()
  @IsString()
  pan?: string | null;

  @IsOptional()
  @IsString()
  firstName?: string | null;

  @IsOptional()
  @IsString()
  middleName?: string | null;

  @IsOptional()
  @IsString()
  lastName?: string | null;

  @IsOptional()
  @IsString()
  fullName?: string | null;

  @IsOptional()
  @IsString()
  dateOfAppointment?: string | null;

  @IsOptional()
  @IsBoolean()
  disqualified?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsString()
  videoKycUrl?: string | null;

  @IsOptional()
  @IsString()
  videoKycStatus?: string | null;

  @IsOptional()
  @IsBoolean()
  isVkycVerified?: boolean;

  @IsOptional()
  @IsString()
  status?: string;
}
