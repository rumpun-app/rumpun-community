<?php

use App\Application\Relationships\CreateRelationship;
use App\Application\Relationships\CreateRelationshipData;
use App\Infrastructure\Persistence\Person;
use App\Infrastructure\Persistence\Relationship;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

it('creates a typed relationship between two people', function (): void {
    $a = Person::factory()->create();
    $b = Person::factory()->create();

    $rel = app(CreateRelationship::class)->execute(new CreateRelationshipData($a->id, $b->id, 'parent_child'));

    expect($rel->type)->toBe('parent_child');
    expect(Relationship::count())->toBe(1);
});

it('rejects invalid relationship type', function (): void {
    $a = Person::factory()->create();
    $b = Person::factory()->create();

    expect(fn () => app(CreateRelationship::class)->execute(new CreateRelationshipData($a->id, $b->id, 'unknown')))
        ->toThrow(ValidationException::class);
});

it('rejects self-relationship', function (): void {
    $a = Person::factory()->create();

    expect(fn () => app(CreateRelationship::class)->execute(new CreateRelationshipData($a->id, $a->id, 'parent_child')))
        ->toThrow(ValidationException::class);
});
