import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  HEADER_CORRELATION_ID,
  HEADER_SERVICE_TOKEN,
} from '@app/shared-kernel';
import {
  AccountsPort,
} from '../../application/ports/accounts.port.js';
import { mapAccountsHttpError } from './errors/http-error.mapper.js';

@Injectable()
export class AccountsHttpClient implements AccountsPort {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async debit(input: {
    accountId: string;
    amountMinor: number;
    currency: string;
    operationId: string;
    correlationId: string;
  }): Promise<void> {
    await this.mutate('debit', input);
  }

  async credit(input: {
    accountId: string;
    amountMinor: number;
    currency: string;
    operationId: string;
    correlationId: string;
  }): Promise<void> {
    await this.mutate('credit', input);
  }

  private async mutate(
    action: 'debit' | 'credit',
    input: {
      accountId: string;
      amountMinor: number;
      currency: string;
      operationId: string;
      correlationId: string;
    },
  ) {
    const base = this.config.getOrThrow<string>('COMPTES_BASE_URL');
    const token = this.config.getOrThrow<string>(
      'SERVICE_TOKEN_PAIEMENTS_TO_COMPTES',
    );
    try {
      await firstValueFrom(
        this.http.post(
          `${base}/accounts/${input.accountId}/${action}`,
          {
            amountMinor: input.amountMinor,
            currency: input.currency,
            operationId: input.operationId,
          },
          {
            timeout: 2000,
            headers: {
              [HEADER_SERVICE_TOKEN]: token,
              [HEADER_CORRELATION_ID]: input.correlationId,
            },
          },
        ),
      );
    } catch (e) {
      mapAccountsHttpError(e);
    }
  }
}
