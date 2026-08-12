import { Router } from 'express'
import { AppDependencies } from '../app.js'
import { AppError } from '../middleware/error-handler.js'
import { authenticate, requireAuth, authorize } from '../middleware/auth.js'
import { requireCsrf } from '../services/csrf.js'
import { generateId } from '../lib/id.js'

export function treeRoutes(deps: AppDependencies): Router {
  const router = Router()

  router.use(authenticate(deps.db))

  router.get('/', requireAuth, authorize('tree.read'), (req, res, next) => {
    try {
      const tree = deps.db.get<{
        id: string
        name: string
        locale: string
        description: string | null
        version: string
        created_at: string
        updated_at: string
      }>('SELECT * FROM trees LIMIT 1')

      if (!tree) {
        throw new AppError(404, 'not_found', 'Tree not found')
      }

      res.json({
        id: tree.id,
        name: tree.name,
        locale: tree.locale,
        description: tree.description,
        version: tree.version,
        createdAt: tree.created_at,
        updatedAt: tree.updated_at,
      })
    } catch (err) {
      next(err)
    }
  })

  router.patch('/', requireAuth, authorize('tree.update'), (req, res, next) => {
    try {
      requireCsrf(req, deps.db)

      const tree = deps.db.get<{ id: string; version: string }>(
        'SELECT id, version FROM trees LIMIT 1'
      )

      if (!tree) {
        throw new AppError(404, 'not_found', 'Tree not found')
      }

      const ifMatch = req.headers['if-match'] as string | undefined
      if (ifMatch && ifMatch !== `"${tree.version}"`) {
        throw new AppError(412, 'precondition_failed', 'Resource version mismatch')
      }

      const { name, locale, description } = req.body
      const newVersion = generateId()

      const updates: string[] = []
      const params: Record<string, unknown> = { $id: tree.id, $version: newVersion }

      if (name !== undefined) { updates.push('name = $name'); params.$name = name }
      if (locale !== undefined) { updates.push('locale = $locale'); params.$locale = locale }
      if (description !== undefined) { updates.push('description = $description'); params.$description = description }

      if (updates.length === 0) {
        throw new AppError(400, 'validation_error', 'No fields to update')
      }

      deps.db.run(
        `UPDATE trees SET ${updates.join(', ')}, version = $version, updated_at = datetime('now') WHERE id = $id`,
        params
      )

      const updated = deps.db.get<{
        id: string
        name: string
        locale: string
        description: string | null
        version: string
        created_at: string
        updated_at: string
      }>('SELECT * FROM trees WHERE id = $id', { $id: tree.id })

      res.json({
        id: updated!.id,
        name: updated!.name,
        locale: updated!.locale,
        description: updated!.description,
        version: updated!.version,
        createdAt: updated!.created_at,
        updatedAt: updated!.updated_at,
      })
    } catch (err) {
      next(err)
    }
  })

  return router
}
