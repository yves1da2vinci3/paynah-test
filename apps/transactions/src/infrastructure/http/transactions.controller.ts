import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RecordTransactionHandler } from '../../application/commands/record-transaction.handler.js';
import { GetTransactionHistoryHandler } from '../../application/queries/get-transaction-history.handler.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { GetTransactionsQueryDto } from './dto/get-transactions-query.dto.js';

@Controller('transactions')
export class TransactionsHttpController {
  constructor(
    private readonly record: RecordTransactionHandler,
    private readonly history: GetTransactionHistoryHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTransactionDto) {
    const tx = await this.record.execute({
      operationId: dto.operationId,
      eventId: dto.eventId,
      paymentId: dto.paymentId,
      accountId: dto.accountId,
      walletId: dto.walletId,
      counterpartyWalletId: dto.counterpartyWalletId,
      direction: dto.direction,
      amountMinor: dto.amountMinor,
      currency: dto.currency,
      status: dto.status,
      correlationId: dto.correlationId ?? randomUUID(),
      occurredAt: new Date(dto.occurredAt),
    });

    return {
      id: tx.id,
      operationId: tx.operationId,
      eventId: tx.eventId,
      paymentId: tx.paymentId,
      accountId: tx.accountId,
      walletId: tx.walletId,
      counterpartyWalletId: tx.counterpartyWalletId,
      direction: tx.direction,
      amountMinor: tx.amountMinor,
      currency: tx.currency.trim(),
      status: tx.status,
      correlationId: tx.correlationId,
      occurredAt: tx.occurredAt,
      createdAt: tx.createdAt,
    };
  }

  @Get()
  async list(@Query() query: GetTransactionsQueryDto) {
    const result = await this.history.execute({
      accountId: query.accountId,
      walletId: query.walletId,
      limit: query.limit,
      cursor: query.cursor,
      page: query.page,
    });

    return {
      items: result.items.map((tx) => ({
        id: tx.id,
        paymentId: tx.paymentId,
        walletId: tx.walletId,
        direction: tx.direction,
        amountMinor: tx.amountMinor,
        currency: tx.currency.trim(),
        status: tx.status,
        occurredAt: tx.occurredAt,
      })),
      nextCursor: result.nextCursor,
      page: result.page,
      limit: result.limit,
    };
  }
}
