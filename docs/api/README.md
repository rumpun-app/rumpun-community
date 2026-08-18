# Rumpun Community HTTP API

The canonical contract is [`openapi.yaml`](openapi.yaml), written for OpenAPI 3.1.0.

## Scope

Version 1 covers the product's genealogy core and portability boundary:

- family trees
- people and alternate names
- explicitly typed relationships
- life facts and uncertain historical dates
- places
- sources and citations
- tree traversal
- search
- change history
- GEDCOM dry-run import, commit, diagnostics, and export

It intentionally excludes proprietary Rumpun features, memorial experiences, oral histories, heirloom stories, time capsules, and zero-knowledge E2EE. Media, invitations, roles, edit review, and extension APIs remain deferred until their requirements are accepted.

## Conventions

- Base path: `/api/v1`
- JSON uses UTF-8 and camelCase property names.
- Identifiers are opaque UUIDs. Clients must not derive meaning from them.
- Collection pagination uses opaque cursors.
- Errors use RFC 9457 problem details with stable Rumpun error codes.
- Mutable resources return `ETag`; updates and deletes require `If-Match`.
- Retriable creates and workflow commands accept `Idempotency-Key`.
- Dates preserve precision and original text instead of fabricating missing day or month values.
- Mutations never silently merge duplicate people or invent relationships.
- GEDCOM import always starts with analysis; committing an import is a separate explicit action.

Authentication mechanics are deployment policy. The contract models bearer tokens for machine clients; a first-party Laravel or Filament UI may use secure same-origin sessions while enforcing the same authorization behavior.

## Validation

Validate the document with an OpenAPI 3.1-compatible linter. Breaking changes require a new API version or an accepted compatibility plan.
