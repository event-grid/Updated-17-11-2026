-- shared: Spring Modulith event publication registry (ADR-020, BACKEND_ARCHITECTURE.md section 8).
-- Events are recorded in the same transaction as the business change and marked complete after
-- their listeners succeed. Columns match Spring Modulith 2.1's JPA entity; Hibernate only validates.

CREATE TABLE event_publication (
    id                     uuid        NOT NULL PRIMARY KEY,
    listener_id            text        NOT NULL,
    event_type             text        NOT NULL,
    serialized_event       text        NOT NULL,
    publication_date       timestamptz NOT NULL,
    completion_date        timestamptz,
    status                 text,
    completion_attempts    integer     NOT NULL DEFAULT 0,
    last_resubmission_date timestamptz
);

CREATE INDEX event_publication_serialized_event_hash_ix ON event_publication USING hash (serialized_event);
CREATE INDEX event_publication_completion_date_ix ON event_publication (completion_date);
