import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DocumentCrudService } from './document-crud.service';
import {
  ClientIdOnlyPayloadDto,
  SaveMerchantDocumentDto,
} from './dto/upload-document.dto';

@Controller()
export class DocumentController {
  constructor(private readonly documentCrudService: DocumentCrudService) {}

  @MessagePattern({ cmd: 'merchant-onboarding.documents.upload' })
  upload(@Payload() payload: SaveMerchantDocumentDto) {
    return this.documentCrudService.upload(payload);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.documents.list' })
  list(@Payload() payload: ClientIdOnlyPayloadDto) {
    return this.documentCrudService.listLatest(payload.clientId);
  }
}
