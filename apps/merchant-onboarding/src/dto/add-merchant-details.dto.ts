import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import {
  GSTIN_REGEX,
  VALIDATION_MESSAGES,
} from '../common/validation/validation-patterns.constants';

/**
 * Bootstrap merchant profile:
 * verifyGST → getCINnoByCompanyName → getCompanyDetailsByCINno
 */
export class AddMerchantDetailsDto {
  @IsString()
  @IsNotEmpty({ message: 'gstNumber should not be empty' })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @Matches(GSTIN_REGEX, { message: VALIDATION_MESSAGES.gstNumber })
  gstNumber: string;

  @IsOptional()
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'mobile must be exactly 10 digits' })
  mobile?: string;
}
