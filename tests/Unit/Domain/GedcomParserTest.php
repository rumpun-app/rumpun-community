<?php

use App\Domain\Gedcom\GedcomParser;

it('parses valid GEDCOM and warns on missing TRLR', function (): void {
    $gedcom = "0 HEAD\n1 SOUR Test\n0 @I1@ INDI\n1 NAME Alice /Smith/\n0 TRLR\n";
    $parser = new GedcomParser;
    $result = $parser->parse($gedcom);

    expect($result['records'])->not->toBeEmpty();
    expect($result['diagnostics'])->toBeArray();
    $codes = array_map(fn ($d) => $d->code, $result['diagnostics']);
    expect($codes)->not->toContain('gedcom.missing_head');
    expect($codes)->not->toContain('gedcom.missing_trlr');
});

it('collects diagnostics before commit and does not throw on malformed lines', function (): void {
    $gedcom = "not valid gedcom\n0 HEAD\n0 TRLR\n";
    $parser = new GedcomParser;
    $result = $parser->parse($gedcom);

    expect($result['diagnostics'])->not->toBeEmpty();
    $codes = array_map(fn ($d) => $d->code, $result['diagnostics']);
    expect($codes)->toContain('gedcom.malformed_line');
});

it('warns when HEAD or TRLR missing', function (): void {
    $parser = new GedcomParser;
    $result = $parser->parse("0 @I1@ INDI\n1 NAME Bob /Jones/\n");

    $codes = array_map(fn ($d) => $d->code, $result['diagnostics']);
    expect($codes)->toContain('gedcom.missing_head');
    expect($codes)->toContain('gedcom.missing_trlr');
});

it('handles empty input', function (): void {
    $parser = new GedcomParser;
    $result = $parser->parse('');

    expect($result['records'])->toBeEmpty();
    expect($result['diagnostics'])->not->toBeEmpty();
});
