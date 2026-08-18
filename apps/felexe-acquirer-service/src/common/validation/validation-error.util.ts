import { ValidationError } from 'class-validator';

export type FieldValidationError = {
  field: string;
  message: string;
};

export function formatValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): FieldValidationError[] {
  const result: FieldValidationError[] = [];

  for (const error of errors) {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        result.push({ field, message });
      }
    }

    if (error.children?.length) {
      result.push(...formatValidationErrors(error.children, field));
    }
  }

  return result;
}

export function fieldFromValidationMessage(message: string): string {
  const trimmed = message.trim();
  const nestedMatch = trimmed.match(/^([A-Za-z0-9_.[\]-]+)\s+/);
  if (nestedMatch) {
    return nestedMatch[1];
  }

  const firstToken = trimmed.split(/\s+/)[0] ?? 'unknown';
  return firstToken.replace(/\.$/, '');
}

export function formatValidationMessages(
  messages: string[],
): FieldValidationError[] {
  return messages.map((message) => ({
    field: fieldFromValidationMessage(message),
    message,
  }));
}

export const VALIDATION_FAILED_MESSAGE = 'Validation failed';

export type ValidationErrorResponse = {
  statusCode: number;
  message: string;
  error: string;
  errors: FieldValidationError[];
};

export function buildValidationErrorResponse(
  errors: FieldValidationError[],
): ValidationErrorResponse {
  return {
    statusCode: 400,
    message: VALIDATION_FAILED_MESSAGE,
    error: 'Bad Request',
    errors,
  };
}
