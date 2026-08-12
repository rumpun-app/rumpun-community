import express, { Express } from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { Db } from './db/connection.js'
import { errorHandler } from './middleware/error-handler.js'
import { requestId } from './middleware/request-id.js'
import { healthRoutes } from './routes/health.js'
import { bootstrapRoutes } from './routes/bootstrap.js'
import { authRoutes } from './routes/auth.js'
import { treeRoutes } from './routes/tree.js'
import { personRoutes } from './routes/people.js'
import { env } from './lib/env.js'
import { logger } from './lib/logger.js'

export interface AppDependencies {
  db: Db
  policyRevision: string
}

export function createApp(deps: AppDependencies): Express {
  const app = express()

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
  }))
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))
  app.use(requestId)

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-Request-Id', res.locals.requestId)
    next()
  })

  app.use('/health', healthRoutes(deps))
  app.use('/bootstrap', bootstrapRoutes(deps))
  app.use('/auth', authRoutes(deps))
  app.use('/tree', treeRoutes(deps))
  app.use('/people', personRoutes(deps))

  app.use(errorHandler)

  logger.info({ revision: deps.policyRevision }, 'app created')
  return app
}
