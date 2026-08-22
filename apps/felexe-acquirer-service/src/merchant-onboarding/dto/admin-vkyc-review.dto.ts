import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminVkycReviewDto {
  @IsOptional()
  @IsIn(['VKYC', 'VERIFICATION'], {
    message: 'type must be VKYC or VERIFICATION',
  })
  type?: 'VKYC' | 'VERIFICATION';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) =>
    value === undefined || value === null ? value : String(value).trim(),
  )
  reason?: string | null;
}
