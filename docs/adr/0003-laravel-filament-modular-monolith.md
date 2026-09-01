# ADR-0003: Adopt Laravel 13 and Filament 5 with conventional modular structure

- Status: Accepted
- Date: 2026-09-01
- Deciders: Project maintainer
- Supersedes: ADR-0002

## Context

ADR-0002 proposed a TypeScript monorepo with separate Next.js and Express applications. Before application scaffolding begins, the project has chosen a different implementation direction that reduces the number of runtimes, keeps deployment simple for self-hosters, and makes the codebase approachable to contributors who already understand Laravel.

Rumpun Community still requires clear module boundaries. Genealogy, people, relationships, sources, GEDCOM interoperability, access control, and other capabilities must not collapse into an unstructured collection of controllers and models.

At the same time, modularity must not introduce a custom directory convention that makes the application unfamiliar to ordinary Laravel developers. A contributor who understands a conventional Laravel application should be able to locate HTTP controllers, models, policies, jobs, console commands, Filament resources, migrations, tests, and configuration without first learning a project-specific module framework.

## Decision drivers

- Keep the application familiar to Laravel developers.
- Use one coherent application runtime and deployment unit.
- Build the operational interface quickly with an established Laravel-native UI framework.
- Preserve explicit capability boundaries inside a modular monolith.
- Avoid custom module loaders, non-standard application roots, and package-like indirection without evidence that they are needed.
- Keep self-hosting, migrations, backup, restore, queues, scheduling, and upgrades understandable.
- Retain first-class support for genealogy data, GEDCOM interoperability, localization, accessibility, security, and automated testing.
- Minimize long-term maintenance cost and contributor onboarding time.

## Options considered

### 1. Continue with Next.js, Express, and PostgreSQL

This retains the architecture proposed by ADR-0002.

**Advantages:** one language across frontend and backend, explicit runtime separation, and a broad TypeScript contributor pool.

**Disadvantages:** two application runtimes, duplicated validation and presentation concerns, more deployment moving parts, and more project-defined backend structure.

Rejected. The project prefers a Laravel-native application with fewer operational components.

### 2. Laravel with a third-party modular package and custom `Modules/` tree

Each capability could be implemented as a package-like module with its own controllers, models, migrations, routes, configuration, and views.

**Advantages:** strong physical grouping by feature and possible future extraction.

**Disadvantages:** the repository no longer looks like a normal Laravel application, contributors must learn package-specific conventions, framework discovery and tooling can require extra indirection, and ordinary maintenance becomes dependent on the module package lifecycle.

Rejected. Modularity is required, but a non-standard project shape is not.

### 3. Conventional Laravel modular monolith with Filament

Use Laravel's standard directory layout and extension points. Keep capabilities modular through namespaces, focused classes, dependency direction, policies, actions, services, events, jobs, and tests, while leaving each artifact in the directory where Laravel developers normally expect it.

**Advantages:** familiar structure, strong framework support, straightforward deployment, lower onboarding cost, and explicit boundaries without a custom module system.

**Disadvantages:** one capability is represented across several conventional directories rather than one top-level module folder, so boundaries require naming discipline and automated checks.

Accepted.

## Decision

Rumpun Community SHALL be implemented as a modular monolith using:

- **Application framework:** Laravel 13
- **Application UI and operational panels:** Filament 5
- **Architecture:** one Laravel modular monolith
- **Dependency management:** Composer and the standard Laravel frontend toolchain where required
- **Repository structure:** the conventional Laravel project layout

Exact PHP, Node.js, database, cache, queue, and infrastructure versions SHALL be pinned in dependency manifests and deployment documentation. Adding a new persistent service or mandatory infrastructure dependency requires evidence and, when architecturally significant, a separate ADR.

### Conventional structure is mandatory

The project SHALL preserve the directory layout and naming conventions expected in a normal Laravel application. In particular:

```text
/
├── app/
│   ├── Actions/
│   ├── Console/
│   ├── Events/
│   ├── Filament/
│   ├── Http/
│   ├── Jobs/
│   ├── Listeners/
│   ├── Models/
│   ├── Notifications/
│   ├── Policies/
│   ├── Providers/
│   ├── Rules/
│   └── Services/
├── bootstrap/
├── config/
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── lang/
├── public/
├── resources/
├── routes/
├── storage/
└── tests/
    ├── Feature/
    └── Unit/
```

Directories MAY be added when they follow established Laravel conventions and have a concrete need. The application MUST NOT replace this structure with a custom top-level `Modules/`, `Domains/`, `Packages/`, `src/`, or similar application tree merely to claim modularity.

A third-party modularization package MUST NOT become part of the foundation unless a later ADR demonstrates a problem that conventional Laravel boundaries cannot solve.

### How modularity is expressed

Modules are logical capability boundaries, not alternate Laravel applications. Initial boundaries include, but are not limited to:

- People and identity
- Relationships and families
- Genealogical facts and events
- Places
- Sources, repositories, and citations
- Media
- GEDCOM import and export
- Collaboration and access control
- Audit and change history

Artifacts remain in their conventional Laravel directories and are grouped with clear namespaces when grouping improves navigation. Examples:

```text
app/Actions/People/CreatePerson.php
app/Actions/Relationships/CreateRelationship.php
app/Filament/Resources/People/PersonResource.php
app/Filament/Resources/Families/FamilyResource.php
app/Http/Controllers/Gedcom/ImportController.php
app/Jobs/Gedcom/ProcessImport.php
app/Models/Person.php
app/Models/Relationship.php
app/Policies/PersonPolicy.php
app/Services/Gedcom/Importer.php
tests/Feature/People/CreatePersonTest.php
tests/Feature/Gedcom/ImportGedcomTest.php
```

This structure is intentionally Laravel-first. A developer should search for an artifact by its Laravel role first, then by capability.

### Boundary rules

- Controllers and Filament resources coordinate requests and presentation; they MUST NOT contain core domain workflows.
- Reusable business operations belong in focused action or service classes with explicit inputs and outputs.
- Eloquent models represent persistence and relationships but MUST NOT become dumping grounds for unrelated workflows.
- Authorization is enforced through Laravel policies, gates, middleware, and server-side checks. Hiding a Filament action is not sufficient authorization.
- Cross-capability behavior uses explicit method calls, actions, contracts, events, or jobs. It MUST NOT depend on hidden model observers for critical invariants.
- Database writes spanning related invariants use explicit transactions.
- Jobs, listeners, notifications, and console commands remain thin entry points into the same application rules.
- Shared helpers are kept small and purposeful. A generic `Helpers`, `Common`, or `Utils` dumping ground is prohibited.
- Circular dependencies between capability namespaces are prohibited.
- Extraction into a package, service, or separate repository requires measured need and a separate ADR.

### Filament rules

Filament 5 is the primary framework for authenticated application panels and resource-oriented workflows where it provides a suitable user experience.

- Filament resources, pages, widgets, relation managers, forms, tables, and actions live under `app/Filament` using Filament's documented conventions.
- Filament classes are presentation and orchestration code, not the canonical home of business rules.
- The same authorization and application actions used outside Filament SHALL be reused inside Filament.
- Complex genealogy interactions that Filament cannot express accessibly or maintainably MAY use conventional Laravel, Livewire, Blade, or a focused frontend component without creating a second application by default.
- Public pages and APIs are not required to use Filament.
- UI convenience MUST NOT weaken validation, authorization, auditability, localization, accessibility, or data portability.

### Data and migrations

- Laravel migrations in `database/migrations` are the only canonical mechanism for application schema evolution.
- Production schema changes MUST NOT rely on automatic synchronization.
- Migrations require an upgrade note and a rollback or recovery strategy.
- Factories and seeders MUST use synthetic data only.
- Genealogical data must preserve uncertainty, conflicting claims, provenance, citations, original imported values, and varied family structures.
- GEDCOM files remain untrusted input and require bounded parsing, validation, diagnostics, and explicit handling of lossy mappings.

### Testing and enforcement

CI SHALL verify:

- code formatting and static analysis
- Laravel and Filament tests
- unit tests for focused rules and transformations
- feature tests for HTTP, Filament, authorization, jobs, and database behavior
- migration tests from supported prior schemas
- GEDCOM parser, import, export, security, and round-trip fixtures
- dependency and namespace boundary rules
- localization and accessibility of critical flows
- use of synthetic committed fixtures

Architecture tests SHOULD enforce prohibited dependencies and ensure presentation classes do not become the only implementation of business rules.

## Consequences

### Positive

- The repository looks and behaves like a conventional Laravel application.
- Laravel developers can contribute without learning a custom module framework.
- Laravel 13 provides the application, routing, validation, authorization, queues, scheduling, migrations, testing, and operational foundation in one ecosystem.
- Filament 5 accelerates maintainable resource and panel development.
- One modular monolith keeps self-hosting and deployment simpler than multiple application runtimes.
- Logical boundaries remain available for future extraction if evidence justifies it.

### Negative

- Files for one capability are distributed across standard Laravel directories.
- Boundary quality depends on naming discipline, reviews, and architecture tests.
- Highly interactive family-tree visualization may require focused UI work outside ordinary Filament resources.
- Framework and plugin upgrades require active maintenance and compatibility testing.

### Risks and mitigations

- **Fat models, controllers, or Filament resources:** move workflows into focused actions and services, then enforce with review and tests.
- **Feature boundaries become unclear:** use capability namespaces consistently and maintain a short architecture map.
- **Filament becomes the domain layer:** reuse application actions and policies from Filament rather than implementing rules in UI classes.
- **A custom pseudo-framework grows inside `app/`:** prefer Laravel-native facilities and require an ADR for new architectural abstractions.
- **Plugin dependency churn:** keep the plugin set small, review maintenance health, and avoid plugins for behavior that Laravel or Filament already supports clearly.
- **Conventional structure becomes a dumping ground:** prohibit generic buckets and require each class to have one clear role and owner capability.

### Migration implications

No production application data exists, so this decision requires no user-data migration.

ADR-0002 is superseded. Its Next.js, Express, TypeScript monorepo, separate web/API runtime, and related folder decisions are no longer authoritative. Product requirements that remain relevant, including GEDCOM interoperability, portability, self-hosting, accessibility, localization, secure defaults, provenance, and safe schema evolution, continue to apply.

Repository documentation, contributor guidance, development containers, CI, and scaffolding SHALL be updated to reflect Laravel 13, Filament 5, and this conventional modular structure.

## Validation

The decision is validated by a thin vertical slice that:

1. boots a clean Laravel 13 application using documented local and container workflows
2. loads an authenticated Filament 5 panel
3. creates and retrieves synthetic people and explicitly typed relationships
4. enforces the same policy and application action from Filament and a conventional HTTP endpoint or test harness
5. imports a bounded synthetic GEDCOM fixture and reports actionable diagnostics
6. exports and re-imports representative data without inventing missing facts
7. applies migrations to a clean database and verifies backup and restore instructions
8. passes architecture tests for dependency direction and prohibited custom module roots
9. demonstrates keyboard and screen-reader usability for the critical implemented flow

Revisit this ADR when Laravel 13 or Filament 5 reaches end of support, conventional boundaries repeatedly fail despite enforcement, self-hosting becomes impractical, representative workloads miss agreed targets, or a proposed capability requires a materially different trust or deployment boundary.
