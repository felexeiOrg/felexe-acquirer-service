import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('merchant_verification_reviews')
export class MerchantVerificationReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'client_id', type: 'uuid' })
  client_id: string;

  @Column({ name: 'reviewer_user_id', type: 'uuid' })
  reviewer_user_id: string;

  @Column({ name: 'target_type', type: 'varchar' })
  target_type: string;

  @Column({ name: 'target_key', type: 'varchar' })
  target_key: string;

  @Column({ name: 'decision', type: 'varchar' })
  decision: string;

  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;
}
