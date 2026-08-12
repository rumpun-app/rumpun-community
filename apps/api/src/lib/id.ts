import { ulid } from 'ulid'

export function generateId(): string {
  return ulid()
}

export function generateToken(bits = 256): string {
  const bytes = Math.ceil(bits / 8)
  const buffer = crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
