<?php

use App\Application\People\CreatePerson;
use App\Application\People\CreatePersonData;
use App\Infrastructure\Persistence\Person;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates a person via use case', function (): void {
    $person = app(CreatePerson::class)->execute(new CreatePersonData('Aisyah', 'Putri'));

    expect($person->id)->not->toBeNull();
    expect($person->given_name)->toBe('Aisyah');
    expect($person->family_name)->toBe('Putri');
    expect(Person::count())->toBe(1);
});

it('stores synthetic person and retrieves via model', function (): void {
    Person::factory()->create(['given_name' => 'Budi', 'family_name' => 'Santoso']);

    expect(Person::where('given_name', 'Budi')->exists())->toBeTrue();
});
