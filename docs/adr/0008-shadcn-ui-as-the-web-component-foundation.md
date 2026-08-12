# ADR-0008: Use shadcn/ui as the web component foundation

- Status: Accepted
- Date: 2026-08-12
- Deciders: Initial Rumpun Community maintainer
- Depends on: ADR-0002

## Context

ADR-0002 selects Next.js and TypeScript for the Rumpun Community frontend but leaves the component system undecided. The application needs accessible forms, dialogs, menus, navigation, tables, feedback, and responsive layouts for genealogy editing, source management, GEDCOM workflows, invitations, authentication, settings, and administration.

Building every interaction primitive from scratch would slow delivery and increase accessibility risk. Adopting a conventional packaged component library could accelerate development, but it may constrain styling, make deep fixes difficult, and introduce upgrades that change behavior outside the repository's review boundary.

shadcn/ui distributes component source code into the application rather than hiding the product UI behind a versioned black-box component package. This fits a community project that needs visible ownership, local customization, and auditable accessibility behavior. It is a component foundation, not a complete Rumpun Community design system.

As of this decision, new shadcn/ui projects use Base UI primitives by default while Radix remains supported. The project must choose and pin one primitive foundation rather than allowing generated components to mix them accidentally.

## Decision drivers

- Use accessible interaction primitives without outsourcing accessibility responsibility.
- Keep component source code reviewable and modifiable inside the repository.
- Fit naturally with Next.js, React, TypeScript, and server/client component boundaries.
- Establish consistent tokens, variants, focus behavior, forms, and responsive patterns.
- Avoid a runtime dependency on a hosted UI service or registry.
- Support localization, long translated text, bidirectional layouts where practical, and varied genealogy terminology.
- Prevent generated code from bypassing review, provenance, tests, or dependency policy.
- Keep product-specific family-tree visualization separate from generic UI controls.
- Allow deliberate upgrades instead of silently tracking upstream templates.

## Options considered

### 1. Build all components from scratch

**Advantages:** complete control and minimal third-party styling assumptions.

**Disadvantages:** substantial accessibility, interaction, testing, and maintenance burden for commodity controls.

Rejected.

### 2. Adopt a packaged component library as an opaque dependency

**Advantages:** quick installation, centralized upstream upgrades, and a broad prebuilt catalog.

**Disadvantages:** harder local fixes, stronger visual and API coupling, and less control over generated markup and interaction changes.

Rejected as the primary component model.

### 3. Use headless primitives directly without a shared component layer

**Advantages:** low styling opinion and direct access to primitive APIs.

**Disadvantages:** repeated styling, variants, validation, composition, and accessibility integration across features.

Rejected. Headless primitives remain implementation details beneath the shared layer.

### 4. Use shadcn/ui components owned in the repository

**Advantages:** accessible foundations, open component source, local ownership, strong React and Tailwind integration, and no runtime registry dependency.

**Disadvantages:** copied components become project-maintained code; upgrades require review and generated output can drift.

Accepted.

## Decision

### Foundation

Use shadcn/ui as the initial component foundation for `apps/web`.

New generated components use the current shadcn/ui `new-york` style with **Base UI** primitives, the upstream default at the time of this ADR. The primitive choice is pinned in repository configuration. Radix-based and Base UI-based variants must not be mixed casually because their composition APIs, markup, focus behavior, and upgrade paths differ.

Changing the primitive foundation across existing components requires a focused ADR or an amendment to this one, an inventory of affected components, accessibility regression testing, and a migration plan. A component may use another primitive only when shadcn/ui or Base UI cannot meet a documented requirement and the exception is reviewed.

### Source ownership

shadcn/ui is a code distribution mechanism, not an opaque runtime UI platform. Generated component source is committed under the frontend, initially:

```text
apps/web/src/
├── components/
│   ├── ui/              # owned shadcn-based primitives and composites
│   ├── genealogy/       # product-specific genealogy UI
│   └── features/        # feature-level compositions
├── hooks/
├── lib/
└── styles/
```

Exact folders may evolve, but the boundaries must remain clear:

- `components/ui` contains generic reusable controls, not domain workflows.
- `components/genealogy` contains family-tree, person, relationship, source, citation, and evidence presentation.
- feature components compose these layers and own application behavior.
- generated code receives the same review, tests, linting, provenance, and maintenance expectations as handwritten code.

The application must not fetch executable component code from a registry at runtime. Registry or CLI access is a development-time operation only.

### Styling and tokens

Adopt Tailwind CSS as the styling engine required by the chosen shadcn/ui foundation. Use CSS variables and semantic design tokens for color, typography, spacing, radius, elevation, motion, borders, focus rings, and status meaning.

Feature code should use semantic tokens and shared variants instead of scattering arbitrary values. Raw palette names must not become the only expression of meaning. Statuses such as living, deceased, uncertain, disputed, private, warning, and error require text or icon support and must never rely on color alone.

The initial component theme must support light and dark modes without forcing dark mode into the first release. System preference, user preference, persistence, and no-flash behavior require implementation tests before dark mode is advertised.

This ADR does not import or reproduce any proprietary Rumpun visual system. Rumpun Community must establish its own public visual identity, tokens, examples, and assets.

### Accessibility

shadcn/ui and Base UI reduce primitive implementation risk but do not make the application automatically accessible. Rumpun Community owns the final markup, labeling, focus order, announcements, keyboard behavior, contrast, zoom, motion, errors, and touch targets.

Every adopted or modified interactive component must verify:

- semantic HTML and an accessible name
- complete keyboard operation
- visible focus
- correct focus entry, containment, return, and escape behavior where relevant
- screen-reader name, role, state, and value
- error association and status announcements
- contrast in supported themes and states
- operation at 200% zoom and narrow viewports
- reduced-motion behavior
- no reliance on pointer hover, color, or spatial position alone

Automated checks are required but insufficient. Critical workflows receive manual keyboard and screen-reader verification using a documented support matrix.

### Next.js boundaries

Components are React Server Components by default. Add `use client` only when browser state, events, effects, or an interactive primitive requires it.

A client component boundary must remain as narrow as practical. Importing one interactive shadcn/ui control must not turn an entire page or data-loading tree into client-rendered code. Data access, authentication authority, authorization, and protected mutations remain in the Express boundary selected by earlier ADRs.

UI components must not connect to PostgreSQL, Redis, OPA, or S3-compatible storage directly. They consume documented API contracts and safe presentation models.

### Forms and validation

Use accessible shadcn-based field components for labels, descriptions, errors, required state, grouping, and submission feedback. Browser validation improves usability but is never the integrity or authorization boundary.

Transport schemas remain runtime validated by the backend. Sharing safe contract schemas with the frontend is allowed under ADR-0002, but persistence models and authorization facts must not leak into component props merely for convenience.

Destructive actions require explicit language and appropriate confirmation proportional to impact. A dialog is not automatically required for every action; undo or staged review is preferred when safer and less disruptive.

### Genealogy-specific UI

shadcn/ui does not define the family-tree canvas, relationship graph, pedigree view, chronology, evidence comparison, ambiguous relationship presentation, GEDCOM diagnostics, or accessible non-visual alternatives. These are product-specific components built and tested by the project.

Graphical tree views must have an equivalent structured representation that is keyboard operable and screen-reader understandable. Virtualization, canvas, SVG, or graph libraries cannot remove access to names, relationships, sources, warnings, and actions through semantic controls.

The domain UI must not force uncertain genealogy into false certainty. Components need explicit states for unknown, approximate, disputed, unsupported, private, and not yet entered values.

### Localization and content resilience

All user-visible strings are localizable and must not be hard-coded inside generic UI primitives except documented fallback text. Components must tolerate longer translations, Unicode names, varied name order, right-to-left content where supported, and locale-aware formatting.

Do not use placeholder text as the only label. Icons require accessible names when they convey meaning. Genealogy role terminology comes from the domain and localization layers, not from fixed component labels.

### Component admission

Do not install the entire shadcn/ui catalog. Add components only when a feature needs them.

Before committing a generated component:

1. record the exact shadcn CLI and dependency versions
2. inspect all generated source and dependencies
3. remove unused variants and examples
4. align it with project tokens and import boundaries
5. add accessibility and behavior tests
6. verify server/client boundaries and bundle impact
7. record meaningful local deviations from upstream

Community registry components are third-party source imports, not automatically trusted shadcn/ui components. They require separate license, provenance, security, accessibility, and maintenance review.

### Upgrades and drift

Pin the shadcn CLI, React primitives, Tailwind, icons, and supporting package versions through the selected package manager and lockfile. Do not run `latest` in CI or release automation.

Upstream upgrades are deliberate source migrations. Each upgrade must:

- identify changed templates and dependencies
- compare generated output with local components
- preserve intentional customizations
- run visual, interaction, accessibility, type, and bundle checks
- avoid replacing project-owned files blindly
- document behavior changes and rollback

The project may maintain an inventory with component name, upstream source version, primitive foundation, local modifications, owner, and test coverage.

### Icons and visual assets

Use the icon set provided by the selected shadcn/ui setup for ordinary interface symbols, initially Lucide, while keeping meaningful icons accompanied by labels or accessible names.

Icons are not suitable for genealogy diagrams, identity claims, cultural symbolism, or product branding without design and accessibility review. Product assets remain separate, repository-owned artifacts with clear licenses.

### Quality gates

CI for the web application must include:

- formatting, linting, and TypeScript checks
- dependency-boundary checks
- component unit and interaction tests
- automated accessibility checks for shared components and critical screens
- production build verification
- checks preventing accidental client-boundary expansion where practical
- visual regression tests for stable critical components once infrastructure exists
- license and provenance review for generated and registry-derived code

Storybook or another component workshop is not selected by this ADR. If added, it must be development tooling only and cannot become the sole evidence that components work in the real Next.js application.

## Consequences

### Positive

- Common controls begin from accessible, well-understood primitives.
- Component implementation is visible and owned by the project.
- Styling and behavior can evolve without waiting for an opaque library API.
- Next.js and TypeScript integration is straightforward.
- Semantic tokens and shared variants create a coherent UI foundation.

### Negative

- The project owns every copied component and its security and accessibility maintenance.
- Upstream updates require source comparison rather than a simple package bump.
- Tailwind CSS becomes part of the frontend stack.
- Inconsistent local edits can create drift without governance.
- shadcn/ui does not solve specialized genealogy visualization.

### Risks and mitigations

- **Generated code is trusted without review:** treat it as third-party source and require normal review and tests.
- **Accessibility claims are overstated:** test final workflows manually and automatically; never infer compliance from component origin.
- **Base UI and Radix components become mixed:** pin one foundation and enforce imports and inventory checks.
- **Arbitrary utility classes fragment the design:** use semantic tokens, shared variants, and review lint rules.
- **Client components spread across pages:** default to server components and keep interactive islands narrow.
- **Upstream regeneration destroys fixes:** pin versions, diff generated output, and never overwrite blindly.
- **Registry code introduces licensing or security problems:** require provenance and dependency review or reject it.
- **Tree visualization excludes keyboard or screen-reader users:** ship a structured semantic alternative as part of the same feature.
- **Community UI copies proprietary Rumpun:** create independent public tokens, content, assets, and implementation.

### Migration implications

There is no existing application UI implementation to migrate. Initial scaffolding after acceptance must:

- configure shadcn/ui for Next.js with the pinned Base UI foundation and `new-york` style
- configure Tailwind CSS and semantic CSS variables
- establish component import aliases and repository boundaries
- add only the first components needed by the vertical slice
- add an accessibility test harness and documented manual checks
- record exact versions and provenance in the lockfile and component inventory

If an implementation already appears before acceptance, it must be reconciled to this ADR rather than treated as precedent.

## Deferred decisions

This ADR does not select:

- final brand identity, palette, typography, or illustration system
- a component workshop such as Storybook
- the family-tree graph or layout library
- form-state or server-state libraries
- animation library
- rich-text editor
- data-grid library
- charting or visualization library
- dark-mode launch scope
- visual-regression hosting service

Each choice must preserve accessibility, localization, self-hosting, and source ownership.

## Validation

Validate with a thin, independently designed Community UI slice that:

1. renders a server component page with narrow interactive client islands
2. includes accessible navigation, form fields, validation errors, dialog, menu, notification, and destructive-action handling
3. creates and edits synthetic people and relationships through the Express API
4. supports keyboard-only operation and documented screen-reader checks
5. works at 200% zoom, narrow mobile width, and with reduced motion
6. tolerates long translated labels, Unicode names, and locale-aware dates
7. uses no color-only meaning for genealogy or system status
8. exposes an accessible structured alternative to a small graphical family tree
9. passes automated accessibility, type, build, dependency, and interaction tests
10. proves no component accesses PostgreSQL, Redis, OPA, or object storage directly
11. records generated component versions and local modifications
12. measures the client JavaScript cost and removes unnecessary client boundaries

Revisit this ADR if shadcn/ui or the chosen primitive foundation becomes unmaintained, accessibility regressions cannot be corrected reasonably, source upgrades become prohibitively expensive, or measured bundle and interaction costs block agreed targets. Any replacement must include a component inventory, migration strategy, accessibility comparison, visual regression plan, and rollback path.
