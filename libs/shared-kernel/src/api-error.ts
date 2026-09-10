import { ErrorCode } from './error-codes.js';

export type ApiErrorBody = {
  code: ErrorCode;
  message: string;
  correlation_id: string;
  details?: Record<string, unknown>;
};
