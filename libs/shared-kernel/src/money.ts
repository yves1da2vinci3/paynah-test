export type Money = {
  amountMinor: number;
  currency: string;
};

export function assertMoney(m: Money): void {
  if (!Number.isInteger(m.amountMinor) || m.amountMinor <= 0) {
    throw new Error('amountMinor must be a positive integer');
  }
  if (!/^[A-Z]{3}$/.test(m.currency)) {
    throw new Error('currency must be ISO 4217 (3 letters)');
  }
}
