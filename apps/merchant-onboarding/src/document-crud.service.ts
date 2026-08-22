import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { MerchantAuditEvent } from './constants/audit-event.constants';
import { MERCHANT_DOCUMENT_STATUS } from './constants/document-type.constants';
import { SaveMerchantDocumentDto } from './dto/upload-document.dto';
import { MerchantDocument } from './entities/merchant-document.entity';
import { MerchantContextService } from './merchant-context.service';

@Injectable()
export class DocumentCrudService {
  constructor(
    private readonly merchantContextService: MerchantContextService,
    private readonly auditService: AuditService,
    @InjectRepository(MerchantDocument)
    private readonly documentRepository: Repository<MerchantDocument>,
  ) {}

  async upload(payload: SaveMerchantDocumentDto) {
    await this.merchantContextService.assertMerchantActive(payload.clientId);

    const document = this.documentRepository.create({
      client_id: payload.clientId,
      document_type: payload.documentType,
      file_url: payload.fileUrl,
      file_name: payload.fileName,
      mime_type: payload.mimeType,
      status: MERCHANT_DOCUMENT_STATUS.PENDING,
    });
    const saved = await this.documentRepository.save(document);

    await this.auditService.log({
      event: MerchantAuditEvent.MERCHANT_DOCUMENT_UPLOADED,
      action: 'CREATE',
      resource: 'merchant_documents',
      description: `Document uploaded: ${saved.document_type} for clientId ${saved.client_id}`,
      targetId: saved.id,
      changedFields: [
        'client_id',
        'document_type',
        'file_url',
        'file_name',
        'mime_type',
        'status',
      ],
      newValues: {
        id: saved.id,
        client_id: saved.client_id,
        document_type: saved.document_type,
        file_url: saved.file_url,
        file_name: saved.file_name,
        mime_type: saved.mime_type,
        status: saved.status,
      },
      metadata: { client_id: saved.client_id },
    });

    return {
      message: 'Document uploaded successfully',
      document: this.toDocumentResponse(saved),
    };
  }

  async listLatest(clientId: string) {
    await this.merchantContextService.findMerchantByClientId(clientId);

    const rows = await this.documentRepository.find({
      where: { client_id: clientId },
      order: { created_at: 'DESC' },
    });

    const latestByType = new Map<string, MerchantDocument>();
    for (const row of rows) {
      if (!latestByType.has(row.document_type)) {
        latestByType.set(row.document_type, row);
      }
    }

    return {
      clientId,
      documents: Array.from(latestByType.values()).map((doc) =>
        this.toDocumentResponse(doc),
      ),
    };
  }

  private toDocumentResponse(document: MerchantDocument) {
    return {
      id: document.id,
      clientId: document.client_id,
      documentType: document.document_type,
      fileUrl: document.file_url,
      fileName: document.file_name,
      mimeType: document.mime_type,
      status: document.status,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
    };
  }
}
