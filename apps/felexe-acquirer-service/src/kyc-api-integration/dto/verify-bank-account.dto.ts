import { IsNotEmpty, IsString } from 'class-validator';

/** Frontend only sends acc_number + ifsc_number. Vendor payload is built in KYC microservice. */
export class VerifyBankAccountDto {
  @IsString()
  @IsNotEmpty()
  acc_number: string;

  @IsString()
  @IsNotEmpty()
  ifsc_number: string;
}
