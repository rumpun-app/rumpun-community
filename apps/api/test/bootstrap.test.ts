import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { createTestDb } from './setup.js'

describe('Bootstrap endpoints', () => {
  it('GET /bootstrap/status returns available before bootstrap', async () => {
    const { db } = await createTestDb()
    const app = createApp({ db, policyRevision: 'test' })

    const res = await request(app).get('/bootstrap/status')
    expect(res.status).toBe(200)
    expect(res.body.available).toBe(true)
    expect(res.body.expiresAt).toBeTruthy()

    db.close()
  })

  it('POST /bootstrap/admin creates first admin', async () => {
    const { db, bootstrapToken } = await createTestDb()
    const app = createApp({ db, policyRevision: 'test' })

    const res = await request(app)
      .post('/bootstrap/admin')
      .send({
        bootstrapToken,
        email: 'admin@test.com',
        password: 'test-password-123!',
        displayName: 'Admin',
        treeName: 'My Family Tree',
      })

    expect(res.status).toBe(201)
    expect(res.body.accepted).toBe(true)
    expect(res.body.account.email).toBe('admin@test.com')
    expect(res.body.tree.name).toBe('My Family Tree')

    db.close()
  })

  it('POST /bootstrap/admin rejects second admin', async () => {
    const { db, bootstrapToken } = await createTestDb()
    const app = createApp({ db, policyRevision: 'test' })

    await request(app)
      .post('/bootstrap/admin')
      .send({
        bootstrapToken,
        email: 'admin@test.com',
        password: 'test-password-123!',
        displayName: 'Admin',
        treeName: 'My Family Tree',
      })

    const res = await request(app)
      .post('/bootstrap/admin')
      .send({
        bootstrapToken: 'some-other-token',
        email: 'admin2@test.com',
        password: 'test-password-456!',
        displayName: 'Admin 2',
        treeName: 'Another Tree',
      })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('already_bootstrapped')

    db.close()
  })
})
