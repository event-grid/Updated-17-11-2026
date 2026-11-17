-- identity module: accounts, roles and one-time sign-in codes (DATABASE_SCHEMA.md, section 3).
-- Customer sign-in is by one-time code (OTP) to a mobile number or an email address (U-01, owner request 2026-11-12).
-- Application code generates the UUIDv7 primary keys (ADR-012); the defaults cover manual inserts.

CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE identity.user_account (
    id               uuid        PRIMARY KEY DEFAULT uuidv7(),
    phone_e164       text,
    email_normalized text,
    display_name     text,
    status           text        NOT NULL DEFAULT 'ACTIVE',
    last_sign_in_at  timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    version          bigint      NOT NULL DEFAULT 0,
    CONSTRAINT user_account_identifier_ck CHECK (phone_e164 IS NOT NULL OR email_normalized IS NOT NULL),
    CONSTRAINT user_account_phone_format_ck CHECK (phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
    CONSTRAINT user_account_status_ck CHECK (status IN ('ACTIVE', 'SUSPENDED'))
);

CREATE UNIQUE INDEX user_account_phone_uk ON identity.user_account (phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE UNIQUE INDEX user_account_email_uk ON identity.user_account (email_normalized) WHERE email_normalized IS NOT NULL;

COMMENT ON COLUMN identity.user_account.status IS 'Provisional CHECK values';

CREATE TABLE identity.role (
    code        text PRIMARY KEY,
    description text NOT NULL
);

INSERT INTO identity.role (code, description) VALUES
    ('CUSTOMER', 'Customer of customer-web'),
    ('PROVIDER', 'Individual vendor or event management company (provider-portal)'),
    ('ADMINISTRATOR', 'EVNTGRID administrator (admin-portal)');

CREATE TABLE identity.user_role (
    user_id    uuid        NOT NULL REFERENCES identity.user_account (id) ON DELETE CASCADE,
    role_code  text        NOT NULL REFERENCES identity.role (code) ON DELETE RESTRICT,
    granted_by uuid        REFERENCES identity.user_account (id) ON DELETE SET NULL,
    granted_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_code)
);

CREATE INDEX user_role_role_user_ix ON identity.user_role (role_code, user_id);

-- One sign-in code request. Only a hash of the code is stored; codes expire within minutes.
CREATE TABLE identity.otp_challenge (
    id          uuid        PRIMARY KEY DEFAULT uuidv7(),
    channel     text        NOT NULL,
    destination text        NOT NULL,
    code_hash   text        NOT NULL,
    attempts    integer     NOT NULL DEFAULT 0,
    expires_at  timestamptz NOT NULL,
    consumed_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT otp_challenge_channel_ck CHECK (channel IN ('PHONE', 'EMAIL')),
    CONSTRAINT otp_challenge_attempts_ck CHECK (attempts >= 0)
);

CREATE INDEX otp_challenge_destination_created_ix ON identity.otp_challenge (destination, created_at);

COMMENT ON COLUMN identity.otp_challenge.destination IS 'Normalised: E.164 phone number or lower-case email address';
