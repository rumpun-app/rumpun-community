import { Db } from '../db/connection.js'
import { generateId, generateToken } from '../lib/id.js'
import { createHash, timingSafeEqual } from 'node:crypto'
import { env } from '../lib/env.js'

const SESSION_COOKIE = env.NODE_ENV === 'test' ? 'rumpun_session' : '__Host-rumpun_session'

export interface SessionData {
  id: string
  accountId: string
  assurance: string
  securityVersion: number
  createdAt: string
  lastSeenAt: string
  idleExpiresAt: string
  absoluteExpiresAt: string
}

function hashToken(token: string): string {
  return createHash('sha256').update(token + env.SESSION_SECRET).digest('hex')
}

export function createSessionToken(): { raw: string; verifier: string } {
  const raw = generateToken(256)
  const verifier = hashToken(raw)
  return { raw, verifier }
}

export function createSession(
  db: Db,
  accountId: string,
  assurance = 'normal'
): { rawToken: string; session: SessionData } {
  const { raw, verifier } = createSessionToken()
  const id = generateId()
  const now = new Date().toISOString()
  const idleExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  const absoluteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  db.run(
    `INSERT INTO sessions (id, account_id, token_verifier, assurance, security_version, created_at, last_seen_at, idle_expires_at, absolute_expires_at)
     VALUES ($id, $accountId, $verifier, $assurance, 1, $now, $now, $idleExpiresAt, $absoluteExpiresAt)`,
    {
      $id: id,
      $accountId: accountId,
      $verifier: verifier,
      $assurance: assurance,
      $now: now,
      $idleExpiresAt: idleExpiresAt,
      $absoluteExpiresAt: absoluteExpiresAt,
    }
  )

  const session: SessionData = {
    id,
    accountId,
    assurance,
    securityVersion: 1,
    createdAt: now,
    lastSeenAt: now,
    idleExpiresAt,
    absoluteExpiresAt,
  }

  return { rawToken: raw, session }
}

export function validateSession(db: Db, rawToken: string): SessionData | null {
  const verifier = hashToken(rawToken)
  const row = db.get<{
    id: string
    account_id: string
    assurance: string
    security_version: number
    created_at: string
    last_seen_at: string
    idle_expires_at: string
    absolute_expires_at: string
    revoked_at: string | null
  }>(
    'SELECT * FROM sessions WHERE token_verifier = $verifier',
    { $verifier: verifier }
  )

  if (!row) return null
  if (row.revoked_at) return null

  const now = new Date()
  if (now > new Date(row.absolute_expires_at)) return null
  if (now > new Date(row.idle_expires_at)) return null

  return {
    id: row.id,
    accountId: row.account_id,
    assurance: row.assurance,
    securityVersion: row.security_version,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    idleExpiresAt: row.idle_expires_at,
    absoluteExpiresAt: row.absolute_expires_at,
  }
}

export function touchSession(db: Db, sessionId: string): void {
  const now = new Date().toISOString()
  const idleExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  db.run(
    'UPDATE sessions SET last_seen_at = $now, idle_expires_at = $idleExpiresAt WHERE id = $id',
    { $now: now, $idleExpiresAt: idleExpiresAt, $id: sessionId }
  )
}

export function revokeSession(db: Db, sessionId: string): void {
  const now = new Date().toISOString()
  db.run('UPDATE sessions SET revoked_at = $now WHERE id = $id', { $now: now, $id: sessionId })
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE
}

export function setSessionCookie(res: { cookie: (name: string, value: string, options: Record<string, unknown>) => void }, rawToken: string): void {
  const isProduction = env.NODE_ENV === 'production' || env.NODE_ENV === 'test'
  res.cookie(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export function clearSessionCookie(res: { clearCookie: (name: string, options: Record<string, unknown>) => void }): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' })
}
