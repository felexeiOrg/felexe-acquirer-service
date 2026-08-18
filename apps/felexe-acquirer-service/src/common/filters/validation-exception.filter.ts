import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  buildValidationErrorResponse,
  FieldValidationError,
  formatValidationMessages,
  VALIDATION_FAILED_MESSAGE,
  ValidationErrorResponse,
} from '../validation/validation-error.util';
import { inferFieldFromMessage } from '../validation/field-error.util';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (status === 400) {
      response
        .status(status)
        .json(normalizeValidationResponse(exceptionResponse, status));
      return;
    }

    response.status(status).json(
      typeof exceptionResponse === 'string'
        ? { statusCode: status, message: exceptionResponse }
        : exceptionResponse,
    );
  }
}

function normalizeValidationResponse(
  exceptionResponse: string | object,
  status: number,
): ValidationErrorResponse | Record<string, unknown> {
  if (typeof exceptionResponse === 'string') {
    return buildValidationErrorResponse([
      { field: inferFieldFromMessage(exceptionResponse), message: exceptionResponse },
    ]);
  }

  const body = exceptionResponse as Record<string, unknown>;

  if (Array.isArray(body.errors) && body.errors.length) {
    return {
      statusCode: Number(body.statusCode ?? status),
      message: String(body.message ?? VALIDATION_FAILED_MESSAGE),
      error: String(body.error ?? 'Bad Request'),
      errors: body.errors as FieldValidationError[],
    };
  }

  if (Array.isArray(body.message)) {
    return buildValidationErrorResponse(
      formatValidationMessages(body.message.map(String)),
    );
  }

  if (typeof body.message === 'string') {
    return buildValidationErrorResponse([
      { field: inferFieldFromMessage(body.message), message: body.message },
    ]);
  }

  return {
    statusCode: Number(body.statusCode ?? status),
    message: VALIDATION_FAILED_MESSAGE,
    error: String(body.error ?? 'Bad Request'),
    errors: [
      {
        field: inferFieldFromMessage(VALIDATION_FAILED_MESSAGE),
        message: VALIDATION_FAILED_MESSAGE,
      },
    ],
  };
}

export { normalizeValidationResponse };
