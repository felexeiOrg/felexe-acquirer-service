import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import {
  BANK_ACCOUNT_REGEX,
  IFSC_REGEX,
  VALIDATION_MESSAGES,
} from '../common/validation/validation-patterns.constants';

export class CreateBankDetailDto {
  @IsString()
  @IsNotEmpty({ message: 'accountNumber should not be empty' })
  @Transform(({ value }) => String(value ?? '').trim())
  @Matches(BANK_ACCOUNT_REGEX, { message: VALIDATION_MESSAGES.accountNumber })
  accountNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'ifscCode should not be empty' })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @Matches(IFSC_REGEX, { message: VALIDATION_MESSAGES.ifscCode })
  ifscCode: string;

  @IsOptional()
  @IsString()
  bankName?: string | null;

  @IsOptional()
  @IsString()
  branchName?: string | null;

  @IsOptional()
  @IsString()
  accountHolderName?: string | null;

  @IsOptional()
  @IsString()
  accountType?: string | null;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsString()
  verificationStatus?: string;

  @IsOptional()
  @IsObject()
  rawVerificationResponse?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateBankDetailDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === undefined || value === null ? value : String(value).trim(),
  )
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @Matches(BANK_ACCOUNT_REGEX, { message: VALIDATION_MESSAGES.accountNumber })
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === undefined || value === null
      ? value
      : String(value).trim().toUpperCase(),
  )
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @Matches(IFSC_REGEX, { message: VALIDATION_MESSAGES.ifscCode })
  ifscCode?: string;

  @IsOptional()
  @IsString()
  bankName?: string | null;

  @IsOptional()
  @IsString()
  branchName?: string | null;

  @IsOptional()
  @IsString()
  accountHolderName?: string | null;

  @IsOptional()
  @IsString()
  accountType?: string | null;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsString()
  verificationStatus?: string;

  @IsOptional()
  @IsObject()
  rawVerificationResponse?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  status?: string;
}
