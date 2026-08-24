<?php

use App\Domain\People\PersonName;

it('builds display name from given and family', function (): void {
    $name = new PersonName('Alice', 'Smith');

    expect($name->displayName())->toBe('Alice Smith');
    expect($name->toArray())->toBe([
        'given_name' => 'Alice',
        'family_name' => 'Smith',
        'middle_name' => null,
        'prefix' => null,
        'suffix' => null,
    ]);
});

it('includes optional parts in display name', function (): void {
    $name = new PersonName('Alice', 'Smith', 'Marie', 'Dr.', 'Jr.');

    expect($name->displayName())->toBe('Dr. Alice Marie Smith Jr.');
});

it('rejects empty names', function (): void {
    expect(fn () => new PersonName('', ''))->toThrow(InvalidArgumentException::class);
});

it('allows one of given or family to be empty-ish but at least one non-empty', function (): void {
    $name = new PersonName('', 'Smith');
    expect($name->displayName())->toBe('Smith');
});
