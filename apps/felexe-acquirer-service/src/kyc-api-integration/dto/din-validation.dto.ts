import { IsNotEmpty, IsString } from 'class-validator';

/** Frontend only sends din_number. Vendor payload is built in KYC microservice. */
export class DinValidationDto {
  @IsString()
  @IsNotEmpty()
  din_number: string;
}
