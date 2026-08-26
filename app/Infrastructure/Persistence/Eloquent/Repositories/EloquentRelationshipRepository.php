<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Contracts\RelationshipRepositoryInterface;
use App\Infrastructure\Persistence\Relationship;

class EloquentRelationshipRepository implements RelationshipRepositoryInterface
{
    public function create(array $attributes): Relationship
    {
        return Relationship::create($attributes);
    }

    public function findById(int $id): ?Relationship
    {
        return Relationship::find($id);
    }

    public function existsBetween(int $fromId, int $toId, string $type): bool
    {
        return Relationship::where('from_person_id', $fromId)
            ->where('to_person_id', $toId)
            ->where('type', $type)
            ->exists();
    }
}
