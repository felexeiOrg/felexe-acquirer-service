import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { MerchantAuditEvent } from './constants/audit-event.constants';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';
import { AuthorizedSignatory } from './entities/authorized-signatory.entity';
import { MerchantContextService } from './merchant-context.service';
import {
  applyPersonUpdate,
  fromCreatePersonDto,
  toPersonResponse,
} from './mappers/person.mapper';

@Injectable()
export class AuthorizerCrudService {
  constructor(
    private readonly merchantContextService: MerchantContextService,
    private readonly auditService: AuditService,
    @InjectRepository(AuthorizedSignatory)
    private readonly authorizerRepository: Repository<AuthorizedSignatory>,
  ) {}

  async list(clientId: string) {
    await this.merchantContextService.findMerchantByClientId(clientId);
    const rows = await this.authorizerRepository.find({
      where: { client_id: clientId, status: 'active' },
      order: { created_at: 'ASC' },
    });
    return { clientId, authorizers: rows.map(toPersonResponse) };
  }

  async get(clientId: string, id: string) {
    const authorizer = await this.findActiveAuthorizer(clientId, id);
    return toPersonResponse(authorizer);
  }

  async create(clientId: string, body: CreatePersonDto) {
    await this.merchantContextService.assertMerchantActive(clientId);
    const authorizer = this.authorizerRepository.create(
      fromCreatePersonDto(clientId, body),
    );
    const saved = await this.authorizerRepository.save(authorizer);

    await this.auditService.log({
      event: MerchantAuditEvent.AUTHORIZER_CREATED,
      action: 'CREATE',
      resource: 'authorized_signatory_details',
      description: `Authorizer created: ${saved.full_name ?? saved.din ?? saved.id}`,
      targetId: saved.id,
      name: saved.full_name,
      changedFields: Object.keys(fromCreatePersonDto(clientId, body)),
      newValues: toPersonResponse(saved),
      metadata: { client_id: clientId },
    });

    return {
      message: 'Authorizer created successfully',
      authorizer: toPersonResponse(saved),
    };
  }

  async update(clientId: string, id: string, body: UpdatePersonDto) {
    await this.merchantContextService.assertMerchantActive(clientId);
    const authorizer = await this.findActiveAuthorizer(clientId, id);
    const changedFields = applyPersonUpdate(authorizer, body);

    if (!changedFields.length) {
      throw new BadRequestException('At least one field is required to update');
    }

    const saved = await this.authorizerRepository.save(authorizer);

    await this.auditService.log({
      event: MerchantAuditEvent.AUTHORIZER_UPDATED,
      action: 'UPDATE',
      resource: 'authorized_signatory_details',
      description: `Authorizer updated: ${saved.full_name ?? saved.din ?? saved.id}`,
      targetId: saved.id,
      name: saved.full_name,
      changedFields,
      newValues: toPersonResponse(saved),
      metadata: { client_id: clientId },
    });

    return {
      message: 'Authorizer updated successfully',
      authorizer: toPersonResponse(saved),
    };
  }

  async delete(clientId: string, id: string) {
    await this.merchantContextService.assertMerchantActive(clientId);
    const authorizer = await this.findActiveAuthorizer(clientId, id);

    authorizer.status = 'deleted';
    const saved = await this.authorizerRepository.save(authorizer);

    await this.auditService.log({
      event: MerchantAuditEvent.AUTHORIZER_DELETED,
      action: 'DELETE',
      resource: 'authorized_signatory_details',
      description: `Authorizer deleted: ${saved.full_name ?? saved.din ?? saved.id}`,
      targetId: saved.id,
      name: saved.full_name,
      changedFields: ['status'],
      newValues: { status: 'deleted' },
      metadata: { client_id: clientId },
    });

    return {
      message: 'Authorizer deleted successfully',
      id: saved.id,
      status: saved.status,
    };
  }

  private async findActiveAuthorizer(
    clientId: string,
    id: string,
  ): Promise<AuthorizedSignatory> {
    const authorizer = await this.authorizerRepository.findOne({
      where: { id, client_id: clientId },
    });
    if (!authorizer || authorizer.status === 'deleted') {
      throw new NotFoundException(
        `Authorizer not found for clientId ${clientId} and id ${id}`,
      );
    }
    return authorizer;
  }
}
