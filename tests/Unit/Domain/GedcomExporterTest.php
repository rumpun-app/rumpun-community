<?php

use App\Domain\Gedcom\GedcomExporter;
use App\Domain\Gedcom\GedcomParser;

it('exports people to GEDCOM and round-trips via parser', function (): void {
    $exporter = new GedcomExporter;
    $gedcom = $exporter->export([
        ['id' => 'I1', 'given_name' => 'Alice', 'family_name' => 'Smith', 'sex' => 'F'],
        ['id' => 'I2', 'given_name' => 'Bob', 'family_name' => 'Smith', 'sex' => 'M'],
    ]);

    expect($gedcom)->toContain('0 HEAD');
    expect($gedcom)->toContain('0 TRLR');
    expect($gedcom)->toContain('Alice /Smith/');
    expect($gedcom)->toContain('Bob /Smith/');

    $parser = new GedcomParser;
    $parsed = $parser->parse($gedcom);
    expect($parsed['records'])->not->toBeEmpty();
    $codes = array_map(fn ($d) => $d->code, $parsed['diagnostics']);
    expect($codes)->not->toContain('gedcom.missing_head');
    expect($codes)->not->toContain('gedcom.missing_trlr');
});

it('exports empty people list with HEAD and TRLR', function (): void {
    $exporter = new GedcomExporter;
    $gedcom = $exporter->export([]);

    expect($gedcom)->toContain('0 HEAD');
    expect($gedcom)->toContain('0 TRLR');
});
