/**
 * Database connection + query helpers.
 * Uses postgres.js (sql template tag).
 * RLS: every query that touches tenant-scoped tables sets app.user_id.
 */
import postgres from 'postgres'

const url = process.env['DATABASE_URL']
if (!url) throw new Error('DATABASE_URL is required')

export const sql = postgres(url, {
  max: 20,
  idle_timeout: 30,
  transform: postgres.camel,
  onnotice: () => {},  // suppress Timescale INFO notices in logs
})

/**
 * Execute a query with RLS context set for the given user.
 * All queries touching RLS-enabled tables must go through this.
 */
export async function withUserCtx<T>(
  userId: string,
  fn: (txSql: postgres.TransactionSql) => Promise<T>
): Promise<T> {
  return sql.begin(async (txSql) => {
    await txSql`SELECT set_config('app.user_id', ${userId}, true)`
    return fn(txSql)
  }) as Promise<T>
}

export type Sql = postgres.Sql
