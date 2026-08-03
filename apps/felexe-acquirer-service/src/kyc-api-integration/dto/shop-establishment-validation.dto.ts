import { IsNotEmpty, IsString } from 'class-validator';

/** Frontend sends registration_number + state. Vendor payload is built in KYC microservice. */
export class ShopEstablishmentValidationDto {
  @IsString()
  @IsNotEmpty()
  registration_number: string;

  @IsString()
  @IsNotEmpty()
  state: string;
}
