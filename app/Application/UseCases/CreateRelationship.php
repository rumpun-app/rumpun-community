<?php

namespace App\Application\UseCases;

use App\Application\DataTransferObjects\RelationshipData;
use App\Application\Exceptions\DomainException;
use App\Domain\Contracts\PersonRepositoryInterface;
use App\Domain\Contracts\RelationshipRepositoryInterface;
use App\Domain\Enums\RelationshipType;
use Illuminate\Support\Facades\DB;

class CreateRelationship
{
    public function __construct(
        private readonly PersonRepositoryInterface $people,
        private readonly RelationshipRepositoryInterface $relationships,
    ) {}

    public function execute(array $attributes): RelationshipData
    {
        $type = RelationshipType::tryFrom($attributes['type'] ?? '');

        if ($type === null) {
            throw new DomainException('Invalid relationship type: '.($attributes['type'] ?? 'null'));
        }

        if (($attributes['from_person_id'] ?? null) === ($attributes['to_person_id'] ?? null)) {
            throw new DomainException('A relationship cannot link a person to themselves.');
        }

        if ($this->people->findById($attributes['from_person_id']) === null) {
            throw new DomainException('from_person_id does not exist.');
        }

        if ($this->people->findById($attributes['to_person_id']) === null) {
            throw new DomainException('to_person_id does not exist.');
        }

        if ($this->relationships->existsBetween($attributes['from_person_id'], $attributes['to_person_id'], $type->value)) {
            throw new DomainException('Relationship already exists between these people with this type.');
        }

        $relationship = DB::transaction(fn () => $this->relationships->create($attributes));

        return RelationshipData::fromModel($relationship);
    }
}
