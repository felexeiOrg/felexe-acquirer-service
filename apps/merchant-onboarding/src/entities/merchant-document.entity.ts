import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('merchant_documents')
export class MerchantDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'client_id', type: 'uuid' })
  client_id: string;

  @Index()
  @Column({ name: 'document_type', type: 'varchar' })
  document_type: string;

  @Column({ name: 'file_url', type: 'varchar' })
  file_url: string;

  @Column({ name: 'file_name', type: 'varchar' })
  file_name: string;

  @Column({ name: 'mime_type', type: 'varchar' })
  mime_type: string;

  @Column({ name: 'status', type: 'varchar', default: 'Pending' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;
}
