export enum VkycPersonType {
  DIRECTOR = 'Director',
  AUTHORIZER = 'Authorizer',
}

export enum VkycReviewType {
  VKYC = 'VKYC',
  VERIFICATION = 'VERIFICATION',
}

export enum VkycAdminDecision {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export const VKYC_PROVIDER_PENDING_STATUS = 'Pending';
export const VKYC_ADMIN_VERIFIED_STATUS = 'Verified';
export const VKYC_ADMIN_REJECTED_STATUS = 'Rejected';

export const VKYC_PROVIDER_COMPLETED_STATUSES = [
  'confirmed',
  'completed',
  'verified',
];

export function toUiVideoKycStatus(status: string | null | undefined): string {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (normalized === 'confirmed' || normalized === 'completed') {
    return 'Completed';
  }
  if (normalized === 'verified') {
    return 'Verified';
  }
  if (normalized === 'rejected') {
    return 'Rejected';
  }
  if (!normalized || normalized === 'pending' || normalized === 'initiated') {
    return 'Pending';
  }
  return status as string;
}

export function toVkycAdminStatus(person: {
  vkyc_rejection_reason?: string | null;
  is_vkyc_verified?: boolean;
}): 'Rejected' | 'Verified' | 'Pending' {
  if (person.vkyc_rejection_reason) {
    return 'Rejected';
  }
  if (person.is_vkyc_verified) {
    return 'Verified';
  }
  return 'Pending';
}
