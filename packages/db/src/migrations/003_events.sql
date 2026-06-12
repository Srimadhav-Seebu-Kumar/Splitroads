-- Migration 003: immutable event log (TimescaleDB hypertable)
-- APPEND-ONLY. Never updated. Privacy hard-delete is the only sanctioned mutation.

CREATE TABLE events.intent_events (
    event_id         UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL,
    idempotency_key  TEXT        NOT NULL,
    schema           TEXT        NOT NULL,
    schema_version   SMALLINT    NOT NULL,
    source           TEXT        NOT NULL,
    occurred_at      TIMESTAMPTZ NOT NULL,
    received_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    instrument_symbol TEXT,
    instrument_venue  TEXT,
    asset_class      TEXT,
    payload          JSONB       NOT NULL,
    context          JSONB       NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (occurred_at, event_id)
);

-- Hypertable: partition by time (7d chunks), segment by user for compression
SELECT create_hypertable('events.intent_events', 'occurred_at',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Idempotency guard
CREATE UNIQUE INDEX uq_intent_events_idem
    ON events.intent_events (user_id, idempotency_key, occurred_at);

-- Primary access patterns
CREATE INDEX ix_intent_events_user_time
    ON events.intent_events (user_id, occurred_at DESC);
CREATE INDEX ix_intent_events_user_instr_time
    ON events.intent_events (user_id, instrument_symbol, occurred_at DESC)
    WHERE instrument_symbol IS NOT NULL;
CREATE INDEX ix_intent_events_schema
    ON events.intent_events (schema, occurred_at DESC);

-- Compression policy: events older than 30 days
SELECT add_compression_policy('events.intent_events', INTERVAL '30 days', if_not_exists => TRUE);

-- ─── Trade events (same envelope, different family) ───────────────────────────

CREATE TABLE events.trade_events (
    event_id         UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL,
    idempotency_key  TEXT        NOT NULL,
    schema           TEXT        NOT NULL,
    schema_version   SMALLINT    NOT NULL DEFAULT 1,
    source           TEXT        NOT NULL,
    occurred_at      TIMESTAMPTZ NOT NULL,
    received_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    instrument_symbol TEXT,
    instrument_venue  TEXT,
    payload          JSONB       NOT NULL,
    context          JSONB       NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (occurred_at, event_id)
);

SELECT create_hypertable('events.trade_events', 'occurred_at',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

CREATE UNIQUE INDEX uq_trade_events_idem
    ON events.trade_events (user_id, idempotency_key, occurred_at);
CREATE INDEX ix_trade_events_user_time
    ON events.trade_events (user_id, occurred_at DESC);

SELECT add_compression_policy('events.trade_events', INTERVAL '30 days', if_not_exists => TRUE);
