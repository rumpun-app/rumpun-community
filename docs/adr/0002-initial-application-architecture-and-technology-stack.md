# ADR-0002: Initial application architecture and technology stack

- Status: Proposed
- Date: 2026-08-10
- Deciders: Community review
- Supersedes: The stack-neutrality constraint in ADR-0000 after this ADR is accepted

## Context

Rumpun Community has completed enough foundation work to choose an initial implementation architecture. The project needs a stack that is approachable for contributors, practical to self-host, explicit about frontend and backend responsibilities, and capable of preserving genealogical data over long periods.

This decision does not change the product boundary. Rumpun Community remains an independent, community-maintained family tree builder. Its purpose is to answer **who belongs to a family, how people are related, what genealogical facts are claimed, and what evidence supports those claims**. It is not an open-source edition, free tier, technical upstream, or compatibility layer for proprietary Rumpun.

GEDCOM import and export are core product behavior, not optional integrations. The architecture must support large files, partial or ambiguous records, diagnostics, repeatable imports, standards-aware export, and preservation of information that cannot be represented perfectly in the internal model or a selected GEDCOM version.

The first implementation also needs a repository structure that keeps coordinated changes easy while preserving a real application boundary between the browser-facing frontend and the backend API.

## Decision drivers

- Keep the product narrowly focused on genealogy and family-tree workflows.
- Make GEDCOM import, export, validation, and diagnostics first-class capabilities.
- Represent ambiguous, incomplete, conflicting, and source-backed genealogy claims without inventing certainty.
- Use a familiar, contributor-friendly TypeScript web stack.
- Maintain a clear security and trust boundary between browser code and server-side data access.
- Support practical self-hosting on commodity infrastructure.
- Keep installation, upgrades, database migrations, backup, restore, and recovery understandable.
- Preserve data portability and avoid lock-in to a proprietary service or database feature without an exit path.
- Support accessibility, localization, Unicode names, historical dates, and non-Western naming conventions.
- Allow frontend, API, domain, and interoperability code to evolve together without publishing multiple repositories.
- Keep the core small and defer optional infrastructure until demonstrated by real requirements.
- Avoid technical coupling with proprietary Rumpun.

## Product boundary

The selected stack serves a **family-tree and genealogy application only**.

### In scope

- people and identity records, including alternate names and uncertain attributes
- biological, adoptive, foster, step, guardian, spouse, partner, and other explicitly typed relationships
- families and multi-generation tree navigation
- genealogical facts and events such as birth, death, marriage, residence, occupation, and education when represented as evidence-backed family-history data
- places, sources, repositories, citations, notes, and confidence or attribution metadata
- supporting media attached to genealogical records, subject to a later storage ADR
- search, filters, validation, duplicate detection, and change history
- collaboration required to maintain a shared tree, including invitations, roles, and edit review
- localization, accessibility, self-hosting, backup, restore, and documented migrations
- GEDCOM import, export, interoperability fixtures, mapping diagnostics, and round-trip testing
- stable extension points whose primary value is genealogy interoperability

### Explicitly out of scope

- oral-history products and narrative story archives
- heirloom stories, family recipes as legacy experiences, and curated memory collections
- time capsules, commemorative experiences, memorial products, and celebration experiences
- zero-knowledge or end-to-end encryption features specific to proprietary Rumpun
- social-network feeds, general-purpose family chat, and unrelated household management
- compatibility with proprietary Rumpun schemas, APIs, packages, clients, services, or release plans
- copying or sharing implementation code with proprietary Rumpun outside normal AGPL-3.0-only obligations
- becoming a generic CMS, digital asset manager, CRM, or private family archive

A proposed capability belongs in this repository only when its primary user value is genealogy, evidence, interoperability, or self-hosting. Ambiguous proposals require a product-boundary review before implementation.

## Options considered

### 1. Next.js full-stack application with direct database access

A single Next.js application could provide UI, route handlers, server actions, and database access.

Advantages:

- minimal initial scaffolding and deployment surface
- one framework and one application process
- fast iteration for small CRUD features

Disadvantages:

- weakens the explicit frontend/backend boundary
- encourages domain rules to spread across route handlers, server actions, and UI code
- makes independent API testing and non-web clients harder
- couples background GEDCOM processing and operational concerns to the frontend framework lifecycle

Rejected. Next.js remains the frontend, but it is not the canonical genealogy backend.

### 2. Separate frontend and backend repositories

Next.js and Express could be maintained in independent repositories.

Advantages:

- strongest repository-level separation
- independent release permissions and histories
- smaller per-repository checkout

Disadvantages:

- coordinated schema, API, and feature changes become slower
- shared contracts and test fixtures require publication or duplication
- increases maintenance overhead for a small community project
- makes atomic changes across frontend, API, and GEDCOM fixtures difficult

Rejected for the initial architecture. Runtime separation does not require repository separation.

### 3. Monorepo with Next.js frontend, Express backend, and PostgreSQL

The frontend and backend live in one repository as separate applications. Shared packages contain narrowly scoped contracts, configuration, and test fixtures, not hidden cross-application runtime coupling.

Advantages:

- clear runtime and trust boundaries
- atomic changes across UI, API contracts, migrations, and interoperability fixtures
- familiar TypeScript ecosystem with broad contributor access
- PostgreSQL provides transactions, constraints, recursive queries, indexing, and mature backup tooling
- practical local development and self-hosting

Disadvantages:

- requires workspace conventions and dependency-boundary enforcement
- two application processes must be deployed and observed
- JavaScript/TypeScript requires discipline for CPU-heavy or memory-heavy GEDCOM workloads
- PostgreSQL schema evolution and recursive genealogy queries need careful design and testing

Accepted.

### 4. Monorepo with Next.js and a different backend or database

Candidates include NestJS, Fastify, a non-JavaScript backend, a document database, or a graph database.

Advantages:

- some alternatives provide stronger built-in structure, higher raw throughput, or graph-native traversal
- a graph database can make selected relationship queries expressive

Disadvantages:

- adds contributor or operational complexity without validated need
- a graph database is not a substitute for provenance-aware domain modeling and complicates conventional backups, migrations, and self-hosting
- introducing multiple implementation languages increases build, review, and security-maintenance cost

Rejected for the initial implementation. These choices may be reconsidered with measured evidence.

## Decision

### Architecture style

Adopt a modular monolith with two separately deployable applications in one monorepo:

- **Frontend:** Next.js with TypeScript
- **Backend:** Express.js with TypeScript
- **Primary database:** PostgreSQL
- **Repository model:** one Git repository containing separate frontend and backend folders plus narrowly scoped shared packages

The initial system is not microservices. Genealogy capabilities are modules inside one backend deployment and one PostgreSQL database. A module may be extracted only after operational or scaling evidence shows that extraction is worth the additional failure modes and maintenance cost.

### Monorepo layout

Use the following conceptual structure:

```text
/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Express.js backend
├── packages/
│   ├── contracts/           # transport schemas and generated/static API types
│   ├── genealogy/           # framework-neutral domain primitives where sharing is justified
│   ├── gedcom/              # GEDCOM parser, mapper, exporter, fixtures, and diagnostics
│   ├── config/              # shared lint, TypeScript, and test configuration
│   └── test-fixtures/       # synthetic genealogy and interoperability data
├── db/
│   ├── migrations/          # ordered, reviewed PostgreSQL migrations
│   └── seeds/               # synthetic development data only
├── docs/
│   └── adr/
└── deploy/                  # self-hosting examples and operational documentation
```

Names may change during scaffolding, but the boundaries must not. `apps/web` must not import backend implementation modules or access PostgreSQL. `apps/api` owns authorization, domain orchestration, persistence, and server-side interoperability workflows. Shared packages must not become a dumping ground for application-specific code.

The exact package manager and monorepo task runner are deferred. The selected tooling must support lockfile reproducibility, workspace dependency boundaries, offline-friendly installation where practical, and ordinary self-hosted CI. It must not require a proprietary cloud service.

### Frontend responsibilities

Next.js owns:

- accessible and localizable user interfaces
- server-rendered or client-rendered presentation where appropriate
- interactive family-tree navigation and editing experiences
- browser-side input validation for usability
- calls to the documented backend API
- session presentation and safe handling of browser-visible state

Frontend validation is never an authorization or integrity boundary. The frontend must not connect directly to PostgreSQL, embed privileged database credentials, or contain the only implementation of genealogy rules.

The choice between specific Next.js rendering modes is made per route. Public rendering, authenticated rendering, and highly interactive tree views have different needs; this ADR does not force every page into one rendering model.

### Backend responsibilities

Express.js is the canonical application API and owns:

- authentication integration and authorization enforcement
- genealogy domain rules and validation
- transaction boundaries and persistence
- source, citation, provenance, and change-history integrity
- GEDCOM import/export orchestration and diagnostics
- migration-aware API behavior
- audit-relevant events and operational health endpoints
- rate limits, payload limits, and security headers at the application boundary

Routes must remain thin. Request handling delegates to explicit application and domain modules. Persistence code must not leak database row shapes into the public API by accident.

The public API style, versioning policy, and contract format require a follow-up ADR. Until then, implementations must use explicit runtime-validated request and response schemas and must not treat TypeScript compile-time types as sufficient input validation.

### PostgreSQL responsibilities

PostgreSQL is the authoritative transactional store for genealogy records and application metadata.

The data model must:

- use stable internal identifiers independent of names and GEDCOM cross-reference identifiers
- represent people and relationships without assuming one universal family structure
- distinguish assertions or claims from supporting sources and citations where the domain requires it
- allow unknown, approximate, ranged, text-only, and disputed dates instead of coercing them into false precision
- preserve original imported values when normalization would be lossy
- use database constraints for invariants that are truly universal
- avoid constraints that encode contested cultural or genealogical assumptions
- record migration history and support documented forward upgrades
- keep exports possible without proprietary PostgreSQL extensions

PostgreSQL recursive common table expressions may support ancestry and descendant traversal, but arbitrary graph traversal must be bounded and tested. Denormalized paths, closure tables, materialized views, or a dedicated search system may be introduced later only with measurements and a migration plan.

The ORM or query-builder choice is deferred to a follow-up ADR. Whatever is selected must expose SQL and migration behavior clearly, support transactions and constraints, avoid destructive implicit schema synchronization in production, and permit escape hatches for well-reviewed SQL.

### GEDCOM interoperability

GEDCOM import and export are first-class modules, not controller utilities.

The initial implementation must:

- define explicitly supported GEDCOM versions before claiming compatibility
- begin with standards-based support for GEDCOM 5.5.1 and/or FamilySearch GEDCOM 7.x through a dedicated interoperability ADR
- parse files as streams or bounded chunks so file size does not require loading the entire dataset into memory
- enforce configurable file-size, record-count, nesting, and processing-time limits
- validate structure and encoding while returning actionable diagnostics with record or line context where possible
- separate parsing, normalization, domain mapping, persistence, and reporting stages
- run imports transactionally or through resumable batches with a clear rollback policy
- support dry-run analysis before committing imported records
- detect duplicate candidates without silently merging people
- preserve unsupported tags or original records when feasible so round trips do not silently destroy information
- disclose lossy mappings before import or export completes
- never fabricate missing relationships, dates, sex, names, places, or certainty
- keep synthetic conformance fixtures and regression tests in the repository
- test export by validating the produced GEDCOM and re-importing representative fixtures
- produce deterministic output where the standard and source data allow it
- document privacy implications because GEDCOM files may contain sensitive data about living people

Importing is untrusted-input processing. Parsers must be hardened against malformed nesting, oversized values, encoding attacks, path traversal through referenced media, resource exhaustion, and formula or markup injection in downstream exports or displays.

Long-running import/export execution may initially run in the API process only for small bounded workloads. Before production support for large datasets, a follow-up ADR must decide whether to add a PostgreSQL-backed job mechanism or a separate worker. Introducing Redis, a message broker, or another persistent service is not part of this decision.

### API and dependency boundaries

- The browser communicates with the Express API over a documented HTTP interface.
- All external input is runtime validated at the boundary.
- Shared contracts may define transport schemas, but domain entities must not be reduced to transport DTOs.
- The frontend may depend on `packages/contracts` and safe domain presentation primitives, never backend persistence modules.
- The backend may depend on domain and GEDCOM packages, never frontend components.
- Package dependency direction is enforced in linting and CI.
- No package may import proprietary Rumpun code, schemas, APIs, generated clients, assets, or private documentation.

### Security and privacy baseline

This architecture does not provide zero-knowledge E2EE. It uses conventional server-side security suitable for a self-hosted genealogy application.

The implementation must include:

- least-privilege database credentials
- secrets supplied outside source control
- secure session and cookie defaults when browser sessions are introduced
- authorization checks in the backend for every protected operation
- protection against common web attacks, including CSRF where relevant, injection, XSS, unsafe redirects, and abusive uploads
- explicit limits for JSON bodies, uploads, and GEDCOM processing
- dependency and container vulnerability review in the release process
- auditability for sensitive mutations without logging secret values or unnecessary personal data
- documented backup, restore, and deletion behavior
- clear treatment of living-person data in UI, export, and collaboration flows

A dedicated threat-model and authentication ADR must be accepted before production authentication is implemented.

### Self-hosting and operations

A supported installation consists conceptually of:

- the Next.js web application
- the Express API application
- PostgreSQL
- optional reverse proxy or ingress supplied by the operator
- optional object storage only after a media-storage ADR

Development convenience must not make a proprietary hosted platform mandatory. Deployment examples should favor reproducible containers and standard environment configuration, but the exact container and orchestration strategy is deferred.

Every release that changes the database must include reviewed migrations, upgrade notes, and a rollback or recovery statement. Backups must cover PostgreSQL and, once introduced, media storage. Restore procedures must be tested rather than merely documented.

### Accessibility and localization

Next.js does not make the product accessible by default. Core flows, including tree navigation, person editing, relationship editing, GEDCOM diagnostics, and import/export, must be keyboard operable, screen-reader understandable, and usable without relying only on color or spatial layout.

User-visible text must be localizable. The data model must support Unicode, multiple names, locale-independent identifiers, uncertain dates, and place names that change over time. No schema or API may assume Indonesian, English, Western surname order, binary family roles, or Gregorian-only free-text interpretation.

### Testing and quality gates

The monorepo CI baseline must include:

- formatting, linting, and TypeScript checks
- frontend component and accessibility tests for critical flows
- backend unit and integration tests against PostgreSQL
- migration tests from the previous supported schema
- API contract validation
- GEDCOM parser, mapping, security, conformance, and round-trip fixtures
- end-to-end tests for creating a small tree and importing/exporting it
- dependency-boundary checks between applications and packages
- checks that fixtures contain synthetic data only

Performance tests must cover representative tree traversal and GEDCOM datasets before compatibility or scale claims are published.

## Consequences

### Positive

- Contributors work primarily in one language and type system across the web stack.
- Frontend and backend changes can be reviewed and committed atomically.
- Express creates an explicit API and trust boundary without forcing a large backend framework.
- PostgreSQL provides mature transactions, constraints, indexing, recursive queries, migrations, and operational tooling.
- GEDCOM interoperability has a defined architectural home and cannot be treated as an afterthought.
- The modular-monolith approach keeps deployment understandable while preserving future extraction seams.
- The product boundary is encoded directly into architecture and review criteria.

### Negative

- Operators run at least two application processes plus PostgreSQL.
- The project must define structure and conventions that Express does not impose.
- Shared TypeScript can create accidental coupling if package boundaries are not enforced.
- Large GEDCOM imports may eventually require a worker or job system.
- Next.js and Node.js security releases require active dependency maintenance.
- PostgreSQL is a substantial operational dependency compared with an embedded database.

### Risks and mitigations

- **Domain logic leaks into UI or routes.** Enforce module boundaries, thin routes, and backend integration tests.
- **The monorepo becomes a distributed monolith in folders.** Keep one backend deployment initially and require an ADR before adding services.
- **Genealogy is modeled as an oversimplified parent-child graph.** Review schemas against ambiguous relationships, conflicting claims, sources, citations, and non-Western cases.
- **GEDCOM import causes silent data loss.** Preserve raw or unsupported data where feasible and require diagnostics plus round-trip fixtures.
- **Import exhausts memory or CPU.** Stream parsing, enforce limits, benchmark representative datasets, and introduce workers only through a follow-up ADR.
- **Framework churn creates costly upgrades.** Pin supported versions, automate dependency review, and avoid unstable framework-specific features without justification.
- **Database features create lock-in.** Prefer standard PostgreSQL capabilities, document extensions, and keep complete export paths.
- **Feature creep crosses into proprietary Rumpun's category.** Apply the product-boundary test in issue and pull-request review.

### Migration implications

There is no application implementation to migrate at the time of this proposal. After acceptance:

- ADR-0000 remains authoritative for project identity, independence, and decision discipline.
- Its temporary prohibition on selecting a framework, database, package manager, or monorepo structure is superseded only for the technologies selected here.
- README.md, AGENTS.md, and related architecture documentation must be updated in the same implementation phase so they no longer describe the stack as undecided.
- Scaffolding may begin only after this ADR is accepted, not while it remains Proposed.

## Deferred decisions

This ADR intentionally does not select:

- package manager or monorepo task runner
- exact supported Node.js, Next.js, Express.js, TypeScript, or PostgreSQL versions
- ORM, query builder, or migration library
- public API style and versioning scheme
- authentication and authorization implementation
- object or media storage
- background-job implementation
- search engine beyond PostgreSQL's initial capabilities
- deployment orchestrator or hosted platform
- observability vendor
- exact GEDCOM versions and extension policy

Each choice must fit this ADR, preserve self-hostability and data portability, and receive a focused ADR when its consequences are architectural.

## Validation

Before acceptance, maintainers and community reviewers must verify that:

- the product boundary matches `docs/PRODUCT_BOUNDARY.md` and `COMMERCIAL_SEPARATION.md`
- the options have been compared against all criteria in `docs/ARCHITECTURE_PRINCIPLES.md`
- the proposed stack can run locally with only the documented open-source dependencies
- no proprietary Rumpun artifact or undocumented assumption informed the design

Within the first implementation milestone, validate the decision with a thin vertical slice that:

1. runs the Next.js frontend, Express API, and PostgreSQL from the monorepo
2. creates and retrieves synthetic people and explicitly typed relationships through the API
3. renders a small accessible family tree without direct database access from the frontend
4. imports a small synthetic GEDCOM fixture with diagnostics
5. exports the resulting tree and validates or re-imports the output
6. applies a database migration from a clean installation and from the previous test schema
7. documents local setup, backup, restore, and failure recovery

Revisit this ADR when one of the following occurs:

- representative tree navigation or GEDCOM workloads fail agreed performance targets
- deployment complexity blocks practical self-hosting
- the modular monolith can no longer provide reliable isolation or scaling
- PostgreSQL cannot represent required genealogy behavior without unacceptable complexity
- a major framework reaches end of support or imposes unacceptable migration cost
- the product boundary materially changes

Any revisit must include measurements, migration impact, data-portability consequences, and a rollback or transition plan.