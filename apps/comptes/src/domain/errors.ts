import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@app/shared-kernel';

export class InsufficientFundsError extends HttpException {
  constructor(details?: Record<string, unknown>) {
    super(
      {
        code: ErrorCode.INSUFFICIENT_FUNDS,
        message: 'Solde insuffisant',
        details,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
