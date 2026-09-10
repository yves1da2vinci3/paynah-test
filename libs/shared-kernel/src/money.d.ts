export type Money = {
    amountMinor: number;
    currency: string;
};
export declare function assertMoney(m: Money): void;
