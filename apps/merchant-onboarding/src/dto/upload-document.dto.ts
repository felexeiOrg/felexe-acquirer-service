import { IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { MERCHANT_DOCUMENT_TYPES } from '../constants/document-type.constants';

export class SaveMerchantDocumentDto {
  @IsUUID('4', { message: 'clientId must be a valid UUID' })
  clientId: string;

  @IsString()
  @IsIn(MERCHANT_DOCUMENT_TYPES, {
    message: `documentType must be one of: ${MERCHANT_DOCUMENT_TYPES.join(', ')}`,
  })
  documentType: string;

  @IsString()
  @IsNotEmpty({ message: 'fileUrl should not be empty' })
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;
}

export class ClientIdOnlyPayloadDto {
  @IsUUID('4', { message: 'clientId must be a valid UUID' })
  clientId: string;
}
