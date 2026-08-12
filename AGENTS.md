# AGENTS.md

Instructions for AI coding agents and automated contributors working in this repository.

## Mission

Build Rumpun Community as a community-maintained family tree application focused on genealogy fundamentals, evidence, interoperability, accessibility, and practical self-hosting.

## Source-of-truth boundary

This repository is the complete product and architecture context available to agents. Use only committed files in this repository, cited public standards, and public upstream dependency documentation required by the assigned task.

Do not search for, request, infer, compare against, mention, or acknowledge any other product, repository, roadmap, design, feature set, schema, API, asset, prompt, infrastructure, or non-public material. Do not describe excluded features from elsewhere. If a requirement is not present here, treat it as unknown and stop at the exact gap.

Use synthetic data only. Never commit real family records or personal data.

## Authority and decision status

Accepted ADRs under `docs/adr/` are binding implementation decisions. Read every ADR relevant to the assigned slice before editing code. Do not reopen an accepted decision inside an implementation pull request. If implementation evidence shows that a decision is unsafe or unworkable, propose a superseding ADR with migration and rollback impact.

ADR-0000 remains authoritative for decision discipline, but its temporary stack-neutrality restriction is superseded by accepted ADR-0002. Implementation may proceed within accepted boundaries.

## Accepted architecture

- Monorepo with TypeScript applications and narrowly scoped shared packages.
- `apps/web`: Next.js frontend. It never connects directly to PostgreSQL, OPA, Redis, or S3-compatible storage.
- `apps/api`: Express canonical backend, authentication authority, policy enforcement point, transaction owner, and integration boundary.
- PostgreSQL is the authoritative transactional store.
- One deployment supports exactly one top-level family tree. Keep an explicit stable tree ID and scope.
- OPA is the policy decision point. Express supplies trusted facts and fails closed on missing, malformed, unavailable, or denied decisions.
- Authentication uses local email/password credentials with Argon2id and opaque server-side sessions stored in PostgreSQL. Browser sessions use hardened HttpOnly cookies and CSRF protection, never browser token storage.
- S3-compatible private object storage holds binary bytes. PostgreSQL remains authoritative for media metadata and lifecycle.
- Redis is disposable cache only. It is never authoritative for sessions, permissions, jobs, locks, audit records, genealogy data, or recovery.
- `apps/web` uses repository-owned shadcn/ui components with the pinned `new-york` style, Base UI primitives, Tailwind CSS, and semantic tokens.
- `packages/contracts/openapi/openapi.yaml` is the initial HTTP contract. Runtime validation is required; generated TypeScript types are not validation.

## Required repository boundaries

- Browser code communicates with Express through the documented API only.
- Routes stay thin and delegate to explicit application and domain modules.
- Shared transport contracts must not replace domain entities or expose persistence row shapes.
- Account identity and genealogy person identity remain separate.
- Genealogy facts preserve uncertainty, conflicting claims, original values, sources, citations, and confidence.
- A top-level tree is not a household, surname, lineage branch, or GEDCOM `FAM` record.
- Imports target the existing singleton tree and never silently merge people or create another tree.
- Object keys, cache keys, logs, and telemetry must not leak unnecessary personal or genealogy data.
- Redis loss, flush, restart, or eviction may reduce performance only.

## Required workflow

1. Read `README.md`, `CONTRIBUTING.md`, `ROADMAP.md`, `docs/PRODUCT_BOUNDARY.md`, relevant accepted ADRs, and affected OpenAPI schemas.
2. State the bounded implementation slice and explicit exclusions before changing code.
3. Confirm the slice does not depend on a deferred decision. If it does, create a focused ADR rather than guessing.
4. Keep each pull request focused and avoid unrelated refactors.
5. Update the OpenAPI contract, runtime schemas, migrations, tests, and operator documentation together when behavior changes.
6. Use explicit database migrations. Never use destructive implicit schema synchronization in production.
7. Add deterministic tests through the real production boundary where practical.
8. Run focused checks first, then the broader affected suite.
9. Report changed files, commands, results, migration and rollback impact, security and privacy impact, and remaining exclusions.
10. Do not merge, force-push reviewed history, weaken gates, or mark incomplete work production-ready without maintainer approval.

## Implementation order

1. Foundation: package manager, workspace runner, pinned runtime versions, lint/type/test/build tooling, dependency boundaries, OpenAPI validation, local containers, and CI.
2. Persistence and singleton tree: PostgreSQL schema, migrations, synthetic fixtures, bootstrap invariants, and backup/restore skeleton.
3. Authentication and authorization: first-admin bootstrap, accounts, invitations, opaque sessions, CSRF, OPA contracts, policy tests, and fail-closed integration.
4. Genealogy core: people, names, typed relationships, facts, sources, citations, confidence, uncertainty, and change history.
5. Accessible web vertical slice using shadcn/ui without moving authority into the frontend.
6. Private S3-compatible media lifecycle and reconciliation.
7. GEDCOM dry-run, diagnostics, explicit commit, export, security limits, and round-trip evidence.
8. Redis caching only after measured eligible queries exist and uncached behavior is correct.

Do not implement the whole system in one pull request.

## Quality gates

Every affected slice must include applicable formatting, linting, TypeScript, build, dependency-boundary, OpenAPI, migration, database integration, OPA, authentication, accessibility, storage, GEDCOM, cache-failure, and synthetic-fixture checks. Skipped, disabled, or model-only tests do not prove production behavior.

## Security and privacy guardrails

- Default deny and fail closed at authentication, authorization, storage, and lifecycle boundaries.
- Never trust browser-supplied roles, tree IDs, storage keys, session assurance, MIME types, or authorization facts.
- Never log passwords, raw session or CSRF tokens, invitation or recovery tokens, presigned URLs, storage credentials, GEDCOM payloads, or genealogy content by default.
- Keep protected mutations idempotent where the contract requires it and use optimistic concurrency where defined.
- Do not claim capabilities that the accepted repository architecture does not provide.
- Do not weaken licensing, provenance, security reporting, privacy, accessibility, or data portability.

## Definition of done

A change is done only when its behavior matches accepted ADRs and the OpenAPI contract, production paths enforce stated invariants, runtime validation and deterministic tests exist, migrations and recovery are documented, accessibility and localization impacts are handled, privacy and security implications are reviewed, and self-hosting remains reproducible.

When information is missing, stop at the exact gap and propose the smallest decision needed. Do not silently guess.
