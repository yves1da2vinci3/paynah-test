import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import {
  ErrorCode,
  HEADER_CORRELATION_ID,
  HEADER_IDEMPOTENCY_KEY,
} from '@app/shared-kernel';
import { InitiatePaymentUseCase } from '../../application/initiate-payment.use-case.js';
import { PaymentEntity } from '../persistence/entities/payment.entity.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly initiate: InitiatePaymentUseCase,
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
  ) {}

  @Post()
  async create(
    @Body() dto: CreatePaymentDto,
    @Headers(HEADER_IDEMPOTENCY_KEY) idempotencyKey: string | undefined,
    @Headers(HEADER_CORRELATION_ID) correlationId: string | undefined,
    @Res({ passthrough: true }) res: { status: (code: number) => void },
  ) {
    const result = await this.initiate.execute({
      sourceAccountId: dto.sourceAccountId,
      destinationAccountId: dto.destinationAccountId,
      amountMinor: dto.amountMinor,
      currency: dto.currency,
      correlationId: correlationId ?? randomUUID(),
      idempotencyKey: idempotencyKey ?? '',
    });
    res.status(result.statusCode);
    return result.body;
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const payment = await this.payments.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND });
    }
    return {
      id: payment.id,
      sourceAccountId: payment.sourceAccountId,
      destinationAccountId: payment.destinationAccountId,
      amountMinor: payment.amountMinor,
      currency: payment.currency.trim(),
      status: payment.status,
      failureCode: payment.failureCode,
      correlationId: payment.correlationId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
