# Architecture Principles

The stack is intentionally undecided. These principles guide evaluation without preselecting technologies.

1. **Portable data first.** Users must be able to export, back up, restore, and migrate their records.
2. **Provenance over certainty.** Facts and relationships may conflict; preserve claims, sources, citations, and confidence.
3. **Safe evolution.** Schema and API changes need reversible, documented migrations.
4. **Self-hosting is a product feature.** Installation, upgrades, backups, observability, and recovery count as UX.
5. **Secure defaults.** Minimize exposed services, privileges, secrets, and personal-data collection.
6. **Accessible and localizable.** Core flows must work with assistive technology and non-English content.
7. **Small core, stable seams.** Keep optional capabilities behind documented interfaces.
8. **No proprietary coupling.** Do not depend on private Rumpun code, APIs, schemas, services, or release plans.

## Choosing a stack

A stack ADR must compare at least maintainability, contributor accessibility, security lifecycle, data modeling, portability, self-hosting operations, accessibility, localization, testability, performance, and long-term migration cost.