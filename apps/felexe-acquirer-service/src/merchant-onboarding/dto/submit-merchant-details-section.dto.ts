import { IsObject, IsOptional } from 'class-validator';

export class SubmitMerchantDetailsSectionDto {
  @IsOptional()
  @IsObject()
  selections?: Record<string, unknown>;
}
