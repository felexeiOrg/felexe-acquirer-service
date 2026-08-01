import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'mobile must be exactly 10 digits' })
  mobile: string;

  @IsString()
  @IsNotEmpty()
  verification_token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message:
      'password must contain uppercase, lowercase, digit and special character',
  })
  new_password: string;
}
