# AGENTS.md

Instructions for AI coding agents and automated contributors working in this repository.

## Mission

Build Rumpun Community as an independent, community-maintained family tree application focused on genealogy fundamentals.

## Non-negotiable product boundary

- This is not the open-source edition, free tier, or upstream/downstream of proprietary Rumpun.
- Do not copy, port, reference, or depend on proprietary Rumpun code, schemas, APIs, assets, documentation, or internal decisions.
- Do not add zero-knowledge E2EE or family-archive features such as oral histories, heirloom stories, time capsules, memorial experiences, or commercial-product compatibility.
- Prefer genealogy records, evidence, interoperability, and self-hostability.

## Technology status

The technology stack is intentionally undecided.

Until an accepted ADR chooses a stack, agents must not:

- scaffold a framework, package manager, database, deployment platform, or monorepo tool
- add generated lockfiles or framework-specific configuration
- describe an unapproved technology as selected or planned
- infer a stack from examples, issue discussions, or personal preference

Agents may contribute stack-neutral requirements, domain models, test fixtures, interface contracts, threat models, accessibility criteria, and ADR proposals.

## Required workflow

1. Read README.md, CONTRIBUTING.md, ROADMAP.md, and relevant files under docs/.
2. Confirm the requested change fits PRODUCT_BOUNDARY.md.
3. For architectural decisions, create an ADR proposal before implementation.
4. Keep each pull request focused and explain user impact, trade-offs, testing, and documentation changes.
5. Never weaken licensing, security reporting, privacy, accessibility, or data portability without explicit maintainer approval.

## Engineering principles

- Model genealogy ambiguity instead of inventing certainty.
- Preserve provenance: facts and relationships should support sources and citations.
- Treat import/export and backups as core product behavior.
- Design for accessibility, localization, and self-hosting from the start.
- Keep the core small; prefer documented extension points over feature sprawl.
- Avoid irreversible data transformations.
- Use synthetic data only. Never commit real family records or personal data.

## Definition of done

A change is done when its behavior is documented, tests or reproducible verification are included where applicable, privacy and migration impact are considered, and no proprietary Rumpun dependency has been introduced.

When information is missing, state the gap and propose options. Do not silently guess.