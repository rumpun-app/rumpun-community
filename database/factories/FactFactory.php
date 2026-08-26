<?php

namespace Database\Factories;

use App\Domain\Enums\DateType;
use App\Domain\Enums\FactType;
use App\Infrastructure\Persistence\Eloquent\Models\Fact;
use App\Infrastructure\Persistence\Person;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Fact>
 */
class FactFactory extends Factory
{
    protected $model = Fact::class;

    public function definition(): array
    {
        $dateType = fake()->randomElement(DateType::cases());

        return [
            'person_id' => Person::factory(),
            'type' => fake()->randomElement(FactType::cases())->value,
            'value' => fake()->optional()->sentence(3),
            'date_type' => $dateType->value,
            'date_from' => $dateType->requiresDateFrom() ? fake()->date() : null,
            'date_to' => $dateType === DateType::Range ? fake()->date() : null,
            'date_text' => $dateType->requiresText() ? fake()->sentence(2) : null,
            'date_is_approximate' => $dateType === DateType::Approximate,
            'is_disputed' => fake()->boolean(10),
            'place_id' => null,
            'original_value' => null,
            'notes' => null,
        ];
    }

    public function disputed(): static
    {
        return $this->state(fn () => ['is_disputed' => true]);
    }

    public function textOnlyDate(string $text): static
    {
        return $this->state(fn () => [
            'date_type' => DateType::TextOnly->value,
            'date_from' => null,
            'date_to' => null,
            'date_text' => $text,
            'date_is_approximate' => false,
        ]);
    }

    public function unknownDate(): static
    {
        return $this->state(fn () => [
            'date_type' => DateType::Unknown->value,
            'date_from' => null,
            'date_to' => null,
            'date_text' => null,
            'date_is_approximate' => false,
        ]);
    }
}
