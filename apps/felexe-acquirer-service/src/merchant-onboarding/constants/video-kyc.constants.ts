export const VIDEO_KYC_UPLOAD_FOLDER = 'VIDEO_KYC';

export const ALLOWED_VIDEO_KYC_MIME_TYPES = [
  'video/webm',
  'video/mp4',
  'video/quicktime',
  'video/ogg',
] as const;

export const ALLOWED_VIDEO_KYC_EXTENSIONS = ['.webm', '.mp4', '.mov', '.ogg'];

export const MAX_VIDEO_KYC_SIZE_BYTES = 50 * 1024 * 1024;
