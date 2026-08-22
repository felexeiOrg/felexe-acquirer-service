import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid', unique: true })
  client_id: string;

  @Column({ name: 'gstin', type: 'varchar', unique: true, nullable: true })
  gstin: string | null;

  @Column({ name: 'cin', type: 'varchar', nullable: true })
  cin: string | null;

  @Column({ name: 'legal_name', type: 'varchar', nullable: true })
  legal_name: string | null;

  @Column({ name: 'trade_name', type: 'varchar', nullable: true })
  trade_name: string | null;

  @Column({ name: 'status', type: 'varchar', default: 'pending' })
  status: string;

  @Column({
    name: 'verification_status',
    type: 'varchar',
    default: 'pending',
  })
  verification_status: string;

  @Column({ name: 'merchant_profile', type: 'jsonb' })
  merchant_profile: Record<string, unknown>;

  @Column({ name: 'raw_gst_response', type: 'jsonb', nullable: true })
  raw_gst_response: Record<string, unknown> | null;

  @Column({ name: 'raw_cin_lookup_response', type: 'jsonb', nullable: true })
  raw_cin_lookup_response: Record<string, unknown> | null;

  @Column({ name: 'raw_company_response', type: 'jsonb', nullable: true })
  raw_company_response: Record<string, unknown> | null;

  @Column({ name: 'onboarding_type', type: 'varchar', nullable: true })
  onboarding_type: string | null;

  @Column({ name: 'selected_merchant_profile', type: 'jsonb', nullable: true })
  selected_merchant_profile: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;
}
