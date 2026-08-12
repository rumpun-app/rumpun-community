import { Db, createDb } from '../src/db/connection.js'
import { runMigrations } from '../src/db/migrate.js'
import { ensureBootstrapState } from '../src/routes/bootstrap.js'
import path from 'node:path'
import fs from 'node:fs'

const TEST_DB_DIR = path.resolve('test/tmp')

export interface TestContext {
  db: Db
  bootstrapToken: string
}

export async function createTestDb(): Promise<TestContext> {
  if (!fs.existsSync(TEST_DB_DIR)) {
    fs.mkdirSync(TEST_DB_DIR, { recursive: true })
  }

  const dbPath = path.join(TEST_DB_DIR, `test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`)
  const db = await createDb(dbPath)
  runMigrations(db)
  const bootstrapToken = ensureBootstrapState(db)
  return { db, bootstrapToken }
}
