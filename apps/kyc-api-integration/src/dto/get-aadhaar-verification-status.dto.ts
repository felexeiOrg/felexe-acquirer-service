import { IsNotEmpty, IsString } from 'class-validator';

export class GetAadhaarVerificationStatusDto {
  @IsString()
  @IsNotEmpty()
  request_id: string;

  @IsString()
  @IsNotEmpty()
  verification_id: string;
}
