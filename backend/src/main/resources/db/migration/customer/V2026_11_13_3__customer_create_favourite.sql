-- customer module: favourites (owner decision 2026-11-13 brings favourites into the MVP, superseding CD-22 for this feature).
-- target_id is a catalog.venue or catalog.service_listing id; the catalog module resolves it.

CREATE SCHEMA IF NOT EXISTS customer;

CREATE TABLE customer.favourite (
    user_id     uuid        NOT NULL REFERENCES identity.user_account (id) ON DELETE CASCADE,
    target_type text        NOT NULL,
    target_id   uuid        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, target_type, target_id),
    CONSTRAINT favourite_target_type_ck CHECK (target_type IN ('VENUE', 'LISTING'))
);

CREATE INDEX favourite_user_created_ix ON customer.favourite (user_id, created_at DESC);
