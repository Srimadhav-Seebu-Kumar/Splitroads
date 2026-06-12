-- Migration 004: intent projections (derived, rebuildable from event log)

CREATE TABLE intent.sessions (
    session_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID        NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
    instrument_symbol  TEXT        NOT NULL,
    instrument_venue   TEXT        NOT NULL,
    asset_class        TEXT,
    started_at         TIMESTAMPTZ NOT NULL,
    ended_at           TIMESTAMPTZ,
    end_reason         TEXT CHECK (end_reason IN
                       ('executed','abandoned','timeout','ticket_deleted','chart_closed')),
    event_count        INT         NOT NULL DEFAULT 0,
    -- Inferred trade parameters (with provenance)
    inferred_direction TEXT        CHECK (inferred_direction IN ('long','short')),
    inferred_entry     NUMERIC,
    inferred_stop      NUMERIC,
    inferred_target    NUMERIC,
    inferred_size      NUMERIC,
    inference_basis    JSONB,                     -- which events each param came from
    executed_trade_id  UUID        REFERENCES trading.trades(trade_id) ON DELETE SET NULL,
    clusterer_version  TEXT        NOT NULL DEFAULT 'heuristic@1.0'
);

CREATE INDEX ix_sessions_user_time   ON intent.sessions (user_id, started_at DESC);
CREATE INDEX ix_sessions_open        ON intent.sessions (user_id) WHERE ended_at IS NULL;
CREATE INDEX ix_sessions_instrument  ON intent.sessions (user_id, instrument_symbol, started_at DESC);

-- ─── Intent scores (append-only per session, full history kept) ──────────────

CREATE TABLE intent.scores (
    score_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id        UUID        NOT NULL REFERENCES intent.sessions(session_id) ON DELETE CASCADE,
    scored_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    intent_score      NUMERIC     NOT NULL CHECK (intent_score BETWEEN 0 AND 1),
    model_id          TEXT        NOT NULL DEFAULT 'heuristic@1.0',
    feature_snapshot  JSONB,                      -- features at scoring time (for audit/replay)
    user_correction   TEXT        CHECK (user_correction IN ('confirmed_intent','denied_intent'))
);

CREATE INDEX ix_scores_session ON intent.scores (session_id, scored_at DESC);
CREATE INDEX ix_scores_labels  ON intent.scores (model_id)
    WHERE user_correction IS NOT NULL;
