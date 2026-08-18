# ADR-0002: Initial application architecture and technology stack

- Status: Accepted
- Date: 2026-08-19
- Deciders: Initial Rumpun Community maintainers
- Supersedes: The temporary stack-neutrality constraint in ADR-0000

## Context

Rumpun Community has enough foundation work to select an initial implementation architecture. It needs a stack that is approachable for contributors, practical to self-host, productive for data-heavy workflows, and capable of preserving genealogical records over long periods.

The initial product focuses on people, typed family relationships, navigable trees, facts, places, sources, citations, media, collaboration, and GEDCOM exchange. GEDCOM input is untrusted and may be incomplete, ambiguous, malformed, or lossy. Diagnostics, provenance, migrations, backups, and recovery are first-class concerns.

There is no production application to migrate. An earlier proposal selected a TypeScript monorepo with separate Next.js and Express processes, but implementation had not begun. Re-evaluation favored a smaller operational footprint and a cohesive server-driven application.

## Decision drivers

- Keep self-hosting and upgrades understandable on commodity infrastructure.
- Deliver genealogy workflows quickly without scattering domain rules through UI code.
- Preserve explicit domain, application, persistence, and delivery boundaries.
- Make GEDCOM import, export, validation, and diagnostics first-class capabilities.
- Represent incomplete, uncertain, conflicting, and source-backed claims without inventing certainty.
- Use PostgreSQL transactions, constraints, recursive queries, backups, and reviewed migrations.
- Support accessibility, localization, Unicode names, historical dates, and varied family structures.
- Avoid separate frontend and backend runtimes before a validated need exists.
- Preserve data portability and avoid mandatory hosted services.

## Options considered

### 1. Next.js frontend, Express backend, and PostgreSQL

**Advantages:** one language across browser and server, explicit runtime separation, and a broad ecosystem.

**Disadvantages:** two application processes, duplicated transport and validation concerns, more deployment surface, and greater risk of splitting domain behavior between frontend and API before an external API requirement exists.

Rejected for the initial implementation. A separate client or public API may be introduced later through an ADR based on concrete requirements.

### 2. Laravel 13 with custom Blade and Livewire UI

**Advantages:** cohesive framework, low operating complexity, and full interface control.

**Disadvantages:** foundational tables, forms, actions, authorization wiring, and administration patterns would be rebuilt before the genealogy experience is validated.

Rejected as the default delivery approach. Custom components remain appropriate where Filament cannot provide an accessible genealogy-specific interaction.

### 3. Laravel 13 modular monolith with Filament 5, Livewire, and PostgreSQL

**Advantages:** one deployable application, mature migrations and queues, policy-based authorization, productive server-driven forms and tables, straightforward self-hosting, and clear seams between domain and delivery layers.

**Disadvantages:** Filament can encourage CRUD-shaped domain modeling, complex tree visualization needs custom components, and PHP plus browser assets still requires disciplined dependency maintenance.

Accepted.

### 4. Microservices or a graph database

**Advantages:** independent scaling or graph-native traversal may help at very large scale.

**Disadvantages:** higher operational cost, distributed consistency, harder backups and migrations, and no validated workload requiring them.

Rejected. Reconsideration requires measurements and a migration case.

## Decision

Adopt a modular monolith with:

- **Runtime:** PHP 8.3 or newer, following Laravel 13 requirements
- **Application framework:** Laravel 13, constrained as `^13.0`
- **Application UI:** Filament 5 with Livewire, plus focused custom Blade or Livewire components where necessary
- **Primary database:** PostgreSQL
- **Dependency management:** Composer for PHP; Laravel and Filament's minimal Node-based asset toolchain may compile browser assets, but Node.js is not an application runtime
- **Repository model:** one Git repository and one primary deployable Laravel application

The system is not microservices. Modules run in one Laravel deployment and one PostgreSQL database. Extraction requires operational evidence and a separate ADR.

## Application structure

```text
/
├── app/
│   ├── Domain/              # genealogy concepts and rules, independent of Filament
│   ├── Application/         # use cases, commands, queries, and transactions
│   ├── Infrastructure/      # persistence, storage, formats, and adapters
│   ├── Filament/            # resources, pages, widgets, and panel configuration
│   ├── Http/                # non-Filament HTTP delivery and middleware
│   ├── Jobs/                # bounded asynchronous work
│   └── Policies/            # authorization policies
├── database/
│   ├── factories/           # synthetic data only
│   ├── migrations/          # ordered Laravel migrations
│   └── seeders/             # synthetic development data only
├── resources/
│   ├── views/               # Blade and custom Livewire presentation
│   └── lang/                # localizable strings
├── tests/
│   ├── Unit/
│   ├── Feature/
│   └── Fixtures/            # synthetic GEDCOM and genealogy fixtures
├── docs/adr/
└── deploy/                  # self-hosting and operations guidance
```

Directories may evolve, but dependency direction stays clear: delivery calls application use cases; application code coordinates domain behavior; infrastructure implements explicit ports. Domain code must not depend on Filament, Livewire, controllers, or presentation concerns.

## Delivery responsibilities

Filament owns authenticated panels, accessible localizable forms and tables, genealogy record workflows, review queues, import diagnostics, duplicate candidates, and operator dashboards. Filament resources and Livewire components are delivery adapters, not the only implementation of validation, authorization, transactions, provenance, or genealogy invariants.

Interactive tree navigation may use custom Blade, Livewire, Alpine, SVG, Canvas, or another narrowly scoped browser library after accessibility, bundle-size, maintenance, and data-boundary review. Canonical data and authorization remain server-side.

Laravel owns application bootstrapping, authentication integration, policy-based authorization, transactions, persistence, queues, scheduling, rate limits, migrations, audit-relevant events, health endpoints, and GEDCOM orchestration. Controllers, Filament actions, and Livewire methods must remain thin and delegate to application use cases.

## PostgreSQL responsibilities

PostgreSQL is the authoritative store. The model must:

- use stable identifiers independent of names and GEDCOM cross-reference identifiers
- represent biological, adoptive, foster, guardian, spouse, partner, and other explicit relationship types
- distinguish claims from supporting sources and citations where required
- support unknown, approximate, ranged, text-only, and disputed dates
- preserve original imported values when normalization would be lossy
- enforce only genuinely universal invariants with reviewed constraints
- avoid cultural assumptions in schema constraints
- use ordered Laravel migrations with upgrade and recovery notes
- remain fully exportable without non-portable extensions

Recursive traversal must be bounded and tested. Closure tables, materialized views, denormalization, search services, or graph stores require evidence and a migration plan.

## GEDCOM interoperability

GEDCOM import and export are domain capabilities, not Filament utilities. The implementation must:

- declare supported versions and extensions in a focused decision
- parse streams or bounded chunks
- enforce file-size, record-count, nesting, value-size, and processing-time limits
- separate parsing, normalization, mapping, persistence, and reporting
- provide dry-run analysis and actionable diagnostics
- import transactionally or through resumable batches with rollback policy
- detect duplicate candidates without silently merging people
- preserve unsupported tags or original values where feasible
- disclose lossy mappings and never fabricate missing facts or certainty
- maintain synthetic conformance, security, regression, and round-trip fixtures
- resist malformed nesting, oversized values, encoding attacks, media path traversal, resource exhaustion, and downstream injection

Small jobs may run synchronously. Production imports should initially use Laravel queues with the database driver. Redis, message brokers, and mandatory separate services require another ADR.

## Security and privacy baseline

The implementation must include least-privilege credentials, secrets outside source control, secure session and CSRF defaults, policies for protected operations, safe upload handling, mass-assignment protection, payload limits, dependency review, useful mutation audit trails without excessive personal data, and documented backup, restore, deletion, and living-person behavior.

A focused threat model and authentication ADR must precede production authentication.

## Self-hosting and operations

A supported installation consists conceptually of one Laravel application, PostgreSQL, scheduler integration, queue workers when enabled, an operator-supplied web server or reverse proxy, and optional object storage after a media-storage ADR.

Deployment must not require a proprietary hosted platform. Examples should favor reproducible containers and standard environment configuration. Database-changing releases need reviewed migrations, upgrade notes, and rollback or recovery guidance. Backup and restore procedures must be tested.

## Accessibility and localization

Core flows, including tree navigation, relationship editing, GEDCOM diagnostics, import, and export, must be keyboard operable, screen-reader understandable, and usable without relying only on color or spatial layout. Filament defaults do not replace accessibility testing.

User-visible text must be localizable. The model must support Unicode, multiple names, locale-independent identifiers, uncertain dates, and changing place names. No schema or UI may assume one language, surname order, family-role vocabulary, or Gregorian-only free-text interpretation.

## Testing and quality gates

CI must include PHP formatting and static analysis, Laravel unit and feature tests, PostgreSQL integration and migration tests, Filament and Livewire tests for critical actions and authorization, accessibility checks, GEDCOM conformance and round-trip tests, end-to-end coverage for a small synthetic tree, dependency-boundary checks, and verification that fixtures are synthetic.

## Consequences

### Positive

- Operators deploy one application runtime plus PostgreSQL.
- Laravel supplies mature migrations, queues, policies, validation, and testing.
- Filament accelerates data-heavy workflows while custom tree interfaces remain possible.
- Domain logic, provenance, and GEDCOM behavior have explicit homes outside UI resources.

### Negative

- Contributors need PHP, Laravel, Filament, and Livewire familiarity.
- Filament can tempt contributors to put domain logic in resources and forms.
- Interactive tree visualization needs custom frontend work.
- Large imports may require queue workers.
- Framework security releases require active maintenance.

### Risks and mitigations

- **CRUD UI dictates the domain:** keep domain and application layers independent and test them directly.
- **Authorization exists only in UI:** enforce policies at application entry points and test denied paths.
- **GEDCOM exhausts resources:** stream input, enforce limits, use resumable queued batches, and benchmark fixtures.
- **Eloquent models become public contracts:** use explicit data objects and serializers at external boundaries.
- **Genealogy becomes culturally narrow:** test varied relationships, names, calendars, uncertain claims, and international fixtures.

## Migration implications

There is no application implementation to migrate. This decision replaces the unimplemented TypeScript monorepo proposal. ADR-0000 remains authoritative for decision discipline and product independence, while its temporary stack-selection prohibition is superseded. Scaffolding may begin with a thin vertical slice.

## Deferred decisions

This ADR does not select the exact PostgreSQL version, authentication and recovery design, media storage, public API style, exact GEDCOM versions, tree-visualization library, deployment orchestrator, observability vendor, or search service beyond PostgreSQL.

## Validation

Validate with a thin vertical slice that:

1. boots Laravel 13 with Filament 5 and PostgreSQL from documented setup
2. creates synthetic people and typed relationships through application use cases
3. manages records through policy-protected Filament pages
4. renders a small accessible family tree using a custom presentation component
5. imports a synthetic GEDCOM fixture and reports diagnostics before commit
6. exports and re-imports the resulting tree
7. applies migrations to a clean installation and tests backup and restore

Revisit this ADR when representative workloads fail agreed targets, Filament blocks accessible core workflows, self-hosting becomes impractical, module boundaries fail, PostgreSQL cannot support required behavior reasonably, or a core framework reaches end of support. Any revisit must include measurements, migration impact, portability consequences, and a transition plan.
