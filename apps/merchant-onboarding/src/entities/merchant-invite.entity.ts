import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MerchantInviteListStatus } from '../constants/merchant-invite-status.constants';

@Entity('merchant_invites')
export class MerchantInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  user_id: string;

  @Column({ name: 'client_id', type: 'uuid', nullable: true, unique: true })
  client_id: string | null;

  @Column({ name: 'company_name', type: 'varchar' })
  company_name: string;

  @Column({ name: 'first_name', type: 'varchar', length: 50 })
  first_name: string;

  @Column({ name: 'last_name', type: 'varchar', length: 50 })
  last_name: string;

  @Column({ name: 'mobile', type: 'varchar', length: 10 })
  mobile: string;

  @Column({ name: 'email', type: 'varchar' })
  email: string;

  @Column({ name: 'business_website', type: 'varchar', nullable: true })
  business_website: string | null;

  @Column({ name: 'company_type', type: 'varchar', nullable: true })
  company_type: string | null;

  @Column({
    name: 'list_status',
    type: 'varchar',
    default: MerchantInviteListStatus.INVITED,
  })
  list_status: string;

  @Column({ name: 'merchant_details_completed', type: 'boolean', default: false })
  merchant_details_completed: boolean;

  @Column({ name: 'directors_completed', type: 'boolean', default: false })
  directors_completed: boolean;

  @Column({ name: 'authorizers_completed', type: 'boolean', default: false })
  authorizers_completed: boolean;

  @Column({ name: 'bank_details_completed', type: 'boolean', default: false })
  bank_details_completed: boolean;

  @Column({ name: 'video_kyc_completed', type: 'boolean', default: false })
  video_kyc_completed: boolean;

  @Column({ name: 'onboarding_type', type: 'varchar', nullable: true })
  onboarding_type: string | null;

  @Column({ name: 'section_statuses', type: 'jsonb', nullable: true })
  section_statuses: Record<string, string> | null;

  @Column({
    name: 'overall_onboarding_status',
    type: 'varchar',
    default: 'not_started',
  })
  overall_onboarding_status: string;

  @Column({ name: 'maker_submitted_at', type: 'timestamp', nullable: true })
  maker_submitted_at: Date | null;

  @Column({ name: 'checker_user_id', type: 'uuid', nullable: true })
  checker_user_id: string | null;

  @Column({ name: 'checker_decision', type: 'varchar', nullable: true })
  checker_decision: string | null;

  @Column({ name: 'checker_remarks', type: 'text', nullable: true })
  checker_remarks: string | null;

  @Column({ name: 'checker_reviewed_at', type: 'timestamp', nullable: true })
  checker_reviewed_at: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @CreateDateColumn({ name: 'invited_at', type: 'timestamp' })
  invited_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;
}
