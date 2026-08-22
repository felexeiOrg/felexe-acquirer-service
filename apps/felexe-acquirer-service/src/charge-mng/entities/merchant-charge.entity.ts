import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { MerchantChargeSlab } from './merchant-charge-slab.entity';

@Entity('merchant_charges')
@Unique('uq_merchant_charges_client_payment_mode', ['client_id', 'payment_mode'])
export class MerchantCharge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'client_id', type: 'uuid' })
  client_id: string;

  @Column({ name: 'payment_mode', type: 'varchar', length: 20 })
  payment_mode: string;

  @Column({ name: 'mode_of_charge', type: 'varchar', length: 20 })
  mode_of_charge: string;

  @Column({
    name: 'charge_percent',
    type: 'numeric',
    precision: 12,
    scale: 4,
    nullable: true,
  })
  charge_percent: string | null;

  @Column({
    name: 'charge_flat',
    type: 'numeric',
    precision: 12,
    scale: 4,
    nullable: true,
  })
  charge_flat: string | null;

  @Column({
    name: 'commission_percent',
    type: 'numeric',
    precision: 12,
    scale: 4,
    nullable: true,
  })
  commission_percent: string | null;

  @Column({
    name: 'commission_flat',
    type: 'numeric',
    precision: 12,
    scale: 4,
    nullable: true,
  })
  commission_flat: string | null;

  @OneToMany(() => MerchantChargeSlab, (slab) => slab.charge, {
    cascade: true,
    eager: true,
  })
  slabs: MerchantChargeSlab[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;
}
