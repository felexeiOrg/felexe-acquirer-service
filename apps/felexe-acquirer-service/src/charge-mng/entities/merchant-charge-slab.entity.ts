import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MerchantCharge } from './merchant-charge.entity';

@Entity('merchant_charge_slabs')
export class MerchantChargeSlab {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'charge_id', type: 'uuid' })
  charge_id: string;

  @ManyToOne(() => MerchantCharge, (charge) => charge.slabs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'charge_id' })
  charge: MerchantCharge;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sort_order: number;

  @Column({ name: 'min_amount', type: 'numeric', precision: 14, scale: 4 })
  min_amount: string;

  @Column({ name: 'max_amount', type: 'numeric', precision: 14, scale: 4 })
  max_amount: string;

  @Column({ name: 'charge_percent', type: 'numeric', precision: 12, scale: 4 })
  charge_percent: string;

  @Column({ name: 'charge_flat', type: 'numeric', precision: 12, scale: 4 })
  charge_flat: string;

  @Column({
    name: 'commission_percent',
    type: 'numeric',
    precision: 12,
    scale: 4,
  })
  commission_percent: string;

  @Column({
    name: 'commission_flat',
    type: 'numeric',
    precision: 12,
    scale: 4,
  })
  commission_flat: string;
}
