-- catalog module: event taxonomy (DATABASE_SCHEMA.md, section 6).
-- Source wording is stored verbatim. display_name values are provisional until decision D-01.
-- uuidv7() requires PostgreSQL 18 (ADR-026). Application code that inserts rows generates its own UUIDv7 (ADR-012).

CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE catalog.event_category (
    id                  uuid        PRIMARY KEY DEFAULT uuidv7(),
    code                text        NOT NULL,
    source_main_name    text        NOT NULL,
    source_section_name text,
    display_name        text        NOT NULL,
    sort_order          integer     NOT NULL,
    is_active           boolean     NOT NULL DEFAULT true,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT event_category_code_uk UNIQUE (code),
    CONSTRAINT event_category_code_format_ck CHECK (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE INDEX event_category_active_sort_ix ON catalog.event_category (is_active, sort_order);

COMMENT ON COLUMN catalog.event_category.source_section_name IS 'NULL where the source has no Sub Services section (Surprise Events, D-02)';

CREATE TABLE catalog.event_subcategory (
    id           uuid        PRIMARY KEY DEFAULT uuidv7(),
    category_id  uuid        NOT NULL REFERENCES catalog.event_category (id) ON DELETE RESTRICT,
    kind         text        NOT NULL,
    code         text        NOT NULL,
    source_label text        NOT NULL,
    display_name text        NOT NULL,
    sort_order   integer     NOT NULL,
    is_active    boolean     NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT event_subcategory_kind_ck CHECK (kind IN ('EVENT_TYPE', 'SUBCATEGORY')),
    CONSTRAINT event_subcategory_category_code_uk UNIQUE (category_id, code)
);

CREATE INDEX event_subcategory_category_kind_sort_ix ON catalog.event_subcategory (category_id, kind, sort_order);

CREATE TABLE catalog.service (
    id         uuid        PRIMARY KEY DEFAULT uuidv7(),
    code       text        NOT NULL,
    name       text        NOT NULL,
    is_active  boolean     NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT service_code_uk UNIQUE (code)
);
-- The trigram index on name waits for approval of pg_trgm (TA-15).

CREATE TABLE catalog.category_service (
    id           uuid        PRIMARY KEY DEFAULT uuidv7(),
    category_id  uuid        NOT NULL REFERENCES catalog.event_category (id) ON DELETE RESTRICT,
    service_id   uuid        NOT NULL REFERENCES catalog.service (id) ON DELETE RESTRICT,
    source_label text        NOT NULL,
    is_rental    boolean     NOT NULL DEFAULT false,
    is_optional  boolean     NOT NULL DEFAULT false,
    sort_order   integer     NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT category_service_category_label_uk UNIQUE (category_id, source_label)
);

CREATE INDEX category_service_category_sort_ix ON catalog.category_service (category_id, sort_order);
CREATE INDEX category_service_service_ix ON catalog.category_service (service_id);

CREATE TABLE catalog.service_option (
    id                  uuid        PRIMARY KEY DEFAULT uuidv7(),
    category_service_id uuid        NOT NULL REFERENCES catalog.category_service (id) ON DELETE RESTRICT,
    kind                text        NOT NULL,
    source_label        text        NOT NULL,
    display_name        text        NOT NULL,
    sort_order          integer     NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT service_option_kind_ck CHECK (kind IN ('OPTION', 'ATTRIBUTE')),
    CONSTRAINT service_option_service_label_uk UNIQUE (category_service_id, source_label)
);

CREATE INDEX service_option_service_sort_ix ON catalog.service_option (category_service_id, sort_order);
