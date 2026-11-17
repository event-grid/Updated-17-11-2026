-- booking module: cart and bookings (owner decision 2026-11-13: fixed-price packages bought through a cart,
-- with an advance paid by Razorpay at checkout). Amounts are in paise. Package details are copied into
-- booking_item at checkout, so later price changes never alter a booking.

CREATE SCHEMA IF NOT EXISTS booking;

CREATE TABLE booking.cart_item (
    id          uuid        PRIMARY KEY DEFAULT uuidv7(),
    user_id     uuid        NOT NULL REFERENCES identity.user_account (id) ON DELETE CASCADE,
    package_id  uuid        NOT NULL,
    quantity    integer     NOT NULL,
    event_date  date        NOT NULL,
    notes       text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cart_item_quantity_ck CHECK (quantity >= 1),
    CONSTRAINT cart_item_user_package_date_uk UNIQUE (user_id, package_id, event_date)
);

CREATE INDEX cart_item_user_created_ix ON booking.cart_item (user_id, created_at);

CREATE TABLE booking.booking (
    id                   uuid        PRIMARY KEY DEFAULT uuidv7(),
    reference            text        NOT NULL,
    user_id              uuid        NOT NULL REFERENCES identity.user_account (id) ON DELETE RESTRICT,
    status               text        NOT NULL,
    currency             text        NOT NULL DEFAULT 'INR',
    total_minor          bigint      NOT NULL,
    advance_percent      integer     NOT NULL,
    advance_minor        bigint      NOT NULL,
    balance_minor        bigint      NOT NULL,
    advance_paid_at      timestamptz,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),
    version              bigint      NOT NULL DEFAULT 0,
    CONSTRAINT booking_reference_uk UNIQUE (reference),
    -- Provisional statuses: provider confirmation and cancellation rules wait on D-22 and D-25.
    CONSTRAINT booking_status_ck CHECK (status IN ('PENDING_PAYMENT', 'ADVANCE_PAID', 'PAYMENT_FAILED', 'EXPIRED')),
    CONSTRAINT booking_amounts_ck CHECK (total_minor > 0 AND advance_minor > 0 AND balance_minor >= 0
        AND advance_minor + balance_minor = total_minor),
    CONSTRAINT booking_advance_percent_ck CHECK (advance_percent BETWEEN 1 AND 100)
);

CREATE INDEX booking_user_created_ix ON booking.booking (user_id, created_at DESC);
CREATE INDEX booking_status_created_ix ON booking.booking (status, created_at);

CREATE TABLE booking.booking_item (
    id               uuid    PRIMARY KEY DEFAULT uuidv7(),
    booking_id       uuid    NOT NULL REFERENCES booking.booking (id) ON DELETE CASCADE,
    package_id       uuid    NOT NULL,
    provider_id      uuid    NOT NULL,
    provider_name    text    NOT NULL,
    listing_title    text    NOT NULL,
    package_title    text    NOT NULL,
    category_name    text    NOT NULL,
    price_unit       text    NOT NULL,
    unit_price_minor bigint  NOT NULL,
    quantity         integer NOT NULL,
    line_total_minor bigint  NOT NULL,
    event_date       date    NOT NULL,
    notes            text,
    CONSTRAINT booking_item_amounts_ck CHECK (unit_price_minor > 0 AND quantity >= 1 AND line_total_minor = unit_price_minor * quantity)
);

CREATE INDEX booking_item_booking_ix ON booking.booking_item (booking_id);
