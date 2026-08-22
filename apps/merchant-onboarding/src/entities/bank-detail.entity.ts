import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bank_details')
export class BankDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'client_id', type: 'uuid' })
  client_id: string;

  @Column({ name: 'account_number', type: 'varchar' })
  account_number: string;

  @Column({ name: 'ifsc_code', type: 'varchar' })
  ifsc_code: string;

  @Column({ name: 'bank_name', type: 'varchar', nullable: true })
  bank_name: string | null;

  @Column({ name: 'branch_name', type: 'varchar', nullable: true })
  branch_name: string | null;

  @Column({ name: 'account_holder_name', type: 'varchar', nullable: true })
  account_holder_name: string | null;

  @Column({ name: 'transaction_remark', type: 'varchar', nullable: true })
  transaction_remark: string | null;

  @Column({ name: 'is_penny_drop', type: 'boolean', nullable: true })
  is_penny_drop: boolean | null;

  @Column({ name: 'ifsc_details', type: 'jsonb', nullable: true })
  ifsc_details: Record<string, unknown> | null;

  @Column({ name: 'account_type', type: 'varchar', nullable: true })
  account_type: string | null;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  is_primary: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  is_verified: boolean;

  @Column({
    name: 'verification_status',
    type: 'varchar',
    default: 'pending',
  })
  verification_status: string;

  @Column({ name: 'raw_verification_response', type: 'jsonb', nullable: true })
  raw_verification_response: Record<string, unknown> | null;

  @Column({ name: 'status', type: 'varchar', default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;
}
