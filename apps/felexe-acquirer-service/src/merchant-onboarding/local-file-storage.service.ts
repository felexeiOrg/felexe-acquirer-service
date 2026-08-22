import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { MERCHANT_DOCUMENT_TYPES } from './constants/document-type.constants';
import { VIDEO_KYC_UPLOAD_FOLDER } from './constants/video-kyc.constants';

@Injectable()
export class LocalFileStorageService implements OnModuleInit {
  private uploadRoot = '';
  private publicBaseUrl = '';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.uploadRoot = this.configService.get<string>(
      'UPLOAD_DIR',
      join(process.cwd(), 'upload'),
    );

    let host = this.configService.get<string>('GATEWAY_HOST', 'localhost');
    if (host === 'GATEWAY_HOST' || !host) {
      host = 'localhost';
    }
    const port = this.configService.get<number>('GATEWAY_PORT', 3000);
    this.publicBaseUrl = this.configService.get<string>(
      'PUBLIC_BASE_URL',
      `http://${host}:${port}/v2/api/uploads`,
    );

    await mkdir(this.uploadRoot, { recursive: true });
    for (const documentType of MERCHANT_DOCUMENT_TYPES) {
      await mkdir(join(this.uploadRoot, documentType), { recursive: true });
    }
    await mkdir(join(this.uploadRoot, VIDEO_KYC_UPLOAD_FOLDER), {
      recursive: true,
    });
  }

  getUploadRoot(): string {
    return this.uploadRoot;
  }

  async saveMerchantDocument(params: {
    clientId: string;
    documentType: string;
    originalName: string;
    buffer: Buffer;
  }): Promise<{ fileUrl: string; storedFileName: string; relativePath: string }> {
    const sanitizedOriginalName = this.sanitizeFileName(params.originalName);
    const storedFileName = `${params.clientId}-${Date.now()}-${sanitizedOriginalName}`;
    const relativePath = join(params.documentType, storedFileName);
    const absolutePath = join(this.uploadRoot, relativePath);

    await mkdir(join(this.uploadRoot, params.documentType), { recursive: true });
    await writeFile(absolutePath, params.buffer);

    const fileUrl = `${this.publicBaseUrl}/${params.documentType}/${storedFileName}`;
    return { fileUrl, storedFileName, relativePath };
  }

  async saveVideoKycRecording(params: {
    clientId: string;
    personId: string;
    originalName: string;
    buffer: Buffer;
  }): Promise<{ fileUrl: string; storedFileName: string; relativePath: string }> {
    const sanitizedOriginalName = this.sanitizeFileName(
      params.originalName || 'video-kyc.webm',
    );
    const storedFileName = `${params.clientId}-${params.personId}-${Date.now()}-${sanitizedOriginalName}`;
    const relativePath = join(VIDEO_KYC_UPLOAD_FOLDER, storedFileName);
    const absolutePath = join(this.uploadRoot, relativePath);

    await mkdir(join(this.uploadRoot, VIDEO_KYC_UPLOAD_FOLDER), {
      recursive: true,
    });
    await writeFile(absolutePath, params.buffer);

    const fileUrl = `${this.publicBaseUrl}/${VIDEO_KYC_UPLOAD_FOLDER}/${storedFileName}`;
    return { fileUrl, storedFileName, relativePath };
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, '_')
      .trim();
  }
}
