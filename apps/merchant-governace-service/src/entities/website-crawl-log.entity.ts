import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('website_crawl_logs')
export class WebsiteCrawlLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'client_id', type: 'uuid' })
  client_id: string;

  @Column({ name: 'log_id', type: 'uuid', unique: true })
  log_id: string;

  @Column({ name: 'website_url', type: 'varchar' })
  website_url: string;

  @Column({ name: 'domain', type: 'varchar' })
  domain: string;

  @Column({ name: 'ssl_status', type: 'varchar' })
  ssl_status: string;

  @Column({ name: 'domain_age', type: 'int', nullable: true })
  domain_age: number | null;

  @Column({ name: 'contact_info', type: 'jsonb', nullable: true })
  contact_info: Record<string, unknown> | null;

  @Column({ name: 'compliance_flags', type: 'jsonb', nullable: true })
  compliance_flags: Record<string, unknown> | null;

  @Column({ name: 'business_match', type: 'boolean', default: false })
  business_match: boolean;

  @Column({ name: 'anomalies', type: 'jsonb', default: [] })
  anomalies: string[];

  @Column({ name: 'policies_found', type: 'jsonb', default: [] })
  policies_found: string[];

  @Column({ name: 'website_score', type: 'int', default: 0 })
  website_score: number;

  @Column({ name: 'score_breakdown', type: 'jsonb', nullable: true })
  score_breakdown: Record<string, unknown> | null;

  @Column({ name: 'raw_response', type: 'jsonb', nullable: true })
  raw_response: Record<string, unknown> | null;

  @Column({ name: 'crawled_at', type: 'timestamp' })
  crawled_at: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;
}
