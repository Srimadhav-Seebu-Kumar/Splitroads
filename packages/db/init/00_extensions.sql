-- Bootstrap: extensions and schemas
-- Runs once via docker-entrypoint-initdb.d before any migration

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
-- TimescaleDB is optional (present in production, skipped in plain-Postgres dev)
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "timescaledb";
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Schema layout (see DATABASE_DESIGN.md §1)
CREATE SCHEMA IF NOT EXISTS events;
CREATE SCHEMA IF NOT EXISTS trading;
CREATE SCHEMA IF NOT EXISTS intent;
CREATE SCHEMA IF NOT EXISTS phantom;
CREATE SCHEMA IF NOT EXISTS graph;
CREATE SCHEMA IF NOT EXISTS profile;
CREATE SCHEMA IF NOT EXISTS core;
