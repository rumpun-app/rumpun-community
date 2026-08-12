# ADR-0003: Policy-based authorization with Open Policy Agent

- Status: Proposed
- Date: 2026-08-12
- Deciders: Community review
- Depends on: ADR-0002

## Context

Rumpun Community needs authorization for shared family trees, invitations, genealogy records, sources, media metadata, imports, exports, and administrative operations. Access decisions will depend on more than a global role. They may include the authenticated actor, active membership, tree or workspace scope, requested action, resource ownership and tenancy, record sensitivity, and relevant request context.

Embedding these rules throughout Express route handlers would make policy behavior difficult to review, test, and evolve consistently. Enforcing access only in the Next.js frontend would be insecure because browser behavior is not an authorization boundary.

The project therefore needs one reviewable policy decision mechanism while keeping identity verification, authoritative relationship data, resource loading, and enforcement inside the application boundary defined by ADR-0002.

## Decision drivers

- Deny unauthorized cross-tree and cross-tenant access by default.
- Support role-based and attribute-based decisions without hard-coding every rule into routes.
- Keep authorization policy reviewable, testable, and version controlled.
- Preserve a clear separation between authentication, policy decisions, and enforcement.
- Avoid using a policy engine as an identity provider or application database.
- Keep protected operations secure when the policy engine is unavailable or returns an invalid result.
- Support practical self-hosting without a mandatory hosted authorization service.
- Produce useful audit evidence without logging unnecessary genealogy or living-person data.
- Allow policy and application changes to be validated atomically in the monorepo.

## Options considered

### 1. Authorization logic in Express route handlers

**Advantages:** no additional runtime component and easy to begin with.

**Disadvantages:** rules become duplicated across routes, difficult to audit, and tightly coupled to transport code. Inconsistent checks and accidental omissions become more likely.

Rejected.

### 2. A custom centralized authorization library

**Advantages:** no separate process and full control over the API.

**Disadvantages:** the project would own a policy language, evaluator semantics, tooling, and long-term security maintenance. A library also makes it easier for callers to bypass the canonical decision boundary.

Rejected for the initial architecture.

### 3. Open Policy Agent with Rego policies

Express gathers authoritative facts, requests a decision from Open Policy Agent (OPA), and enforces that decision before protected application behavior executes.

**Advantages:** declarative policy as code, mature testing and evaluation tooling, support for RBAC and contextual rules, a language-neutral decision interface, and self-hostable deployment.

**Disadvantages:** adds a runtime component, Rego expertise, policy distribution concerns, latency, and new failure modes that must fail closed.

Accepted.

### 4. A mandatory hosted authorization service

**Advantages:** may provide a management UI, relationship graph, and hosted operations.

**Disadvantages:** creates an external availability and portability dependency, increases self-hosting complexity, and may expose sensitive authorization metadata to another operator.

Rejected as the required architecture. Future optional integrations require a separate ADR.

## Decision

### Responsibilities

Adopt OPA as the policy decision point for protected backend operations. Express remains the policy enforcement point.

- **Authentication** establishes the actor and session assurance. OPA does not authenticate users.
- **Express** validates the request, loads authoritative authorization facts, calls OPA, and enforces the result.
- **OPA** evaluates versioned Rego policy against structured input and returns a bounded decision document.
- **PostgreSQL** remains authoritative for memberships, roles, tree scope, resource ownership, and other application facts.
- **Next.js** may hide or disable unavailable actions for usability, but frontend checks never replace backend enforcement.

OPA must not query PostgreSQL directly, accept browser-supplied roles as authority, or become the system of record for application relationships.

### Initial deployment model

Run OPA as a separately managed local service beside the Express API, preferably as a sidecar or adjacent container in supported deployments. The API communicates with OPA over a private network boundary that is not exposed to browsers or the public internet.

The initial implementation must use OPA's documented decision API. Embedding or compiling policies into another runtime may be reconsidered only with measured latency, operational, and portability evidence.

### Repository layout

Authorization artifacts live in the same repository as the application and are independent of any other product:

```text
packages/
└── authorization-policy/
    ├── policy/              # Rego modules
    ├── data/                # small, non-sensitive static policy data only
    ├── schemas/             # versioned input and decision contracts
    └── test/                # policy tests and synthetic fixtures
```

Application integration code belongs in an explicit backend authorization module under `apps/api`. Route handlers must not call OPA ad hoc. They delegate to this module so input construction, timeout behavior, decision validation, telemetry, and failure handling remain consistent.

Policy and application changes that depend on each other must be reviewed and tested together. Production policy distribution must use immutable, verifiable bundles or an equivalently reproducible mechanism. Direct mutation of production policy through administrative APIs is not part of the supported operating model.

### Authorization input contract

Every decision request uses a runtime-validated, versioned document. The initial logical shape is:

```json
{
  "schema_version": "1",
  "request_id": "opaque-correlation-id",
  "actor": {
    "id": "stable-actor-id",
    "authenticated": true,
    "session_assurance": "normal"
  },
  "action": "person.read",
  "scope": {
    "tree_id": "stable-tree-id"
  },
  "resource": {
    "type": "person",
    "id": "stable-resource-id",
    "tree_id": "stable-tree-id",
    "attributes": {}
  },
  "membership": {
    "active": true,
    "roles": ["editor"]
  },
  "context": {}
}
```

This is a contract shape, not permission to send every database row to OPA. Express must provide only facts required by the policy and must derive them from trusted server-side sources. Secrets, genealogy content, source text, notes, and unnecessary personal data must not enter policy input or decision logs.

Actions use stable, namespaced identifiers such as `tree.read`, `person.update`, `source.attach`, `gedcom.import`, and `member.invite`. Policy must evaluate both action and resource scope. Possessing a role in one tree never grants access to another tree.

Callers must not reuse an allow decision for a different actor, action, resource, tree, policy revision, or materially changed authorization state.

### Decision contract

OPA returns a small runtime-validated decision document:

```json
{
  "allow": false,
  "reason_code": "membership_required",
  "policy_revision": "immutable-revision"
}
```

`allow` is the only field that grants access. Missing, undefined, malformed, stale, or unexpected results are denials. Reason codes are stable machine-readable categories for server behavior and tests; they must not reveal hidden records or sensitive policy details to clients.

Policies use default deny. An operation proceeds only when the decision is explicitly `allow: true` and the response passes schema validation.

### Enforcement rules

- Every protected backend entry point performs authorization before its protected read, mutation, import, export, or administrative effect.
- Authorization is checked against the target resource and tree scope, not merely against a route name.
- Collection and search operations enforce result-set constraints; one broad allow must not leak unauthorized rows.
- Mutations revalidate relevant authorization facts inside, or immediately adjacent to, the transaction boundary when stale membership or ownership could create a time-of-check/time-of-use gap.
- Internal jobs and administrative tools use explicit service identities and actions. They do not bypass policy implicitly.
- Public endpoints are explicitly classified and tested rather than allowed by missing policy.
- OPA unavailability, timeout, invalid input, invalid output, missing policy, or evaluation error fails closed.

The API may return `401` when authentication is required and `403` when an authenticated request is denied. Responses should avoid confirming the existence of resources the actor cannot discover.

### Policy model

The initial policy model combines:

- coarse roles assigned within a tree or administrative scope
- contextual attributes such as membership state, requested action, resource tree, ownership where relevant, and session assurance
- explicit rules for sensitive bulk operations such as GEDCOM import and export

Role names are inputs to policy, not permissions by themselves. Rego policy maps trusted roles and attributes to allowed actions. Relationship-based authorization may be added only when a concrete genealogy use case and authoritative data model exist; OPA must not infer family relationships from untrusted client input.

### Performance and availability

The API sets a short, explicit OPA timeout and records bounded metrics for latency, errors, and denials. The supported deployment must expose readiness that confirms a valid policy revision is loaded before protected traffic is accepted.

Optimization must preserve semantics. Caching is initially limited to clearly identified immutable or safely versioned facts and decisions. Cache keys must include every authorization-relevant dimension and a policy revision. No allow result may outlive membership or resource-scope changes unless safe invalidation is proven.

### Audit and privacy

Authorization telemetry may record request ID, actor pseudonymous or stable internal ID where operationally necessary, action, resource type, scope identifier, allow or deny, reason code, policy revision, latency, and error category.

It must not record genealogy record contents, names, dates, notes, citations, GEDCOM payloads, session secrets, or complete OPA input by default. Retention and operator access require documented configuration.

## Consequences

### Positive

- Authorization policy is centralized without coupling it to individual route handlers.
- RBAC and contextual rules can evolve through reviewed policy changes.
- Policy behavior can be unit tested independently and integration tested through Express.
- Default-deny and fail-closed behavior are explicit.
- The solution remains self-hostable and language independent.

### Negative

- Operators run OPA in addition to Next.js, Express, and PostgreSQL.
- Contributors must learn Rego and the project's authorization contract.
- Policy bundles, readiness, upgrades, and decision telemetry require operational support.
- Every protected request gains a policy-evaluation cost.
- Incorrect input construction can still produce incorrect decisions even when Rego is correct.

### Risks and mitigations

- **Routes bypass the policy boundary:** provide one backend authorization module, dependency checks, and route inventory tests.
- **Cross-tree access through incomplete input:** require tree scope on both membership and resource, then test mismatches explicitly.
- **OPA becomes a shadow database:** pass request-scoped authoritative facts from Express and keep mutable relationships in PostgreSQL.
- **Policy deployment drifts from application code:** use immutable revisions, bundle verification, compatibility tests, and readiness checks.
- **OPA outage becomes an authorization bypass:** fail closed on every timeout, error, undefined decision, and malformed response.
- **Decision logs leak personal data:** log a bounded decision envelope and prohibit full input logging by default.
- **Caching preserves revoked access:** avoid allow caching initially; introduce it only with authorization-state versioning and proven invalidation.
- **Frontend behavior is mistaken for enforcement:** require backend tests that invoke protected endpoints directly.

### Migration implications

There is no existing application authorization implementation to migrate at the time of this proposal. After ADR-0002 and this ADR are accepted:

- scaffold the authorization policy package and backend integration module
- add OPA to local and supported self-hosting examples
- define the version 1 input and decision schemas
- inventory protected actions and resources before feature routes are implemented
- require policy and integration tests in CI

No implementation may import or depend on proprietary Rumpun policy, schemas, roles, documentation, or infrastructure.

## Deferred decisions

This ADR does not select:

- the authentication provider or session mechanism
- the final role catalog and permission matrix
- relationship-based authorization semantics
- a hosted OPA control plane
- a specific bundle registry or signing mechanism
- long-lived authorization caching
- field-level redaction or query partial-evaluation design

These require focused proposals and must preserve the boundaries and fail-closed behavior defined here.

## Validation

Before acceptance, reviewers must verify that the design fits the self-hosting and product boundaries of the repository and that OPA is justified over application-only authorization.

Validate the decision with a synthetic vertical slice that:

1. authenticates a test actor through a private test adapter
2. loads membership and resource scope from PostgreSQL fixtures
3. authorizes a protected Express read and mutation through OPA
4. denies unauthenticated, inactive-member, wrong-tree, wrong-action, and missing-resource-scope cases
5. denies when OPA is unavailable, times out, has no matching policy, or returns malformed output
6. proves Next.js cannot obtain access by changing browser-visible roles or UI state
7. verifies policy unit tests and Express integration tests in CI
8. verifies decision telemetry excludes genealogy content and secrets
9. verifies the API is not ready for protected traffic until an expected policy revision is loaded

Revisit this ADR if policy latency blocks agreed service targets, OPA creates unreasonable self-hosting burden, authorization requirements need graph semantics that cannot be represented safely through request-scoped facts, or the integration cannot maintain reliable fail-closed behavior. Any replacement must include a migration plan, equivalent policy tests, and no temporary bypass of protected operations.
