import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  DIN_REGEX,
  VALIDATION_MESSAGES,
} from '../../common/validation/validation-patterns.constants';

/** Frontend only sends din_number. Vendor payload is built in KYC microservice. */
export class DinValidationDto {
  @IsString()
  @IsNotEmpty({ message: 'din_number should not be empty' })
  @Transform(({ value }) => String(value ?? '').trim())
  @Matches(DIN_REGEX, { message: VALIDATION_MESSAGES.dinNumber })
  din_number: string;
}
