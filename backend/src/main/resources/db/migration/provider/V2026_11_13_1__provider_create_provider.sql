-- provider module: the businesses behind venues and service listings (DATABASE_SCHEMA.md, section 5).
-- Verification, members and approval decisions come with the provider portal; approval_status is set by staff until then.

CREATE SCHEMA IF NOT EXISTS provider;

CREATE TABLE provider.provider_type (
    code  text PRIMARY KEY,
    label text NOT NULL
);

INSERT INTO provider.provider_type (code, label) VALUES
    ('INDIVIDUAL', 'Individual vendor'),
    ('COMPANY', 'Event management company or business');

CREATE TABLE provider.provider (
    id                 uuid        PRIMARY KEY DEFAULT uuidv7(),
    slug               text        NOT NULL,
    provider_type_code text        NOT NULL REFERENCES provider.provider_type (code),
    display_name       text        NOT NULL,
    city               text        NOT NULL,
    area               text,
    about              text,
    approval_status    text        NOT NULL DEFAULT 'PENDING',
    approved_at        timestamptz,
    is_demo            boolean     NOT NULL DEFAULT false,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    version            bigint      NOT NULL DEFAULT 0,
    CONSTRAINT provider_slug_uk UNIQUE (slug),
    CONSTRAINT provider_slug_format_ck CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT provider_approval_status_ck CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX provider_approval_created_ix ON provider.provider (approval_status, created_at);
CREATE INDEX provider_type_ix ON provider.provider (provider_type_code);

COMMENT ON COLUMN provider.provider.is_demo IS 'Development demo data (db/demo migrations); never a real business';
