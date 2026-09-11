import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'idempotency_keys' })
export class IdempotencyKeyEntity {
  @PrimaryColumn({ type: 'varchar', length: 128, name: 'idempotency_key' })
  idempotencyKey!: string;

  @Column({ type: 'char', length: 64, name: 'request_hash' })
  requestHash!: string;

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId!: string;

  @Column({ type: 'int', name: 'response_code' })
  responseCode!: number;

  @Column({ type: 'jsonb', name: 'response_body' })
  responseBody!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;
}
