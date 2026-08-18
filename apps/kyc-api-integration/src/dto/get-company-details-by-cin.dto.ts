import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  CIN_REGEX,
  VALIDATION_MESSAGES,
} from '../common/validation/validation-patterns.constants';

export class GetCompanyDetailsByCINnoDto {
  @IsString()
  @IsNotEmpty({ message: 'company_id should not be empty' })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @Matches(CIN_REGEX, { message: VALIDATION_MESSAGES.companyId })
  company_id: string;
}
