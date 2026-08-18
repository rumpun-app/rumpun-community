# AGENTS.md

Instructions for AI coding agents and automated contributors working in this repository.

## Mission

Build Rumpun Community as an independent, community-maintained family tree application focused on genealogy fundamentals.

## Non-negotiable product boundary

- This is not the open-source edition, free tier, or upstream/downstream of proprietary Rumpun.
- Do not copy, port, reference, or depend on proprietary Rumpun code, schemas, APIs, assets, documentation, or internal decisions.
- Do not add zero-knowledge E2EE or family-archive features such as oral histories, heirloom stories, time capsules, memorial experiences, or commercial-product compatibility.
- Prefer genealogy records, evidence, interoperability, and self-hostability.

## Technology baseline

ADR-0002 selects a modular monolith built with:

- PHP 8.3 or newer as required by Laravel 13
- Laravel 13 as the application framework
- Filament 5 and Livewire for application panels and interactive server-driven UI
- PostgreSQL as the authoritative transactional store
- Composer for PHP dependency management

Agents must:

- preserve module boundaries and keep domain rules out of Filament resources, pages, widgets, and Livewire components
- use Laravel migrations for reviewed schema changes and Eloquent without leaking persistence models into public contracts
- keep Filament as a delivery layer, not the genealogy domain model
- avoid adding a separate JavaScript SPA, Node.js backend, microservice, persistent service, or mandatory hosted dependency without an accepted ADR
- pin compatible dependency ranges and commit reproducible lockfiles when scaffolding begins
- prefer framework-native capabilities unless another dependency has a documented maintenance and self-hosting case

## Required workflow

1. Read README.md, CONTRIBUTING.md, ROADMAP.md, ADR-0002, and relevant files under docs/.
2. Confirm the requested change fits PRODUCT_BOUNDARY.md.
3. Use an ADR for changes to persistent services, trust boundaries, public contracts, core frameworks, or major operating requirements.
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

A change is done when its behavior is documented, automated tests or reproducible verification are included where applicable, migrations and privacy impact are considered, and no proprietary Rumpun dependency has been introduced.

When information is missing, state the gap and propose options. Do not silently guess.
