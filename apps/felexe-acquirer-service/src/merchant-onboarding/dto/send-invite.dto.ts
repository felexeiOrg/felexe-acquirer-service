import {
  Allow,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/** Creates merchant login credentials via auth/register (system-generated password). */
export class SendInviteDto {
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  last_name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'mobile must be exactly 10 digits' })
  mobile: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsUrl({ require_protocol: true })
  business_website?: string;

  @IsOptional()
  @IsString()
  company_type?: string;

  /** UI may send GST here; it is ignored. GST is bound later in addMerchantDetails. */
  @IsOptional()
  @Allow()
  gstNumber?: string;

  @IsOptional()
  @Allow()
  gst_number?: string;

  @IsOptional()
  @Allow()
  gst?: string;
}
