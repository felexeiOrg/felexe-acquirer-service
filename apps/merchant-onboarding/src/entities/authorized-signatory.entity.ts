import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('authorized_signatory_details')
export class AuthorizedSignatory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'client_id', type: 'uuid' })
  client_id: string;

  @Column({ name: 'din', type: 'varchar', nullable: true })
  din: string | null;

  @Column({ name: 'pan', type: 'varchar', nullable: true })
  pan: string | null;

  @Column({ name: 'first_name', type: 'varchar', nullable: true })
  first_name: string | null;

  @Column({ name: 'middle_name', type: 'varchar', nullable: true })
  middle_name: string | null;

  @Column({ name: 'last_name', type: 'varchar', nullable: true })
  last_name: string | null;

  @Column({ name: 'full_name', type: 'varchar', nullable: true })
  full_name: string | null;

  @Column({ name: 'date_of_appointment', type: 'varchar', nullable: true })
  date_of_appointment: string | null;

  @Column({ name: 'disqualified', type: 'boolean', default: false })
  disqualified: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ name: 'video_kyc_status', type: 'varchar', nullable: true })
  video_kyc_status: string | null;

  @Column({ name: 'is_vkyc_verified', type: 'boolean', default: false })
  is_vkyc_verified: boolean;

  @Column({ name: 'status', type: 'varchar', default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;
}
