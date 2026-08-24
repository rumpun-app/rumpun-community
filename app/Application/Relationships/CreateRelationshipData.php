<?php

declare(strict_types=1);

namespace App\Application\Relationships;

final readonly class CreateRelationshipData
{
    public function __construct(
        public int $fromPersonId,
        public int $toPersonId,
        public string $type,
    ) {}
}
