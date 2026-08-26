# Backup and Restore — PostgreSQL

> ADR-0002: PostgreSQL is the authoritative store. IDs are opaque ULIDs, stable across backup/restore.

## Supported PostgreSQL versions

- **Primary:** PostgreSQL 16 (tested in CI)
- **Also supported:** PostgreSQL 15
- Pin the exact version in your deployment (e.g. `postgres:16-alpine`).

## Backup

```bash
# Full logical backup (recommended for self-hosting)
pg_dump --format=custom --compress=9 --file=rumpun.dump "postgresql://user:pass@host:5432/rumpun?sslmode=require"

# Plain SQL alternative
pg_dump --format=plain --file=rumpun.sql "postgresql://user:pass@host:5432/rumpun"
```

- Run `pg_dump` against the primary or a replica.
- Store dumps encrypted and off-site; rotate per your retention policy.
- Verify dumps with `pg_restore --list rumpun.dump` (custom format).

## Restore

```bash
# Custom format
pg_restore --clean --if-exists --no-owner --no-acl --dbname="postgresql://user:pass@host:5432/rumpun" rumpun.dump

# Plain SQL
psql "postgresql://user:pass@host:5432/rumpun" < rumpun.sql
```

- Restore preserves opaque ULIDs and all provenance (facts, citations, sources, original_values).
- After restore, verify: `php artisan migrate:status` should show all migrations as `Ran`.

## Upgrade and rollback notes

- Every release that changes the database ships ordered Laravel migrations under `database/migrations` with upgrade and recovery notes in the release notes.
- To roll back the last batch: `php artisan migrate:rollback --step=1` (only before new data depends on the new schema).
- For production, prefer restoring from a pre-upgrade `pg_dump` over rolling back if data has been written.

## Testing procedure (CI and local)

```bash
# Clean install
php artisan migrate:fresh --force

# Seed synthetic data
php artisan db:seed --force

# Incremental migration from previous schema (CI runs this)
php artisan migrate --force
php artisan migrate:status

# Backup/restore round-trip (requires PostgreSQL)
pg_dump --format=custom --file=/tmp/rumpun_test.dump "$DATABASE_URL"
pg_restore --clean --if-exists --dbname="$DATABASE_URL" /tmp/rumpun_test.dump
php artisan migrate:status
```

## Notes

- No non-portable PostgreSQL extensions are required. A plain `pg_dump`/`pg_restore` is fully exportable.
- Media bytes are not stored in the database (only metadata under `media`); back up object storage separately per the media-storage ADR when it lands.
