import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { User } from './entities/user.entity';
import { AuditEvent } from './enums/audit-event.enum';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'LOGIN'
  | 'VERIFY'
  | 'SEND'
  | 'REQUEST'
  | 'DELETE';

export interface AuditLogInput {
  event: AuditEvent;
  action: AuditAction;
  status?: 'SUCCESS' | 'FAILED';
  module?: string;
  resource?: string;
  description?: string;
  user?: User | null;
  userId?: string | null;
  name?: string | null;
  role?: string | null;
  mobile?: string | null;
  email?: string | null;
  targetId?: string | null;
  targetMobile?: string | null;
  changedFields?: string[];
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  eventTime?: Date;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(input: AuditLogInput) {
    const name =
      input.name ??
      (input.user
        ? `${input.user.first_name} ${input.user.last_name}`.trim()
        : null);

    const entry = this.auditLogRepository.create({
      event: input.event,
      action: input.action,
      status: input.status ?? 'SUCCESS',
      module: input.module ?? 'auth',
      resource: input.resource ?? null,
      description: input.description ?? null,
      user_id: input.userId ?? input.user?.id ?? null,
      name,
      role: input.role ?? input.user?.role ?? null,
      mobile: input.mobile ?? input.user?.mobile ?? null,
      email: input.email ?? input.user?.email ?? null,
      target_id: input.targetId ?? input.user?.id ?? null,
      target_mobile: input.targetMobile ?? input.user?.mobile ?? null,
      changed_fields: input.changedFields ?? [],
      old_values: input.oldValues ?? null,
      new_values: input.newValues ?? null,
      metadata: {
        ...(input.metadata ?? {}),
        audited_at: (input.eventTime ?? new Date()).toISOString(),
      },
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
      request_id: input.requestId ?? null,
      event_time: input.eventTime ?? new Date(),
    });

    return this.auditLogRepository.save(entry);
  }
}
