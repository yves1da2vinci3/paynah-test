import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'transactions' })
@Check(`"amount_minor" > 0`)
@Check(`"direction" IN ('CREDIT', 'DEBIT', 'TRANSFER')`)
@Index('transactions_account_occurred_idx', ['accountId', 'occurredAt', 'id'])
@Index('transactions_wallet_occurred_idx', ['walletId', 'occurredAt', 'id'])
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 128, unique: true, name: 'operation_id' })
  operationId!: string;

  @Column({ type: 'uuid', unique: true, nullable: true, name: 'event_id' })
  eventId!: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'payment_id' })
  paymentId!: string | null;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string;

  @Column({ type: 'uuid', name: 'wallet_id' })
  walletId!: string;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'counterparty_wallet_id',
  })
  counterpartyWalletId!: string | null;

  @Column({ type: 'varchar', length: 8 })
  direction!: 'CREDIT' | 'DEBIT' | 'TRANSFER';

  @Column({
    type: 'bigint',
    name: 'amount_minor',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  amountMinor!: number;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ type: 'uuid', name: 'correlation_id' })
  correlationId!: string;

  @Column({ type: 'timestamptz', name: 'occurred_at' })
  occurredAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
