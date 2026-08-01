import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditEvent } from '../enums/audit-event.enum';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Who */
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  user_id: string | null;

  @Column({ name: 'name', type: 'varchar', nullable: true })
  name: string | null;

  @Column({ name: 'role', type: 'varchar', nullable: true })
  role: string | null;

  @Column({ name: 'mobile', type: 'varchar', length: 10, nullable: true })
  mobile: string | null;

  @Column({ name: 'email', type: 'varchar', nullable: true })
  email: string | null;

  /** On whom */
  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  target_id: string | null;

  @Column({ name: 'target_mobile', type: 'varchar', length: 10, nullable: true })
  target_mobile: string | null;

  /** What */
  @Column({ name: 'event', type: 'varchar' })
  event: AuditEvent;

  @Column({ name: 'action', type: 'varchar' })
  action: string;

  @Column({ name: 'module', type: 'varchar', default: 'auth' })
  module: string;

  @Column({ name: 'resource', type: 'varchar', nullable: true })
  resource: string | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'status', type: 'varchar', default: 'SUCCESS' })
  status: 'SUCCESS' | 'FAILED';

  /** Change detail */
  @Column({ name: 'changed_fields', type: 'text', array: true, default: '{}' })
  changed_fields: string[];

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  old_values: Record<string, unknown> | null;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  new_values: Record<string, unknown> | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'ip', type: 'varchar', nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  user_agent: string | null;

  @Column({ name: 'request_id', type: 'varchar', nullable: true })
  request_id: string | null;

  /** When */
  @Column({
    name: 'event_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  event_time: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;
}
