import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { Db } from '../src/db/connection.js'
import { createTestDb, TestContext } from './setup.js'

describe('Auth endpoints', () => {
  let db: Db
  let bootstrapToken: string
  let app: ReturnType<typeof createApp>

  beforeEach(async () => {
    const ctx: TestContext = await createTestDb()
    db = ctx.db
    bootstrapToken = ctx.bootstrapToken
    app = createApp({ db, policyRevision: 'test' })
  })

  function extractCookie(res: request.Response): string {
    const header = res.headers['set-cookie']
    if (!header) return ''
    const cookieStr = Array.isArray(header) ? header[0] : header
    return cookieStr.split(';')[0]!
  }

  async function bootstrapAndGetCookie(): Promise<string> {
    const res = await request(app)
      .post('/bootstrap/admin')
      .send({
        bootstrapToken,
        email: 'admin@test.com',
        password: 'test-password-123!',
        displayName: 'Admin',
        treeName: 'My Family Tree',
      })
    return extractCookie(res)
  }

  async function loginAndGetCookie(): Promise<string> {
    await bootstrapAndGetCookie()
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'test-password-123!' })
    return extractCookie(res)
  }

  it('POST /auth/login returns session cookie', async () => {
    await bootstrapAndGetCookie()

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'test-password-123!' })

    expect(res.status).toBe(200)
    expect(res.body.account).toBeTruthy()
    expect(res.body.account.email).toBe('admin@test.com')
    expect(res.headers['set-cookie']).toBeTruthy()
  })

  it('POST /auth/login rejects wrong password', async () => {
    await bootstrapAndGetCookie()

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'wrong-password' })

    expect(res.status).toBe(401)
  })

  it('GET /auth/csrf returns CSRF token', async () => {
    const cookie = await loginAndGetCookie()

    const res = await request(app)
      .get('/auth/csrf')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.token.length).toBeGreaterThanOrEqual(32)
  })

  it('POST /auth/logout revokes session', async () => {
    const cookie = await loginAndGetCookie()

    const csrfRes = await request(app)
      .get('/auth/csrf')
      .set('Cookie', cookie)

    const res = await request(app)
      .post('/auth/logout')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrfRes.body.token)

    expect(res.status).toBe(200)
    expect(res.body.accepted).toBe(true)
  })

  it('GET /auth/me returns current user', async () => {
    const cookie = await loginAndGetCookie()

    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.account.email).toBe('admin@test.com')
    expect(res.body.tree).toBeTruthy()
  })

  it('GET /auth/me returns 401 without cookie', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })
})
