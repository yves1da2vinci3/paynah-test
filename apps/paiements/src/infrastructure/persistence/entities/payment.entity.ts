import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from '../../../domain/payment-status.js';

@Entity({ name: 'payments' })
@Check(`"amount_minor" > 0`)
@Check(`"source_account_id" <> "destination_account_id"`)
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'source_account_id' })
  sourceAccountId!: string;

  @Column({ type: 'uuid', name: 'destination_account_id' })
  destinationAccountId!: string;

  @Column({
    type: 'bigint',
    name: 'amount_minor',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  amountMinor!: number;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: PaymentStatus;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'failure_code' })
  failureCode!: string | null;

  @Column({ type: 'uuid', name: 'correlation_id' })
  correlationId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
