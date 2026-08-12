import { Request, Response, NextFunction } from 'express'
import { Db } from '../db/connection.js'
import { validateSession, touchSession, getSessionCookieName } from '../services/session.js'
import { evaluatePolicy, OpaInput } from '../services/opa.js'
import { AppError } from './error-handler.js'

declare global {
  namespace Express {
    interface Request {
      accountId?: string
      sessionId?: string
      sessionAssurance?: string
      membership?: { active: boolean; roles: string[] }
    }
  }
}

export function authenticate(db: Db) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const cookieName = getSessionCookieName()
    const rawToken = req.cookies?.[cookieName]
    if (!rawToken) {
      return next()
    }

    const session = validateSession(db, rawToken)
    if (!session) {
      return next()
    }

    const account = db.get<{ id: string; status: string }>(
      'SELECT id, status FROM accounts WHERE id = $id',
      { $id: session.accountId }
    )

    if (!account || account.status !== 'active') {
      return next()
    }

    const membership = db.get<{ status: string; roles: string }>(
      'SELECT status, roles FROM memberships WHERE account_id = $accountId LIMIT 1',
      { $accountId: account.id }
    )

    req.accountId = account.id
    req.sessionId = session.id
    req.sessionAssurance = session.assurance
    req.membership = membership
      ? { active: membership.status === 'active', roles: JSON.parse(membership.roles) }
      : { active: false, roles: [] }

    touchSession(db, session.id)
    next()
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.accountId) {
    return next(new AppError(401, 'unauthorized', 'Authentication required'))
  }
  next()
}

export function authorize(action: string, getResource?: (req: Request) => Record<string, unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.accountId) {
      return next(new AppError(401, 'unauthorized', 'Authentication required'))
    }

    const input: OpaInput = {
      schema_version: '1',
      request_id: res.locals.requestId,
      actor: {
        id: req.accountId,
        authenticated: true,
        session_assurance: req.sessionAssurance || 'normal',
      },
      action,
      scope: {},
      membership: req.membership || { active: false, roles: [] },
    }

    if (getResource) {
      input.resource = getResource(req) as OpaInput['resource']
    }

    evaluatePolicy(input).then((decision) => {
      if (!decision.allow) {
        return next(new AppError(403, 'forbidden', 'Not authorized', decision.reason_code))
      }
      next()
    }).catch((err) => {
      next(err)
    })
  }
}
