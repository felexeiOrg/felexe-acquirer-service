import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { MERCHANT_DOCUMENT_TYPES } from '../constants/document-type.constants';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'documentType should not be empty' })
  @IsIn(MERCHANT_DOCUMENT_TYPES, {
    message: `documentType must be one of: ${MERCHANT_DOCUMENT_TYPES.join(', ')}`,
  })
  documentType: string;
}
