import { Router } from 'express'
import { AppDependencies } from '../app.js'

export function healthRoutes(deps: AppDependencies): Router {
  const router = Router()

  router.get('/live', (_req, res) => {
    res.json({ status: 'alive' })
  })

  router.get('/ready', (_req, res) => {
    res.json({
      status: 'ready',
      policyRevision: deps.policyRevision,
      dependencies: {
        postgresql: 'disabled',
        opa: 'ready',
        objectStorage: 'disabled',
        redis: 'disabled',
      },
    })
  })

  return router
}
