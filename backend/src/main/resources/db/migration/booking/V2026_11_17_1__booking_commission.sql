-- booking module: platform commission (owner request 2026-11-17).
-- The platform keeps a percentage of every booked package and the provider receives the rest. The percentage is one
-- setting an administrator can raise or lower. Each booked item stores the rate and the amount in force when the
-- booking was made, so changing the rate later never alters an existing booking. Rates are in basis points
-- (1 basis point = 0.01%, so 500 = 5%); amounts are in paise.

CREATE TABLE booking.commission_setting (
    id         smallint    PRIMARY KEY DEFAULT 1,
    rate_bps   integer     NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT commission_setting_single_row_ck CHECK (id = 1),
    CONSTRAINT commission_setting_rate_ck CHECK (rate_bps BETWEEN 0 AND 3000)
);

INSERT INTO booking.commission_setting (id, rate_bps) VALUES (1, 500);

-- Every change of the rate, newest first when listed, so the administrator can see who did what and when.
CREATE TABLE booking.commission_change (
    id         uuid        PRIMARY KEY DEFAULT uuidv7(),
    old_bps    integer     NOT NULL,
    new_bps    integer     NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT commission_change_rates_ck CHECK (old_bps BETWEEN 0 AND 3000 AND new_bps BETWEEN 0 AND 3000)
);

CREATE INDEX commission_change_changed_ix ON booking.commission_change (changed_at DESC);

ALTER TABLE booking.booking_item
    ADD COLUMN commission_bps   integer NOT NULL DEFAULT 0,
    ADD COLUMN commission_minor bigint  NOT NULL DEFAULT 0,
    ADD CONSTRAINT booking_item_commission_ck CHECK (
        commission_bps BETWEEN 0 AND 3000 AND commission_minor >= 0 AND commission_minor <= line_total_minor);

COMMENT ON COLUMN booking.booking_item.commission_minor IS 'Kept by the platform; the provider receives line_total_minor minus this';
