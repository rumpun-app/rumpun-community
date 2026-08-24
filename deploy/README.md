# Self-Hosting

## Requirements

- PHP 8.3+
- Composer
- PostgreSQL 14+
- Node 20+ (assets only, not runtime)

## Setup

```bash
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
# Configure DB_* in .env for PostgreSQL
php artisan migrate --force
php artisan filament:upgrade  # if needed
npm ci
npm run build
```

Serve with any PHP-capable web server (nginx + php-fpm, Apache, or `php artisan serve` for dev).

## Queue & Scheduler

Queue driver is `database` by default (no Redis required):

```bash
php artisan queue:work
php artisan schedule:work  # or cron: * * * * * php artisan schedule:run
```

## Backups

PostgreSQL:

```bash
pg_dump rumpun_community | gzip > backup.sql.gz
gunzip -c backup.sql.gz | psql rumpun_community
```

Migrations are ordered and reversible; test upgrades on a copy first.

## Upgrades

```bash
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
npm ci && npm run build
php artisan filament:upgrade
```
