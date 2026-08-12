import { createApp } from './app.js'
import { createDb } from './db/connection.js'
import { runMigrations } from './db/migrate.js'
import { loadPolicy } from './services/opa.js'
import { env } from './lib/env.js'
import { logger } from './lib/logger.js'
import { ensureBootstrapState } from './routes/bootstrap.js'

async function main() {
  const db = await createDb(env.DATABASE_PATH)
  runMigrations(db)
  ensureBootstrapState(db)

  const policyRevision = await loadPolicy()

  const app = createApp({ db, policyRevision })

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, revision: policyRevision }, 'api started')
  })

  function shutdown(signal: string) {
    logger.info({ signal }, 'shutting down')
    server.close(() => {
      db.close()
      process.exit(0)
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((err) => {
  logger.fatal(err, 'fatal startup error')
  process.exit(1)
})
