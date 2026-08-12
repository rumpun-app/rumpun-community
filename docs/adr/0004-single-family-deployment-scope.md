# ADR-0004: Limit each deployment to one family tree

- Status: Accepted
- Date: 2026-08-12
- Deciders: Initial Rumpun Community maintainer
- Depends on: ADR-0002, ADR-0003

## Context

Rumpun Community is beginning with a family-tree core and a self-hostable modular monolith. Supporting multiple independent family trees in one deployment would immediately add tree creation and switching, cross-tree authorization, per-tree administration, quotas, invitations, data isolation, deletion semantics, import destinations, export selection, and more complex testing.

Those capabilities are useful eventually, but they are not required to validate the first complete genealogy workflow. Implementing them now would widen the security and product surface before the person, relationship, source, citation, GEDCOM, backup, restore, and collaboration foundations are proven.

The word `family` is ambiguous in genealogy software. This ADR uses **family tree** to mean the single top-level genealogy dataset administered by one Rumpun Community deployment. It does not mean a nuclear-family record, household, surname, lineage branch, GEDCOM `FAM` record, or one biological relationship model. The tree may contain many family groups, branches, generations, partners, guardians, adoptive relationships, disputed claims, and disconnected records.

## Decision drivers

- Deliver one coherent genealogy workflow before adding tenancy features.
- Reduce authorization and data-isolation mistakes during the initial phase.
- Keep self-hosting setup and administration understandable.
- Make GEDCOM import, export, backup, restore, and deletion targets unambiguous.
- Avoid premature tenant billing, quotas, switching, and lifecycle abstractions.
- Preserve a realistic path to multiple trees without promising compatibility prematurely.
- Keep culturally varied relationships and genealogy ambiguity fully supported inside the tree.

## Options considered

### 1. Support multiple independent family trees immediately

**Advantages:** users can separate unrelated research, maintain several trees, and host multiple groups in one deployment.

**Disadvantages:** requires tenant lifecycle, tree switching, stronger isolation, scoped administration, ambiguous import and export destinations, and a much larger authorization matrix before the core genealogy model is stable.

Rejected for the initial phase.

### 2. Limit each user account to one tree while allowing many trees per deployment

**Advantages:** the user interface remains simple while one deployment can host several isolated groups.

**Disadvantages:** the backend still needs complete multi-tenant isolation, provisioning, routing, operations, backup, restore, deletion, and policy coverage. Hiding switching in the UI does not remove the architectural complexity.

Rejected.

### 3. Limit each deployment to one family tree

**Advantages:** a clear operating model, smaller authorization surface, deterministic import and export targets, simpler administration, and easier backup and restore.

**Disadvantages:** users needing unrelated trees must run separate deployments, and future multi-tree support will require an explicit migration.

Accepted for the initial phase.

## Decision

Each Rumpun Community deployment supports exactly one top-level family tree during the initial product phase.

### Product behavior

- Initial setup creates or initializes the deployment's single family tree.
- The product does not expose create-another-tree, duplicate-tree, tree picker, or switch-tree flows.
- All invited members collaborate within the same tree, subject to backend authorization.
- A user cannot belong to a second tree inside the same deployment.
- GEDCOM import targets the deployment's tree. The import flow must still require explicit confirmation and disclose merge, duplicate, and conflict behavior.
- GEDCOM export exports an explicitly selected scope within the deployment's tree or the full tree, according to the export contract. It does not select among top-level trees.
- Backup, restore, archival, and deletion procedures operate on the deployment and its one tree as a documented unit unless a narrower operation is explicitly defined.
- Supporting multiple branches, disconnected components, uncertain relationships, several surnames, and many GEDCOM family records inside the tree remains required.

A deployment with an initialized tree must reject any attempt to provision a second top-level tree through the UI, API, import path, administrative command, or direct application workflow.

### Data model

The persistence model must represent the top-level tree with a stable identifier even though only one may exist. Genealogy records that require scoping continue to reference that identifier explicitly.

The one-tree constraint must be enforced by an authoritative backend and database invariant, not by hiding a button in Next.js. The exact PostgreSQL mechanism may be chosen during implementation, but it must be migration-safe, testable, and resistant to concurrent initialization. A constant identifier hard-coded throughout business logic is not acceptable.

The domain model must not misuse the top-level tree entity as a GEDCOM `FAM` record or household. Those are separate concepts with separate identifiers and cardinalities.

### API behavior

- The API may expose the current tree as a singleton resource, such as `GET /tree`, rather than requiring clients to select from a collection.
- Protected operations still carry or derive an explicit tree scope internally.
- Client-supplied tree identifiers are never trusted as authorization evidence.
- Any collection endpoint for top-level trees, if retained for future compatibility, returns at most one item and cannot create another.
- Attempts to create a second tree return a stable conflict error rather than silently replacing, merging, or reusing the existing tree.

Public API naming and versioning remain subject to the API ADR deferred by ADR-0002.

### Authorization

ADR-0003 remains authoritative for policy decisions and enforcement. OPA policy must still bind actors, memberships, actions, and resources to the deployment's tree identifier.

The singleton limit is not permission to remove scope checks. Explicit scoping protects against programming mistakes, malformed imports, stale records, and future migrations. Cross-tree mismatch tests remain required even if the second identifier exists only as a synthetic fixture.

### Self-hosting

Operators who need completely separate family trees must run separate Rumpun Community deployments, each with independent configuration, database ownership or isolated database, backups, secrets, and upgrade lifecycle.

The project will document this limitation clearly. It must not claim that one deployment provides multi-tenant hosting or hard isolation between several families.

### Future evolution

Multi-tree support requires a new ADR. It must define at least:

- tree provisioning, ownership, suspension, export, transfer, and deletion
- user membership across trees and tree switching
- authorization and isolation invariants
- namespacing for records, jobs, media, audit events, and caches
- import destination and duplicate-handling semantics
- per-tree backup, restore, and disaster recovery
- migration of existing singleton deployments without changing record identity
- operational impact on self-hosting and upgrades

No current interface is guaranteed to remain unchanged for multi-tree support. Stable tree identifiers and explicit scope are retained to make a future migration possible, not to promise it.

## Consequences

### Positive

- The first release has a smaller, clearer product and security surface.
- Members, imports, exports, backups, and restores have one unambiguous top-level tree.
- Self-hosters avoid tenant provisioning and tree-management operations.
- Authorization policies remain scoped but have fewer lifecycle states to cover.
- Engineering effort stays focused on genealogy correctness and portability.

### Negative

- One deployment cannot host several unrelated family trees.
- Researchers managing multiple datasets need separate deployments.
- Shared infrastructure across several families is not supported initially.
- A later multi-tree release requires deliberate schema, API, authorization, and operational migration.

### Risks and mitigations

- **The singleton leaks into hard-coded assumptions:** retain a stable tree entity and explicit foreign-key scope.
- **The UI-only limit is bypassed:** enforce the invariant in Express and PostgreSQL, including concurrent initialization tests.
- **One tree is mistaken for one simple family:** document and test multiple branches, relationship types, family groups, and disconnected records.
- **A GEDCOM import creates another top-level tree:** imports always target the existing tree and never provision tenancy.
- **Future multi-tree work weakens isolation:** require a dedicated ADR, migration plan, adversarial authorization tests, and operational validation.
- **Self-hosters assume multi-tenant safety:** state the one-deployment, one-tree limitation in setup and administration documentation.

### Migration implications

There is no application data to migrate at the time of this proposal. Initial schema and setup work must:

- create one stable top-level tree record
- enforce at most one top-level tree per deployment
- scope relevant genealogy and collaboration records to that tree
- make initialization idempotent and concurrency-safe
- reject second-tree creation without modifying the existing tree

If the project later supports multiple trees, migration must preserve the existing tree identifier, memberships, records, citations, media references, imports, audit history, and export behavior.

## Deferred decisions

This ADR does not select:

- the exact database constraint used to enforce the singleton
- the public API route naming for the current tree
- detailed onboarding and initial administrator creation
- tree ownership transfer semantics
- multi-tree tenancy or hosting
- federation between deployments
- merging or splitting top-level trees

## Validation

Before acceptance, reviewers must verify that the limit reduces initial complexity without collapsing genealogy concepts or removing explicit authorization scope.

Validate the decision with synthetic tests that:

1. initialize a clean deployment with exactly one stable tree
2. repeat initialization without creating a duplicate
3. race two initialization attempts and persist only one tree
4. reject second-tree creation through the API and administrative application path
5. import GEDCOM data into the existing tree without provisioning another tree
6. represent multiple family groups, branches, relationship types, and disconnected people inside that tree
7. deny a record whose synthetic tree identifier does not match the deployment tree
8. export and restore the deployment while preserving the tree identifier and record scope
9. verify Next.js exposes no create-another-tree or tree-switching flow

Revisit this ADR only after the single-tree vertical slice, authorization boundary, GEDCOM workflows, and backup and restore behavior are stable. A multi-tree proposal must include a working migration prototype and isolation tests before acceptance.
