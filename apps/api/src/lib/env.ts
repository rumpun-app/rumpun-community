function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) {
    if (process.env.NODE_ENV === 'test') {
      return `test-${name.toLowerCase()}`
    }
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  PORT: parseInt(requireEnv('PORT', '3001'), 10),
  DATABASE_PATH: requireEnv('DATABASE_PATH', './data/rumpun.db'),
  OPA_URL: requireEnv('OPA_URL', 'http://localhost:8181'),
  OPA_POLICY_PATH: requireEnv('OPA_POLICY_PATH', './packages/authorization-policy/policy'),
  BOOTSTRAP_TOKEN: requireEnv('BOOTSTRAP_TOKEN', ''),
  SESSION_SECRET: requireEnv('SESSION_SECRET', 'dev-session-secret-change-in-production'),
  CSRF_SECRET: requireEnv('CSRF_SECRET', 'dev-csrf-secret-change-in-production'),
  NODE_ENV: requireEnv('NODE_ENV', 'development'),
  CORS_ORIGIN: requireEnv('CORS_ORIGIN', 'http://localhost:3000'),
  HASH_COST: parseInt(requireEnv('HASH_COST', '2'), 10),
  LOG_LEVEL: requireEnv('LOG_LEVEL', 'info'),
}
