import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ClientIdPipe } from '../common/pipes/uuid-param.pipe';
import { buildValidationErrorResponse } from '../common/validation/validation-error.util';
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from './constants/document-type.constants';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { LocalFileStorageService } from './local-file-storage.service';
import { MerchantOnboardingService } from './merchant-onboarding.service';

type UploadedFilePayload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Controller('merchant-onboarding/:clientId/documents')
export class DocumentsController {
  constructor(
    private readonly merchantOnboardingService: MerchantOnboardingService,
    private readonly localFileStorageService: LocalFileStorageService,
  ) {}

  @Get()
  listDocuments(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.listMerchantDocuments(clientId);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES },
    }),
  )
  async uploadDocument(
    @Param('clientId', ClientIdPipe) clientId: string,
    @UploadedFile() file: UploadedFilePayload | undefined,
    @Body() body: UploadDocumentDto,
  ) {
    this.assertValidFile(file);

    try {
      const { fileUrl, storedFileName } =
        await this.localFileStorageService.saveMerchantDocument({
          clientId,
          documentType: body.documentType,
          originalName: file.originalname,
          buffer: file.buffer,
        });

      return await this.merchantOnboardingService.uploadMerchantDocument({
        clientId,
        documentType: body.documentType,
        fileUrl,
        fileName: storedFileName,
        mimeType: file.mimetype,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Document upload failed',
      );
    }
  }

  private assertValidFile(
    file: UploadedFilePayload | undefined,
  ): asserts file is UploadedFilePayload {
    if (!file) {
      throw new BadRequestException(
        buildValidationErrorResponse([
          { field: 'file', message: 'file is required' },
        ]),
      );
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new BadRequestException(
        buildValidationErrorResponse([
          {
            field: 'file',
            message: 'file size must not exceed 2MB',
          },
        ]),
      );
    }

    const mime = file.mimetype?.toLowerCase() ?? '';
    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(mime as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number])) {
      throw new BadRequestException(
        buildValidationErrorResponse([
          {
            field: 'file',
            message: 'file must be PDF, JPEG, JPG, or PNG',
          },
        ]),
      );
    }

    const lowerName = file.originalname.toLowerCase();
    const hasAllowedExtension = ALLOWED_DOCUMENT_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext),
    );
    if (!hasAllowedExtension) {
      throw new BadRequestException(
        buildValidationErrorResponse([
          {
            field: 'file',
            message: 'file extension must be .pdf, .jpeg, .jpg, or .png',
          },
        ]),
      );
    }
  }
}
