-- Migration 006: profile + insights

-- ─── DNA snapshots ────────────────────────────────────────────────────────────

CREATE TABLE profile.dna_snapshots (
    snapshot_id  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
    as_of        TIMESTAMPTZ NOT NULL,
    window_days  INT         NOT NULL DEFAULT 90,
    -- dimensions JSON shape:
    -- { "conviction": {"score":0.62,"ci":[0.51,0.73],"n":48,"trend":"+0.04"}, ... }
    dimensions   JSONB       NOT NULL DEFAULT '{}'::jsonb,
    model_id     TEXT        NOT NULL DEFAULT 'heuristic@1.0',
    UNIQUE (user_id, as_of, window_days)
);

CREATE INDEX ix_dna_user ON profile.dna_snapshots (user_id, as_of DESC);

-- ─── Insights (Laws 1 + 4 enforced at DB layer) ───────────────────────────────

CREATE TABLE profile.insights (
    insight_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
    kind         TEXT        NOT NULL,
    status       TEXT        NOT NULL DEFAULT 'candidate' CHECK (status IN
                 ('candidate','published','dismissed','expired')),
    claim        JSONB       NOT NULL,
    evidence_refs JSONB      NOT NULL DEFAULT '{"phantom_ids":[],"trade_ids":[]}'::jsonb,
    action       JSONB,
    severity     TEXT        NOT NULL CHECK (severity IN ('improvement','neutral','cost')),
    sample_n     INT         NOT NULL,
    published_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- LAW 1: published insights require n >= 20
    CONSTRAINT law1_sample CHECK (status <> 'published' OR sample_n >= 20),
    -- LAW 4: cost insights require an action
    CONSTRAINT law4_action CHECK (severity <> 'cost' OR action IS NOT NULL)
);

ALTER TABLE profile.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY insights_owner ON profile.insights
    USING (user_id = current_setting('app.user_id', true)::uuid);

CREATE INDEX ix_insights_feed ON profile.insights (user_id, status, published_at DESC);
CREATE INDEX ix_insights_kind  ON profile.insights (user_id, kind, status);

-- ─── Behavioral metrics (rolling window, pre-computed) ────────────────────────

CREATE TABLE profile.behavioral_metrics (
    metric_id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
    computed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    window_days      INT         NOT NULL DEFAULT 30,
    -- Hesitation
    hesitation_sessions_n     INT,
    hesitation_sessions_pct   NUMERIC,    -- % of high-intent sessions abandoned
    hesitation_cost_r_p50     NUMERIC,
    hesitation_cost_r_p05     NUMERIC,
    hesitation_cost_r_p95     NUMERIC,
    -- Exit quality
    premature_exits_n         INT,
    exit_efficiency_p50       NUMERIC,    -- % of available R captured (p50)
    exit_cost_r_p50           NUMERIC,
    -- Discipline
    plan_adherence_pct        NUMERIC,    -- % trades matching plan within tolerance
    stop_moved_pct            NUMERIC,
    size_vs_plan_pct          NUMERIC,    -- actual size / planned size
    UNIQUE (user_id, computed_at, window_days)
);

CREATE INDEX ix_bmetrics_user ON profile.behavioral_metrics (user_id, computed_at DESC);
