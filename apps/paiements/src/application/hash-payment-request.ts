import { createHash } from 'crypto';

export function hashPaymentRequest(body: {
  sourceAccountId: string;
  destinationAccountId: string;
  amountMinor: number;
  currency: string;
}): string {
  const canonical = JSON.stringify({
    amountMinor: body.amountMinor,
    currency: body.currency,
    destinationAccountId: body.destinationAccountId,
    sourceAccountId: body.sourceAccountId,
  });
  return createHash('sha256').update(canonical).digest('hex');
}
