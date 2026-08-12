# ADR-0009: Use SQLite for the initial implementation stage

- Status: Accepted
- Date: 2026-08-12
- Deciders: Initial Rumpun Community maintainer
- Temporarily supersedes: The PostgreSQL implementation requirement in ADR-0002

## Context

Rumpun Community has an accepted OpenAPI contract but no application implementation. The first objective is to prove the singleton-tree domain, authentication and authorization boundaries, HTTP behavior, migrations, and frontend integration with the smallest practical local runtime.

Running PostgreSQL from the first coding slice increases setup and CI work before those boundaries are proven. SQLite can provide a deterministic embedded database for the initial implementation stage, but it differs from PostgreSQL in concurrency, typing, constraints, locking, query behavior, and migration semantics. Treating SQLite as silently equivalent would create a dangerous migration later.

## Decision

Use SQLite as the only application database during the initial implementation stage.

This decision changes implementation sequencing, not the OpenAPI contract or domain authority:

- SQLite is authoritative for structured application state during this stage.
- Express remains the only backend and database access boundary.
- The browser and Next.js never access the SQLite file directly.
- One deployment still owns exactly one top-level family tree with an explicit stable tree ID.
- OPA authorization, opaque server-side sessions, CSRF, S3-compatible object bytes, and disposable Redis semantics remain unchanged.
- The database file is local operator state and must never be committed.

### Portability boundary

Persistence code must sit behind explicit repositories or ports owned by `apps/api`. Domain and application services must not import a SQLite driver or depend on SQLite row shapes.

Migrations must be explicit, ordered, reviewed, forward-only during normal startup, and tested from a clean database and the previous supported schema. Destructive implicit synchronization is forbidden.

Use portable schema and query behavior where reasonable:

- stable opaque text identifiers rather than database-generated integer identity as public identity
- ISO 8601 UTC timestamps stored and validated consistently
- explicit booleans and enumerations with application and database checks
- foreign keys enabled on every connection
- transaction boundaries explicit in application code
- no correctness dependency on SQLite's permissive typing, implicit row ordering, single-writer behavior, or connection-local state
- no SQLite-specific full-text, JSON, trigger, or extension feature without a focused ADR and migration plan

### Concurrency and operation

Configure a bounded busy timeout and WAL mode where supported by the selected driver. Do not hide lock contention behind unbounded retry. Tests must cover concurrent first-admin bootstrap, singleton-tree initialization, session rotation, invitation consumption, idempotent mutations, optimistic concurrency, and rollback.

SQLite is not a cache, queue, lock service, or object store. Redis remains optional disposable cache only and must not be introduced before measured eligible reads exist.

### PostgreSQL transition gate

PostgreSQL is deferred, not assumed compatible. Moving to PostgreSQL requires a new accepted ADR and a tested migration utility that:

1. reads a supported SQLite schema version
2. writes to an empty PostgreSQL database through explicit mappings
3. preserves stable IDs, tree scope, account and membership identity, sessions where intentionally migrated, genealogy claims, citations, media metadata, audit history, and versions
4. verifies counts, referential integrity, uniqueness, digests, and representative behavior
5. documents downtime, backup, rollback, and unsupported historical versions
6. runs the same repository contract tests against both databases during the transition

No code may claim PostgreSQL support before that gate passes.

## Consequences

### Positive

- First-time setup and CI need no database service.
- AI agents can prove the OpenAPI and domain boundaries faster.
- Tests can create isolated database files deterministically.
- The repository abstraction is forced to expose portability assumptions early.

### Negative

- SQLite has a single-writer concurrency profile and different SQL semantics.
- A deliberate PostgreSQL migration remains future work.
- Production scale and high-concurrency claims cannot be made from SQLite evidence.
- Some accepted ADR-0002 PostgreSQL-specific validation is deferred.

## Validation

The initial backend slice must prove:

1. foreign keys are enabled for every connection
2. migrations apply to clean and previous-version databases
3. singleton-tree and first-admin bootstrap remain atomic under concurrency
4. transaction rollback leaves no partial account, membership, tree, session, invitation, or mutation state
5. idempotency and `If-Match` behavior survive process restart
6. database files, journals, and temporary copies are ignored by Git
7. repository and application tests do not depend on raw SQLite row shapes
8. backup copies are consistent and restoration preserves all stable identifiers
9. unsupported SQLite behavior fails explicitly rather than being described as PostgreSQL-compatible
