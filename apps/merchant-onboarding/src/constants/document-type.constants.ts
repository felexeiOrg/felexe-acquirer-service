export const MERCHANT_DOCUMENT_TYPES = [
  'GST',
  'PAN',
  'CIN',
  'MOA',
  'AOA',
  'CANCEL_CHEQUE',
] as const;

export type MerchantDocumentType = (typeof MERCHANT_DOCUMENT_TYPES)[number];

export const MERCHANT_DOCUMENT_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

export const MAX_DOCUMENT_SIZE_BYTES = 2 * 1024 * 1024;
