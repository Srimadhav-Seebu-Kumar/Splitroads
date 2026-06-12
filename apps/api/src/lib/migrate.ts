/**
 * Forward-only migration runner.
 * Reads SQL files from packages/db/src/migrations in order.
 * Tracks applied migrations in core.migrations table.
 */
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import postgres from 'postgres'

const url = process.env['DATABASE_URL']
if (!url) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const sql = postgres(url)

async function migrate() {
  // Bootstrap migration tracking table
  await sql`
    CREATE TABLE IF NOT EXISTS core.migrations (
      id          SERIAL PRIMARY KEY,
      filename    TEXT NOT NULL UNIQUE,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  const migrationsDir = join(__dirname, '../../../packages/db/src/migrations')
  const files = (await readdir(migrationsDir))
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const [row] = await sql<[{ count: number }]>`
      SELECT COUNT(*)::int AS count FROM core.migrations WHERE filename = ${file}
    `
    if (row && row.count > 0) {
      console.log(`  skip  ${file}`)
      continue
    }

    const content = await readFile(join(migrationsDir, file), 'utf-8')
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(content)
        await tx`INSERT INTO core.migrations (filename) VALUES (${file})`
      })
      console.log(`  apply ${file}`)
    } catch (err) {
      console.error(`  FAIL  ${file}:`, err)
      process.exit(1)
    }
  }

  console.log('Migrations complete.')
  await sql.end()
}

migrate()
