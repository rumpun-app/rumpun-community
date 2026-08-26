<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Person;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Person::factory()->count(5)->create();

        if (app()->environment('local', 'testing')) {
            $this->call(GenealogySeeder::class);
        }
    }
}
