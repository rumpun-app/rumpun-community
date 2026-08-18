# ADR-0003: HTTP API style and OpenAPI contract

- Status: Proposed
- Date: 2026-08-19
- Deciders: Community review

## Context

Rumpun Community needs a stable boundary for genealogy integrations, alternate clients, import tooling, and automated conformance tests. The boundary must preserve ambiguity and provenance rather than flatten genealogy into generic CRUD records.

The API must work with a Laravel modular monolith without binding consumers to Filament, Livewire, Eloquent, database row shapes, or a particular authentication provider.

## Decision drivers

- Keep genealogy meaning explicit and portable.
- Preserve uncertain dates, alternate names, relationship types, evidence, and original imported values.
- Prevent lost updates and accidental duplicate mutations.
- Keep large GEDCOM workflows bounded, diagnosable, and explicit.
- Support practical self-hosting and generated documentation without requiring hosted infrastructure.
- Allow additive evolution while making breaking changes visible.

## Decision

Adopt an OpenAPI 3.1 contract at `docs/api/openapi.yaml` with JSON resources under `/api/v1`.

The first contract covers trees, people, relationships, facts, places, sources, citations, traversal, search, change history, and GEDCOM import/export. It does not expose persistence models or Filament resources.

Use:

- opaque UUID identifiers
- camelCase JSON properties
- opaque cursor pagination
- RFC 9457 problem details plus stable application error codes
- ETags and required `If-Match` headers for update and delete operations
- `Idempotency-Key` for retriable creates and workflow commands
- asynchronous job resources for GEDCOM processing
- a mandatory analyze-before-commit GEDCOM import flow
- explicit precision, qualifier, original text, and normalized bounds for historical dates
- explicit relationship types and participant roles
- source and citation resources separate from asserted facts

Collection responses use `{ items, page }`. Sparse fieldsets, arbitrary client-selected includes, bulk mutation, and GraphQL are not part of v1.

Authentication mechanics remain a deployment decision. Bearer authentication is documented for external clients. First-party same-origin sessions may call the same application use cases, but authorization semantics must match the contract.

## Compatibility policy

Additive optional fields, new enum values where clients are required to tolerate unknown values, and new endpoints are compatible. Removing or renaming fields, changing meaning, tightening accepted input, or changing identifier semantics is breaking and requires a new version or an accepted migration plan.

Clients must ignore unknown response properties. Servers must reject unknown mutation properties to catch misspelled or unsupported input.

## Consequences

### Positive

- Integrations share one reviewable contract.
- Genealogy ambiguity and provenance survive transport.
- Generated clients and conformance tests become possible.
- Long-running imports are observable and retry-safe.
- ETags protect collaborative edits from silent overwrites.

### Negative

- The contract adds maintenance and compatibility obligations.
- ETag and idempotency behavior require storage and tests.
- Custom date and GEDCOM diagnostics schemas are more complex than generic CRUD.
- Media and collaboration workflows need follow-up decisions.

## Validation

Before acceptance:

1. lint the OpenAPI document with a 3.1-compatible validator
2. generate at least one client and server stub as a contract smoke test
3. run examples for uncertain dates, non-biological relationships, conflicting facts, source citations, and duplicate candidates
4. verify every mutation has authorization, validation, optimistic concurrency, and idempotency behavior where applicable
5. verify GEDCOM malformed-input and lossy-mapping diagnostics remain machine-readable
6. confirm no proprietary Rumpun capability or compatibility assumption appears in the contract
