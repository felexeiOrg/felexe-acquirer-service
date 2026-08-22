import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  OnboardingSectionKey,
  VerificationDecision,
} from '../constants/onboarding-section.constants';

function normalizeDecision(value: unknown): unknown {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'approve') {
    return VerificationDecision.APPROVED;
  }
  if (raw === 'reject') {
    return VerificationDecision.REJECTED;
  }
  return raw || value;
}

export class AdminReviewDecisionDto {
  @Transform(({ value }) => normalizeDecision(value))
  @IsEnum(VerificationDecision, {
    message: 'decision must be approved or rejected',
  })
  decision: VerificationDecision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) =>
    value === undefined || value === null ? value : String(value).trim(),
  )
  remarks?: string | null;
}

export class AdminSectionReviewPayloadDto extends AdminReviewDecisionDto {
  @IsUUID('4')
  clientId: string;

  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .replace(/-/g, '_'),
  )
  @IsEnum(OnboardingSectionKey, {
    message: 'section must be a valid onboarding section',
  })
  section: OnboardingSectionKey;

  @IsUUID('4')
  @IsNotEmpty()
  reviewerUserId: string;
}

export class AdminDocumentReviewPayloadDto extends AdminReviewDecisionDto {
  @IsUUID('4')
  clientId: string;

  @IsUUID('4')
  documentId: string;

  @IsUUID('4')
  reviewerUserId: string;
}

export class AdminOverallApprovalPayloadDto extends AdminReviewDecisionDto {
  @IsUUID('4')
  clientId: string;

  @IsUUID('4')
  reviewerUserId: string;
}

export class AdminClientReviewerPayloadDto {
  @IsUUID('4')
  clientId: string;

  @IsUUID('4')
  reviewerUserId: string;
}
