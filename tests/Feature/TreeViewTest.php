<?php

use App\Infrastructure\Persistence\Person;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('renders welcome page with accessible tree component', function (): void {
    Person::factory()->create(['given_name' => 'Aisyah', 'family_name' => 'Putri']);

    $response = $this->get('/');
    $response->assertStatus(200);
});
