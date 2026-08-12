import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { Db } from '../src/db/connection.js'
import { createTestDb, TestContext } from './setup.js'

describe('Tree endpoints', () => {
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

  it('GET /tree returns tree info', async () => {
    const cookie = await bootstrapAndGetCookie()

    const res = await request(app)
      .get('/tree')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('My Family Tree')
    expect(res.body.id).toBeTruthy()
    expect(res.body.version).toBeTruthy()
  })

  it('GET /tree returns 401 without auth', async () => {
    const res = await request(app).get('/tree')
    expect(res.status).toBe(401)
  })

  it('PATCH /tree updates tree name', async () => {
    const cookie = await bootstrapAndGetCookie()

    const csrfRes = await request(app)
      .get('/auth/csrf')
      .set('Cookie', cookie)

    const getRes = await request(app)
      .get('/tree')
      .set('Cookie', cookie)

    const version = getRes.body.version

    const res = await request(app)
      .patch('/tree')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrfRes.body.token)
      .set('If-Match', `"${version}"`)
      .send({ name: 'Updated Tree Name' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Updated Tree Name')
  })
})
