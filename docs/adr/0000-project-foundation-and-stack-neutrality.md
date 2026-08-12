# ADR-0000: Project foundation and initial decision discipline

- Status: Accepted
- Date: 2026-08-07
- Deciders: Initial Rumpun Community maintainer
- Partially superseded by: ADR-0002

## Context

Rumpun Community began as a new community-maintained genealogy project without an implementation. The repository needed explicit product scope, architecture principles, public provenance, and a reviewable process before selecting technologies.

## Decision

Rumpun Community is an AGPL-3.0-only genealogy project with its own public repository, architecture, data model, APIs, dependencies, roadmap, and release history.

Architectural decisions are recorded as ADRs. Before a stack ADR was accepted, work remained stack-neutral and focused on genealogy requirements, portability, accessibility, security, privacy, self-hosting, and interoperability. ADR-0002 supersedes that temporary restriction and authorizes implementation within its accepted boundaries.

Agents and contributors use only this repository, cited public standards, and public upstream dependency documentation required by their task. Unknown requirements are not inferred.

## Consequences

Decisions are explicit and reviewable. New services, trust boundaries, persistent data changes, public contracts, or substantial operational burdens require focused ADRs with migration and rollback impact.

## Validation

Repository changes follow accepted ADRs, preserve product scope and provenance, use synthetic fixtures, and keep architecture decisions public.
