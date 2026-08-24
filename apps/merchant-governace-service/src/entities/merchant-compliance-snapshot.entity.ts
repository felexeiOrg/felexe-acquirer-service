import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('merchant_compliance_snapshots')
export class MerchantComplianceSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid', unique: true })
  client_id: string;

  @Column({ name: 'website_score', type: 'int', default: 0 })
  website_score: number;

  @Column({ name: 'latest_log_id', type: 'uuid', nullable: true })
  latest_log_id: string | null;

  @Column({ name: 'latest_crawl', type: 'jsonb', nullable: true })
  latest_crawl: Record<string, unknown> | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;
}
