-- Migration 002: trading system of record
-- Instruments, accounts, trades, trade plans.

-- ─── Instruments ─────────────────────────────────────────────────────────────

CREATE TABLE trading.instruments (
    instrument_id UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol        TEXT      NOT NULL,
    venue         TEXT      NOT NULL,
    asset_class   TEXT      NOT NULL CHECK (asset_class IN
                            ('equity','futures','fx','crypto','option')),
    tick_size     NUMERIC,
    multiplier    NUMERIC   NOT NULL DEFAULT 1,
    currency      TEXT      NOT NULL DEFAULT 'USD',
    UNIQUE (symbol, venue)
);

-- Seed common instruments
INSERT INTO trading.instruments (symbol, venue, asset_class, tick_size, multiplier, currency) VALUES
  ('NQ',    'CME',       'futures', 0.25,  20,   'USD'),
  ('ES',    'CME',       'futures', 0.25,  50,   'USD'),
  ('MNQ',   'CME',       'futures', 0.25,  2,    'USD'),
  ('MES',   'CME',       'futures', 0.25,  5,    'USD'),
  ('CL',    'NYMEX',     'futures', 0.01,  1000, 'USD'),
  ('GC',    'COMEX',     'futures', 0.10,  100,  'USD'),
  ('BTCUSDT','BINANCE',  'crypto',  0.01,  1,    'USDT'),
  ('ETHUSDT','BINANCE',  'crypto',  0.01,  1,    'USDT'),
  ('EURUSD','FOREX',     'fx',      0.00001, 100000, 'USD'),
  ('GBPUSD','FOREX',     'fx',      0.00001, 100000, 'USD')
ON CONFLICT (symbol, venue) DO NOTHING;

-- ─── Accounts (broker connections) ───────────────────────────────────────────

CREATE TABLE trading.accounts (
    account_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
    broker           TEXT        NOT NULL,
    label            TEXT,
    base_currency    TEXT        NOT NULL DEFAULT 'USD',
    credentials_ref  TEXT,                        -- KMS-vault pointer; NEVER the secret itself
    sync_enabled     BOOLEAN     NOT NULL DEFAULT true,
    last_synced_at   TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trading.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY accounts_owner ON trading.accounts
    USING (user_id = current_setting('app.user_id', true)::uuid);

CREATE INDEX ix_accounts_user ON trading.accounts (user_id);

-- ─── Trades ───────────────────────────────────────────────────────────────────

CREATE TABLE trading.trades (
    trade_id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
    account_id      UUID        NOT NULL REFERENCES trading.accounts(account_id),
    instrument_id   UUID        REFERENCES trading.instruments(instrument_id),
    instrument_symbol TEXT      NOT NULL,         -- denorm for queries without join
    instrument_venue  TEXT      NOT NULL,
    asset_class     TEXT        NOT NULL,
    direction       TEXT        NOT NULL CHECK (direction IN ('long','short')),
    opened_at       TIMESTAMPTZ NOT NULL,
    closed_at       TIMESTAMPTZ,                  -- NULL = still open
    avg_entry       NUMERIC     NOT NULL,
    avg_exit        NUMERIC,
    quantity        NUMERIC     NOT NULL,
    fees            NUMERIC     NOT NULL DEFAULT 0,
    currency        TEXT        NOT NULL DEFAULT 'USD',
    realized_pnl    NUMERIC,
    r_multiple      NUMERIC,                      -- vs initial risk; NULL if no stop known
    plan_id         UUID,                         -- FK added after trade_plans table exists
    setup_tags      TEXT[]      NOT NULL DEFAULT '{}',
    source          TEXT        NOT NULL,
    external_id     TEXT,                         -- broker's native id; for dedup
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, source, external_id)         -- dedup guard on import
);

ALTER TABLE trading.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY trades_owner ON trading.trades
    USING (user_id = current_setting('app.user_id', true)::uuid);

CREATE INDEX ix_trades_user_time  ON trading.trades (user_id, opened_at DESC);
CREATE INDEX ix_trades_user_open  ON trading.trades (user_id) WHERE closed_at IS NULL;
CREATE INDEX ix_trades_instrument ON trading.trades (user_id, instrument_symbol, opened_at DESC);

-- ─── Trade plans ─────────────────────────────────────────────────────────────

CREATE TABLE trading.trade_plans (
    plan_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
    instrument_symbol TEXT       NOT NULL,
    instrument_venue  TEXT       NOT NULL,
    direction        TEXT        NOT NULL CHECK (direction IN ('long','short')),
    planned_entry    NUMERIC,
    planned_stop     NUMERIC,
    planned_target   NUMERIC,
    planned_size     NUMERIC,
    planned_size_type TEXT       CHECK (planned_size_type IN ('units','dollars','percent')),
    thesis           TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at       TIMESTAMPTZ,
    linked_trade_id  UUID        REFERENCES trading.trades(trade_id) ON DELETE SET NULL
);

ALTER TABLE trading.trade_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY trade_plans_owner ON trading.trade_plans
    USING (user_id = current_setting('app.user_id', true)::uuid);

CREATE INDEX ix_plans_user ON trading.trade_plans (user_id, created_at DESC);

-- Back-fill the FK on trades
ALTER TABLE trading.trades
    ADD CONSTRAINT fk_trades_plan
    FOREIGN KEY (plan_id) REFERENCES trading.trade_plans(plan_id) ON DELETE SET NULL;
