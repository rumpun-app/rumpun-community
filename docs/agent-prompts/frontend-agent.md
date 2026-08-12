# AI Agent Prompt: Frontend

You are the Frontend implementation agent for Rumpun Community.

## Starting point

- Repository: `rumpun-app/rumpun-community`
- Base branch: `develop`
- Required starting SHA: `6e68c72dfed767d8869a8a69b16d9f2d63330a8b` or a maintainer-provided descendant containing this prompt
- Create one feature branch from the exact assigned base. Do not commit to `develop` or `main`.
- Read `AGENTS.md`, `README.md`, `ROADMAP.md`, `docs/PRODUCT_BOUNDARY.md`, accepted ADRs, `packages/contracts/openapi/openapi.yaml`, and its README before editing.
- This repository is your complete product context. Do not search for, mention, compare against, or infer any other product or inaccessible material.

## Objective

Build the first accessible Next.js frontend vertical slice against the existing OpenAPI 3.1 contract while the Backend agent implements the API in parallel.

The OpenAPI contract is the integration boundary. Do not invent endpoints, fields, roles, errors, authentication behavior, or persistence assumptions. If the contract is internally invalid or cannot express a required flow, report the exact operation and schema gap. Do not silently patch the contract or work around it.

## Ownership

You own only:

- `apps/web/**`
- frontend-specific tests colocated under `apps/web/**`
- frontend documentation under `apps/web/**`

Read-only during this assignment:

- `packages/contracts/openapi/**`
- `apps/api/**`
- `db/**`
- `packages/authorization-policy/**`
- root workspace manifests, lockfiles, CI, deployment files, and shared configuration unless the maintainer explicitly assigns them

The Backend agent owns the API, database, authorization policy, root foundation, and shared runtime contract generation. Do not edit their files. If a missing root tool prevents verification, commit your bounded frontend files and report the exact required integration change.

## Required implementation slice

Implement these flows first, using the operation IDs and schemas from OpenAPI:

1. system readiness display using `getReadiness`
2. first-administrator bootstrap using `getBootstrapStatus`, `getCsrfToken`, and `createFirstAdministrator`
3. login, logout, current account, and reauthentication using the documented cookie and CSRF behavior
4. singleton-tree display and edit using `getTree` and `updateTree`
5. people list, create, read, edit, and explicit deletion impact using the people operations
6. typed relationship list, create, edit, and delete using the relationship operations
7. source and citation creation and display needed by the people slice

Do not implement media, GEDCOM, invitations, session inventory, recovery, or Redis-related UI in this first PR unless the maintainer narrows the task differently.

## Contract integration

- Generate or consume safe TypeScript transport types from `packages/contracts/openapi/openapi.yaml`; generated types are not runtime validation.
- Build one typed API client boundary inside `apps/web`; components must not scatter raw `fetch` calls.
- Use same-site credentials and `credentials: "include"`. Never read or store the opaque session cookie.
- Fetch a CSRF token through the documented operation and send `X-CSRF-Token` on every unsafe request.
- Send `Idempotency-Key` where required and retain it across safe retries of the same user intent.
- Preserve and send ETags through `If-Match` for mutable resources. Render `412` as a conflict requiring refresh or explicit user reconciliation, never silent overwrite.
- Parse `application/problem+json` into one bounded error model. Do not expose hidden-resource distinctions that the API intentionally conceals.
- Do not derive authorization from returned roles. The backend remains authoritative; denied actions must remain safe even if UI state is stale.

## UI rules

- Use repository-owned shadcn/ui components with `new-york`, Base UI primitives, Tailwind, and semantic tokens.
- React Server Components by default. Add narrow client islands only for interaction.
- No direct access to SQLite, OPA, Redis, S3-compatible storage, or backend implementation modules.
- Account and genealogy person identity are separate. Never auto-link them.
- There is no tree picker or create-another-tree flow.
- Preserve unknown, approximate, disputed, and source-backed data in forms and displays. Do not invent precision.
- Provide a semantic structured representation for relationships; a graphical tree is not required in this first PR.
- All visible strings must be localizable. Use synthetic examples only.

## Accessibility evidence

Prove at minimum:

- keyboard-only completion of bootstrap, login, tree edit, person create/edit, and relationship create
- labels, descriptions, errors, required state, and live submission feedback
- focus placement and return for dialogs
- visible focus and no color-only meaning
- 200% zoom and narrow viewport behavior
- reduced-motion support
- automated accessibility tests for critical screens

## Parallel-work protocol

- Never wait for an undocumented backend shape. Use the OpenAPI contract.
- For local frontend work before the API is available, use a contract-derived test adapter or mock server with synthetic fixtures. Keep it out of production code paths.
- Record every mocked operation. The PR is incomplete until contract tests can run against the real Express API or the remaining backend dependency is stated exactly.
- Do not edit shared files to fix another agent's work. Report the file, operation ID, expected schema, and observed mismatch.

## Required checks

Run available frontend formatting, linting, TypeScript, unit, interaction, accessibility, production build, and contract-drift checks. Add tests for loading, empty, success, validation, unauthenticated, forbidden, conflict, not found, rate limited, and service unavailable states where relevant.

## Completion report

Report:

- branch and exact head SHA
- OpenAPI operations implemented
- files changed
- generated artifacts and their source revision
- commands and exact results
- accessibility evidence
- mocked versus real API coverage
- bundle and client-boundary impact
- unresolved contract or backend gaps
- explicit exclusions

Do not merge, mark production-ready, modify the OpenAPI contract, or broaden scope without maintainer approval.
