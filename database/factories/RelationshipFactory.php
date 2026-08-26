<?php

namespace Database\Factories;

use App\Domain\Enums\RelationshipType;
use App\Infrastructure\Persistence\Person;
use App\Infrastructure\Persistence\Relationship;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Relationship>
 */
class RelationshipFactory extends Factory
{
    protected $model = Relationship::class;

    public function definition(): array
    {
        return [
            'from_person_id' => Person::factory(),
            'to_person_id' => Person::factory(),
            'type' => fake()->randomElement(RelationshipType::cases())->value,
        ];
    }

    public function ofType(RelationshipType $type): static
    {
        return $this->state(fn () => ['type' => $type->value]);
    }
}
