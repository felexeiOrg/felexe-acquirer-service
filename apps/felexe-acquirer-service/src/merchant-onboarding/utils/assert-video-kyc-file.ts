import { BadRequestException } from '@nestjs/common';
import { buildValidationErrorResponse } from '../../common/validation/validation-error.util';
import {
  ALLOWED_VIDEO_KYC_EXTENSIONS,
  ALLOWED_VIDEO_KYC_MIME_TYPES,
  MAX_VIDEO_KYC_SIZE_BYTES,
} from '../constants/video-kyc.constants';

export type UploadedVideoPayload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

const MIME_TO_EXTENSION: Record<string, string> = {
  'video/webm': '.webm',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/ogg': '.ogg',
};

export function normalizeVideoKycFileName(
  originalName: string | undefined,
  mimeType: string,
): string {
  const name = (originalName ?? '').trim();
  const hasExtension = ALLOWED_VIDEO_KYC_EXTENSIONS.some((ext) =>
    name.toLowerCase().endsWith(ext),
  );
  if (name && name.toLowerCase() !== 'blob' && hasExtension) {
    return name;
  }

  const mime = mimeType.split(';')[0].trim().toLowerCase();
  return `video-kyc${MIME_TO_EXTENSION[mime] ?? '.webm'}`;
}

export function assertValidVideoKycFile(
  file: UploadedVideoPayload | undefined,
): asserts file is UploadedVideoPayload {
  if (!file) {
    throw new BadRequestException(
      buildValidationErrorResponse([
        { field: 'file', message: 'file is required' },
      ]),
    );
  }

  if (file.size > MAX_VIDEO_KYC_SIZE_BYTES) {
    throw new BadRequestException(
      buildValidationErrorResponse([
        {
          field: 'file',
          message: 'file size must not exceed 50MB',
        },
      ]),
    );
  }

  const mime = (file.mimetype?.toLowerCase() ?? '').split(';')[0].trim();
  if (
    !ALLOWED_VIDEO_KYC_MIME_TYPES.includes(
      mime as (typeof ALLOWED_VIDEO_KYC_MIME_TYPES)[number],
    )
  ) {
    throw new BadRequestException(
      buildValidationErrorResponse([
        {
          field: 'file',
          message: 'file must be WEBM, MP4, MOV, or OGG',
        },
      ]),
    );
  }

  file.originalname = normalizeVideoKycFileName(file.originalname, mime);
}
