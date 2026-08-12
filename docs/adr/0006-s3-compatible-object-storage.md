# ADR-0006: Use S3-compatible object storage for binary media

- Status: Proposed
- Date: 2026-08-12
- Deciders: Community review
- Depends on: ADR-0002, ADR-0003, ADR-0004, ADR-0005

## Context

Rumpun Community needs storage for media and other large binary objects associated with genealogy records. PostgreSQL remains appropriate for authoritative structured metadata, relationships, citations, permissions, and lifecycle state, but storing large files directly in database rows would increase backup size, database I/O, restore time, and operational coupling.

The project must remain self-hostable and portable. It cannot require Amazon Web Services or any proprietary hosted platform. A stable S3-compatible boundary allows operators to choose Amazon S3, MinIO, Ceph-compatible gateways, or another implementation that passes the project's compatibility tests.

Media may contain sensitive information about living people. Objects must therefore remain private by default, and possession of an object key or bucket URL must not grant permanent access.

## Decision drivers

- Keep large binary data outside PostgreSQL while retaining authoritative metadata and authorization state there.
- Support self-hosted and hosted storage through one narrow protocol boundary.
- Preserve private-by-default access and backend authorization.
- Support bounded uploads, integrity checks, deletion, backup, restore, and migration.
- Avoid provider-specific features that make exports or restores non-portable.
- Prevent object keys, filenames, and metadata from leaking personal information.
- Make partial failures and orphan cleanup explicit.

## Options considered

### 1. Store binary objects in PostgreSQL

**Advantages:** one transactional system and one backup target.

**Disadvantages:** large database growth, slower backup and restore, higher I/O pressure, and less practical media delivery.

Rejected for ordinary media objects.

### 2. Store files on the API server's local filesystem

**Advantages:** minimal development setup and no additional service.

**Disadvantages:** weak portability across replicas and containers, difficult backup coordination, unsafe path handling, and poor horizontal scaling.

Rejected as the production storage contract. A development adapter may exist but is not a supported substitute for production validation.

### 3. Use one vendor-specific object-storage service

**Advantages:** access to provider-specific lifecycle, replication, and security features.

**Disadvantages:** conflicts with self-hosting and portability, and makes migration harder.

Rejected.

### 4. Use a tested S3-compatible object-storage interface

**Advantages:** broad ecosystem support, mature SDKs, bounded direct transfers, and operator choice.

**Disadvantages:** S3-compatible products differ at edge cases, add another service, and require coordinated metadata and object recovery.

Accepted.

## Decision

### Authority and ownership

PostgreSQL is authoritative for object metadata and lifecycle. S3-compatible storage is authoritative only for object bytes.

Each stored object has a PostgreSQL record containing a stable media ID, tree scope, opaque storage key, original display filename where needed, media type, expected size, cryptographic digest, lifecycle state, creator, timestamps, and references to genealogy records. Bucket listings are never treated as the application catalog.

An object is usable only when both its database record and verified object state are complete. An unreferenced object does not become visible merely because it exists in the bucket.

### Compatibility baseline

The storage adapter uses the S3 API with AWS Signature Version 4 and a configurable endpoint, region, bucket, path-style or virtual-host style addressing, and credentials.

The required portable subset initially includes:

- `PutObject`
- `GetObject`
- `HeadObject`
- `DeleteObject`
- bounded multipart upload for files above a configured threshold
- aborting incomplete multipart uploads
- presigned `PUT` and `GET` URLs where the provider passes compatibility tests

Provider-specific ACLs, event notifications, object lock, replication, storage classes, inventory, and lifecycle behavior are optional operational enhancements, not correctness dependencies. The application must not require a public bucket.

### Bucket and key model

A deployment uses a configured private bucket or private bucket namespace. Object keys are generated opaque identifiers and must not contain names, email addresses, dates of birth, relationship labels, original paths, or other genealogy data.

The initial logical key shape is versioned, for example:

```text
v1/tree/<opaque-tree-id>/media/<opaque-media-id>/<opaque-object-version>
```

The exact separators are not a public API. Keys are never accepted directly from browser input and are never authorization evidence.

### Upload flow

Express authorizes upload initiation through OPA before creating an upload intent.

1. Validate declared size, media type, extension where relevant, and per-request limits.
2. Create a short-lived, single-purpose upload intent bound to actor, tree, media ID, storage key, expected size, expected content type, and expiry.
3. Generate a short-lived presigned upload or proxy a bounded stream when direct upload is unavailable.
4. Do not overwrite an existing object key.
5. After upload, verify object existence, exact size, allowed type, and required checksum or digest.
6. Perform malware or content-safety scanning when that capability is configured and required by policy.
7. Mark the database object `ready` only after verification succeeds.

Pending or failed uploads are not readable through the application. Expired intents and incomplete multipart uploads are cleaned up by an idempotent job. Cleanup must never delete a ready object based only on age or bucket listing.

Presigned URLs are bearer capabilities. They must be short-lived, scoped to one operation and key, generated only after authorization, excluded from logs, and never stored as durable application data.

### Download flow

Express authorizes every download request against current actor, membership, tree, action, and media metadata. On allow, it returns a short-lived presigned `GET` URL or proxies the object stream.

Objects remain private. CDN or public-origin access is not selected by this ADR. Cache headers for sensitive downloads must be conservative, and generated URLs must not reveal original filenames unless an authorized response explicitly supplies a safe content-disposition value.

Authorization is evaluated before URL issuance. The URL lifetime must be short enough to bound access after membership revocation. A presigned URL cannot be revoked reliably once issued, so high-sensitivity operations may require API proxying or shorter expiry.

### Integrity and concurrency

The application records and verifies a cryptographic digest using SHA-256 or a later reviewed algorithm. S3 ETags are not treated as a universal content digest, especially for multipart uploads.

Upload completion, replacement, and deletion use explicit lifecycle states such as `pending`, `verifying`, `ready`, `deleting`, and `failed`. Database and object storage do not provide one distributed transaction, so operations use idempotency keys, compare expected state, and reconcile safely after partial failure.

Replacing media writes a new immutable object version and changes the authoritative database reference only after verification. It must not overwrite bytes behind a ready key.

### Deletion and retention

Deleting a genealogy reference and deleting object bytes are separate steps. When no retained reference remains and deletion is authorized, PostgreSQL first records a durable deletion intent. An idempotent worker deletes the exact object version and then records completion.

Failure preserves a retryable state. The UI must not claim physical deletion while object removal remains unresolved. Retention, legal hold, recycle-bin behavior, and delayed purge require explicit policy and must not be inferred from provider lifecycle settings.

### Backup, restore, and migration

A complete backup includes PostgreSQL plus all referenced object versions and a manifest binding media IDs, keys, sizes, digests, and metadata schema versions. Database-only backups are incomplete when media exists.

Restore verifies object availability and digests before declaring success. Migration between compatible providers copies bytes, verifies digests, and changes configuration or metadata only after verification. Provider bucket replication alone is not the project's backup contract.

### Security and operations

- Use least-privilege storage credentials scoped to the required bucket and operations.
- Supply credentials outside source control and rotate them through documented procedures.
- Require TLS for non-loopback endpoints and validate certificates.
- Keep the storage endpoint private where practical.
- Apply strict upload size, part count, concurrency, and processing limits.
- Do not trust browser MIME declarations or original filenames.
- Prevent active content from executing under the application origin.
- Log media IDs and bounded outcome metadata, never presigned URLs or object contents.
- Expose readiness that checks configured bucket access without creating public objects.

Server-side encryption offered by the storage provider is recommended and may be required by deployment guidance, but it is not end-to-end encryption and must not be described as such.

## Consequences

### Positive

- Binary storage scales independently from PostgreSQL.
- Operators can choose a tested hosted or self-hosted S3-compatible implementation.
- Private direct uploads and downloads avoid routing all bytes through Express.
- Stable metadata, digests, and manifests support migration and recovery.

### Negative

- Supported deployments add an object-storage service and credentials.
- Database and object changes require reconciliation rather than one transaction.
- Compatibility varies across S3 implementations and must be tested.
- Presigned URLs remain temporary bearer capabilities after issuance.

### Risks and mitigations

- **Provider incompatibility:** maintain a required-operation conformance suite and publish tested providers and versions.
- **Unauthorized media access:** keep buckets private, authorize before URL issuance, and use short expiries.
- **Orphaned objects:** use durable intents, idempotent cleanup, and manifest-based reconciliation.
- **Lost objects after database restore:** treat database and object manifests as one backup set and verify digests.
- **Key or filename data leakage:** use opaque keys and sanitize content disposition.
- **Malicious uploads:** enforce limits, inspect content, isolate delivery origin, and support scanning hooks.
- **Silent corruption:** record SHA-256 digests and verify during completion, restore, and migration.

### Migration implications

There is no existing media implementation to migrate. Initial work adds object metadata and lifecycle tables, a narrow S3 adapter, compatibility fixtures, backup manifests, cleanup jobs, and local self-hosting examples.

Changing providers must not change stable media IDs or genealogy references.

## Deferred decisions

This ADR does not select:

- a specific S3-compatible provider
- CDN integration
- image transformation or thumbnail service
- malware-scanning engine
- retention and recycle-bin durations
- storage quotas
- public sharing links
- provider-native replication or object lock

## Validation

Validate with at least Amazon S3 and one self-hosted S3-compatible implementation:

1. upload small and multipart synthetic files
2. reject oversized, wrong-type, wrong-key, expired, and unauthorized uploads
3. verify exact size and SHA-256 before marking an object ready
4. authorize downloads and reject wrong-tree or revoked-member requests
5. confirm presigned URLs are short-lived and absent from logs
6. abort incomplete multipart uploads and clean expired intents safely
7. recover from object-written/database-not-committed and database-intent/object-missing failures
8. replace media without overwriting a ready object version
9. delete through a durable retryable intent
10. back up, restore, migrate, and verify all object digests
11. prove bucket contents alone cannot create application-visible media
12. run the compatibility suite against each documented provider and version
