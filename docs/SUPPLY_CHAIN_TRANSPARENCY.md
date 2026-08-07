# Supply-Chain Transparency

Rumpun Community will make its software composition and build inputs inspectable once implementation begins.

## Before stack selection

No package manifest, lockfile, container base image, CI runtime, or SBOM format is selected. Proposals must remain stack-neutral until accepted by ADR.

## Implementation requirements

The eventual delivery pipeline should:

- pin direct dependencies and reproducible build inputs where practical
- preserve license and attribution information
- review dependency provenance and maintenance health
- generate an SBOM for release artifacts in an open, machine-readable standard
- link release artifacts to source commits and build records
- document known exceptions and unverifiable inputs
- avoid dependencies on proprietary Rumpun packages, registries, APIs, or infrastructure

## Release evidence

Each stable release should publish, where applicable:

- source commit and signed tag or equivalent integrity record
- dependency lock or resolved dependency manifest
- SBOM
- checksums for distributed artifacts
- build and migration notes
- known security advisories and license exceptions

## Scope

An SBOM proves software composition, not product independence by itself. It complements public commits, ADRs, provenance declarations, dependency review, and the commercial separation policy.

The exact tooling and SBOM format require a future ADR after the stack and release model are selected.