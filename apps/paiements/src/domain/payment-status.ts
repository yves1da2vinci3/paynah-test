export enum PaymentStatus {
  PENDING = 'PENDING',
  DEBITED = 'DEBITED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  COMPENSATED = 'COMPENSATED',
}

const ALLOWED: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [PaymentStatus.DEBITED, PaymentStatus.FAILED],
  [PaymentStatus.DEBITED]: [PaymentStatus.COMPLETED, PaymentStatus.COMPENSATED],
  [PaymentStatus.COMPLETED]: [],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.COMPENSATED]: [],
};

export function assertTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (!ALLOWED[from].includes(to)) {
    const err = new Error('CONFLICT_STATE');
    (err as Error & { code: string }).code = 'CONFLICT_STATE';
    throw err;
  }
}
