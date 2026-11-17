-- payment module: Razorpay payments and webhook receipts (DATABASE_SCHEMA.md, section 10).
-- reference_id is the booking id; the payment module does not depend on the booking module.

CREATE SCHEMA IF NOT EXISTS payment;

CREATE TABLE payment.payment (
    id                  uuid        PRIMARY KEY DEFAULT uuidv7(),
    reference_id        uuid        NOT NULL,
    user_id             uuid        NOT NULL,
    amount_minor        bigint      NOT NULL,
    currency            text        NOT NULL DEFAULT 'INR',
    status              text        NOT NULL,
    razorpay_order_id   text        NOT NULL,
    razorpay_payment_id text,
    failure_code        text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    captured_at         timestamptz,
    updated_at          timestamptz NOT NULL DEFAULT now(),
    version             bigint      NOT NULL DEFAULT 0,
    CONSTRAINT payment_razorpay_order_uk UNIQUE (razorpay_order_id),
    CONSTRAINT payment_amount_ck CHECK (amount_minor > 0),
    CONSTRAINT payment_status_ck CHECK (status IN ('CREATED', 'CAPTURED', 'FAILED'))
);

CREATE UNIQUE INDEX payment_razorpay_payment_uk ON payment.payment (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX payment_reference_created_ix ON payment.payment (reference_id, created_at DESC);
CREATE INDEX payment_status_created_ix ON payment.payment (status, created_at);

CREATE TABLE payment.payment_webhook_event (
    razorpay_event_id text        PRIMARY KEY,
    event_type        text        NOT NULL,
    raw_body          text        NOT NULL,
    received_at       timestamptz NOT NULL DEFAULT now(),
    processing_status text        NOT NULL DEFAULT 'RECEIVED',
    processed_at      timestamptz,
    CONSTRAINT payment_webhook_event_status_ck CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'IGNORED'))
);

CREATE INDEX payment_webhook_event_status_received_ix ON payment.payment_webhook_event (processing_status, received_at);
