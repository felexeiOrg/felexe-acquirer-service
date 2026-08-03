import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('kyc_audit_logs')
export class KycAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event', type: 'varchar' })
  event: string;

  @Column({ name: 'action', type: 'varchar' })
  action: string;

  @Column({ name: 'module', type: 'varchar', default: 'kyc' })
  module: string;

  @Column({ name: 'resource', type: 'varchar', nullable: true })
  resource: string | null;

  @Column({ name: 'status', type: 'varchar' })
  status: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'pan', type: 'varchar', nullable: true })
  pan: string | null;

  @Column({ name: 'aadhaar', type: 'varchar', length: 12, nullable: true })
  aadhaar: string | null;

  @Column({ name: 'request', type: 'jsonb', nullable: true })
  request: Record<string, unknown> | null;

  @Column({ name: 'response', type: 'jsonb', nullable: true })
  response: Record<string, unknown> | null;

  @Column({ name: 'status_code', type: 'varchar', nullable: true })
  status_code: string | null;

  @Column({ name: 'vendor_request_id', type: 'varchar', nullable: true })
  vendor_request_id: string | null;

  @Column({ name: 'sequence_id', type: 'varchar', nullable: true })
  sequence_id: string | null;

  @Column({ name: 'error', type: 'text', nullable: true })
  error: string | null;

  @Column({
    name: 'event_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  event_time: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;
}
