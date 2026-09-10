import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';
import { ErrorCode } from '@app/shared-kernel';

export function mapAccountsHttpError(err: unknown): never {
  const ax = err as AxiosError<{ code?: string }>;
  if (ax.code === 'ECONNABORTED') {
    throw new HttpException(
      { code: ErrorCode.DOWNSTREAM_TIMEOUT, message: 'Comptes timeout' },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
  const status = ax.response?.status;
  const code = ax.response?.data?.code;
  if (status === 422 && code === ErrorCode.INSUFFICIENT_FUNDS) {
    throw new HttpException(
      { code: ErrorCode.INSUFFICIENT_FUNDS, message: 'Solde insuffisant' },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  throw new HttpException(
    { code: ErrorCode.DOWNSTREAM_UNAVAILABLE, message: 'Comptes unavailable' },
    HttpStatus.SERVICE_UNAVAILABLE,
  );
}
