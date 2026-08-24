import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class WebsiteCrawlPayloadDto {
  @IsUUID('4')
  clientId: string;

  @IsNotEmpty({ message: 'websiteUrl should not be empty' })
  @Transform(({ obj, value }) =>
    String(value ?? obj.url ?? '')
      .trim(),
  )
  @IsUrl({ require_protocol: true }, { message: 'websiteUrl must be a valid URL' })
  websiteUrl: string;
}

export class WebsiteStatusPayloadDto {
  @IsUUID('4')
  clientId: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeHistory?: boolean;
}
