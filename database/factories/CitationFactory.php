<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Citation;
use App\Infrastructure\Persistence\Eloquent\Models\Source;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Citation>
 */
class CitationFactory extends Factory
{
    protected $model = Citation::class;

    public function definition(): array
    {
        return [
            'source_id' => Source::factory(),
            'page' => fake()->optional()->numerify('p. ##'),
            'excerpt' => fake()->optional()->sentence(),
            'confidence' => fake()->randomElement([null, 0, 1, 2, 3]),
            'original_value' => null,
            'notes' => null,
        ];
    }
}
