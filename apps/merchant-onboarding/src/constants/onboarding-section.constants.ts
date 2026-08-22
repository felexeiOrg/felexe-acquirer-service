export enum OnboardingType {
  WITH_GST = 'with_gst',
  WITHOUT_GST = 'without_gst',
}

export enum OnboardingSectionKey {
  MERCHANT_DETAILS = 'merchant_details',
  DIRECTORS = 'directors',
  AUTHORIZERS = 'authorizers',
  BANK_DETAILS = 'bank_details',
  VIDEO_KYC = 'video_kyc',
  DOCUMENTS = 'documents',
}

export enum OnboardingSectionStatus {
  NOT_STARTED = 'not_started',
  DRAFT = 'draft',
  VERIFICATION_PENDING = 'verification_pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum OverallOnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  MAKER_SUBMITTED = 'maker_submitted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum VerificationDecision {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum VerificationTargetType {
  SECTION = 'section',
  DOCUMENT = 'document',
  OVERALL = 'overall',
}

export const ONBOARDING_SECTIONS = [
  OnboardingSectionKey.MERCHANT_DETAILS,
  OnboardingSectionKey.DIRECTORS,
  OnboardingSectionKey.AUTHORIZERS,
  OnboardingSectionKey.BANK_DETAILS,
  OnboardingSectionKey.VIDEO_KYC,
  OnboardingSectionKey.DOCUMENTS,
] as const;

export const REQUIRED_DOCUMENT_TYPES = [
  'GST',
  'PAN',
  'CIN',
  'MOA',
  'AOA',
  'CANCEL_CHEQUE',
] as const;

export type SectionStatusMap = Record<
  OnboardingSectionKey,
  OnboardingSectionStatus
>;

export const DEFAULT_SECTION_STATUS_MAP = (): SectionStatusMap => ({
  [OnboardingSectionKey.MERCHANT_DETAILS]:
    OnboardingSectionStatus.NOT_STARTED,
  [OnboardingSectionKey.DIRECTORS]: OnboardingSectionStatus.NOT_STARTED,
  [OnboardingSectionKey.AUTHORIZERS]: OnboardingSectionStatus.NOT_STARTED,
  [OnboardingSectionKey.BANK_DETAILS]: OnboardingSectionStatus.NOT_STARTED,
  [OnboardingSectionKey.VIDEO_KYC]: OnboardingSectionStatus.NOT_STARTED,
  [OnboardingSectionKey.DOCUMENTS]: OnboardingSectionStatus.NOT_STARTED,
});
