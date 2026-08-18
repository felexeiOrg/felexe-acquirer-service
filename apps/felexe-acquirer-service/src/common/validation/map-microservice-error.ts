import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  buildValidationErrorResponse,
  FieldValidationError,
  formatValidationMessages,
  VALIDATION_FAILED_MESSAGE,
} from './validation-error.util';
import { inferFieldFromMessage } from './field-error.util';

type ErrorRecord = {
  statusCode?: number | string;
  message?: string | string[];
  error?: string;
  status?: number | string;
  errors?: FieldValidationError[];
};

export function mapMicroserviceError(err: unknown): HttpException {
  let payload = err;
  if (typeof err === 'object' && err !== null) {
    const nested = (err as { error?: unknown }).error;
    if (typeof nested === 'object' && nested !== null) {
      payload = nested;
    }
  }

  if (payload instanceof HttpException) {
    return payload;
  }

  if (typeof payload === 'object' && payload !== null) {
    const record = payload as ErrorRecord;
    const statusCode = Number(record.statusCode ?? record.status);

    if (Number.isFinite(statusCode) && statusCode >= 400) {
      return buildHttpException(record, statusCode);
    }

    if (record.status === 'error' && record.message) {
      const message = String(record.message);
      if (/already exists|already registered/i.test(message)) {
        return new HttpException(
          { statusCode: HttpStatus.CONFLICT, message },
          HttpStatus.CONFLICT,
        );
      }
      if (/not found/i.test(message)) {
        return new HttpException(
          { statusCode: HttpStatus.NOT_FOUND, message },
          HttpStatus.NOT_FOUND,
        );
      }
      if (/required|invalid|validation failed/i.test(message)) {
        return new HttpException(
          buildValidationErrorResponse([
            { field: inferFieldFromMessage(message), message },
          ]),
          HttpStatus.BAD_REQUEST,
        );
      }
      return new InternalServerErrorException(message);
    }
  }

  if (typeof err === 'string') {
    return new InternalServerErrorException(err);
  }

  return new InternalServerErrorException('Request failed');
}

function buildHttpException(record: ErrorRecord, statusCode: number): HttpException {
  if (Array.isArray(record.errors) && record.errors.length) {
    return new HttpException(
      {
        statusCode,
        message: record.message ?? VALIDATION_FAILED_MESSAGE,
        error: typeof record.error === 'string' ? record.error : 'Bad Request',
        errors: record.errors,
      },
      statusCode,
    );
  }

  if (Array.isArray(record.message)) {
    return new HttpException(
      buildValidationErrorResponse(formatValidationMessages(record.message.map(String))),
      statusCode,
    );
  }

  if (typeof record.message === 'string') {
    return new HttpException(
      buildValidationErrorResponse([
        {
          field: inferFieldFromMessage(record.message),
          message: record.message,
        },
      ]),
      statusCode,
    );
  }

  return new HttpException(
    {
      statusCode,
      message: 'Request failed',
      error: typeof record.error === 'string' ? record.error : undefined,
    },
    statusCode,
  );
}
