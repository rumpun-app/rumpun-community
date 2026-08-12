import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import fs from 'node:fs'
import path from 'node:path'
import { logger } from '../lib/logger.js'

export interface Db {
  run(sql: string, params?: Record<string, unknown>): void
  get<T>(sql: string, params?: Record<string, unknown>): T | undefined
  all<T>(sql: string, params?: Record<string, unknown>): T[]
  exec(sql: string): void
  transaction<T>(fn: () => T): T
  close(): void
  export(): Uint8Array
}

class SqlJsDbAdapter implements Db {
  private db: SqlJsDatabase

  constructor(db: SqlJsDatabase) {
    this.db = db
    this.db.run('PRAGMA foreign_keys = ON')
  }

  private bindParams(params?: Record<string, unknown>): Record<string, number | string | Uint8Array | null> {
    if (!params) return {}
    const result: Record<string, number | string | Uint8Array | null> = {}
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        result[key] = null
      } else if (typeof value === 'number' || typeof value === 'string') {
        result[key] = value
      } else if (value instanceof Uint8Array) {
        result[key] = value
      } else {
        result[key] = String(value)
      }
    }
    return result
  }

  run(sql: string, params?: Record<string, unknown>): void {
    if (params && Object.keys(params).length > 0) {
      const stmt = this.db.prepare(sql)
      stmt.bind(this.bindParams(params) as any)
      stmt.step()
      stmt.free()
    } else {
      this.db.run(sql)
    }
  }

  get<T>(sql: string, params?: Record<string, unknown>): T | undefined {
    if (params && Object.keys(params).length > 0) {
      const stmt = this.db.prepare(sql)
      stmt.bind(this.bindParams(params) as any)
      if (stmt.step()) {
        const obj = stmt.getAsObject() as T
        stmt.free()
        return obj
      }
      stmt.free()
      return undefined
    }
    const result = this.db.exec(sql)
    if (result.length > 0 && result[0]!.values.length > 0) {
      const cols = result[0]!.columns
      const vals = result[0]!.values[0]!
      const obj: Record<string, unknown> = {}
      cols.forEach((col, i) => { obj[col] = vals[i] })
      return obj as T
    }
    return undefined
  }

  all<T>(sql: string, params?: Record<string, unknown>): T[] {
    const results: T[] = []
    if (params && Object.keys(params).length > 0) {
      const stmt = this.db.prepare(sql)
      stmt.bind(this.bindParams(params) as any)
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T)
      }
      stmt.free()
    } else {
      const result = this.db.exec(sql)
      if (result.length > 0) {
        const cols = result[0]!.columns
        result[0]!.values.forEach((vals) => {
          const obj: Record<string, unknown> = {}
          cols.forEach((col, i) => { obj[col] = vals[i] })
          results.push(obj as T)
        })
      }
    }
    return results
  }

  exec(sql: string): void {
    this.db.run(sql)
  }

  transaction<T>(fn: () => T): T {
    this.db.run('BEGIN')
    try {
      const result = fn()
      this.db.run('COMMIT')
      return result
    } catch (e) {
      this.db.run('ROLLBACK')
      throw e
    }
  }

  close(): void {
    this.db.close()
  }

  export(): Uint8Array {
    return this.db.export()
  }
}

let sqlJsReady: Promise<void> | null = null

export async function createDb(dbPath: string): Promise<Db> {
  if (!sqlJsReady) {
    sqlJsReady = initSqlJs().then(() => {})
  }
  await sqlJsReady

  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  let buffer: Buffer | null = null
  if (fs.existsSync(dbPath)) {
    buffer = fs.readFileSync(dbPath)
  }

  const SQL = await initSqlJs()
  const sqlDb = new SQL.Database(buffer)
  sqlDb.run('PRAGMA foreign_keys = ON')
  sqlDb.run('PRAGMA journal_mode = WAL')

  const adapter = new SqlJsDbAdapter(sqlDb)

  const origClose = adapter.close.bind(adapter)
  adapter.close = () => {
    const data = adapter.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
    origClose()
  }

  logger.info({ path: dbPath }, 'database opened')
  return adapter
}
