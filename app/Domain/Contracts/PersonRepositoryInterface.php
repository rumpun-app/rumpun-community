<?php

namespace App\Domain\Contracts;

use App\Infrastructure\Persistence\Person;

interface PersonRepositoryInterface
{
    public function create(array $attributes): Person;

    public function findById(int $id): ?Person;

    public function ancestors(int $personId, int $maxDepth = 10): array;

    public function descendants(int $personId, int $maxDepth = 10): array;
}
