import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  BANK_ACCOUNT_REGEX,
  IFSC_REGEX,
  VALIDATION_MESSAGES,
} from '../common/validation/validation-patterns.constants';

/** Frontend only sends acc_number + ifsc_number. Vendor payload is built here. */
export class VerifyBankAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'acc_number should not be empty' })
  @Transform(({ value }) => String(value ?? '').trim())
  @Matches(BANK_ACCOUNT_REGEX, { message: VALIDATION_MESSAGES.accNumber })
  acc_number: string;

  @IsString()
  @IsNotEmpty({ message: 'ifsc_number should not be empty' })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @Matches(IFSC_REGEX, { message: VALIDATION_MESSAGES.ifsc })
  ifsc_number: string;
}
