<?php

use App\Domain\Relationships\RelationshipType;

it('has expected cases and labels', function (): void {
    expect(RelationshipType::ParentChild->value)->toBe('parent_child');
    expect(RelationshipType::Partnership->label())->toBe('Partnership');
    expect(RelationshipType::Sibling->label())->toBe('Sibling');
});

it('can be resolved from value', function (): void {
    expect(RelationshipType::tryFrom('parent_child'))->toBe(RelationshipType::ParentChild);
    expect(RelationshipType::tryFrom('unknown'))->toBeNull();
});
