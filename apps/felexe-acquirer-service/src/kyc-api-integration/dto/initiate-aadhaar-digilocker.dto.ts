import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class InitiateAadhaarDigilockerDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{12}$/, { message: 'aadhaar must be exactly 12 digits' })
  aadhaar: string;
}
