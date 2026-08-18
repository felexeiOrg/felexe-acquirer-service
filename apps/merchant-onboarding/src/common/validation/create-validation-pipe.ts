import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import {
  buildValidationErrorResponse,
  formatValidationErrors,
} from './validation-error.util';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestException(buildValidationErrorResponse(formatValidationErrors(errors))),
  });
}
