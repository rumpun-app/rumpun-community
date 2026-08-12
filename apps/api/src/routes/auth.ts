import { Router } from 'express'
import { AppDependencies } from '../app.js'
import { AppError } from '../middleware/error-handler.js'
import { authenticate, requireAuth, authorize } from '../middleware/auth.js'
import { createSession, setSessionCookie, clearSessionCookie, revokeSession } from '../services/session.js'
import { generateCsrfToken, storeCsrfToken, requireCsrf } from '../services/csrf.js'
import { hashPassword, verifyPassword, needsRehash } from '../services/password.js'
import { generateId } from '../lib/id.js'

export function authRoutes(deps: AppDependencies): Router {
  const router = Router()

  router.use(authenticate(deps.db))

  router.get('/csrf', (req, res) => {
    if (!req.sessionId) {
      throw new AppError(401, 'unauthorized', 'Authentication required')
    }
    const token = generateCsrfToken()
    storeCsrfToken(deps.db, req.sessionId, token)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    res.json({ token, expiresAt })
  })

  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        throw new AppError(400, 'validation_error', 'Email and password required')
      }

      const account = deps.db.get<{ id: string; status: string; display_name: string }>(
        'SELECT id, status, display_name FROM accounts WHERE email = $email',
        { $email: email.toLowerCase().trim() }
      )

      if (!account || account.status !== 'active') {
        throw new AppError(401, 'invalid_credentials', 'Invalid email or password')
      }

      const cred = deps.db.get<{ hash: string; hash_version: number }>(
        'SELECT hash, hash_version FROM credentials WHERE account_id = $id',
        { $id: account.id }
      )

      if (!cred) {
        throw new AppError(401, 'invalid_credentials', 'Invalid email or password')
      }

      const valid = await verifyPassword(cred.hash, password)
      if (!valid) {
        throw new AppError(401, 'invalid_credentials', 'Invalid email or password')
      }

      if (await needsRehash(cred.hash_version)) {
        const { hash, hashVersion } = await hashPassword(password)
        deps.db.run(
          'UPDATE credentials SET hash = $hash, hash_version = $hashVersion, updated_at = datetime(\'now\') WHERE account_id = $id',
          { $hash: hash, $hashVersion: hashVersion, $id: account.id }
        )
      }

      const { rawToken, session } = createSession(deps.db, account.id)
      setSessionCookie(res, rawToken)

      res.json({
        account: {
          id: account.id,
          email,
          displayName: account.display_name,
          status: account.status,
          linkedPersonId: null,
          createdAt: session.createdAt,
        },
        membership: null,
        session: {
          id: session.id,
          current: true,
          createdAt: session.createdAt,
          lastSeenAt: session.lastSeenAt,
          idleExpiresAt: session.idleExpiresAt,
          absoluteExpiresAt: session.absoluteExpiresAt,
          assurance: session.assurance,
        },
      })
    } catch (err) {
      next(err)
    }
  })

  router.post('/logout', (req, res) => {
    requireCsrf(req, deps.db)
    if (req.sessionId) {
      revokeSession(deps.db, req.sessionId)
    }
    clearSessionCookie(res)
    res.json({ accepted: true })
  })

  router.get('/me', (req, res, next) => {
    try {
      if (!req.accountId) {
        throw new AppError(401, 'unauthorized', 'Authentication required')
      }

      const account = deps.db.get<{ id: string; email: string; display_name: string; status: string; created_at: string }>(
        'SELECT id, email, display_name, status, created_at FROM accounts WHERE id = $id',
        { $id: req.accountId }
      )

      if (!account) {
        throw new AppError(401, 'unauthorized', 'Account not found')
      }

      const tree = deps.db.get<{ id: string; name: string }>(
        'SELECT id, name FROM trees LIMIT 1'
      )

      res.json({
        account: {
          id: account.id,
          email: account.email,
          displayName: account.display_name,
          status: account.status,
          linkedPersonId: null,
          createdAt: account.created_at,
        },
        membership: req.membership || null,
        session: {
          id: req.sessionId,
          current: true,
        },
        tree: tree ? { id: tree.id, name: tree.name } : null,
      })
    } catch (err) {
      next(err)
    }
  })

  router.post('/reauthenticate', async (req, res, next) => {
    try {
      requireAuth(req, res, () => {})
      requireCsrf(req, deps.db)
      const { password } = req.body
      if (!password) {
        throw new AppError(400, 'validation_error', 'Password required')
      }

      const cred = deps.db.get<{ hash: string }>(
        'SELECT hash FROM credentials WHERE account_id = $id',
        { $id: req.accountId! }
      )

      if (!cred) {
        throw new AppError(401, 'invalid_credentials', 'Invalid credentials')
      }

      const valid = await verifyPassword(cred.hash, password)
      if (!valid) {
        throw new AppError(401, 'invalid_credentials', 'Invalid credentials')
      }

      if (req.sessionId) {
        revokeSession(deps.db, req.sessionId)
      }

      const { rawToken, session } = createSession(deps.db, req.accountId!, 'recent')
      setSessionCookie(res, rawToken)

      res.json({ accepted: true })
    } catch (err) {
      next(err)
    }
  })

  router.put('/password', async (req, res, next) => {
    try {
      requireAuth(req, res, () => {})
      requireCsrf(req, deps.db)
      const { currentPassword, newPassword } = req.body
      if (!currentPassword || !newPassword) {
        throw new AppError(400, 'validation_error', 'Current and new password required')
      }

      const cred = deps.db.get<{ hash: string }>(
        'SELECT hash FROM credentials WHERE account_id = $id',
        { $id: req.accountId! }
      )

      if (!cred) {
        throw new AppError(401, 'invalid_credentials', 'Invalid credentials')
      }

      const valid = await verifyPassword(cred.hash, currentPassword)
      if (!valid) {
        throw new AppError(401, 'invalid_credentials', 'Invalid credentials')
      }

      const { hash, hashVersion } = await hashPassword(newPassword)

      deps.db.transaction(() => {
        deps.db.run(
          'UPDATE credentials SET hash = $hash, hash_version = $hashVersion, updated_at = datetime(\'now\') WHERE account_id = $id',
          { $hash: hash, $hashVersion: hashVersion, $id: req.accountId! }
        )
        const sessions = deps.db.all<{ id: string }>(
          'SELECT id FROM sessions WHERE account_id = $id AND id != $currentId',
          { $id: req.accountId!, $currentId: req.sessionId || '' }
        )
        for (const s of sessions) {
          revokeSession(deps.db, s.id)
        }
      })

      res.json({ accepted: true })
    } catch (err) {
      next(err)
    }
  })

  return router
}
