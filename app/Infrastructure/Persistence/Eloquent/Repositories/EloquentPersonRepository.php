<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Contracts\PersonRepositoryInterface;
use App\Infrastructure\Persistence\Person;
use Illuminate\Support\Facades\DB;

class EloquentPersonRepository implements PersonRepositoryInterface
{
    public function create(array $attributes): Person
    {
        return Person::create($attributes);
    }

    public function findById(int $id): ?Person
    {
        return Person::find($id);
    }

    public function ancestors(int $personId, int $maxDepth = 10): array
    {
        $maxDepth = max(1, min($maxDepth, 20));

        $rows = DB::select(
            <<<'SQL'
            WITH RECURSIVE ancestors(person_id, depth) AS (
                SELECT to_person_id AS person_id, 1 AS depth
                FROM relationships
                WHERE from_person_id = ?
                  AND type IN ('biological','adoptive','foster','guardian')
                UNION ALL
                SELECT r.to_person_id, a.depth + 1
                FROM relationships r
                JOIN ancestors a ON r.from_person_id = a.person_id
                WHERE r.type IN ('biological','adoptive','foster','guardian')
                  AND a.depth < ?
            )
            SELECT DISTINCT person_id, MIN(depth) AS depth
            FROM ancestors
            GROUP BY person_id
            ORDER BY depth
            SQL,
            [$personId, $maxDepth],
        );

        return array_map(fn ($row) => (array) $row, $rows);
    }

    public function descendants(int $personId, int $maxDepth = 10): array
    {
        $maxDepth = max(1, min($maxDepth, 20));

        $rows = DB::select(
            <<<'SQL'
            WITH RECURSIVE descendants(person_id, depth) AS (
                SELECT from_person_id AS person_id, 1 AS depth
                FROM relationships
                WHERE to_person_id = ?
                  AND type IN ('biological','adoptive','foster','guardian')
                UNION ALL
                SELECT r.from_person_id, d.depth + 1
                FROM relationships r
                JOIN descendants d ON r.to_person_id = d.person_id
                WHERE r.type IN ('biological','adoptive','foster','guardian')
                  AND d.depth < ?
            )
            SELECT DISTINCT person_id, MIN(depth) AS depth
            FROM descendants
            GROUP BY person_id
            ORDER BY depth
            SQL,
            [$personId, $maxDepth],
        );

        return array_map(fn ($row) => (array) $row, $rows);
    }
}
