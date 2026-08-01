import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'mobile must be exactly 10 digits' })
  mobile: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
