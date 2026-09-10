export const ACCOUNTS_PORT = Symbol('ACCOUNTS_PORT');

export interface AccountsPort {
  debit(input: {
    accountId: string;
    amountMinor: number;
    currency: string;
    operationId: string;
    correlationId: string;
  }): Promise<void>;
  credit(input: {
    accountId: string;
    amountMinor: number;
    currency: string;
    operationId: string;
    correlationId: string;
  }): Promise<void>;
}
