import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { Db } from '../src/db/connection.js'
import { createTestDb, TestContext } from './setup.js'

describe('People endpoints', () => {
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

  async function getAdminCookie(): Promise<string> {
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

  async function getCsrfToken(cookie: string): Promise<string> {
    const res = await request(app)
      .get('/auth/csrf')
      .set('Cookie', cookie)
    return res.body.token
  }

  it('POST /people creates a person', async () => {
    const cookie = await getAdminCookie()
    const csrfToken = await getCsrfToken(cookie)

    const res = await request(app)
      .post('/people')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrfToken)
      .send({
        names: [
          {
            type: 'birth',
            display: 'John Doe',
            given: 'John',
            surname: 'Doe',
            preferred: true,
          },
        ],
        livingStatus: 'living',
        privacy: 'members',
        sex: 'male',
      })

    expect(res.status).toBe(201)
    expect(res.body.id).toBeTruthy()
    expect(res.body.names[0].display).toBe('John Doe')
  })

  it('GET /people returns paginated list', async () => {
    const cookie = await getAdminCookie()
    const csrfToken = await getCsrfToken(cookie)

    await request(app)
      .post('/people')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrfToken)
      .send({
        names: [{ type: 'birth', display: 'John Doe', preferred: true }],
        livingStatus: 'living',
        privacy: 'members',
      })

    const res = await request(app)
      .get('/people')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.items).toBeTruthy()
    expect(res.body.items.length).toBeGreaterThanOrEqual(1)
  })

  it('GET /people/:id returns a person', async () => {
    const cookie = await getAdminCookie()
    const csrfToken = await getCsrfToken(cookie)

    const createRes = await request(app)
      .post('/people')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrfToken)
      .send({
        names: [{ type: 'birth', display: 'Jane Doe', preferred: true }],
        livingStatus: 'living',
        privacy: 'members',
      })

    const res = await request(app)
      .get(`/people/${createRes.body.id}`)
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(createRes.body.id)
    expect(res.body.names[0].display).toBe('Jane Doe')
  })

  it('PATCH /people/:id updates a person', async () => {
    const cookie = await getAdminCookie()
    const csrfToken = await getCsrfToken(cookie)

    const createRes = await request(app)
      .post('/people')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrfToken)
      .send({
        names: [{ type: 'birth', display: 'Jane Doe', preferred: true }],
        livingStatus: 'living',
        privacy: 'members',
      })

    const version = createRes.body.version

    const csrfRes2 = await request(app)
      .get('/auth/csrf')
      .set('Cookie', cookie)

    const res = await request(app)
      .patch(`/people/${createRes.body.id}`)
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrfRes2.body.token)
      .set('If-Match', `"${version}"`)
      .send({
        names: [{ type: 'birth', display: 'Jane Smith', preferred: true }],
      })

    expect(res.status).toBe(200)
    expect(res.body.names[0].display).toBe('Jane Smith')
  })

  it('PATCH /people/:id rejects stale version', async () => {
    const cookie = await getAdminCookie()
    const csrfToken = await getCsrfToken(cookie)

    const createRes = await request(app)
      .post('/people')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrfToken)
      .send({
        names: [{ type: 'birth', display: 'Jane Doe', preferred: true }],
        livingStatus: 'living',
        privacy: 'members',
      })

    const csrfRes2 = await request(app)
      .get('/auth/csrf')
      .set('Cookie', cookie)

    const res = await request(app)
      .patch(`/people/${createRes.body.id}`)
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrfRes2.body.token)
      .set('If-Match', '"stale-version"')
      .send({
        names: [{ type: 'birth', display: 'Jane Smith', preferred: true }],
      })

    expect(res.status).toBe(412)
  })
})
