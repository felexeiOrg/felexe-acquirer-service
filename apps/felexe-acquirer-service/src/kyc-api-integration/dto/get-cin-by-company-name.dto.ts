import { IsNotEmpty, IsString } from 'class-validator';

/** Frontend only sends company_name. Vendor payload is built in KYC microservice. */
export class GetCINnoByCompanyNameDto {
  @IsString()
  @IsNotEmpty()
  company_name: string;
}
