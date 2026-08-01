import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_name', type: 'varchar' })
  company_name: string;

  @Column({ name: 'business_website', type: 'varchar', nullable: true })
  business_website: string | null;

  @Column({ name: 'company_type', type: 'varchar', nullable: true })
  company_type: string | null;

  @Column({
    name: 'role',
    type: 'varchar',
    default: UserRole.MERCHANT,
  })
  role: string;

  @Column({ name: 'first_name', type: 'varchar', length: 50 })
  first_name: string;

  @Column({ name: 'last_name', type: 'varchar', length: 50 })
  last_name: string;

  @Column({ name: 'mobile', type: 'varchar', length: 10, unique: true })
  mobile: string;

  @Column({ name: 'email', type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  password_hash: string;

  @Column({ name: 'is_active', type: 'smallint', default: 0 })
  is_active: number;

  @Column({ name: 'must_change_password', type: 'boolean', default: true })
  must_change_password: boolean;

  @Column({ name: 'password_change_count', type: 'int', default: 0 })
  password_change_count: number;

  @Column({
    name: 'password_changed_at',
    type: 'timestamp',
    nullable: true,
  })
  password_changed_at: Date | null;

  @Column({ name: 'created_by_admin_id', type: 'varchar', nullable: true })
  created_by_admin_id: string | null;

  @Column({ name: 'created_by_partner_id', type: 'varchar', nullable: true })
  created_by_partner_id: string | null;

  @Column({ name: 'upi_merchant_id', type: 'varchar', nullable: true })
  upi_merchant_id: string | null;

  @Column({
    name: 'upi_encrypted_access_key',
    type: 'varchar',
    nullable: true,
  })
  upi_encrypted_access_key: string | null;

  @Column({ name: 'merchant_payee_vpa', type: 'varchar', nullable: true })
  merchant_payee_vpa: string | null;

  @Column({ name: 'mid', type: 'varchar', nullable: true })
  mid: string | null;

  @Column({ name: 'custom_role', type: 'varchar', nullable: true })
  custom_role: string | null;

  @Column({ name: 'permissions', type: 'text', array: true, default: '{}' })
  permissions: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;
}
