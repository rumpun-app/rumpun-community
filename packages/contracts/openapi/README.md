# Rumpun Community OpenAPI contract

`openapi.yaml` is the initial source-of-truth HTTP contract for the independent Rumpun Community product.

## Contract boundaries

- OpenAPI 3.1 and JSON Schema 2020-12 semantics.
- Base path: `/api/v1` behind the supported same-site reverse proxy.
- Exactly one top-level tree per deployment: `GET/PATCH /tree`; deliberately no tree collection or create-tree endpoint.
- Browser auth uses the `__Host-rumpun_session` opaque cookie. There is no browser JWT or bearer-token scheme.
- Every unsafe browser method requires `X-CSRF-Token`.
- Protected mutations use `Idempotency-Key`; mutable resources use `If-Match` and opaque versions.
- Roles are returned only from authoritative membership state and are never accepted as authentication or authorization claims from clients.
- Account IDs and genealogy person IDs are separate. `linkedPersonId` is optional convenience metadata only.
- Person facts and relationships preserve uncertainty, original date text, confidence, citations, and varied relationship types.
- Media endpoints expose short-lived capabilities, never S3 keys or permanent public URLs.
- GEDCOM begins with dry-run diagnostics and explicit commit. It always targets the existing singleton tree and never silently merges people.
- Redis is absent from business endpoints because it is a disposable implementation detail.

## Initial surface

The contract covers system health, first-admin bootstrap, local login and recovery, server-side sessions, singleton-tree membership invitations, people, explicit relationships, sources, citations, private media upload/download capabilities, and GEDCOM import/export.

It intentionally does not cover multi-tree tenancy, social login, OIDC, passkeys, public media, billing, oral histories, time capsules, memorial experiences, zero-knowledge E2EE, or proprietary Rumpun compatibility.

## Validation rules

CI should lint and bundle the contract, reject unresolved references, validate examples, and run breaking-change detection against the last accepted contract. Generated TypeScript types are build artifacts; they must not replace runtime validation in Express.

Recommended gates:

```text
lint -> bundle -> schema tests -> generated-type drift -> breaking-change check -> Express contract tests
```

Test fixtures must be synthetic. Secrets, raw session tokens, invitation tokens, recovery tokens, CSRF tokens, presigned URLs, storage keys, and real family data must never be committed as examples.

## Status

This contract follows the current proposed ADRs and is itself an initial proposal. Accept the governing ADRs and review endpoint semantics before treating version `0.1.0` as stable or scaffolding production behavior from it.
