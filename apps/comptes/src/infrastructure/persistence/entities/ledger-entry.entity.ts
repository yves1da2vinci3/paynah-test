import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Wallet } from './wallet.entity.js';

@Entity({ name: 'ledger_entries' })
@Check(`"amount_minor" > 0`)
@Check(`"balance_after_minor" >= 0`)
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'wallet_id' })
  walletId!: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'wallet_id' })
  wallet!: Relation<Wallet>;

  @Column({ type: 'varchar', length: 128, unique: true, name: 'operation_id' })
  operationId!: string;

  @Column({ type: 'varchar', length: 8 })
  direction!: 'CREDIT' | 'DEBIT';

  @Column({
    type: 'bigint',
    name: 'amount_minor',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  amountMinor!: number;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({
    type: 'bigint',
    name: 'balance_after_minor',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  balanceAfterMinor!: number;

  @Column({ type: 'uuid', name: 'correlation_id' })
  correlationId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
