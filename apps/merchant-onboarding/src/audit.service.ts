import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MerchantAuditEvent } from './constants/audit-event.constants';
import { AuditLog } from './entities/audit-log.entity';

export type AuditAction = 'CREATE' | 'UPDATE' | 'VERIFY' | 'FETCH' | 'REQUEST' | 'DELETE';

export interface MerchantAuditLogInput {
  event: MerchantAuditEvent | string;
  action: AuditAction;
  status?: 'SUCCESS' | 'FAILED';
  resource?: string;
  description?: string;
  targetId?: string | null;
  targetMobile?: string | null;
  name?: string | null;
  role?: string | null;
  mobile?: string | null;
  email?: string | null;
  changedFields?: string[];
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  requestId?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(input: MerchantAuditLogInput, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(AuditLog) : this.auditLogRepository;
    const eventTime = new Date();

    const entry = repo.create({
      event: input.event,
      action: input.action,
      status: input.status ?? 'SUCCESS',
      module: 'merchant_onboarding',
      resource: input.resource ?? null,
      description: input.description ?? null,
      user_id: null,
      name: input.name ?? null,
      role: input.role ?? null,
      mobile: input.mobile ?? null,
      email: input.email ?? null,
      target_id: input.targetId ?? null,
      target_mobile: input.targetMobile ?? null,
      changed_fields: input.changedFields ?? [],
      old_values: input.oldValues ?? null,
      new_values: input.newValues ?? null,
      metadata: {
        ...(input.metadata ?? {}),
        audited_at: eventTime.toISOString(),
      },
      ip: null,
      user_agent: null,
      request_id: input.requestId ?? null,
      event_time: eventTime,
    });

    return repo.save(entry);
  }
}
