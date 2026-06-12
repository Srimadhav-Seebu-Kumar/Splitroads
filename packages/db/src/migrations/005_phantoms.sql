-- Migration 005: phantom storage

CREATE TABLE phantom.phantoms (
    phantom_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
    phantom_type        TEXT        NOT NULL CHECK (phantom_type IN (
                        'ABANDONED_ENTRY','DELAYED_ENTRY','PREMATURE_EXIT','DELAYED_EXIT',
                        'CONVICTION','POSITION_SIZE','STOP_PLACEMENT','OPPOSITE_PERSONALITY')),
    status              TEXT        NOT NULL DEFAULT 'active' CHECK (status IN
                        ('active','resolved','expired','invalidated','pruned')),

    -- Provenance (exactly one origin enforced below)
    origin_session_id   UUID        REFERENCES intent.sessions(session_id) ON DELETE SET NULL,
    origin_trade_id     UUID        REFERENCES trading.trades(trade_id)    ON DELETE SET NULL,
    spawn_intent_score  NUMERIC     CHECK (spawn_intent_score BETWEEN 0 AND 1),

    -- Instrument
    instrument_symbol   TEXT        NOT NULL,
    instrument_venue    TEXT        NOT NULL,
    asset_class         TEXT,
    direction           TEXT        NOT NULL CHECK (direction IN ('long','short')),

    -- Counterfactual parameters
    cf_entry            NUMERIC     NOT NULL,
    cf_stop             NUMERIC,
    cf_target           NUMERIC,
    cf_size             NUMERIC     NOT NULL,
    cf_policy           JSONB       NOT NULL DEFAULT '{}'::jsonb,
    param_provenance    JSONB       NOT NULL DEFAULT '{}'::jsonb,

    -- Lifecycle
    spawned_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ NOT NULL,
    resolved_at         TIMESTAMPTZ,
    sim_version         TEXT        NOT NULL DEFAULT 'v1.0',

    -- Outcome (distribution, not points)
    outcome_r_p05       NUMERIC,
    outcome_r_p50       NUMERIC,
    outcome_r_p95       NUMERIC,
    outcome_mfe_r       NUMERIC,
    outcome_mae_r       NUMERIC,
    outcome_bars_held   INT,
    outcome_exit_reason TEXT CHECK (outcome_exit_reason IN
                        ('stop','target','time_stop','structure','no_fill')),
    outcome_detail      JSONB,

    -- Ranking
    info_value          NUMERIC,

    CONSTRAINT one_origin CHECK (
        (origin_session_id IS NOT NULL)::int + (origin_trade_id IS NOT NULL)::int = 1
    )
);

ALTER TABLE phantom.phantoms ENABLE ROW LEVEL SECURITY;
CREATE POLICY phantoms_owner ON phantom.phantoms
    USING (user_id = current_setting('app.user_id', true)::uuid);

-- Bar-close fanout: advance all active phantoms for an instrument
CREATE INDEX ix_phantoms_active_instr ON phantom.phantoms (instrument_symbol, status)
    WHERE status = 'active';
CREATE INDEX ix_phantoms_user         ON phantom.phantoms (user_id, spawned_at DESC);
CREATE INDEX ix_phantoms_user_type    ON phantom.phantoms (user_id, phantom_type, status);
CREATE INDEX ix_phantoms_expires      ON phantom.phantoms (expires_at)
    WHERE status = 'active';
