<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Person;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Person>
 */
class PersonFactory extends Factory
{
    protected $model = Person::class;

    public function definition(): array
    {
        return [
            'given_name' => fake()->firstName(),
            'family_name' => fake()->lastName(),
            'sex' => fake()->randomElement(['M', 'F', null]),
        ];
    }
}
