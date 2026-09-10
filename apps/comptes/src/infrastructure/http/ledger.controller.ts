import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { HEADER_CORRELATION_ID } from '@app/shared-kernel';
import { CreditWalletUseCase } from '../../application/credit-wallet.use-case.js';
import { DebitWalletUseCase } from '../../application/debit-wallet.use-case.js';
import { ServiceAuthGuard } from '../auth/service-auth.guard.js';
import { LedgerMutationDto } from './dto/ledger-mutation.dto.js';

@Controller('accounts')
@UseGuards(ServiceAuthGuard)
export class LedgerController {
  constructor(
    private readonly debit: DebitWalletUseCase,
    private readonly credit: CreditWalletUseCase,
  ) {}

  @Post(':id/debit')
  @HttpCode(HttpStatus.OK)
  debitWallet(
    @Param('id') id: string,
    @Body() dto: LedgerMutationDto,
    @Headers(HEADER_CORRELATION_ID) correlationId?: string,
  ) {
    return this.debit.execute({
      walletId: id,
      amountMinor: dto.amountMinor,
      currency: dto.currency,
      operationId: dto.operationId,
      correlationId: correlationId ?? randomUUID(),
    });
  }

  @Post(':id/credit')
  @HttpCode(HttpStatus.OK)
  creditWallet(
    @Param('id') id: string,
    @Body() dto: LedgerMutationDto,
    @Headers(HEADER_CORRELATION_ID) correlationId?: string,
  ) {
    return this.credit.execute({
      walletId: id,
      amountMinor: dto.amountMinor,
      currency: dto.currency,
      operationId: dto.operationId,
      correlationId: correlationId ?? randomUUID(),
    });
  }
}
