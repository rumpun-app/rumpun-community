# ADR-0007: Use Redis as a disposable application cache

- Status: Proposed
- Date: 2026-08-12
- Deciders: Community review
- Depends on: ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006

## Context

Rumpun Community will repeatedly read derived family-tree views, bounded ancestor and descendant traversals, reference data, and other expensive but reproducible results. PostgreSQL remains the authoritative transactional store, but recomputing every safe read can create avoidable latency and load.

A shared cache is useful when more than one API process runs and when cached values must be invalidated consistently. It also adds operational and correctness risks: stale authorization, accidental persistence of personal data, unbounded memory, cache stampedes, and application failure when the cache is unavailable.

Redis is selected only as a cache. It is not a second system of record, session authority, queue, lock authority, event bus, rate-limit authority, or authorization database under this ADR.

## Decision drivers

- Reduce latency and PostgreSQL load for measured, read-heavy, reproducible workloads.
- Keep correctness independent of cache availability and eviction.
- Prevent cached data from bypassing current authentication or authorization.
- Bound memory, key lifetime, payload size, and personal-data exposure.
- Support multiple Express instances with a common cache.
- Keep self-hosting understandable and license-compliant.
- Avoid speculative caching before performance evidence exists.

## Options considered

### 1. No shared cache

**Advantages:** simplest operation and no invalidation problem.

**Disadvantages:** repeated derived queries may place unnecessary load on PostgreSQL and increase response latency.

Rejected as the long-term default, though uncached execution remains mandatory and authoritative.

### 2. Per-process in-memory cache

**Advantages:** no extra service and very low latency.

**Disadvantages:** inconsistent entries across replicas, memory duplication, loss on restart, and difficult invalidation.

Rejected as the shared application cache. Small immutable process-local constants may still be cached separately.

### 3. Redis as a general state platform

**Advantages:** could also host sessions, queues, locks, counters, and events.

**Disadvantages:** expands the blast radius, creates hidden durability assumptions, complicates recovery, and conflicts with PostgreSQL authority and ADR-0005 session semantics.

Rejected.

### 4. Redis as a bounded disposable cache only

**Advantages:** mature TTL and eviction behavior, shared access across API replicas, broad operational support, and simple key-value semantics.

**Disadvantages:** adds another service, requires disciplined invalidation, and can expose stale or sensitive data if used carelessly.

Accepted.

## Decision

### Scope

Add Redis as a supported application-cache service. Every cached value must be reproducible from PostgreSQL, object metadata, or immutable configuration. Deleting all Redis keys at any time must affect performance only, never correctness, security, or recoverability.

Initial eligible workloads are:

- bounded, derived ancestor and descendant views
- expensive but deterministic tree summaries
- non-sensitive reference or configuration data with explicit versions
- safe API response fragments after authorization-aware design review

The following are prohibited under this ADR:

- passwords, raw session tokens, CSRF tokens, invitation tokens, recovery tokens, presigned URLs, or storage credentials
- OPA allow decisions or role claims
- authoritative memberships, permissions, genealogy records, citations, media metadata, or audit events
- session state selected by ADR-0005
- durable jobs, distributed transactions, uniqueness guarantees, or correctness-critical locks
- full GEDCOM payloads, uploads, or exports

Adding any prohibited responsibility requires its own ADR and migration or failure analysis.

### Cache-aside pattern

Express uses cache-aside reads:

1. Build a versioned key from authoritative identifiers and all result-shaping dimensions.
2. Read and runtime-validate the cached envelope.
3. On a miss, invalid value, timeout, or Redis error, query the authoritative path.
4. Return the authoritative result even if cache population fails.
5. Populate Redis with a bounded TTL only after the authoritative result succeeds.

Writes commit to PostgreSQL first. After commit, the application invalidates affected cache namespaces or advances an authoritative data version used in keys. Cache invalidation failure does not roll back the database transaction; it emits bounded telemetry and stale entries remain constrained by versioning and TTL.

Redis unavailability must not deny ordinary product reads or writes solely because caching failed. The API must not wait indefinitely for Redis and uses short explicit timeouts, bounded retries with jitter where safe, and a circuit breaker or equivalent backoff.

### Authorization and privacy

Authorization occurs against current authoritative state before sensitive cached data is returned. The cache must not store an `allow` result or treat key possession as access.

Prefer caching shared derived data by tree and data revision, then applying current authorization and response filtering outside the cache. If a response varies by actor or membership, its key must include a stable authorization-context version and receive explicit security review. Caching actor-specific sensitive responses is disabled initially.

Keys and values must not contain names, email addresses, dates of birth, notes, source text, filenames, session identifiers, or other direct personal data unless a later reviewed cache inventory explicitly allows a minimized field. Use opaque stable IDs and one-way bounded key derivation when practical.

Redis transport and command logs must not expose cached values. Operational telemetry records namespace, hit or miss, latency, size class, expiry, and errors, not payload content.

### Key and value contract

Every key is namespaced and versioned, for example:

```text
rumpun:v1:<environment>:tree-view:<opaque-tree-id>:<data-revision>:<query-digest>
```

The exact format is internal. Keys include every input that changes the result, including tree ID, data revision, locale where relevant, query shape, pagination, and schema version.

Cached values use a runtime-validated envelope containing schema version, creation time, authoritative data revision, expiry intent, and payload. Unknown, malformed, oversized, or wrong-version entries are treated as misses and deleted asynchronously where safe.

Values are bounded in serialized size. Large trees are paginated or summarized rather than cached as one unbounded object. Compression requires explicit limits against decompression bombs and must show measured value.

### TTL, invalidation, and consistency

Every application cache key has a finite TTL. Initial defaults are intentionally short:

- rapidly changing tree views: up to 60 seconds
- derived summaries with revisioned keys: up to 5 minutes
- immutable versioned reference data: up to 24 hours

TTL is a safety bound, not the primary invalidation mechanism. Mutations identify affected namespaces and either invalidate them after commit or increment an authoritative revision in PostgreSQL. Revisioned keys are preferred for complex derived views because stale entries become unreachable after mutation even if deletion fails.

The application must document tolerated staleness per cache namespace. Data requiring read-after-write consistency bypasses the cache or uses a confirmed new revision. Negative caching is allowed only for low-risk, non-enumerable results with very short TTL and explicit review.

### Stampede and concurrency control

Hot misses use bounded request coalescing or short-lived cache-fill leases where measurements justify it. Failure to acquire a fill lease must not block indefinitely or turn Redis into correctness authority. Callers may compute from PostgreSQL with concurrency limits.

TTL jitter prevents synchronized expiry. Cache population never holds a PostgreSQL transaction open while waiting on Redis.

### Memory and eviction

Redis has an explicit `maxmemory` limit and an eviction policy suitable for disposable cache entries, initially `allkeys-lfu` or another measured all-keys policy. No correctness assumption depends on a key surviving eviction.

Application keys always have TTLs even when the selected eviction policy can evict them earlier. The deployment monitors used memory, evictions, hit ratio, latency, rejected connections, and command errors. Unbounded key creation, cardinality, and payload growth are release blockers.

Persistence is not required for correctness. Supported examples disable AOF and RDB persistence for the cache unless an operator enables them knowingly for warm restarts. Redis backups are not part of Rumpun Community backup or restore procedures.

### Network and access security

Redis is not exposed to browsers or the public internet. It runs on a private deployment network with:

- authentication or ACL credentials supplied outside source control
- a dedicated least-privilege application user
- TLS when traffic crosses an untrusted host or network
- disabled or restricted administrative and dangerous commands where supported
- connection, command, payload, and timeout limits
- separate key namespace per environment

The API must not derive Redis connection security from untrusted forwarding headers.

### Version and licensing

Supported deployment manifests must pin a reviewed Redis version and document the selected license option. Redis 8 and later are available under multiple licenses, including AGPLv3; project-distributed examples must use a license option compatible with Rumpun Community and record it in dependency and image provenance.

The application uses a narrow Redis protocol adapter so a compatible implementation may be proposed later, but compatibility is not assumed without conformance testing. Redis-specific behavior selected by this ADR is limited to ordinary cache operations, expiry, atomic conditional set for bounded fill coordination, and deletion.

### Failure behavior

Redis startup failure, restart, flush, eviction, timeout, malformed value, or total data loss degrades performance only. The API falls back to authoritative execution and exposes degraded cache health separately from core application readiness.

Readiness must not fail merely because Redis is empty. Deployments may choose whether prolonged Redis unavailability marks the service degraded, but it must not create authentication, authorization, or data-integrity bypasses.

## Consequences

### Positive

- Expensive repeat reads can be shared across API replicas.
- PostgreSQL remains the single transactional authority.
- Cache loss and eviction have explicit non-destructive semantics.
- Versioned keys and TTLs bound stale-data risk.
- Redis operations remain narrow enough for practical self-hosting.

### Negative

- Supported deployments add Redis as another service to configure, secure, monitor, and upgrade.
- Correct invalidation and key design require discipline and tests.
- Cache misses and outages can create sudden PostgreSQL load.
- Privacy review is needed before caching any response-derived data.

### Risks and mitigations

- **Stale authorization grants access:** never cache allow decisions; load current membership and evaluate OPA before protected delivery.
- **Stale genealogy data:** use authoritative revisions, post-commit invalidation, finite TTLs, and bypass for read-after-write flows.
- **Redis outage overloads PostgreSQL:** use short timeouts, circuit breaking, query limits, and controlled degradation.
- **Cache stampede:** use TTL jitter, bounded coalescing, fill leases, and database concurrency limits.
- **Personal data leaks through keys or logs:** use opaque IDs, minimized envelopes, no payload logging, and a reviewed cache inventory.
- **Redis becomes hidden persistence:** prove flush-all and cold-start behavior in CI and exclude Redis from backups.
- **Memory exhaustion:** enforce key/value bounds, `maxmemory`, eviction, TTLs, and cardinality metrics.
- **License or image drift:** pin versions, record provenance and license choice, and review upgrades.

### Migration implications

There is no existing cache to migrate. Initial implementation adds a backend cache interface, Redis adapter, namespaced schemas, mutation invalidation hooks, degraded-health telemetry, and self-hosting configuration.

Features remain correct with the cache disabled or empty. Removing Redis later requires no data migration.

## Deferred decisions

This ADR does not select Redis for:

- server-side sessions
- authorization decisions
- rate limiting
- job queues
- distributed locks for correctness
- pub/sub events
- presence or real-time collaboration
- search indexes

Each use requires a focused ADR because its availability, durability, ordering, and abuse semantics differ from caching.

## Validation

Validate with synthetic workloads that:

1. return identical authorized results with Redis enabled, disabled, empty, flushed, and restarted
2. fall back to PostgreSQL on timeout, connection failure, malformed values, and eviction
3. never store authentication secrets, presigned URLs, OPA decisions, or raw personal identifiers
4. invalidate or version out affected tree views only after committed mutations
5. satisfy documented read-after-write behavior
6. reject wrong-schema, wrong-tree, wrong-revision, oversized, and corrupted entries
7. bound key cardinality, value size, memory, connections, retries, and command latency
8. prevent a hot-key stampede under concurrent misses
9. prove Redis loss affects performance only and is excluded from backup and restore
10. verify private networking, ACL credentials, and non-public exposure in deployment tests
11. record cache hit ratio and PostgreSQL load improvement for each admitted namespace
12. remove any cache namespace that does not show measured benefit or safe invalidation
