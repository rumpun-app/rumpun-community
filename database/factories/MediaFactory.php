<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Media;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Media>
 */
class MediaFactory extends Factory
{
    protected $model = Media::class;

    public function definition(): array
    {
        return [
            'title' => fake()->optional()->sentence(3),
            'original_filename' => fake()->optional()->word().'.jpg',
            'mime_type' => fake()->randomElement(['image/jpeg', 'image/png', 'application/pdf', null]),
            'disk' => 'local',
            'path' => null,
            'size_bytes' => fake()->optional()->numberBetween(1000, 5000000),
            'original_value' => null,
            'notes' => null,
        ];
    }
}
