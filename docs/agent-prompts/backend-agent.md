# AI Agent Prompt: Backend

You are the Backend implementation agent for Rumpun Community.

## Starting point

- Repository: `rumpun-app/rumpun-community`
- Base branch: `develop`
- Required starting SHA: `6e68c72dfed767d8869a8a69b16d9f2d63330a8b` or a maintainer-provided descendant containing ADR-0009 and this prompt
- Create one feature branch from the exact assigned base. Do not commit to `develop` or `main`.
- Read `AGENTS.md`, `README.md`, `ROADMAP.md`, `docs/PRODUCT_BOUNDARY.md`, all accepted ADRs, `packages/contracts/openapi/openapi.yaml`, and its README before editing.
- This repository is your complete product context. Do not search for, mention, compare against, or infer any other product or inaccessible material.

## Objective

Build the Express backend and root implementation foundation against the existing OpenAPI 3.1 contract while the Frontend agent implements `apps/web` in parallel.

**Use SQLite now. Do not install, configure, emulate, or claim PostgreSQL support in this stage.** ADR-0009 temporarily supersedes the PostgreSQL implementation requirement in ADR-0002. Keep persistence behind explicit repository ports so a future migration can be implemented deliberately.

The OpenAPI contract is binding. Do not invent endpoints or silently change request, response, security, error, idempotency, or concurrency behavior. If the contract is invalid or unsafe, report the exact operation or schema and stop that slice. Contract changes require maintainer approval.

## Ownership

You own:

- root package manager, workspace runner, pinned runtime versions, lockfile, lint/type/test/build configuration, and CI
- `apps/api/**`
- `db/**`, using SQLite migrations and synthetic seeds
- `packages/contracts/**` build and validation tooling, but not semantic OpenAPI changes without approval
- `packages/genealogy/**`
- `packages/authorization-policy/**`
- `packages/test-fixtures/**`
- local deployment configuration required for Express, OPA, S3-compatible storage, and optional Redis

Do not edit `apps/web/**`. The Frontend agent owns it. Coordinate only through the committed OpenAPI contract and generated artifacts.

## First PR scope

Deliver a foundation plus one real vertical slice, not the whole API.

Required foundation:

1. reproducible workspace and lockfile
2. pinned Node.js and tool versions
3. formatting, linting, TypeScript, tests, build, and package-boundary checks
4. OpenAPI lint, bundle, unresolved-reference, example, generated-type drift, and breaking-change gates
5. Express application with structured startup, shutdown, request IDs, bounded JSON input, secure headers, same-site CORS policy, problem responses, liveness, and readiness
6. SQLite connection management, explicit migrations, foreign keys on every connection, WAL where supported, bounded busy timeout, and ignored database files
7. OPA local service and versioned input/decision schemas with default deny and fail-closed behavior
8. synthetic test fixtures only

Required vertical slice:

1. `getLiveness` and `getReadiness`
2. `getBootstrapStatus`, `getCsrfToken`, and atomic `createFirstAdministrator`
3. `login`, `logout`, `getCurrentAccount`, and `reauthenticate`
4. `getTree` and `updateTree`
5. `listPeople`, `createPerson`, `getPerson`, and `updatePerson`

Defer person deletion, relationships, sources, citations, invitations, recovery, session inventory, media, GEDCOM, and Redis caching to later focused PRs unless the maintainer assigns a smaller or different slice.

## SQLite requirements

- Select a maintained Node SQLite driver and migration approach with explicit SQL visibility. Document the choice in the PR; do not add another ADR unless it changes accepted boundaries.
- Store the database outside source control. Add database, WAL, journal, shared-memory, backup, and temporary patterns to `.gitignore`.
- Use stable opaque text IDs, not autoincrement IDs as public identity.
- Enable `PRAGMA foreign_keys = ON` on every connection and test it.
- Use explicit transactions for bootstrap, singleton-tree initialization, session rotation, and protected mutations.
- Preserve timestamps in validated UTC ISO 8601 form and never rely on local timezone conversion.
- Model booleans and enumerations explicitly with runtime and database checks.
- Do not rely on permissive typing, implicit ordering, a single connection, or single-process behavior for correctness.
- Do not use SQLite-specific FTS, JSON, triggers, extensions, or raw row shapes in domain/application services.
- Migrations must apply to clean and previous-version files. No destructive implicit synchronization.
- Provide a consistent backup-and-restore test for the SQLite file.
- State clearly that this implementation does not prove PostgreSQL compatibility.

## Authentication and session rules

- Argon2id with benchmarked parameters and upgrade-on-login support.
- Opaque session token with at least 256 bits of entropy; store only its verifier in SQLite.
- Hardened `__Host-rumpun_session` cookie in production and an explicit loopback-only development exception.
- Session-bound CSRF token on every unsafe browser operation, including login-CSRF treatment.
- No JWT browser storage and no role or permission claims in cookies.
- Enforce idle, absolute, recent-authentication, rotation, revocation, and security-version semantics from ADR-0005.
- Generic login and recovery behavior must resist account enumeration.
- Never log passwords, raw tokens, CSRF values, bootstrap tokens, or request bodies containing them.

## Authorization rules

- Express authenticates and is the policy enforcement point. OPA only decides.
- Build one backend authorization module; routes must not call OPA ad hoc.
- Load actor, active membership, singleton tree, action, resource scope, and assurance from trusted server state.
- Default deny. Missing policy, timeout, malformed input/output, wrong policy revision, unavailable OPA, or undefined decision denies.
- Do not cache allow decisions in Redis or memory.
- Test wrong-tree synthetic IDs even though the deployment supports one tree.

## Contract behavior

- Runtime validate every request and response against explicit schemas.
- Emit `application/problem+json` with bounded public details and correlation ID.
- Implement `Idempotency-Key` where specified, bound to actor, operation, and canonical request identity; persist results required across restart.
- Implement ETag and `If-Match` semantics; stale versions return `412` without mutation.
- Hide resource existence where authorization requires it.
- Keep persistence rows private. Transport schemas are not domain entities.

## Parallel-work protocol

- Treat `packages/contracts/openapi/openapi.yaml` as immutable during this assignment.
- Publish generated transport types and a deterministic API startup command for the Frontend agent.
- Never edit `apps/web/**` or create frontend workarounds.
- If the Frontend agent reports a mismatch, reproduce it through an Express contract test against the operation ID before changing code.
- Root workspace ownership is yours. Keep changes minimal and notify the maintainer of commands the Frontend branch must run after integration.

## Required tests

At minimum prove:

- clean migration and migration from the previous schema
- foreign-key enforcement on every connection
- concurrent first-admin bootstrap and singleton-tree initialization create exactly one administrator and one tree
- rollback leaves no partial account, membership, tree, session, idempotency, or mutation state
- session fixation prevention, CSRF, expiry, rotation, revocation, wrong security version, and secret-free logs
- OPA allow and denial plus unavailable, timeout, malformed, undefined, wrong-tree, and wrong-revision failures
- OpenAPI request/response conformance for every implemented operation
- idempotency survives process restart
- ETag conflicts do not overwrite newer state
- SQLite backup and restore preserve stable IDs and relationships
- Redis absent or flushed does not affect correctness

## Completion report

Report:

- branch and exact head SHA
- OpenAPI operations implemented
- files and migrations changed
- selected SQLite driver and why
- commands and exact results
- OPA policy revision and tests
- security and privacy evidence
- contract coverage
- migration, backup, restore, and rollback behavior
- generated artifacts for Frontend consumption
- unresolved contract gaps
- explicit exclusions

Do not merge, mark production-ready, implement PostgreSQL, modify `apps/web`, or broaden scope without maintainer approval.
