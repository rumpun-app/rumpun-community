# ADR-0001: Repository independence and code provenance

- Status: Accepted
- Date: 2026-08-07
- Deciders: Initial Rumpun Community maintainer

## Context

A public community project needs auditable provenance and must not depend on inaccessible material, privileged specifications, undocumented compatibility requirements, or private infrastructure.

## Decision

This repository is the complete product and architecture authority for Rumpun Community.

1. Contributions must be authored by the contributor or submitted under a compatible license with recorded provenance.
2. Generated, copied, or adapted material must identify its public source, inputs, license, and relevant obligations.
3. Confidential, inaccessible, or non-public material must not be reproduced, paraphrased, inferred, or used to direct implementation.
4. Public standards and public upstream dependency documentation may be used and cited.
5. APIs, schemas, tests, designs, fixtures, prompts, assets, and compatibility requirements must originate from public repository decisions.
6. Releases publish dependency manifests and should publish SBOM and build provenance.

## Consequences

Contributors can audit why code exists and where it came from. Work stops when required authority is unavailable instead of inventing requirements.

## Validation

Pull requests declare provenance, CI verifies dependency and license records, fixtures remain synthetic, and repository searches find no inaccessible source assumptions.
