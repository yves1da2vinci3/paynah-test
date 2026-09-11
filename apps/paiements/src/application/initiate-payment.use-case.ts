import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import {
  ErrorCode,
  type PaymentFailedEvent,
  type PaymentSucceededEvent,
} from '@app/shared-kernel';
import {
  assertTransition,
  PaymentStatus,
} from '../domain/payment-status.js';
import { IdempotencyKeyEntity } from '../infrastructure/persistence/entities/idempotency-key.entity.js';
import { OutboxEventEntity } from '../infrastructure/persistence/entities/outbox-event.entity.js';
import { PaymentEntity } from '../infrastructure/persistence/entities/payment.entity.js';
import { hashPaymentRequest } from './hash-payment-request.js';
import { ACCOUNTS_PORT, type AccountsPort } from './ports/accounts.port.js';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error as QueryFailedError & { driverError?: { code?: string } })
      .driverError?.code === '23505'
  );
}

function extractFailureCode(e: unknown): string {
  if (e instanceof HttpException) {
    const body = e.getResponse();
    if (typeof body === 'object' && body !== null && 'code' in body) {
      return String((body as { code: string }).code);
    }
  }
  const nested = e as { response?: { code?: string } };
  return nested.response?.code ?? ErrorCode.DOWNSTREAM_UNAVAILABLE;
}

function paymentToBody(p: PaymentEntity): Record<string, unknown> {
  return {
    id: p.id,
    sourceAccountId: p.sourceAccountId,
    destinationAccountId: p.destinationAccountId,
    amountMinor: p.amountMinor,
    currency: p.currency.trim(),
    status: p.status,
    failureCode: p.failureCode,
    correlationId: p.correlationId,
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
    updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
  };
}

export type InitiatePaymentResult = {
  statusCode: number;
  body: Record<string, unknown>;
};

@Injectable()
export class InitiatePaymentUseCase {
  private readonly logger = new Logger(InitiatePaymentUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly http: HttpService,
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(IdempotencyKeyEntity)
    private readonly idempotencyKeys: Repository<IdempotencyKeyEntity>,
    @Inject(ACCOUNTS_PORT) private readonly accounts: AccountsPort,
  ) {}

  async execute(input: {
    sourceAccountId: string;
    destinationAccountId: string;
    amountMinor: number;
    currency: string;
    correlationId: string;
    idempotencyKey: string;
  }): Promise<InitiatePaymentResult> {
    if (!input.idempotencyKey?.trim()) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Idempotency-Key header is required',
      });
    }

    const requestHash = hashPaymentRequest({
      sourceAccountId: input.sourceAccountId,
      destinationAccountId: input.destinationAccountId,
      amountMinor: input.amountMinor,
      currency: input.currency,
    });

    const existing = await this.idempotencyKeys.findOne({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing && existing.expiresAt > new Date()) {
      if (existing.requestHash.trim() !== requestHash) {
        throw new ConflictException({
          code: ErrorCode.IDEMPOTENCY_KEY_REUSE,
          message: 'Idempotency-Key reused with different payload',
        });
      }
      return {
        statusCode: existing.responseCode,
        body: existing.responseBody,
      };
    }

    const payment = await this.runSaga(input);
    const body = paymentToBody(payment);
    const statusCode = HttpStatus.CREATED;

    try {
      await this.idempotencyKeys.save(
        this.idempotencyKeys.create({
          idempotencyKey: input.idempotencyKey,
          requestHash,
          paymentId: payment.id,
          responseCode: statusCode,
          responseBody: body,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
        }),
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        const raced = await this.idempotencyKeys.findOne({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (raced) {
          if (raced.requestHash.trim() !== requestHash) {
            throw new ConflictException({
              code: ErrorCode.IDEMPOTENCY_KEY_REUSE,
              message: 'Idempotency-Key reused with different payload',
            });
          }
          return {
            statusCode: raced.responseCode,
            body: raced.responseBody,
          };
        }
      }
      throw error;
    }

    return { statusCode, body };
  }

  private useOutbox(): boolean {
    return this.config.getOrThrow<string>('USE_OUTBOX') === 'true';
  }

  private async runSaga(input: {
    sourceAccountId: string;
    destinationAccountId: string;
    amountMinor: number;
    currency: string;
    correlationId: string;
  }): Promise<PaymentEntity> {
    const payment = await this.payments.save(
      this.payments.create({
        id: randomUUID(),
        sourceAccountId: input.sourceAccountId,
        destinationAccountId: input.destinationAccountId,
        amountMinor: input.amountMinor,
        currency: input.currency,
        status: PaymentStatus.PENDING,
        failureCode: null,
        correlationId: input.correlationId,
      }),
    );

    try {
      await this.accounts.debit({
        accountId: input.sourceAccountId,
        amountMinor: input.amountMinor,
        currency: input.currency,
        operationId: `${payment.id}:debit`,
        correlationId: input.correlationId,
      });
    } catch (e) {
      const code = extractFailureCode(e);
      await this.finalizePayment(payment, PaymentStatus.FAILED, code);
      throw e;
    }

    assertTransition(payment.status, PaymentStatus.DEBITED);
    payment.status = PaymentStatus.DEBITED;
    await this.payments.save(payment);

    try {
      await this.accounts.credit({
        accountId: input.destinationAccountId,
        amountMinor: input.amountMinor,
        currency: input.currency,
        operationId: `${payment.id}:credit`,
        correlationId: input.correlationId,
      });
    } catch (e) {
      await this.accounts.credit({
        accountId: input.sourceAccountId,
        amountMinor: input.amountMinor,
        currency: input.currency,
        operationId: `${payment.id}:compensate`,
        correlationId: input.correlationId,
      });
      await this.finalizePayment(
        payment,
        PaymentStatus.COMPENSATED,
        ErrorCode.DOWNSTREAM_UNAVAILABLE,
      );
      throw e;
    }

    await this.finalizePayment(payment, PaymentStatus.COMPLETED, null);
    return payment;
  }

  private async finalizePayment(
    payment: PaymentEntity,
    status:
      | PaymentStatus.COMPLETED
      | PaymentStatus.FAILED
      | PaymentStatus.COMPENSATED,
    failureCode: string | null,
  ): Promise<void> {
    assertTransition(payment.status, status);
    const useOutbox = this.useOutbox();

    await this.dataSource.transaction(async (manager) => {
      payment.status = status;
      payment.failureCode = failureCode;
      await manager.save(payment);

      if (!useOutbox) return;

      const eventId = randomUUID();
      const occurredAt = new Date().toISOString();

      if (status === PaymentStatus.COMPLETED) {
        const event: PaymentSucceededEvent = {
          event_id: eventId,
          event_type: 'payment.succeeded',
          occurred_at: occurredAt,
          correlation_id: payment.correlationId,
          payload: {
            payment_id: payment.id,
            source_account_id: payment.sourceAccountId,
            destination_account_id: payment.destinationAccountId,
            amount_minor: payment.amountMinor,
            currency: payment.currency.trim(),
          },
        };
        await manager.save(
          manager.create(OutboxEventEntity, {
            id: randomUUID(),
            eventId,
            eventType: event.event_type,
            routingKey: event.event_type,
            payload: event as unknown as Record<string, unknown>,
            correlationId: payment.correlationId,
            publishedAt: null,
            attempts: 0,
            lastError: null,
          }),
        );
        return;
      }

      const event: PaymentFailedEvent = {
        event_id: eventId,
        event_type: 'payment.failed',
        occurred_at: occurredAt,
        correlation_id: payment.correlationId,
        payload: {
          payment_id: payment.id,
          source_account_id: payment.sourceAccountId,
          destination_account_id: payment.destinationAccountId,
          amount_minor: payment.amountMinor,
          currency: payment.currency.trim(),
          reason_code: failureCode ?? ErrorCode.DOWNSTREAM_UNAVAILABLE,
        },
      };
      await manager.save(
        manager.create(OutboxEventEntity, {
          id: randomUUID(),
          eventId,
          eventType: event.event_type,
          routingKey: event.event_type,
          payload: event as unknown as Record<string, unknown>,
          correlationId: payment.correlationId,
          publishedAt: null,
          attempts: 0,
          lastError: null,
        }),
      );
    });

    if (!useOutbox) {
      await this.journalViaRest(payment, status);
    }
  }

  private async journalViaRest(
    payment: PaymentEntity,
    status:
      | PaymentStatus.COMPLETED
      | PaymentStatus.FAILED
      | PaymentStatus.COMPENSATED,
  ): Promise<void> {
    const base = this.config.getOrThrow<string>('TRANSACTIONS_BASE_URL');
    const occurredAt = new Date().toISOString();
    const currency = payment.currency.trim();

    try {
      if (status === PaymentStatus.COMPLETED) {
        await firstValueFrom(
          this.http.post(`${base}/transactions`, {
            operationId: `${payment.id}:journal:debit`,
            paymentId: payment.id,
            accountId: payment.sourceAccountId,
            walletId: payment.sourceAccountId,
            counterpartyWalletId: payment.destinationAccountId,
            direction: 'DEBIT',
            amountMinor: payment.amountMinor,
            currency,
            status: 'SUCCEEDED',
            correlationId: payment.correlationId,
            occurredAt,
          }),
        );
        await firstValueFrom(
          this.http.post(`${base}/transactions`, {
            operationId: `${payment.id}:journal:credit`,
            paymentId: payment.id,
            accountId: payment.destinationAccountId,
            walletId: payment.destinationAccountId,
            counterpartyWalletId: payment.sourceAccountId,
            direction: 'CREDIT',
            amountMinor: payment.amountMinor,
            currency,
            status: 'SUCCEEDED',
            correlationId: payment.correlationId,
            occurredAt,
          }),
        );
        return;
      }

      await firstValueFrom(
        this.http.post(`${base}/transactions`, {
          operationId: `${payment.id}:journal:failed`,
          paymentId: payment.id,
          accountId: payment.sourceAccountId,
          walletId: payment.sourceAccountId,
          counterpartyWalletId: payment.destinationAccountId,
          direction: 'TRANSFER',
          amountMinor: payment.amountMinor,
          currency,
          status: 'FAILED',
          correlationId: payment.correlationId,
          occurredAt,
        }),
      );
    } catch (e) {
      this.logger.error(
        `REST journal fallback failed for payment ${payment.id}: ${String(e)}`,
      );
      throw e;
    }
  }
}
