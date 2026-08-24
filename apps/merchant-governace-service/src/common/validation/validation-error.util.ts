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
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

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

export const VALIDATION_FAILED_MESSAGE = 'Validation failed';

export function buildValidationErrorResponse(errors: FieldValidationError[]) {
  return {
    statusCode: 400,
    message: VALIDATION_FAILED_MESSAGE,
    error: 'Bad Request',
    errors,
  };
}
