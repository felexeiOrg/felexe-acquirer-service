export enum MerchantInviteListStatus {
  INVITED = 'invited',
  COMPLETED = 'completed',
}

export const VIDEO_KYC_COMPLETED_STATUS = 'completed';

const VIDEO_KYC_DONE_STATUSES = new Set([
  'confirmed',
  'completed',
  'verified',
]);

export function isPersonVideoKycComplete(person: {
  video_kyc_url?: string | null;
  video_kyc_status?: string | null;
  is_vkyc_verified?: boolean;
}): boolean {
  if (person.is_vkyc_verified === true) {
    return true;
  }

  const status = String(person.video_kyc_status ?? '').toLowerCase();
  return VIDEO_KYC_DONE_STATUSES.has(status);
}
