import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { TransactionEntity } from '../../infrastructure/persistence/entities/transaction.entity.js';

export type RecordTransactionCommand = {
  operationId: string;
  eventId?: string | null;
  paymentId?: string | null;
  accountId: string;
  walletId: string;
  counterpartyWalletId?: string | null;
  direction: 'CREDIT' | 'DEBIT' | 'TRANSFER';
  amountMinor: number;
  currency: string;
  status: string;
  correlationId: string;
  occurredAt: Date;
};

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error as QueryFailedError & { driverError?: { code?: string } })
      .driverError?.code === '23505'
  );
}

@Injectable()
export class RecordTransactionHandler {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repo: Repository<TransactionEntity>,
  ) {}

  async execute(
    cmd: RecordTransactionCommand,
    manager?: EntityManager,
  ): Promise<TransactionEntity> {
    const repo = manager
      ? manager.getRepository(TransactionEntity)
      : this.repo;

    const existing = await repo.findOne({
      where: { operationId: cmd.operationId },
    });
    if (existing) return existing;

    try {
      return await repo.save(
        repo.create({
          id: randomUUID(),
          operationId: cmd.operationId,
          eventId: cmd.eventId ?? null,
          paymentId: cmd.paymentId ?? null,
          accountId: cmd.accountId,
          walletId: cmd.walletId,
          counterpartyWalletId: cmd.counterpartyWalletId ?? null,
          direction: cmd.direction,
          amountMinor: cmd.amountMinor,
          currency: cmd.currency,
          status: cmd.status,
          correlationId: cmd.correlationId,
          occurredAt: cmd.occurredAt,
        }),
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        const raced = await repo.findOne({
          where: { operationId: cmd.operationId },
        });
        if (raced) return raced;
      }
      throw error;
    }
  }
}
