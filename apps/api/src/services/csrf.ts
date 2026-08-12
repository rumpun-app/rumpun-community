import { createHash, randomBytes } from 'node:crypto'
import { Request } from 'express'
import { env } from '../lib/env.js'
import { Db } from '../db/connection.js'
import { AppError } from '../middleware/error-handler.js'

function hashCsrf(token: string): string {
  return createHash('sha256').update(token + env.CSRF_SECRET).digest('hex')
}

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

export function storeCsrfToken(db: Db, sessionId: string, token: string): void {
  const tokenHash = hashCsrf(token)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  db.run(
    `INSERT OR REPLACE INTO csrf_tokens (session_id, token_hash, expires_at)
     VALUES ($sessionId, $tokenHash, $expiresAt)`,
    { $sessionId: sessionId, $tokenHash: tokenHash, $expiresAt: expiresAt }
  )
}

export function validateCsrfToken(db: Db, sessionId: string, token: string): void {
  const row = db.get<{ token_hash: string; expires_at: string }>(
    'SELECT token_hash, expires_at FROM csrf_tokens WHERE session_id = $sessionId',
    { $sessionId: sessionId }
  )

  if (!row) {
    throw new AppError(403, 'csrf_invalid', 'CSRF token is missing or invalid')
  }

  if (new Date() > new Date(row.expires_at)) {
    throw new AppError(403, 'csrf_expired', 'CSRF token has expired')
  }

  const expectedHash = hashCsrf(token)
  if (expectedHash !== row.token_hash) {
    throw new AppError(403, 'csrf_invalid', 'CSRF token mismatch')
  }
}

export function requireCsrf(req: Request, db: Db): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return
  }
  const header = req.headers['x-csrf-token']
  const token = Array.isArray(header) ? header[0] : header
  if (!token || !req.sessionId) {
    throw new AppError(403, 'csrf_required', 'CSRF token required for unsafe methods')
  }
  validateCsrfToken(db, req.sessionId, token)
}
