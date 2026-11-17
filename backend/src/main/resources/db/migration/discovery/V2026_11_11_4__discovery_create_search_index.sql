-- discovery module: keyword search read model (DATA_OWNERSHIP.md: derived from catalog, rebuildable,
-- never edited by hand). PostgreSQL full-text search at launch (AR-14).
-- Uses the 'simple' configuration: no English stemming, so Indian event terms (mehandi, choultry,
-- pandal) are matched as written. Spelling-tolerant (trigram) matching waits for TA-15.

CREATE SCHEMA IF NOT EXISTS discovery;

CREATE TABLE discovery.search_entry (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entry_type     text     NOT NULL,
    type_order     smallint NOT NULL,
    title          text     NOT NULL,
    category_slug  text     NOT NULL,
    category_name  text     NOT NULL,
    options        text[]   NOT NULL DEFAULT '{}',
    sort_order     integer  NOT NULL,
    search_text    text     NOT NULL,
    search_vector  tsvector GENERATED ALWAYS AS (to_tsvector('simple', search_text)) STORED,
    CONSTRAINT search_entry_type_ck CHECK (entry_type IN ('CATEGORY', 'EVENT_TYPE', 'SUBCATEGORY', 'SERVICE'))
);

CREATE INDEX search_entry_vector_ix ON discovery.search_entry USING gin (search_vector);
