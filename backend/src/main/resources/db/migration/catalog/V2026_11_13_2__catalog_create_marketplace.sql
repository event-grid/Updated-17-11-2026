-- catalog module: venues, what each venue owner allows (SR-2), service listings and their fixed-price packages
-- (DATABASE_SCHEMA.md, section 6). Buying model: fixed-price packages bought through a cart (owner decision 2026-11-13).
-- Amounts are in paise (minor units). Provider rows live in the provider module; only their id is referenced.

CREATE TABLE catalog.venue_type (
    code         text    PRIMARY KEY,
    source_label text    NOT NULL,
    display_name text    NOT NULL,
    sort_order   integer NOT NULL,
    is_active    boolean NOT NULL DEFAULT true
);

-- Only types named in the source catalogue (choultries, halls, banquets, party halls, resorts, open grounds, auditoriums).
INSERT INTO catalog.venue_type (code, source_label, display_name, sort_order) VALUES
    ('choultry', 'choultry', 'Choultry', 1),
    ('hall', 'halls', 'Hall', 2),
    ('banquet', 'banquets', 'Banquet', 3),
    ('party-hall', 'Party halls', 'Party hall', 4),
    ('resort', 'Resorts', 'Resort', 5),
    ('open-ground', 'Open Grounds', 'Open ground', 6),
    ('auditorium', 'auditorium Hall''s', 'Auditorium', 7);

CREATE TABLE catalog.venue (
    id                 uuid        PRIMARY KEY DEFAULT uuidv7(),
    provider_id        uuid        NOT NULL REFERENCES provider.provider (id) ON DELETE RESTRICT,
    slug               text        NOT NULL,
    venue_type_code    text        NOT NULL REFERENCES catalog.venue_type (code),
    name               text        NOT NULL,
    city               text        NOT NULL,
    area               text,
    description        text,
    capacity_min       integer,
    capacity_max       integer,
    publication_status text        NOT NULL DEFAULT 'DRAFT',
    published_at       timestamptz,
    is_demo            boolean     NOT NULL DEFAULT false,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    version            bigint      NOT NULL DEFAULT 0,
    CONSTRAINT venue_slug_uk UNIQUE (slug),
    CONSTRAINT venue_id_provider_uk UNIQUE (id, provider_id),
    CONSTRAINT venue_publication_status_ck CHECK (publication_status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED')),
    CONSTRAINT venue_capacity_ck CHECK (capacity_min IS NULL OR capacity_max IS NULL OR capacity_min <= capacity_max)
);

CREATE INDEX venue_provider_status_ix ON catalog.venue (provider_id, publication_status);
CREATE INDEX venue_city_type_ix ON catalog.venue (city, venue_type_code) WHERE publication_status = 'PUBLISHED';

-- What a venue owner has stated about a service. No row: nothing stated, and no SR-2 message (ADR-018).
-- NOT_ALLOWED is the source rule ("the owner does not allow xyz services"); PROVIDED (the venue supplies it
-- itself) and ALLOWED (outside vendors welcome) are provisional until D-14.
CREATE TABLE catalog.venue_service_availability (
    id           uuid        PRIMARY KEY DEFAULT uuidv7(),
    venue_id     uuid        NOT NULL REFERENCES catalog.venue (id) ON DELETE CASCADE,
    service_id   uuid        NOT NULL REFERENCES catalog.service (id) ON DELETE RESTRICT,
    status       text        NOT NULL,
    display_text text,
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT venue_service_availability_uk UNIQUE (venue_id, service_id),
    CONSTRAINT venue_service_availability_status_ck CHECK (status IN ('NOT_ALLOWED', 'PROVIDED', 'ALLOWED'))
);

CREATE INDEX venue_service_availability_service_status_ix ON catalog.venue_service_availability (service_id, status);

-- A provider's published offering of one service, optionally at one of its venues.
CREATE TABLE catalog.service_listing (
    id                 uuid        PRIMARY KEY DEFAULT uuidv7(),
    provider_id        uuid        NOT NULL REFERENCES provider.provider (id) ON DELETE RESTRICT,
    service_id         uuid        NOT NULL REFERENCES catalog.service (id) ON DELETE RESTRICT,
    category_id        uuid        NOT NULL REFERENCES catalog.event_category (id) ON DELETE RESTRICT,
    venue_id           uuid        REFERENCES catalog.venue (id) ON DELETE RESTRICT,
    slug               text        NOT NULL,
    title              text        NOT NULL,
    description        text,
    city               text        NOT NULL,
    serves_veg         boolean,
    serves_non_veg     boolean,
    publication_status text        NOT NULL DEFAULT 'DRAFT',
    published_at       timestamptz,
    is_demo            boolean     NOT NULL DEFAULT false,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    version            bigint      NOT NULL DEFAULT 0,
    CONSTRAINT service_listing_slug_uk UNIQUE (slug),
    CONSTRAINT service_listing_publication_status_ck CHECK (publication_status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED'))
);

CREATE INDEX service_listing_provider_status_ix ON catalog.service_listing (provider_id, publication_status);
CREATE INDEX service_listing_service_status_ix ON catalog.service_listing (service_id, publication_status);
CREATE INDEX service_listing_category_city_ix ON catalog.service_listing (category_id, city) WHERE publication_status = 'PUBLISHED';
CREATE INDEX service_listing_venue_ix ON catalog.service_listing (venue_id);

-- A fixed-price package of a listing. FIXED: one price per event. PER_GUEST: price per guest (for example per plate).
CREATE TABLE catalog.listing_package (
    id           uuid        PRIMARY KEY DEFAULT uuidv7(),
    listing_id   uuid        NOT NULL REFERENCES catalog.service_listing (id) ON DELETE CASCADE,
    title        text        NOT NULL,
    description  text,
    inclusions   text[]      NOT NULL DEFAULT '{}',
    price_minor  bigint      NOT NULL,
    currency     text        NOT NULL DEFAULT 'INR',
    price_unit   text        NOT NULL DEFAULT 'FIXED',
    min_quantity integer     NOT NULL DEFAULT 1,
    max_quantity integer     NOT NULL DEFAULT 1,
    sort_order   integer     NOT NULL DEFAULT 0,
    is_active    boolean     NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT listing_package_price_ck CHECK (price_minor > 0),
    CONSTRAINT listing_package_currency_ck CHECK (currency = 'INR'),
    CONSTRAINT listing_package_unit_ck CHECK (price_unit IN ('FIXED', 'PER_GUEST')),
    CONSTRAINT listing_package_quantity_ck CHECK (min_quantity >= 1 AND max_quantity >= min_quantity)
);

CREATE INDEX listing_package_listing_sort_ix ON catalog.listing_package (listing_id, sort_order);
