import fs from 'node:fs'
import path from 'node:path'
import { Db } from './connection.js'
import { logger } from '../lib/logger.js'

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, '../../../../db/migrations')

interface MigrationRow {
  version: string
  name: string
  applied_at: string
}

export function runMigrations(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const applied = new Set(
    db.all<MigrationRow>('SELECT version FROM _migrations ORDER BY version')
      .map((r) => r.version)
  )

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const version = file.split('_')[0]!
    if (applied.has(version)) continue

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8')
    logger.info({ migration: file }, 'applying migration')

    db.transaction(() => {
      db.exec(sql)
      db.run(
        'INSERT INTO _migrations (version, name) VALUES ($version, $name)',
        { $version: version, $name: file }
      )
    })
  }

  logger.info({ total: files.length }, 'migrations complete')
}
