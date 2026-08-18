import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';
import { buildValidationErrorResponse } from '../validation/validation-error.util';

function createUuidPipe(field: string): ParseUUIDPipe {
  return new ParseUUIDPipe({
    version: '4',
    exceptionFactory: () =>
      new BadRequestException(
        buildValidationErrorResponse([
          { field, message: `${field} must be a valid UUID` },
        ]),
      ),
  });
}

export const ClientIdPipe = createUuidPipe('clientId');
export const ResourceIdPipe = createUuidPipe('id');
