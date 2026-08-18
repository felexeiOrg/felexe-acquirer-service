import { BadRequestException } from '@nestjs/common';
import {
  buildValidationErrorResponse,
  FieldValidationError,
} from './validation-error.util';

const FIELD_HINTS: Array<{ pattern: RegExp; field: string }> = [
  { pattern: /\bgst(in|number)?\b/i, field: 'gstNumber' },
  { pattern: /\bacc(ount)?[_ ]?number\b/i, field: 'acc_number' },
  { pattern: /\baccountNumber\b/i, field: 'accountNumber' },
  { pattern: /\bifsc[_ ]?code\b/i, field: 'ifscCode' },
  { pattern: /\bifsc[_ ]?number\b/i, field: 'ifsc_number' },
  { pattern: /\bcompany_id\b/i, field: 'company_id' },
  { pattern: /\bcompany_name\b/i, field: 'company_name' },
  { pattern: /\budyam[_ ]?number\b/i, field: 'udyam_number' },
  { pattern: /\bdin[_ ]?number\b/i, field: 'din_number' },
  { pattern: /\bverification_id\b/i, field: 'verification_id' },
  { pattern: /\brequest_id\b/i, field: 'request_id' },
  { pattern: /\bflrs[_ ]?license\b/i, field: 'flrs_license_no' },
  { pattern: /\bregistration[_ ]?number\b/i, field: 'registration_number' },
  { pattern: /\blegal[_ ]?name\b/i, field: 'legalName' },
  { pattern: /\btrade[_ ]?name\b/i, field: 'tradeName' },
  { pattern: /\bclientId\b/i, field: 'clientId' },
  { pattern: /\bcin\b/i, field: 'cin' },
  { pattern: /\bpan\b/i, field: 'pan' },
  { pattern: /\bdin\b/i, field: 'din' },
  { pattern: /\baadhaar\b/i, field: 'aadhaar' },
  { pattern: /\bmobile\b/i, field: 'mobile' },
  { pattern: /\bemail\b/i, field: 'email' },
  { pattern: /\bstate\b/i, field: 'state' },
];

export function inferFieldFromMessage(message: string): string {
  const trimmed = message.trim();

  for (const hint of FIELD_HINTS) {
    if (hint.pattern.test(trimmed)) {
      return hint.field;
    }
  }

  const explicitField = trimmed.match(/^([A-Za-z0-9_.[\]-]+)\s+(must|should|is|cannot)/);
  if (explicitField) {
    return explicitField[1];
  }

  const firstToken = trimmed.split(/\s+/)[0] ?? 'unknown';
  return firstToken.replace(/\.$/, '');
}

export function fieldError(field: string, message: string): FieldValidationError {
  return { field, message };
}

export function badRequestForField(
  field: string,
  message: string,
): BadRequestException {
  return new BadRequestException(
    buildValidationErrorResponse([fieldError(field, message)]),
  );
}

export function badRequestForMessage(message: string): BadRequestException {
  return badRequestForField(inferFieldFromMessage(message), message);
}

export function badRequestForFields(
  errors: FieldValidationError[],
): BadRequestException {
  return new BadRequestException(buildValidationErrorResponse(errors));
}
