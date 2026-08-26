<?php

namespace App\Domain\Contracts;

use App\Infrastructure\Persistence\Relationship;

interface RelationshipRepositoryInterface
{
    public function create(array $attributes): Relationship;

    public function findById(int $id): ?Relationship;

    public function existsBetween(int $fromId, int $toId, string $type): bool;
}
