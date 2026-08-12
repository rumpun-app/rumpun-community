import fs from 'node:fs'
import path from 'node:path'
import { env } from '../lib/env.js'
import { logger } from '../lib/logger.js'
import { AppError } from '../middleware/error-handler.js'

export interface OpaDecision {
  allow: boolean
  reason_code?: string
  policy_revision?: string
}

export interface OpaInput {
  schema_version: string
  request_id: string
  actor: {
    id: string
    authenticated: boolean
    session_assurance: string
  }
  action: string
  scope: {
    tree_id?: string
  }
  resource?: {
    type: string
    id?: string
    tree_id?: string
    attributes?: Record<string, unknown>
  }
  membership?: {
    active: boolean
    roles: string[]
  }
  context?: Record<string, unknown>
}

export async function loadPolicy(): Promise<string> {
  const policyDir = path.resolve(env.OPA_POLICY_PATH)
  if (fs.existsSync(policyDir)) {
    const files = fs.readdirSync(policyDir).filter((f) => f.endsWith('.rego'))
    logger.info({ policyDir, files: files.length }, 'policy files discovered')
  } else {
    logger.warn({ policyDir }, 'policy directory not found')
  }
  return 'dev-revision-001'
}

export async function evaluatePolicy(input: OpaInput): Promise<OpaDecision> {
  if (env.OPA_URL === 'http://localhost:8181') {
    return evaluateLocal(input)
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${env.OPA_URL}/v1/data/rumpun/authz/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      logger.warn({ status: response.status }, 'OPA request failed')
      return { allow: false, reason_code: 'policy_unavailable' }
    }

    const result = await response.json()
    return result as OpaDecision
  } catch (err) {
    logger.warn({ err }, 'OPA request error')
    return { allow: false, reason_code: 'policy_unavailable' }
  }
}

function evaluateLocal(input: OpaInput): OpaDecision {
  if (!input.actor.authenticated) {
    return { allow: false, reason_code: 'authentication_required' }
  }
  if (!input.membership?.active) {
    return { allow: false, reason_code: 'membership_required' }
  }

  const roles = input.membership.roles
  const action = input.action

  const adminActions = ['bootstrap.admin.create', 'tree.update', 'member.invite']
  const editorActions = ['person.create', 'person.update', 'tree.read', 'person.read', 'person.list']
  const viewerActions = ['tree.read', 'person.read', 'person.list']

  if (roles.includes('administrator')) {
    return { allow: true, policy_revision: 'dev-revision-001' }
  }
  if (roles.includes('editor') && editorActions.includes(action)) {
    return { allow: true, policy_revision: 'dev-revision-001' }
  }
  if (roles.includes('contributor') && (action === 'person.read' || action === 'person.list' || action === 'tree.read')) {
    return { allow: true, policy_revision: 'dev-revision-001' }
  }
  if (roles.includes('viewer') && viewerActions.includes(action)) {
    return { allow: true, policy_revision: 'dev-revision-001' }
  }

  return { allow: false, reason_code: 'action_not_allowed' }
}

export function requireAuth(req: { accountId?: string; sessionAssurance?: string }): void {
  if (!req.accountId) {
    throw new AppError(401, 'unauthorized', 'Authentication required')
  }
}
