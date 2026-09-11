import { HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { ErrorCode } from '@app/shared-kernel';
import {
  assertTransition,
  PaymentStatus,
} from '../domain/payment-status.js';
import { PaymentEntity } from '../infrastructure/persistence/entities/payment.entity.js';
import { ACCOUNTS_PORT, type AccountsPort } from './ports/accounts.port.js';

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

@Injectable()
export class InitiatePaymentUseCase {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
    @Inject(ACCOUNTS_PORT) private readonly accounts: AccountsPort,
  ) {}

  async execute(input: {
    sourceAccountId: string;
    destinationAccountId: string;
    amountMinor: number;
    currency: string;
    correlationId: string;
  }) {
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
