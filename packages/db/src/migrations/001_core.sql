-- Migration 001: core schema — users, consents, workspaces
-- These are the trust-critical tables. RLS on everything tenant-scoped from the first migration.

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE core.users (
    user_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         CITEXT      NOT NULL UNIQUE,
    password_hash TEXT,                           -- Argon2id; NULL for OAuth-only
    mfa_enabled   BOOLEAN     NOT NULL DEFAULT false,
    mfa_secret    TEXT,                           -- TOTP secret, encrypted at rest
    display_name  TEXT,
    tier          TEXT        NOT NULL DEFAULT 'free'
                              CHECK (tier IN ('free', 'trader', 'pro', 'coach', 'firm')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ                     -- soft mark; hard-delete pipeline follows
);

-- ─── Consents ────────────────────────────────────────────────────────────────
-- Append-only: full history of every consent change

CREATE TABLE core.consents (
    consent_id UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
    scope      TEXT        NOT NULL,
    -- scope examples: 'capture.ticket', 'capture.drawings', 'capture.hover',
    --                 'capture.alerts', 'benchmark.crossuser'
    granted    BOOLEAN     NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_consents_user_scope ON core.consents (user_id, scope, changed_at DESC);

-- ─── Sessions (auth) ──────────────────────────────────────────────────────────

CREATE TABLE core.auth_sessions (
    session_id  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
    token_hash  TEXT        NOT NULL UNIQUE,      -- hashed session token
    user_agent  TEXT,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL,
    last_used   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_auth_sessions_user ON core.auth_sessions (user_id, expires_at);

-- ─── Deletion receipts ───────────────────────────────────────────────────────

CREATE TABLE core.deletion_receipts (
    receipt_id  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,             -- not FK; user may already be gone
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    scopes      TEXT[]      NOT NULL DEFAULT '{}'
);
