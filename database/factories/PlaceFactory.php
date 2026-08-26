<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Place;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Place>
 */
class PlaceFactory extends Factory
{
    protected $model = Place::class;

    public function definition(): array
    {
        $name = fake()->city().', '.fake()->country();

        return [
            'name' => $name,
            'normalized_name' => mb_strtolower($name),
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
            'original_value' => null,
            'notes' => null,
        ];
    }
}
