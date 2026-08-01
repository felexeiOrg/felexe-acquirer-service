import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OtpPurpose } from '../enums/otp-purpose.enum';

@Entity('otp_verifications')
export class OtpVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @Column({ name: 'mobile', type: 'varchar', length: 10 })
  mobile: string;

  @Column({ name: 'otp_hash', type: 'varchar' })
  otp_hash: string;

  @Column({ name: 'purpose', type: 'varchar' })
  purpose: OtpPurpose;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expires_at: Date;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  is_used: boolean;

  @Column({
    name: 'verification_token_hash',
    type: 'varchar',
    nullable: true,
  })
  verification_token_hash: string | null;

  @Column({
    name: 'token_expires_at',
    type: 'timestamp',
    nullable: true,
  })
  token_expires_at: Date | null;

  @Column({ name: 'is_token_used', type: 'boolean', default: false })
  is_token_used: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;
}
