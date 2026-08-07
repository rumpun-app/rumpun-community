# ADR-0000: Project foundation and stack neutrality

- Status: Accepted
- Date: 2026-08-07
- Deciders: Initial Rumpun Community maintainers

## Context

Rumpun Community begins as a new, community-maintained family tree builder. It shares a family-related domain and brand lineage with proprietary Rumpun, but it is not an open-core edition, free tier, delayed release, or technical upstream of that product.

The repository currently contains product, governance, and contribution foundations but no implementation. Selecting a framework, language, database, deployment platform, or repository structure before the community has agreed on requirements would turn personal preference into accidental architecture.

The first architectural decision therefore needs to establish the project's identity, its separation from proprietary Rumpun, and the process by which later technical decisions will be made.

## Decision drivers

- Preserve Rumpun Community as an independent genealogy product.
- Prevent proprietary code, schemas, APIs, assets, and roadmap pressure from shaping this repository.
- Give contributors a fair, evidence-based way to evaluate technology choices.
- Keep genealogy data portable and suitable for long-term preservation.
- Support practical self-hosting, backup, restore, and migration.
- Treat accessibility, localization, privacy, security, and interoperability as architecture inputs.
- Avoid expensive rewrites caused by premature framework selection.

## Options considered

### 1. Adopt the proprietary Rumpun architecture

Rejected. This would blur the product boundary, create coupling between independently maintained products, and risk importing private assumptions or dependencies.

### 2. Select a conventional web stack immediately

Rejected for now. A familiar stack could accelerate scaffolding, but no accepted requirements or comparison currently justify a specific choice.

### 3. Remain stack-neutral until requirements and trade-offs are documented

Accepted. The community will define domain requirements, quality attributes, interoperability cases, and operational constraints before approving an implementation stack through a later ADR.

## Decision

Rumpun Community is established as an independent, AGPL-3.0-only genealogy project with its own repository, maintainers, roadmap, architecture, data model, APIs, dependencies, and release train.

The technology stack is intentionally undecided. Until a dedicated stack ADR is accepted, the repository will not adopt or imply a specific:

- programming language or runtime
- frontend, backend, or mobile framework
- database, search engine, or storage provider
- package manager, build system, or monorepo tool
- cloud vendor, deployment platform, or container strategy
- authentication provider or external managed service

Pre-stack work may define stack-neutral product requirements, genealogy terminology, domain rules, synthetic fixtures, GEDCOM interoperability cases, accessibility criteria, privacy and threat models, operational requirements, interface contracts, and architecture evaluation criteria.

Any future stack proposal must compare realistic alternatives against the architecture principles, including maintainability, contributor accessibility, security lifecycle, genealogy data modeling, portability, self-hosting operations, accessibility, localization, testability, performance, and long-term migration cost.

## Consequences

### Positive

- Contributors can shape the architecture through explicit trade-offs rather than inherit an unexplained choice.
- The project boundary with proprietary Rumpun remains technically enforceable and easy to explain.
- Early work can focus on the difficult genealogy and interoperability problems that should drive implementation.
- Later stack decisions will have written rationale and reviewable evidence.

### Negative

- The repository will not immediately provide a runnable application.
- Some contributors may wait for a concrete stack before participating.
- Requirements and evaluation work adds time before implementation begins.

### Risks

- Stack neutrality could become indefinite analysis. To prevent this, the community should time-box discovery and publish a dedicated stack ADR once the minimum decision inputs are available.
- Documentation may accidentally imply a technology choice. Reviews must remove unapproved implementation assumptions.

## Validation

This decision is working when:

- new proposals remain stack-neutral unless they are explicit ADR candidates
- no proprietary Rumpun code or dependency enters the repository
- genealogy, interoperability, accessibility, privacy, and self-hosting requirements are documented before stack selection
- a future stack ADR compares multiple viable options using the agreed decision drivers

Revisit this ADR when the community has enough validated requirements to propose the initial implementation stack, or when the product boundary materially changes.