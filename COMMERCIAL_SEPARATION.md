# Commercial Separation Policy

Rumpun Community and proprietary Rumpun are different products, not editions of one product.

## What separation means

They have independent repositories, maintainers, roadmaps, code, schemas, APIs, packages, dependencies, infrastructure, release trains, and product decisions. Rumpun Community focuses on genealogy. Proprietary Rumpun focuses on private family archives and zero-knowledge E2EE.

## Equal downstream treatment

Proprietary Rumpun has no special license or private exception for Rumpun Community code. If it uses covered Community work, it must comply with AGPL-3.0-only like any other user, including applicable source-availability obligations.

## Ideas versus implementation

Public ideas may travel. Code does not travel by implication.

Either project may learn from publicly documented problems, user needs, standards, academic research, and high-level feature ideas. The receiving project must create its own requirements, design, and implementation without copying code or other protected expression unless the source license explicitly permits that use and all obligations are followed.

Examples:

- Allowed: learning from a public discussion that uncertain parentage needs confidence metadata, then independently specifying a solution.
- Allowed: implementing a public standard from its canonical specification.
- Not allowed: copying Community code, tests, schema, UI copy, or designs into proprietary Rumpun without AGPL compliance.
- Not allowed: using non-public Rumpun plans or source material to steer Community implementation.

## No privileged channel

Proprietary Rumpun receives no private roadmap access, early release, undocumented compatibility layer, reserved extension point, or automatic priority. Any collaboration must happen through the same public process available to other participants.

## Evidence

The project uses public decision records, commit history, provenance declarations, dependency manifests, and release SBOMs to make this separation auditable.

See `docs/adr/0001-independence-code-provenance-and-commercial-separation.md` and `docs/CODE_PROVENANCE.md`.