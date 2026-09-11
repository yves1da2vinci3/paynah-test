import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { ErrorCode } from '@app/shared-kernel';
import {
  assertTransition,
  PaymentStatus,
} from '../domain/payment-status.js';
import { IdempotencyKeyEntity } from '../infrastructure/persistence/entities/idempotency-key.entity.js';
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
  constructor(
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
      assertTransition(payment.status, PaymentStatus.FAILED);
      payment.status = PaymentStatus.FAILED;
      payment.failureCode = code;
      await this.payments.save(payment);
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
      // compensation: chap. 04/05
      throw e;
    }

    assertTransition(payment.status, PaymentStatus.COMPLETED);
    payment.status = PaymentStatus.COMPLETED;
    await this.payments.save(payment);
    return payment;
  }
}
