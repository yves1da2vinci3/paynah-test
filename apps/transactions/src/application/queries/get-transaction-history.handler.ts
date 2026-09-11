import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from '../../infrastructure/persistence/entities/transaction.entity.js';

export type GetTransactionHistoryQuery = {
  accountId: string;
  walletId?: string;
  limit?: number;
  cursor?: string;
  page?: number;
};

@Injectable()
export class GetTransactionHistoryHandler {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repo: Repository<TransactionEntity>,
  ) {}

  async execute(q: GetTransactionHistoryQuery) {
    const limit = Math.min(q.limit ?? 20, 100);
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.account_id = :accountId', { accountId: q.accountId })
      .orderBy('t.occurred_at', 'DESC')
      .addOrderBy('t.id', 'DESC')
      .take(limit);

    if (q.walletId) {
      qb.andWhere('t.wallet_id = :walletId', { walletId: q.walletId });
    }

    if (q.cursor) {
      const [occurredAt, id] = Buffer.from(q.cursor, 'base64')
        .toString('utf8')
        .split('|');
      qb.andWhere('(t.occurred_at, t.id) < (:occurredAt, :id)', {
        occurredAt,
        id,
      });
    } else if (q.page && q.page > 1) {
      qb.skip((q.page - 1) * limit);
    }

    const items = await qb.getMany();
    const last = items[items.length - 1];
    const nextCursor = last
      ? Buffer.from(
          `${last.occurredAt.toISOString()}|${last.id}`,
        ).toString('base64')
      : null;

    return {
      items,
      nextCursor,
      page: q.page ?? 1,
      limit,
    };
  }
}
