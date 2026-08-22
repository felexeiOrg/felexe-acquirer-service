import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  VkycAdminDecision,
  VkycPersonType,
  VkycReviewType,
} from '../constants/vkyc.constants';

export class VkycPersonPayloadDto {
  @IsUUID('4')
  personId: string;

  @IsEnum(VkycPersonType, {
    message: 'type must be Director or Authorizer',
  })
  type: VkycPersonType;

  @IsOptional()
  @IsUUID('4')
  userId?: string;
}

export class VkycUpdateSessionPayloadDto extends VkycPersonPayloadDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class VkycWebhookPayloadDto {
  @IsOptional()
  @IsString()
  session_id?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  video_url?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  face_video_url?: string;

  @IsOptional()
  @IsString()
  faceVideoUrl?: string;

  @IsOptional()
  @IsObject()
  ocr_data?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class VkycUserPayloadDto {
  @IsUUID('4')
  userId: string;
}

export class VkycAdminListPayloadDto {
  @IsUUID('4')
  clientId: string;
}

export class VkycAdminReviewPayloadDto {
  @IsUUID('4')
  personId: string;

  @IsEnum(VkycPersonType, {
    message: 'personType must be Director or Authorizer',
  })
  personType: VkycPersonType;

  @IsEnum(VkycReviewType, {
    message: 'type must be VKYC or VERIFICATION',
  })
  type: VkycReviewType;

  @IsEnum(VkycAdminDecision, {
    message: 'decision must be approve or reject',
  })
  decision: VkycAdminDecision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) =>
    value === undefined || value === null ? value : String(value).trim(),
  )
  reason?: string | null;

  @IsUUID('4')
  reviewerUserId: string;
}
