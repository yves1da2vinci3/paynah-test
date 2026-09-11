import { createHash } from 'crypto';
import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import type {
  PaymentFailedEvent,
  PaymentSucceededEvent,
} from '@app/shared-kernel';
import { RecordTransactionHandler } from '../../application/commands/record-transaction.handler.js';
import { InboxEventEntity } from '../persistence/entities/inbox-event.entity.js';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error as QueryFailedError & { driverError?: { code?: string } })
      .driverError?.code === '23505'
  );
}

function payloadHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

@Controller()
export class PaymentEventsConsumer {
  private readonly logger = new Logger(PaymentEventsConsumer.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly record: RecordTransactionHandler,
  ) {}

  @EventPattern('payment.succeeded')
  async onSucceeded(payload: PaymentSucceededEvent) {
    await this.dataSource.transaction(async (manager) => {
      const claimed = await this.tryClaimInbox(manager, payload);
      if (!claimed) return;

      const p = payload.payload;
      const occurredAt = new Date(payload.occurred_at);
      const base = {
        paymentId: p.payment_id,
        amountMinor: p.amount_minor,
        currency: p.currency,
        status: 'SUCCEEDED',
        correlationId: payload.correlation_id,
        occurredAt,
      };

      await this.record.execute(
        {
          ...base,
          operationId: `${p.payment_id}:journal:debit`,
          eventId: payload.event_id,
          accountId: p.source_account_id,
          walletId: p.source_account_id,
          counterpartyWalletId: p.destination_account_id,
          direction: 'DEBIT',
        },
        manager,
      );

      await this.record.execute(
        {
          ...base,
          operationId: `${p.payment_id}:journal:credit`,
          eventId: null,
          accountId: p.destination_account_id,
          walletId: p.destination_account_id,
          counterpartyWalletId: p.source_account_id,
          direction: 'CREDIT',
        },
        manager,
      );
    });
  }

  @EventPattern('payment.failed')
  async onFailed(payload: PaymentFailedEvent) {
    await this.dataSource.transaction(async (manager) => {
      const claimed = await this.tryClaimInbox(manager, payload);
      if (!claimed) return;

      const p = payload.payload;
      await this.record.execute(
        {
          operationId: `${p.payment_id}:journal:failed`,
          eventId: payload.event_id,
          paymentId: p.payment_id,
          accountId: p.source_account_id,
          walletId: p.source_account_id,
          counterpartyWalletId: p.destination_account_id,
          direction: 'TRANSFER',
          amountMinor: p.amount_minor,
          currency: p.currency,
          status: 'FAILED',
          correlationId: payload.correlation_id,
          occurredAt: new Date(payload.occurred_at),
        },
        manager,
      );
    });
  }

  private async tryClaimInbox(
    manager: EntityManager,
    payload: PaymentSucceededEvent | PaymentFailedEvent,
  ): Promise<boolean> {
    try {
      await manager.insert(InboxEventEntity, {
        eventId: payload.event_id,
        eventType: payload.event_type,
        payloadHash: payloadHash(payload),
      });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) {
        this.logger.debug(`Duplicate event skipped: ${payload.event_id}`);
        return false;
      }
      throw error;
    }
  }
}
