-- notification module: in-app notifications (DATABASE_SCHEMA.md, section 13). Delivery by email or SMS comes later (D-31).

CREATE SCHEMA IF NOT EXISTS notification;

CREATE TABLE notification.notification (
    id                uuid        PRIMARY KEY DEFAULT uuidv7(),
    recipient_user_id uuid        NOT NULL REFERENCES identity.user_account (id) ON DELETE CASCADE,
    surface           text        NOT NULL,
    type              text        NOT NULL,
    title             text        NOT NULL,
    body              text        NOT NULL,
    action_path       text,
    source_event_id   text        NOT NULL,
    read_at           timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT notification_surface_ck CHECK (surface IN ('CUSTOMER', 'PROVIDER', 'ADMIN')),
    CONSTRAINT notification_source_uk UNIQUE (recipient_user_id, source_event_id, type)
);

CREATE INDEX notification_recipient_created_ix ON notification.notification (recipient_user_id, surface, created_at DESC);
CREATE INDEX notification_unread_ix ON notification.notification (recipient_user_id, surface) WHERE read_at IS NULL;
