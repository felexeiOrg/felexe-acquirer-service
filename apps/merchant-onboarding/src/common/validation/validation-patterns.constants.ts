/** Indian GSTIN — 15 chars: 2 digit state + PAN + entity + Z + checksum */
export const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const BANK_ACCOUNT_REGEX = /^[0-9]{9,18}$/;

export const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const AADHAAR_REGEX = /^\d{12}$/;

export const DIN_REGEX = /^\d{8}$/;

export const CIN_REGEX =
  /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

export const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;

export const VALIDATION_MESSAGES = {
  gstNumber: 'gstNumber must be a valid 15-character GSTIN',
  gstin: 'gstin must be a valid 15-character GSTIN',
  pan: 'pan must be a valid PAN format (e.g. ABCDE1234F)',
  ifsc: 'ifsc must be a valid 11-character IFSC code',
  ifscCode: 'ifscCode must be a valid 11-character IFSC code',
  accNumber: 'acc_number must be 9 to 18 digits',
  accountNumber: 'accountNumber must be 9 to 18 digits',
  mobile: 'mobile must be a valid 10-digit Indian mobile number',
  aadhaar: 'aadhaar must be exactly 12 digits',
  din: 'din must be exactly 8 digits',
  dinNumber: 'din_number must be exactly 8 digits',
  cin: 'cin must be a valid CIN format',
  companyId: 'company_id must be a valid CIN format',
  udyam: 'udyam_number must be a valid UDYAM registration number',
};
