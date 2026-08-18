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
import { Director } from './entities/director.entity';
import { MerchantContextService } from './merchant-context.service';
import {
  applyPersonUpdate,
  fromCreatePersonDto,
  toPersonResponse,
} from './mappers/person.mapper';

@Injectable()
export class DirectorCrudService {
  constructor(
    private readonly merchantContextService: MerchantContextService,
    private readonly auditService: AuditService,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
  ) {}

  async list(clientId: string) {
    await this.merchantContextService.findMerchantByClientId(clientId);
    const rows = await this.directorRepository.find({
      where: { client_id: clientId, status: 'active' },
      order: { created_at: 'ASC' },
    });
    return { clientId, directors: rows.map(toPersonResponse) };
  }

  async get(clientId: string, id: string) {
    const director = await this.findActiveDirector(clientId, id);
    return toPersonResponse(director);
  }

  async create(clientId: string, body: CreatePersonDto) {
    await this.merchantContextService.assertMerchantActive(clientId);
    const director = this.directorRepository.create(
      fromCreatePersonDto(clientId, body),
    );
    const saved = await this.directorRepository.save(director);

    await this.auditService.log({
      event: MerchantAuditEvent.DIRECTOR_CREATED,
      action: 'CREATE',
      resource: 'directors',
      description: `Director created: ${saved.full_name ?? saved.din ?? saved.id}`,
      targetId: saved.id,
      name: saved.full_name,
      changedFields: Object.keys(fromCreatePersonDto(clientId, body)),
      newValues: toPersonResponse(saved),
      metadata: { client_id: clientId },
    });

    return {
      message: 'Director created successfully',
      director: toPersonResponse(saved),
    };
  }

  async update(clientId: string, id: string, body: UpdatePersonDto) {
    await this.merchantContextService.assertMerchantActive(clientId);
    const director = await this.findActiveDirector(clientId, id);
    const changedFields = applyPersonUpdate(director, body);

    if (!changedFields.length) {
      throw new BadRequestException('At least one field is required to update');
    }

    const saved = await this.directorRepository.save(director);

    await this.auditService.log({
      event: MerchantAuditEvent.DIRECTOR_UPDATED,
      action: 'UPDATE',
      resource: 'directors',
      description: `Director updated: ${saved.full_name ?? saved.din ?? saved.id}`,
      targetId: saved.id,
      name: saved.full_name,
      changedFields,
      newValues: toPersonResponse(saved),
      metadata: { client_id: clientId },
    });

    return {
      message: 'Director updated successfully',
      director: toPersonResponse(saved),
    };
  }

  async delete(clientId: string, id: string) {
    await this.merchantContextService.assertMerchantActive(clientId);
    const director = await this.findActiveDirector(clientId, id);

    director.status = 'deleted';
    const saved = await this.directorRepository.save(director);

    await this.auditService.log({
      event: MerchantAuditEvent.DIRECTOR_DELETED,
      action: 'DELETE',
      resource: 'directors',
      description: `Director deleted: ${saved.full_name ?? saved.din ?? saved.id}`,
      targetId: saved.id,
      name: saved.full_name,
      changedFields: ['status'],
      newValues: { status: 'deleted' },
      metadata: { client_id: clientId },
    });

    return {
      message: 'Director deleted successfully',
      id: saved.id,
      status: saved.status,
    };
  }

  private async findActiveDirector(
    clientId: string,
    id: string,
  ): Promise<Director> {
    const director = await this.directorRepository.findOne({
      where: { id, client_id: clientId },
    });
    if (!director || director.status === 'deleted') {
      throw new NotFoundException(
        `Director not found for clientId ${clientId} and id ${id}`,
      );
    }
    return director;
  }
}
