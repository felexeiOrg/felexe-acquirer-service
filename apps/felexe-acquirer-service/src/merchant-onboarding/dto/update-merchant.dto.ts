import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  CIN_REGEX,
  DIN_REGEX,
  GSTIN_REGEX,
  PAN_REGEX,
  VALIDATION_MESSAGES,
} from '../../common/validation/validation-patterns.constants';

export class UpdatePersonDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @Matches(PAN_REGEX, { message: VALIDATION_MESSAGES.pan })
  pan?: string | null;

  @IsOptional()
  @IsString()
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @Transform(({ value }) => String(value ?? '').trim())
  @Matches(DIN_REGEX, { message: VALIDATION_MESSAGES.din })
  din?: string | null;

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

/** Partial update — only provided fields are persisted. */
export class UpdateMerchantDto {
  @IsOptional()
  @IsString()
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @Matches(GSTIN_REGEX, { message: VALIDATION_MESSAGES.gstin })
  gstin?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @Matches(CIN_REGEX, { message: VALIDATION_MESSAGES.cin })
  cin?: string | null;

  @IsOptional()
  @IsString()
  legalName?: string | null;

  @IsOptional()
  @IsString()
  tradeName?: string | null;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  verificationStatus?: string;

  @IsOptional()
  @IsObject()
  merchantProfile?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  rawGstResponse?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  rawCinLookupResponse?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  rawCompanyResponse?: Record<string, unknown> | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePersonDto)
  directors?: UpdatePersonDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePersonDto)
  authorizedSignatories?: UpdatePersonDto[];
}
