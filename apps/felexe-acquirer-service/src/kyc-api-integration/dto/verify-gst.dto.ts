import { IsNotEmpty, IsString } from 'class-validator';

/** Frontend only sends gstNumber. Vendor payload is built in KYC microservice. */
export class VerifyGSTDto {
  @IsString()
  @IsNotEmpty()
  gstNumber: string;
}
