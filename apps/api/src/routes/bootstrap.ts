import { Router } from 'express'
import { createHash } from 'node:crypto'
import { AppDependencies } from '../app.js'
import { AppError } from '../middleware/error-handler.js'
import { generateId, generateToken } from '../lib/id.js'
import { createSession, setSessionCookie } from '../services/session.js'
import { hashPassword } from '../services/password.js'

export function bootstrapRoutes(deps: AppDependencies): Router {
  const router = Router()

  router.get('/status', (_req, res) => {
    const row = deps.db.get<{ consumed: number; expires_at: string }>(
      'SELECT consumed, expires_at FROM bootstrap_state WHERE id = 1'
    )

    if (!row || row.consumed !== 0) {
      res.json({ available: false, expiresAt: null })
      return
    }

    res.json({ available: true, expiresAt: row.expires_at })
  })

  router.post('/admin', async (req, res, next) => {
    try {
      const { bootstrapToken, email, password, displayName, treeName } = req.body

      if (!bootstrapToken || !email || !password || !displayName || !treeName) {
        throw new AppError(400, 'validation_error', 'Missing required fields')
      }

      const existing = deps.db.get<{ id: string }>('SELECT id FROM accounts LIMIT 1')
      if (existing) {
        throw new AppError(409, 'already_bootstrapped', 'First administrator already exists')
      }

      const state = deps.db.get<{ token_verifier: string; consumed: number; expires_at: string }>(
        'SELECT token_verifier, consumed, expires_at FROM bootstrap_state WHERE id = 1'
      )

      if (!state || state.consumed !== 0) {
        throw new AppError(409, 'bootstrap_token_consumed', 'Bootstrap token has already been used')
      }

      if (new Date() > new Date(state.expires_at)) {
        throw new AppError(410, 'bootstrap_token_expired', 'Bootstrap token has expired')
      }

      const tokenHash = createHash('sha256').update(bootstrapToken).digest('hex')
      if (tokenHash !== state.token_verifier) {
        throw new AppError(403, 'bootstrap_token_invalid', 'Invalid bootstrap token')
      }

      const { hash, hashVersion } = await hashPassword(password)
      const accountId = generateId()
      const treeId = generateId()

      deps.db.transaction(() => {
        deps.db.run(
          `INSERT INTO trees (id, name, locale, version) VALUES ($treeId, $treeName, 'en', $version)`,
          { $treeId: treeId, $treeName: treeName, $version: generateId() }
        )

        deps.db.run(
          `INSERT INTO accounts (id, email, display_name, status) VALUES ($id, $email, $displayName, 'active')`,
          { $id: accountId, $email: email, $displayName: displayName }
        )

        deps.db.run(
          'INSERT INTO credentials (account_id, hash, hash_version) VALUES ($id, $hash, $hashVersion)',
          { $id: accountId, $hash: hash, $hashVersion: hashVersion }
        )

        deps.db.run(
          `INSERT INTO memberships (id, account_id, tree_id, status, roles)
           VALUES ($id, $accountId, $treeId, 'active', '["administrator"]')`,
          { $id: generateId(), $accountId: accountId, $treeId: treeId }
        )

        deps.db.run('UPDATE bootstrap_state SET consumed = 1 WHERE id = 1')
      })

      const { rawToken, session } = createSession(deps.db, accountId, 'recent')
      setSessionCookie(res, rawToken)

      res.status(201).json({
        accepted: true,
        account: {
          id: accountId,
          email,
          displayName,
          status: 'active',
          linkedPersonId: null,
          createdAt: session.createdAt,
        },
        tree: {
          id: treeId,
          name: treeName,
        },
      })
    } catch (err) {
      next(err)
    }
  })

  return router
}

export function ensureBootstrapState(db: { get: <T>(sql: string, params?: Record<string, unknown>) => T | undefined; run: (sql: string, params?: Record<string, unknown>) => void }): string {
  const existing = db.get<{ id: number }>('SELECT id FROM bootstrap_state WHERE id = 1')
  if (!existing) {
    const token = generateToken(256)
    const verifier = createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    db.run(
      'INSERT INTO bootstrap_state (id, token_verifier, expires_at) VALUES (1, $verifier, $expiresAt)',
      { $verifier: verifier, $expiresAt: expiresAt }
    )

    console.log(`\n=== BOOTSTRAP TOKEN: ${token} ===\n`)
    return token
  }
  return ''
}
