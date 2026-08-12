import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { createTestDb } from './setup.js'

describe('Health endpoints', () => {
  it('GET /health/live returns alive', async () => {
    const { db } = await createTestDb()
    const app = createApp({ db, policyRevision: 'test-revision' })

    const res = await request(app).get('/health/live')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'alive' })

    db.close()
  })

  it('GET /health/ready returns readiness', async () => {
    const { db } = await createTestDb()
    const app = createApp({ db, policyRevision: 'test-revision' })

    const res = await request(app).get('/health/ready')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ready')
    expect(res.body.policyRevision).toBe('test-revision')

    db.close()
  })
})
