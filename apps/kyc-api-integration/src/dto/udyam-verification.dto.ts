import { IsNotEmpty, IsString } from 'class-validator';

/** Frontend only sends udyam_number. Vendor payload is built here. */
export class UdyamVerificationDto {
  @IsString()
  @IsNotEmpty()
  udyam_number: string;
}
