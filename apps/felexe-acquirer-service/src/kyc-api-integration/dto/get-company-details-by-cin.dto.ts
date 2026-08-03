import { IsNotEmpty, IsString } from 'class-validator';

/** Frontend only sends company_id (CIN). Vendor payload is built in KYC microservice. */
export class GetCompanyDetailsByCINnoDto {
  @IsString()
  @IsNotEmpty()
  company_id: string;
}
