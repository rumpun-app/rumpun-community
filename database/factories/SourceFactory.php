<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Source;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Source>
 */
class SourceFactory extends Factory
{
    protected $model = Source::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'abbreviation' => fake()->optional()->word(),
            'author' => fake()->optional()->name(),
            'publisher' => fake()->optional()->company(),
            'repository' => fake()->optional()->city(),
            'original_value' => null,
            'notes' => null,
        ];
    }
}
