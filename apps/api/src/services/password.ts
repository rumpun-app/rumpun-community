import * as argon2 from 'argon2'
import { env } from '../lib/env.js'

export interface HashResult {
  hash: string
  hashVersion: number
}

export async function hashPassword(password: string): Promise<HashResult> {
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    timeCost: env.HASH_COST,
    memoryCost: 19456,
    parallelism: 1,
  })

  return { hash, hashVersion: 1 }
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}

export async function needsRehash(hashVersion: number): Promise<boolean> {
  return hashVersion < 1
}
