import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  GSTIN_REGEX,
  VALIDATION_MESSAGES,
} from '../../common/validation/validation-patterns.constants';

/** Frontend only sends gstNumber. Vendor payload is built in KYC microservice. */
export class VerifyGSTDto {
  @IsString()
  @IsNotEmpty({ message: 'gstNumber should not be empty' })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @Matches(GSTIN_REGEX, { message: VALIDATION_MESSAGES.gstNumber })
  gstNumber: string;
}
