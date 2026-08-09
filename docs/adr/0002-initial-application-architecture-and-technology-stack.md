# ADR-0002: Initial application architecture and technology stack

- Status: Proposed
- Date: 2026-08-10
- Deciders: Community review
- Supersedes: The stack-neutrality constraint in ADR-0000 after this ADR is accepted

## Context

Rumpun Community has completed enough foundation work to choose an initial implementation architecture. The project needs a stack that is approachable for contributors, practical to self-host, explicit about frontend and backend responsibilities, and capable of preserving genealogical data over long periods.

Rumpun Community is a focused family-tree application. Its purpose is to record people, model family relationships, navigate family trees, preserve genealogical facts and their supporting sources, and exchange genealogy data through GEDCOM.

GEDCOM import and export are core product behavior, not optional integrations. The architecture must support incomplete or ambiguous records, actionable diagnostics, repeatable imports, standards-aware exports, and explicit handling of information that cannot be mapped without loss.

The first implementation also needs a repository structure that keeps coordinated changes easy while preserving a real application boundary between the browser-facing frontend and backend API.

## Decision drivers

- Keep the product narrowly focused on family-tree and genealogy workflows.
- Make GEDCOM import, export, validation, and diagnostics first-class capabilities.
- Represent incomplete, uncertain, conflicting, and source-backed genealogy claims without inventing certainty.
- Use a familiar, contributor-friendly TypeScript web stack.
- Maintain a clear trust boundary between browser code and server-side data access.
- Support practical self-hosting on commodity infrastructure.
- Keep installation, upgrades, migrations, backup, restore, and recovery understandable.
- Preserve data portability and avoid dependence on mandatory hosted services.
- Support accessibility, localization, Unicode names, historical dates, and varied family structures.
- Allow frontend, API, domain, and interoperability code to evolve atomically.
- Keep the core small and defer optional infrastructure until demonstrated by real requirements.

## Product boundary

The selected architecture serves a **family-tree and genealogy application only**.

### In scope

- people and identity records, including alternate names and uncertain attributes
- explicitly typed family relationships, including biological, adoptive, foster, guardian, spouse, and partner relationships
- families and multi-generation ancestor and descendant navigation
- genealogical facts and events such as birth, death, marriage, residence, occupation, and education
- places, sources, repositories, citations, notes, and confidence metadata
- supporting media attached to genealogical evidence, subject to a later storage ADR
- search, filters, validation, duplicate detection, and change history
- collaboration required to maintain a shared family tree, including invitations, roles, and edit review
- localization, accessibility, self-hosting, backup, restore, and documented migrations
- GEDCOM import, export, mapping diagnostics, interoperability fixtures, and round-trip testing
- documented extension points whose primary purpose is genealogy interoperability

### Out of scope

- general-purpose social networking, messaging, or community feeds
- household finance, chores, calendars, health records, and other family-management tools
- generic content management, customer relationship management, or digital asset management
- features whose primary purpose is not building, validating, navigating, or exchanging a family tree
- undocumented interoperability that weakens the canonical genealogy model

A proposed capability belongs in this repository only when its primary value is representing family relationships, genealogical evidence, data exchange, or operation of the family-tree system. Ambiguous proposals require product-boundary review before implementation.

## Options considered

### 1. Next.js full-stack application with direct database access

A single Next.js application could provide UI, route handlers, server actions, and database access.

**Advantages:** minimal scaffolding, one application process, and fast iteration for small CRUD features.

**Disadvantages:** weakens the frontend/backend boundary, encourages domain rules to spread across UI-oriented handlers, complicates independent API testing, and couples GEDCOM processing to the frontend framework lifecycle.

Rejected. Next.js remains the frontend, but it is not the canonical genealogy backend.

### 2. Separate frontend and backend repositories

Next.js and Express could be maintained in independent repositories.

**Advantages:** strong repository-level separation and independent histories.

**Disadvantages:** coordinated schema and feature changes become slower; contracts and fixtures require publication or duplication; atomic changes across frontend, API, and GEDCOM tooling become difficult.

Rejected for the initial architecture. Runtime separation does not require repository separation.

### 3. Monorepo with Next.js frontend, Express backend, and PostgreSQL

The frontend and backend live in one repository as separate applications. Shared packages contain narrowly scoped contracts, domain primitives, configuration, and test fixtures.

**Advantages:** clear runtime boundaries, atomic cross-layer changes, a familiar TypeScript ecosystem, mature PostgreSQL transactions and backup tooling, and practical self-hosting.

**Disadvantages:** requires dependency-boundary enforcement, runs two application processes, and requires discipline for resource-heavy GEDCOM workloads and recursive genealogy queries.

Accepted.

### 4. Monorepo with a different backend or database

Candidates include NestJS, Fastify, a non-JavaScript backend, a document database, or a graph database.

**Advantages:** alternatives may offer more built-in structure, higher throughput, or graph-native traversal.

**Disadvantages:** they add contributor or operational complexity without a validated requirement. A graph database does not replace provenance-aware domain modeling and complicates conventional backups and migrations.

Rejected for the initial implementation. Reconsideration requires measurements and a migration case.

## Decision

### Architecture style

Adopt a modular monolith with two separately deployable applications in one monorepo:

- **Frontend:** Next.js with TypeScript
- **Backend:** Express.js with TypeScript
- **Primary database:** PostgreSQL
- **Repository model:** one Git repository with separate frontend and backend folders plus narrowly scoped shared packages

The initial system is not microservices. Genealogy capabilities remain modules inside one backend deployment and one PostgreSQL database. Extraction requires operational or scaling evidence and a separate ADR.

### Monorepo layout

```text
/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Express.js backend
├── packages/
│   ├── contracts/           # runtime transport schemas and API types
│   ├── genealogy/           # framework-neutral domain primitives
│   ├── gedcom/              # parser, mapper, exporter, fixtures, diagnostics
│   ├── config/              # shared lint, TypeScript, and test configuration
│   └── test-fixtures/       # synthetic genealogy datasets
├── db/
│   ├── migrations/          # ordered PostgreSQL migrations
│   └── seeds/               # synthetic development data only
├── docs/
│   └── adr/
└── deploy/                  # self-hosting examples and operations guidance
```

Names may change during scaffolding, but the boundaries must not. `apps/web` must not import backend implementation modules or connect to PostgreSQL. `apps/api` owns authorization, domain orchestration, persistence, and server-side interoperability workflows. Shared packages must not become a dumping ground for application-specific code.

The package manager and monorepo task runner are deferred. Selected tooling must provide reproducible lockfiles, workspace dependency boundaries, ordinary self-hosted CI, and no mandatory hosted service.

### Frontend responsibilities

Next.js owns:

- accessible and localizable user interfaces
- server-rendered or client-rendered presentation as appropriate
- interactive family-tree navigation and editing
- browser-side validation for usability
- communication with the documented backend API
- safe handling of browser-visible session state

Frontend validation is not an authorization or integrity boundary. The frontend must not access PostgreSQL directly, embed privileged credentials, or contain the only implementation of genealogy rules.

### Backend responsibilities

Express.js is the canonical application API and owns:

- authentication integration and authorization enforcement
- genealogy domain rules and validation
- transaction boundaries and persistence
- source, citation, provenance, and change-history integrity
- GEDCOM import/export orchestration and diagnostics
- migration-aware API behavior
- audit-relevant events and operational health endpoints
- rate limits, payload limits, and security headers

Routes must remain thin and delegate to explicit application and domain modules. Persistence row shapes must not leak accidentally into the public API.

The API style and versioning policy require a follow-up ADR. All external input and API output must use explicit runtime-validated schemas; TypeScript types alone are insufficient.

### PostgreSQL responsibilities

PostgreSQL is the authoritative transactional store for genealogy records and application metadata.

The model must:

- use stable identifiers independent of names and GEDCOM cross-reference identifiers
- represent varied family relationships without assuming one universal structure
- distinguish claims from supporting sources and citations where required
- support unknown, approximate, ranged, text-only, and disputed dates
- preserve original imported values when normalization would be lossy
- enforce only genuinely universal invariants with database constraints
- avoid constraints that encode cultural assumptions as facts
- use ordered, reviewed, and documented migrations
- remain fully exportable without non-portable database extensions

Recursive PostgreSQL queries may support ancestor and descendant traversal, but arbitrary traversal must be bounded and tested. Closure tables, materialized views, denormalization, or an external search system require measurements and a migration plan.

The ORM or query-builder choice is deferred. It must expose migration and SQL behavior clearly, support transactions and constraints, forbid destructive implicit synchronization in production, and permit reviewed SQL escape hatches.

### GEDCOM interoperability

GEDCOM import and export are first-class modules, not controller utilities.

The implementation must:

- declare exactly which GEDCOM versions and extensions are supported
- select initial support for GEDCOM 5.5.1, FamilySearch GEDCOM 7.x, or both through a focused interoperability ADR
- parse as streams or bounded chunks instead of loading an entire dataset into memory
- enforce configurable file-size, record-count, nesting, value-size, and processing-time limits
- return actionable structural, encoding, and mapping diagnostics
- separate parsing, normalization, domain mapping, persistence, and reporting stages
- provide dry-run analysis before records are committed
- import transactionally or through resumable batches with an explicit rollback policy
- detect duplicate candidates without silently merging people
- preserve unsupported tags or original values where feasible
- disclose lossy mappings before import or export completes
- never fabricate missing people, relationships, dates, names, places, or certainty
- maintain synthetic conformance and regression fixtures
- validate exports and re-import representative outputs for round-trip testing
- produce deterministic output where the standard and source data allow it
- warn operators that GEDCOM files may contain sensitive data about living people

GEDCOM files are untrusted input. Parsers must resist malformed nesting, oversized values, encoding attacks, referenced-media path traversal, resource exhaustion, and markup or formula injection in downstream displays and exports.

Small bounded jobs may initially run in the API process. Large-dataset production support requires a follow-up decision on PostgreSQL-backed jobs or a separate worker. Redis, message brokers, and additional persistent services are not selected by this ADR.

### API and dependency boundaries

- Browsers communicate with Express over a documented HTTP interface.
- All external input is runtime validated at the boundary.
- Shared contracts define transport schemas without replacing domain entities.
- The frontend may use contracts and safe presentation primitives, never persistence modules.
- The backend may use domain and GEDCOM packages, never frontend components.
- Linting and CI enforce package dependency direction.

### Security and privacy baseline

This is a conventional server-side architecture. The implementation must include:

- least-privilege database credentials
- secrets supplied outside source control
- secure session and cookie defaults when sessions are introduced
- backend authorization checks for every protected operation
- protection against injection, XSS, CSRF where relevant, unsafe redirects, and abusive uploads
- explicit limits for JSON bodies, uploads, and GEDCOM processing
- dependency and container vulnerability review
- useful mutation audit trails without unnecessary personal-data logging
- documented backup, restore, deletion, and living-person data behavior

A focused threat-model and authentication ADR must precede production authentication.

### Self-hosting and operations

A supported installation consists conceptually of:

- the Next.js web application
- the Express API application
- PostgreSQL
- an optional operator-supplied reverse proxy
- optional object storage only after a media-storage ADR

Deployment must not require a proprietary hosted platform. Examples should favor reproducible containers and standard environment configuration, while exact orchestration remains deferred.

Every database-changing release must include reviewed migrations, upgrade notes, and a rollback or recovery statement. Backup and restore procedures must be tested, not merely documented.

### Accessibility and localization

Core flows, including tree navigation, person and relationship editing, GEDCOM diagnostics, import, and export, must be keyboard operable, screen-reader understandable, and usable without relying only on color or spatial layout.

User-visible text must be localizable. The model must support Unicode, multiple names, locale-independent identifiers, uncertain dates, and changing place names. No schema or API may assume one language, surname order, family-role vocabulary, or Gregorian-only free-text interpretation.

### Testing and quality gates

CI must include:

- formatting, linting, and TypeScript checks
- frontend component and accessibility tests for critical flows
- backend unit and PostgreSQL integration tests
- migration tests from the previous supported schema
- API contract validation
- GEDCOM parser, mapping, security, conformance, and round-trip tests
- end-to-end tests for creating, importing, navigating, and exporting a small tree
- dependency-boundary checks
- verification that committed fixtures are synthetic

Performance tests must cover representative traversal and GEDCOM datasets before compatibility or scale claims are published.

## Consequences

### Positive

- Contributors use one primary language and type system across the web stack.
- Frontend, backend, migrations, contracts, and fixtures can change atomically.
- Express provides a clear API boundary without forcing a larger backend framework.
- PostgreSQL provides mature transactions, constraints, recursive queries, migrations, and backup tooling.
- GEDCOM has a defined architectural home and cannot become an afterthought.
- A modular monolith keeps deployment understandable while preserving extraction seams.
- The scope test limits feature creep beyond family-tree needs.

### Negative

- Operators run two application processes plus PostgreSQL.
- Express requires project-defined structure and conventions.
- Shared TypeScript can create accidental coupling without enforcement.
- Large imports may eventually require a worker or job system.
- Framework and runtime security releases require active maintenance.
- PostgreSQL is operationally heavier than an embedded database.

### Risks and mitigations

- **Domain logic leaks into UI or routes:** enforce module boundaries, thin routes, and backend integration tests.
- **The monorepo becomes fragmented:** keep one backend deployment and require an ADR before adding services.
- **The model becomes an oversimplified parent-child graph:** test varied relationships, conflicting claims, sources, citations, and international cases.
- **GEDCOM processing silently loses data:** preserve original values where feasible and require diagnostics plus round-trip fixtures.
- **Imports exhaust memory or CPU:** stream parsing, enforce limits, benchmark representative datasets, and add workers only through a follow-up ADR.
- **Framework churn creates costly upgrades:** pin supported versions, automate dependency review, and avoid unstable features without justification.
- **Database features create lock-in:** prefer standard PostgreSQL capabilities, document extensions, and maintain complete exports.
- **Feature creep weakens the family-tree focus:** apply the product-boundary test during issue and pull-request review.

### Migration implications

There is no application implementation to migrate at the time of this proposal. After acceptance:

- ADR-0000 remains authoritative for decision discipline.
- Its temporary prohibition on choosing a framework, database, or monorepo structure is superseded for the technologies selected here.
- README.md, AGENTS.md, and architecture documentation must be updated so they no longer describe the stack as undecided.
- Scaffolding may begin only after this ADR is accepted.

## Deferred decisions

This ADR does not select:

- package manager or monorepo task runner
- exact Node.js, Next.js, Express.js, TypeScript, or PostgreSQL versions
- ORM, query builder, or migration library
- API style and versioning scheme
- authentication and authorization implementation
- object or media storage
- background-job implementation
- search engine beyond initial PostgreSQL capabilities
- deployment orchestrator or hosting platform
- observability vendor
- exact GEDCOM versions and extension policy

Each choice must preserve self-hostability, data portability, the family-tree boundary, and the application boundaries defined here.

## Validation

Before acceptance, reviewers must verify that:

- the scope is limited to family-tree and genealogy capabilities
- the options satisfy `docs/ARCHITECTURE_PRINCIPLES.md`
- the proposed stack can run locally using documented open-source dependencies
- GEDCOM portability and failure behavior are treated as core architecture

Validate the decision with a thin vertical slice that:

1. runs the Next.js frontend, Express API, and PostgreSQL from the monorepo
2. creates and retrieves synthetic people and explicitly typed relationships through the API
3. renders a small accessible family tree without frontend database access
4. imports a synthetic GEDCOM fixture and reports diagnostics
5. exports the resulting tree and validates or re-imports the output
6. applies migrations to a clean installation and the previous test schema
7. documents local setup, backup, restore, and failure recovery

Revisit this ADR when representative workloads fail agreed targets, deployment blocks practical self-hosting, modular-monolith boundaries fail, PostgreSQL cannot support required genealogy behavior reasonably, a core framework reaches end of support, or the family-tree product boundary materially changes.

Any revisit must include measurements, migration impact, portability consequences, and a rollback or transition plan.
