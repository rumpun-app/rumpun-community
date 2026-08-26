<?php

namespace App\Application\DataTransferObjects;

use App\Infrastructure\Persistence\Relationship;

readonly class RelationshipData
{
    public function __construct(
        public int $id,
        public int $fromPersonId,
        public int $toPersonId,
        public string $type,
    ) {}

    public static function fromModel(Relationship $relationship): self
    {
        return new self(
            id: $relationship->id,
            fromPersonId: $relationship->from_person_id,
            toPersonId: $relationship->to_person_id,
            type: $relationship->type,
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'from_person_id' => $this->fromPersonId,
            'to_person_id' => $this->toPersonId,
            'type' => $this->type,
        ];
    }
}
