import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, QueryFailedError } from 'typeorm';
import { ErrorCode } from '@app/shared-kernel';
import { LedgerEntry } from '../infrastructure/persistence/entities/ledger-entry.entity.js';

type PgUpdateReturning<T> = [T[], number];

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error as QueryFailedError & { driverError?: { code?: string } })
      .driverError?.code === '23505'
  );
}

@Injectable()
export class CreditWalletUseCase {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async execute(input: {
    walletId: string;
    amountMinor: number;
    currency: string;
    operationId: string;
    correlationId: string;
  }) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const existing = await manager.findOne(LedgerEntry, {
          where: { operationId: input.operationId },
        });
        if (existing) {
          return {
            walletId: existing.walletId,
            balanceMinor: existing.balanceAfterMinor,
            operationId: existing.operationId,
          };
        }

        const [updatedRows] = (await manager.query(
          `UPDATE wallets
           SET balance_minor = balance_minor + $1
           WHERE id = $2
             AND trim(currency) = $3
           RETURNING balance_minor`,
          [input.amountMinor, input.walletId, input.currency],
        )) as PgUpdateReturning<{ balance_minor: string }>;

        if (updatedRows.length === 0) {
          throw new NotFoundException({ code: ErrorCode.NOT_FOUND });
        }

        const balanceAfter = Number(updatedRows[0].balance_minor);

        await manager.save(
          manager.create(LedgerEntry, {
            id: randomUUID(),
            walletId: input.walletId,
            operationId: input.operationId,
            direction: 'CREDIT',
            amountMinor: input.amountMinor,
            currency: input.currency,
            balanceAfterMinor: balanceAfter,
            correlationId: input.correlationId,
          }),
        );

        return {
          walletId: input.walletId,
          balanceMinor: balanceAfter,
          operationId: input.operationId,
        };
      });
    } catch (error) {
      // Course concurrente : le premier INSERT gagne ; on rollback (dont le crédit)
      // via l'échec de la TX, puis on renvoie le résultat mémorisé.
      if (isUniqueViolation(error)) {
        const raced = await this.dataSource.getRepository(LedgerEntry).findOne({
          where: { operationId: input.operationId },
        });
        if (raced) {
          return {
            walletId: raced.walletId,
            balanceMinor: raced.balanceAfterMinor,
            operationId: raced.operationId,
          };
        }
      }
      throw error;
    }
  }
}
