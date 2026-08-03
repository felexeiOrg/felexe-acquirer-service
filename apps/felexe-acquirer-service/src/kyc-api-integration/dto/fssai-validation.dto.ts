import { IsNotEmpty, IsString } from 'class-validator';

/** Frontend only sends flrs_license_no. Vendor payload is built in KYC microservice. */
export class FssaiValidationDto {
  @IsString()
  @IsNotEmpty()
  flrs_license_no: string;
}
