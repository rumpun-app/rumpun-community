<?php

use App\Application\Gedcom\ExportGedcom;
use App\Application\Gedcom\ImportGedcom;
use App\Domain\Gedcom\GedcomParser;
use App\Infrastructure\Persistence\Person;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('diagnoses before commit and does not persist on dry run', function (): void {
    $gedcom = file_get_contents(__DIR__.'/../../Fixtures/synthetic-minimal.ged');
    $result = app(ImportGedcom::class)->execute($gedcom, dryRun: true);

    expect($result->committed)->toBeFalse();
    expect($result->peopleImported)->toBeGreaterThan(0);
    expect(Person::count())->toBe(0);
});

it('imports synthetic GEDCOM on commit and re-exports', function (): void {
    $gedcom = file_get_contents(__DIR__.'/../../Fixtures/synthetic-minimal.ged');
    $imported = app(ImportGedcom::class)->execute($gedcom, dryRun: false);

    expect($imported->committed)->toBeTrue();
    expect(Person::count())->toBeGreaterThan(0);

    $exported = app(ExportGedcom::class)->execute();
    expect($exported)->toContain('0 HEAD');
    expect($exported)->toContain('0 TRLR');

    $reimport = app(ImportGedcom::class)->execute($exported, dryRun: true);
    expect($reimport->peopleImported)->toBe(Person::count());
});

it('round-trips export and re-import diagnostics', function (): void {
    Person::factory()->create(['given_name' => 'Sari', 'family_name' => 'Wijaya']);

    $exported = app(ExportGedcom::class)->execute();
    $parsed = (new GedcomParser)->parse($exported);

    expect($parsed['records'])->not->toBeEmpty();
});
