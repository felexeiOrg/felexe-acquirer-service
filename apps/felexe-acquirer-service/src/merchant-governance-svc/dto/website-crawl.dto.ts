import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class WebsiteCrawlDto {
  @IsNotEmpty({ message: 'websiteUrl should not be empty' })
  @Transform(({ obj, value }) => String(value ?? obj.url ?? '').trim())
  @IsUrl(
    { require_protocol: true },
    { message: 'websiteUrl must be a valid URL with protocol' },
  )
  websiteUrl: string;
}
