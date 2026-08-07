# ADR-0001: Independence, code provenance, and commercial separation

- Status: Accepted
- Date: 2026-08-07
- Deciders: Initial Rumpun Community maintainers

## Context

Rumpun Community and proprietary Rumpun operate in related family-product domains and share organizational lineage. Contributors may reasonably worry that community work could be transferred into the commercial product without equivalent obligations, or that private commercial work could quietly shape the community repository.

Copyright generally distinguishes ideas from their concrete expression, but trust cannot rely on that distinction alone. The project needs visible rules for code, documentation, designs, data models, assets, dependencies, and product ideas moving across the boundary.

## Decision drivers

- Earn contributor trust through verifiable controls rather than branding claims.
- Preserve independent repositories, maintainers, roadmaps, dependencies, and release trains.
- Prevent unlicensed copying in either direction.
- Allow learning from public ideas without creating covert code transfer.
- Make provenance review practical for humans and automated contributors.
- Ensure any commercial use of Community code follows AGPL-3.0-only like any other downstream user.

## Options considered

### 1. Informal separation

Rejected. Good intentions are not auditable and do not survive maintainer turnover.

### 2. Ban all exchange of ideas

Rejected. Ideas, public research, standards, and general domain learning should remain discussable. A blanket ban would be impractical and harmful to both communities.

### 3. Permit ideas, prohibit privileged transfer of protected expression

Accepted. Public ideas may inspire independently designed work, while code and other protected materials require explicit license compliance and provenance records.

## Decision

Rumpun Community and proprietary Rumpun remain technically and operationally independent.

The following rules apply:

1. No code, tests, schemas, migrations, API definitions, documentation, designs, assets, fixtures, prompts, or generated output may be copied between products without an explicit compatible license and recorded provenance.
2. Proprietary Rumpun receives no private preview, privileged API, compatibility promise, roadmap priority, or exception from Community governance.
3. If proprietary Rumpun incorporates or modifies Rumpun Community covered work, it must comply with AGPL-3.0-only exactly as any unrelated downstream user would. There is no internal commercial exception.
4. Publicly discussed product ideas, problem statements, standards, and domain knowledge may be studied. Any implementation for the other product must be independently designed from public requirements without copying protected expression.
5. Contributors with access to non-public material from either product must not use that material to direct work in the other repository.
6. Pull requests must declare relevant source, inspiration, copied material, generated material, and third-party dependencies.
7. Releases should publish source provenance, dependency manifests, and an SBOM once an implementation stack exists.

## Consequences

### Positive

- Contributors can inspect a clear, equal rule for commercial use.
- Public ideas can still improve the broader genealogy ecosystem.
- Provenance and supply-chain records make separation demonstrable.
- Commercial affiliation does not grant special rights over Community work.

### Negative

- Similar functionality may need independent design and implementation work.
- Maintainers must perform provenance review and reject ambiguous contributions.
- Some integrations may be impossible without explicit public specifications.

### Risks

- Independent implementations may still look similar because they solve the same domain problem. Decision records and commit history should show how each implementation was derived.
- Copyright and licensing questions can be fact-specific. Maintainers should obtain qualified legal review for disputed cases rather than improvising legal conclusions.

## Validation

This decision is working when every contribution has reviewable provenance, no private cross-product dependency exists, commercial use receives no exception, and releases publish supply-chain evidence after implementation begins.

Revisit this ADR if ownership, governance, licensing, or repository boundaries change.