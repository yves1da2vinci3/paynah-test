import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RecordTransactionHandler } from '../../application/commands/record-transaction.handler.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';

@Controller('transactions')
export class TransactionsHttpController {
  constructor(private readonly record: RecordTransactionHandler) {}

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
}
