<?php

declare(strict_types=1);

namespace App\Application\Relationships;

use App\Domain\Relationships\RelationshipType;
use App\Infrastructure\Persistence\Relationship;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CreateRelationship
{
    public function execute(CreateRelationshipData $data): Relationship
    {
        $type = RelationshipType::tryFrom($data->type);
        if ($type === null) {
            throw ValidationException::withMessages(['type' => 'Invalid relationship type.']);
        }

        if ($data->fromPersonId === $data->toPersonId) {
            throw ValidationException::withMessages(['to_person_id' => 'A person cannot be related to themselves.']);
        }

        return DB::transaction(function () use ($data): Relationship {
            return Relationship::create([
                'from_person_id' => $data->fromPersonId,
                'to_person_id' => $data->toPersonId,
                'type' => $data->type,
            ]);
        });
    }
}
