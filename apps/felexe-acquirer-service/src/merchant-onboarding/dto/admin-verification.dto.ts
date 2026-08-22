import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum AdminVerificationDecision {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

function normalizeDecision(value: unknown): unknown {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'approve') {
    return AdminVerificationDecision.APPROVED;
  }
  if (raw === 'reject') {
    return AdminVerificationDecision.REJECTED;
  }
  return raw || value;
}

export class AdminReviewDecisionDto {
  @Transform(({ value }) => normalizeDecision(value))
  @IsEnum(AdminVerificationDecision, {
    message: 'decision must be approved or rejected',
  })
  decision: AdminVerificationDecision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) =>
    value === undefined || value === null ? value : String(value).trim(),
  )
  remarks?: string | null;
}
