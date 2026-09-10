export type PaymentSucceededEvent = {
    event_id: string;
    event_type: 'payment.succeeded';
    occurred_at: string;
    correlation_id: string;
    payload: {
        payment_id: string;
        source_account_id: string;
        destination_account_id: string;
        amount_minor: number;
        currency: string;
    };
};
export type PaymentFailedEvent = {
    event_id: string;
    event_type: 'payment.failed';
    occurred_at: string;
    correlation_id: string;
    payload: {
        payment_id: string;
        source_account_id: string;
        destination_account_id: string;
        amount_minor: number;
        currency: string;
        reason_code: string;
    };
};
