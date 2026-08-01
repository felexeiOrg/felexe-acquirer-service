import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { OtpPurpose } from '../enums/otp-purpose.enum';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'mobile must be exactly 10 digits' })
  mobile: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'otp must be exactly 6 digits' })
  otp: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
