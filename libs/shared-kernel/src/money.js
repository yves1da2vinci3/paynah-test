export function assertMoney(m) {
    if (!Number.isInteger(m.amountMinor) || m.amountMinor <= 0) {
        throw new Error('amountMinor must be a positive integer');
    }
    if (!/^[A-Z]{3}$/.test(m.currency)) {
        throw new Error('currency must be ISO 4217 (3 letters)');
    }
}
//# sourceMappingURL=money.js.map